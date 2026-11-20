import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { fixedPrice, parseServiceValue } from './catalog.js';
import type { Config } from './config.js';
import { normalizePhone } from './phone.js';
import { slotProblem, type SlotProblem } from './slots.js';
import type { Booking, BookingStore } from './store.js';
import { isHHMM, isISODate } from './time.js';

/** Длительность для услуг сайта, которых нет в прайсе бота. */
const DEFAULT_MINUTES = 60;
const MAX_BODY = 10_000;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 10;

/** Понятные причины, почему выбранное время не подходит (показываются на сайте). */
const SLOT_MESSAGES: Record<SlotProblem, (daysAhead: number) => string> = {
  past: () => 'Это время уже прошло. Выберите более позднее время.',
  'too-far': (days) =>
    `Онлайн-запись открыта на ${days} дней вперёд. Выберите дату ближе или оставьте заявку без даты — администратор согласует время по телефону.`,
  hours: () => 'Процедура не успеет закончиться до закрытия салона. Выберите более раннее время.',
  busy: () => 'Это время уже занято. Выберите другое время или оставьте заявку без даты — мы перезвоним.',
};

interface SitePayload {
  name?: unknown;
  phone?: unknown;
  serviceId?: unknown;
  serviceTitle?: unknown;
  mode?: unknown;
  date?: unknown;
  time?: unknown;
  consent?: unknown;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * HTTP-приём заявок с сайта: POST /booking (JSON, контракт как в src/api/booking.ts сайта).
 * Ответы: 201 — заявка принята; 400 — ошибка в данных; 409 — время занято; 429 — слишком часто.
 * Тело ошибки: { "message": "…" } на русском — сайт показывает его пользователю.
 */
export function startHttp(cfg: Config, store: BookingStore, onBooking: (b: Booking) => Promise<void>): Server {
  const hits = new Map<string, number[]>();

  const send = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };

  const cors = (req: IncomingMessage, res: ServerResponse) => {
    const origin = req.headers.origin ?? '';
    if (origin && (cfg.allowedOrigins.includes('*') || cfg.allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    }
  };

  const limited = (ip: string): boolean => {
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    list.push(now);
    hits.set(ip, list);
    return list.length > RATE_LIMIT;
  };

  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      let size = 0;
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(new Error('too large'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  const server = createServer(async (req, res) => {
    cors(req, res);
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      send(res, 200, { ok: true });
      return;
    }
    if (req.method !== 'POST' || url.pathname !== '/booking') {
      send(res, 404, { message: 'Не найдено' });
      return;
    }
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    if (limited(ip)) {
      send(res, 429, { message: 'Слишком много заявок подряд. Попробуйте позже или позвоните нам.' });
      return;
    }

    let payload: SitePayload;
    try {
      payload = JSON.parse(await readBody(req)) as SitePayload;
    } catch {
      send(res, 400, { message: 'Некорректный запрос.' });
      return;
    }

    const name = str(payload.name);
    const phone = normalizePhone(str(payload.phone));
    const serviceId = str(payload.serviceId);
    // callback — заявка без даты и времени: администратор перезвонит и согласует время.
    const callback = payload.mode === 'callback';
    const date = callback ? '' : str(payload.date);
    const time = callback ? '' : str(payload.time);
    const errors: string[] = [];
    if (name.length < 2 || name.length > 60 || /\d/.test(name)) errors.push('имя');
    if (!phone) errors.push('телефон');
    if (!serviceId) errors.push('услуга');
    if (!callback && !isISODate(date)) errors.push('дата');
    if (!callback && !isHHMM(time)) errors.push('время');
    if (payload.consent !== true) errors.push('согласие на обработку данных');
    if (errors.length || !phone) {
      send(res, 400, { message: `Проверьте поля: ${errors.join(', ')}.` });
      return;
    }

    const known = parseServiceValue(serviceId);
    const explicitVariant = known !== undefined && serviceId.includes('@');
    const minutes = known?.variant.minutes ?? DEFAULT_MINUTES;
    let problem: SlotProblem | null = null;
    const booking = await store.create(
      {
        source: 'site',
        kind: callback ? 'callback' : 'slot',
        chatId: null,
        name,
        phone,
        serviceId: known?.service.id ?? serviceId,
        serviceTitle: known?.service.title ?? (str(payload.serviceTitle).slice(0, 200) || serviceId),
        variantLabel: explicitVariant ? known.variant.label : null,
        price: explicitVariant ? fixedPrice(known.variant) : null,
        date,
        time,
        minutes: callback ? 0 : minutes,
      },
      (existing) => {
        if (callback) return true;
        problem = slotProblem(cfg, existing, date, time, minutes);
        return problem === null;
      },
    );
    if (!booking) {
      send(res, 409, { message: SLOT_MESSAGES[problem ?? 'busy'](cfg.daysAhead) });
      return;
    }
    send(res, 201, { ok: true, id: booking.id });
    await onBooking(booking).catch((e) => console.error('[http] Не удалось уведомить администратора:', e));
  });

  server.listen(cfg.httpPort, () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : cfg.httpPort;
    console.info(`[http] Приём заявок с сайта: http://localhost:${port}/booking`);
  });
  return server;
}
