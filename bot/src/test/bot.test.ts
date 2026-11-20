import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { UserFromGetMe } from 'grammy/types';
import { createBot } from '../bot.js';
import type { Config } from '../config.js';
import { startHttp } from '../http.js';
import { normalizePhone } from '../phone.js';
import { freeSlots } from '../slots.js';
import { BookingStore } from '../store.js';
import { addDays, nowIn } from '../time.js';

const ADMIN = -100500;
const CLIENT = 111;
const CLIENT2 = 222;

const baseCfg = (dataFile: string): Config => ({
  botToken: 'test:token',
  adminChatId: ADMIN,
  timezone: 'Europe/Moscow',
  open: '10:00',
  close: '21:00',
  slotStep: 30,
  daysAhead: 14,
  capacity: 1,
  leadMinutes: 60,
  dataFile,
  httpPort: 0,
  allowedOrigins: ['http://localhost:5173'],
  salonName: 'Aesthetic Body',
  salonPhone: '+7 (920) 832-22-28',
  salonAddress: 'ТЦ «Соловьи», Брянск, ул. Дуки, 63, 2 этаж',
  salonHours: 'ежедневно 10:00–21:00',
});

const botInfo = {
  id: 1,
  is_bot: true,
  first_name: 'Test',
  username: 'test_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
} as UserFromGetMe;

interface Call {
  method: string;
  payload: Record<string, unknown>;
}

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'ab-bot-'));
  const cfg = baseCfg(join(dir, 'bookings.json'));
  const store = new BookingStore(cfg.dataFile);
  await store.load();
  const { bot, notifyAdmin } = createBot({ cfg, store, botInfo });
  const calls: Call[] = [];
  let messageId = 100;
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> });
    const p = payload as { chat_id?: number; text?: string };
    const result =
      method === 'sendMessage'
        ? { message_id: ++messageId, date: 0, chat: { id: p.chat_id, type: 'private' }, text: p.text }
        : true;
    return { ok: true, result } as never;
  });
  await bot.init();

  let updateId = 0;
  const user = (id: number) => ({ id, is_bot: false, first_name: 'Анна' });
  const chat = (id: number) => ({ id, type: 'private' as const, first_name: 'Анна' });
  const text = (chatId: number, t: string) => {
    const entities = t.startsWith('/') ? [{ type: 'bot_command' as const, offset: 0, length: t.split(' ')[0]!.length }] : undefined;
    return bot.handleUpdate({
      update_id: ++updateId,
      message: { message_id: ++messageId, date: 0, chat: chat(chatId), from: user(chatId), text: t, entities },
    } as never);
  };
  const press = (chatId: number, data: string) =>
    bot.handleUpdate({
      update_id: ++updateId,
      callback_query: {
        id: String(++updateId),
        from: user(chatId),
        chat_instance: 'x',
        data,
        message: { message_id: 1, date: 0, chat: chatId === ADMIN ? { id: ADMIN, type: 'group', title: 'Админы' } : chat(chatId), text: '…' },
      },
    } as never);
  /** Кнопки из последнего сообщения/редактирования. */
  const lastButtons = (): string[] => {
    for (let i = calls.length - 1; i >= 0; i -= 1) {
      const markup = calls[i]?.payload.reply_markup as { inline_keyboard?: { callback_data?: string }[][] } | undefined;
      if (markup?.inline_keyboard) return markup.inline_keyboard.flat().map((b) => b.callback_data ?? '');
    }
    return [];
  };
  return { cfg, store, calls, text, press, lastButtons, notifyAdmin };
}

test('телефон нормализуется в E.164', () => {
  assert.equal(normalizePhone('8 (912) 345-67-89'), '+79123456789');
  assert.equal(normalizePhone('+7 912 345 67 89'), '+79123456789');
  assert.equal(normalizePhone('9123456789'), '+79123456789');
  assert.equal(normalizePhone('+7 012 345 67 89'), null);
  assert.equal(normalizePhone('12345'), null);
});

