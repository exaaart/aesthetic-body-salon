/** Даты и время в часовом поясе салона (сервер может жить в любом поясе). */

const pad = (n: number): string => String(n).padStart(2, '0');

export const toMinutes = (hhmm: string): number => {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

export const fromMinutes = (total: number): string => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;

export interface LocalNow {
  /** YYYY-MM-DD */
  date: string;
  /** Минуты от полуночи. */
  minutes: number;
}

export function nowIn(timezone: string, at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Дата + n дней (календарная арифметика без часовых поясов). */
export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Минуты между двумя локальными моментами (дата + минуты). */
export function diffMinutes(fromDate: string, fromMin: number, toDate: string, toMin: number): number {
  const days = (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000;
  return days * 1440 + (toMin - fromMin);
}

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const weekday = (dateISO: string): string => WEEKDAYS[new Date(`${dateISO}T12:00:00Z`).getUTCDay()] ?? '';

/** «пт, 21 ноября» */
export function formatDate(dateISO: string): string {
  const [, m, d] = dateISO.split('-').map(Number);
  return `${weekday(dateISO)}, ${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** «пт 21.11» — для кнопок */
export function formatDateShort(dateISO: string): string {
  const [, m, d] = dateISO.split('-');
  return `${weekday(dateISO)} ${d}.${m}`;
}

export const isISODate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
export const isHHMM = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
