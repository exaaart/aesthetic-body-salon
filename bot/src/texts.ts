import { catalog, formatPrice, formatVariantPrice } from './catalog.js';
import type { Config } from './config.js';
import { formatPhone } from './phone.js';
import type { Booking, BookingStatus } from './store.js';
import { formatDate } from './time.js';

export const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const BTN = {
  book: 'Записаться',
  price: 'Прайс-лист',
  mine: 'Мои записи',
  contacts: 'Контакты',
} as const;

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'ждёт подтверждения',
  confirmed: 'подтверждена',
  declined: 'отклонена',
  cancelled: 'отменена',
};

export function welcome(cfg: Config, firstName?: string): string {
  const hello = firstName ? `Здравствуйте, ${esc(firstName)}!` : 'Здравствуйте!';
  return [
    `${hello} Это бот салона <b>${esc(cfg.salonName)}</b>.`,
    '',
    'Здесь можно записаться на лазерную эпиляцию, коррекцию фигуры и косметологию, посмотреть цены и свои записи.',
  ].join('\n');
}

export function priceList(): string {
  const lines: string[] = ['<b>Прайс-лист</b>'];
  for (const category of catalog) {
    lines.push('', `<b>${esc(category.title)}</b>`);
    if (category.note) lines.push(`<i>${esc(category.note)}</i>`);
    for (const service of category.services) {
      const title = esc(service.title) + (service.note ? ` <i>(${esc(service.note)})</i>` : '');
      const [only] = service.variants;
      // Одна цена без отдельной подписи — в одну строку с названием.
      if (service.variants.length === 1 && only?.label === 'Процедура') {
        lines.push('', `${title} — ${formatVariantPrice(only)}`);
        continue;
      }
      lines.push('', title);
      for (const v of service.variants) lines.push(`   ${esc(v.label)} — ${formatVariantPrice(v)}`);
    }
  }
  return lines.join('\n');
}

export function contacts(cfg: Config): string {
  return [
    `<b>${esc(cfg.salonName)}</b>`,
    '',
    `Адрес: ${esc(cfg.salonAddress)}`,
    `Телефон и WhatsApp: ${esc(cfg.salonPhone)}`,
    `Часы работы: ${esc(cfg.salonHours)}`,
  ].join('\n');
}

const serviceLine = (b: Pick<Booking, 'serviceTitle' | 'variantLabel'>) =>
  esc(b.serviceTitle) + (b.variantLabel ? `, ${esc(b.variantLabel.toLowerCase())}` : '');

/** «пт, 21 ноября, 14:00» или «согласовать по телефону» для заявки без времени. */
export const whenLine = (b: Pick<Booking, 'kind' | 'date' | 'time'>): string =>
  b.kind === 'callback' || !b.date ? 'согласовать по телефону' : `${formatDate(b.date)}, ${b.time}`;

/** Сводка для клиента. */
export function bookingSummary(
  b: Pick<Booking, 'kind' | 'serviceTitle' | 'variantLabel' | 'price' | 'date' | 'time' | 'name' | 'phone'>,
): string {
  return [
    `Услуга: ${serviceLine(b)}`,
    b.price !== null ? `Стоимость: ${formatPrice(b.price)}` : '',
    `Дата и время: ${whenLine(b)}`,
    `Имя: ${esc(b.name)}`,
    `Телефон: ${formatPhone(b.phone)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Карточка заявки для администратора. */
export function adminCard(b: Booking): string {
  const source = b.source === 'site' ? 'с сайта' : 'из Telegram';
  const callback = b.kind === 'callback';
  const head = [`<b>Заявка ${source}</b> · №${b.id}`];
  if (callback) head.push('<b>Перезвонить клиенту и согласовать время</b>');
  head.push(`Статус: <b>${STATUS_LABEL[b.status]}</b>`);
  const tail = callback ? [] : [`Длительность: ${b.minutes} мин`];
  return [...head, '', bookingSummary(b), ...tail].join('\n');
}

export function myBookingLine(b: Booking): string {
  return `<b>${whenLine(b)}</b> — ${serviceLine(b)}\nСтатус: ${STATUS_LABEL[b.status]}`;
}