test('слоты: прошлое и занятые интервалы исключаются', () => {
  const cfg = baseCfg('x');
  const at = new Date('2026-11-20T11:10:00+03:00');
  const today = freeSlots(cfg, [], '2026-11-20', 60, at);
  assert.equal(today[0], '12:30', 'ближайший слот — не раньше чем через LEAD_MINUTES');
  assert.equal(today.at(-1), '20:00', 'процедура должна закончиться до закрытия');
  const busy = [
    {
      id: 'b1', source: 'telegram' as const, chatId: 1, name: 'А', phone: '+79123456789', serviceId: 'lz-1', serviceTitle: 'x',
      variantLabel: null, price: 1000, date: '2026-11-21', time: '12:00', minutes: 60, status: 'confirmed' as const,
      createdAt: '', reminded: false, adminMessageId: null,
    },
  ];
  const tomorrow = freeSlots(cfg, busy, '2026-11-21', 60, at);
  assert.ok(!tomorrow.includes('11:30') && !tomorrow.includes('12:00') && !tomorrow.includes('12:30'));
  assert.ok(tomorrow.includes('11:00') && tomorrow.includes('13:00'));
});

test('полный сценарий записи, подтверждение администратором и защита от двойной записи', async () => {
  const { store, calls, text, press, lastButtons } = await setup();

  await text(CLIENT, '/start');
  assert.match(String(calls.at(-1)?.payload.text), /Aesthetic Body/);

  await text(CLIENT, 'Записаться');
  assert.deepEqual(lastButtons(), ['c:laser', 'c:vacuum', 'c:injection', 'c:apparatus', 'c:face-massage', 'x']);

  // Направление с одной услугой сразу ведёт к выбору даты, «Назад» — к направлениям.
  await press(CLIENT, 'c:face-massage');
  assert.ok(lastButtons().some((b) => b.startsWith('d:')));
  assert.ok(lastButtons().includes('b:cat'));
  await press(CLIENT, 'b:cat');
  assert.ok(lastButtons().includes('c:laser'));

  await press(CLIENT, 'c:laser');
  assert.ok(lastButtons().includes('s:lz-1'));

  await press(CLIENT, 's:lz-1');
  assert.deepEqual(lastButtons().slice(0, 2), ['v:0', 'v:1'], 'у комплекса два варианта цены');

  await press(CLIENT, 'v:1');
  const dateBtn = lastButtons().find((b) => b.startsWith('d:'));
  assert.ok(dateBtn, 'есть доступные даты');
  const tomorrow = addDays(nowIn('Europe/Moscow').date, 1);
  await press(CLIENT, `d:${tomorrow}`);
  const timeBtns = lastButtons().filter((b) => b.startsWith('t:'));
  assert.equal(timeBtns[0], 't:10:00');

  await press(CLIENT, 't:10:00');
  assert.match(String(calls.at(-1)?.payload.text), /Как к вам обращаться/);

  await text(CLIENT, '1');
  assert.match(String(calls.at(-1)?.payload.text), /без цифр/);
  await text(CLIENT, 'Анна');
  assert.match(String(calls.at(-1)?.payload.text), /телефон/);
  await text(CLIENT, '12345');
  assert.match(String(calls.at(-1)?.payload.text), /Не получилось распознать номер/);
  await text(CLIENT, '8 912 345-67-89');
  assert.match(String(calls.at(-1)?.payload.text), /Проверьте запись/);
  assert.match(String(calls.at(-1)?.payload.text), /1 200 ₽/, 'цена последующего сеанса');

  await press(CLIENT, 'ok');
  const booking = store.all()[0];
  assert.ok(booking);
  assert.equal(booking.status, 'pending');
  assert.equal(booking.phone, '+79123456789');
  assert.equal(booking.time, '10:00');
  const adminMsg = calls.find((c) => c.method === 'sendMessage' && c.payload.chat_id === ADMIN);
  assert.ok(adminMsg, 'администратор получил заявку');
  assert.match(String(adminMsg.payload.text), /Заявка из Telegram/);
  assert.equal(booking.adminMessageId !== null, true);

  // Второй клиент не видит занятое время.
  await text(CLIENT2, '/book');
  await press(CLIENT2, 'c:laser');
  await press(CLIENT2, 's:lz-1');
  await press(CLIENT2, 'v:0');
  await press(CLIENT2, `d:${tomorrow}`);
  const times2 = lastButtons().filter((b) => b.startsWith('t:'));
  assert.ok(!times2.includes('t:10:00'), '10:00 уже занято');
  // Попытка выбрать занятое время старой кнопкой.
  await press(CLIENT2, 't:10:00');
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery' && /занято/.test(String(c.payload.text))));

  // Не-администратор не может подтвердить.
  await press(CLIENT2, `a:ok:${booking.id}`);
  assert.equal(store.get(booking.id)?.status, 'pending');

  // Администратор подтверждает — клиент получает сообщение.
  await press(ADMIN, `a:ok:${booking.id}`);
  assert.equal(store.get(booking.id)?.status, 'confirmed');
  const toClient = calls.filter((c) => c.method === 'sendMessage' && c.payload.chat_id === CLIENT).at(-1);
  assert.match(String(toClient?.payload.text), /Запись подтверждена/);

  // Клиент отменяет из «Мои записи».
  await text(CLIENT, 'Мои записи');
  assert.ok(lastButtons().includes(`m:c:${booking.id}`));
  await press(CLIENT, `m:c:${booking.id}`);
  assert.equal(store.get(booking.id)?.status, 'cancelled');
  assert.ok(calls.some((c) => c.method === 'sendMessage' && c.payload.chat_id === ADMIN && /отменил/.test(String(c.payload.text))));

  // Прайс-лист.
  await text(CLIENT, 'Прайс-лист');
  assert.match(String(calls.at(-1)?.payload.text), /Липолитики — от 3\s000/);
  assert.doesNotMatch(String(calls.at(-1)?.payload.text), /Микротоки|T-Shock/);
});

