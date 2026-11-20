import type { Config } from './config.js';
import { isActive, type Booking } from './store.js';
import { addDays, fromMinutes, nowIn, toMinutes } from './time.js';

type SlotConfig = Pick<Config, 'open' | 'close' | 'slotStep' | 'capacity' | 'leadMinutes' | 'timezone' | 'daysAhead'>;

const overlaps = (aStart: number, aLen: number, bStart: number, bLen: number) => aStart < bStart + bLen && bStart < aStart + aLen;

/** Сколько активных записей пересекается с интервалом. */
function busyCount(bookings: readonly Booking[], date: string, start: number, minutes: number, ignoreId?: string): number {
  return bookings.filter(
    (b) =>
      b.id !== ignoreId &&
      isActive(b) &&
      b.kind !== 'callback' &&
      b.date === date &&
      overlaps(start, minutes, toMinutes(b.time), b.minutes),
  ).length;
}

/** Почему слот недоступен: прошлое, слишком далеко, вне рабочих часов или занято. */
export type SlotProblem = 'past' | 'too-far' | 'hours' | 'busy';

export function slotProblem(
  cfg: SlotConfig,
  bookings: readonly Booking[],
  date: string,
  time: string,
  minutes: number,
  at: Date = new Date(),
): SlotProblem | null {
  const start = toMinutes(time);
  const now = nowIn(cfg.timezone, at);
  if (date < now.date || (date === now.date && start < now.minutes + cfg.leadMinutes)) return 'past';
  if (date > addDays(now.date, cfg.daysAhead)) return 'too-far';
  if (start < toMinutes(cfg.open) || start + minutes > toMinutes(cfg.close)) return 'hours';
  return busyCount(bookings, date, start, minutes) < cfg.capacity ? null : 'busy';
}

/** Можно ли поставить запись: рабочие часы, не в прошлом, есть свободная ёмкость. */
export function isSlotFree(
  cfg: SlotConfig,
  bookings: readonly Booking[],
  date: string,
  time: string,
  minutes: number,
  at: Date = new Date(),
): boolean {
  return slotProblem(cfg, bookings, date, time, minutes, at) === null;
}

/** Свободные времена начала на дату для процедуры заданной длительности. */
export function freeSlots(cfg: SlotConfig, bookings: readonly Booking[], date: string, minutes: number, at: Date = new Date()): string[] {
  const slots: string[] = [];
  for (let t = toMinutes(cfg.open); t + minutes <= toMinutes(cfg.close); t += cfg.slotStep) {
    const time = fromMinutes(t);
    if (isSlotFree(cfg, bookings, date, time, minutes, at)) slots.push(time);
  }
  return slots;
}

/** Ближайшие дни, в которых есть хотя бы одно свободное время. */
export function availableDates(cfg: SlotConfig, bookings: readonly Booking[], minutes: number, at: Date = new Date()): string[] {
  const today = nowIn(cfg.timezone, at).date;
  const dates: string[] = [];
  for (let i = 0; i <= cfg.daysAhead; i += 1) {
    const date = addDays(today, i);
    if (freeSlots(cfg, bookings, date, minutes, at).length > 0) dates.push(date);
  }
  return dates;
}