test('HTTP: заявка с сайта, конфликт времени, ошибки валидации, CORS', async () => {
  const { cfg, store, calls, notifyAdmin } = await setup();
  const server = startHttp(cfg, store, notifyAdmin);
  await new Promise((r) => server.once('listening', r));
  const port = (server.address() as { port: number }).port;
  const url = `http://localhost:${port}/booking`;
  const date = addDays(nowIn('Europe/Moscow').date, 2);
  const body = {
    name: 'Мария',
    phone: '+79161234567',
    serviceId: 'nails-gel',
    serviceTitle: 'Маникюр с покрытием гель-лаком',
    date,
    time: '15:00',
    consent: true,
  };
  const post = (b: unknown) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify(b) });

  const ok = await post(body);
  assert.equal(ok.status, 201);
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const saved = store.all()[0];
  assert.equal(saved?.source, 'site');
  assert.equal(saved?.serviceTitle, 'Маникюр с покрытием гель-лаком');
  assert.ok(calls.some((c) => c.method === 'sendMessage' && c.payload.chat_id === ADMIN && /с сайта/.test(String(c.payload.text))));

  const massage = await post({ ...body, serviceId: 'vacuum-roller@1', time: '10:00' });
  assert.equal(massage.status, 201);
  const m = store.all().find((b) => b.serviceId === 'vacuum-roller');
  assert.equal(m?.minutes, 70);
  assert.equal(m?.variantLabel, '70 минут');
  assert.equal(m?.price, 1500);

  const conflict = await post(body);
  assert.equal(conflict.status, 409);
  assert.match(((await conflict.json()) as { message: string }).message, /занято/);

  const bad = await post({ ...body, phone: '123', consent: false, time: '15:15' });
  assert.equal(bad.status, 400);
  assert.match(((await bad.json()) as { message: string }).message, /телефон/);

  const past = await post({ ...body, date: addDays(nowIn('Europe/Moscow').date, -1) });
  assert.equal(past.status, 409);
  assert.match(((await past.json()) as { message: string }).message, /прошло/);

  // Дальше окна записи — отдельное понятное сообщение с подсказкой про заявку без даты.
  const far = await post({ ...body, date: addDays(nowIn('Europe/Moscow').date, 40) });
  assert.equal(far.status, 409);
  assert.match(((await far.json()) as { message: string }).message, /открыта на 14 дней/);

  // Заявка без даты и времени: принимается, администратор видит «перезвонить».
  const callback = await post({ name: 'Ольга', phone: '89031234567', serviceId: 'lz-1', mode: 'callback', consent: true });
  assert.equal(callback.status, 201);
  const cb = store.all().find((b) => b.kind === 'callback');
  assert.equal(cb?.date, '');
  assert.equal(cb?.time, '');
  assert.ok(
    calls.some((c) => c.method === 'sendMessage' && c.payload.chat_id === ADMIN && /Перезвонить клиенту/.test(String(c.payload.text))),
  );
  assert.ok(calls.some((c) => /согласовать по телефону/.test(String(c.payload.text))));

  // Без согласия заявка без даты тоже не принимается.
  const noConsent = await post({ name: 'Ольга', phone: '89031234567', serviceId: 'lz-1', mode: 'callback' });
  assert.equal(noConsent.status, 400);

  server.close();
});
