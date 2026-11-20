const pad = (n: number): string => String(n).padStart(2, '0');

const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayISO = (): string => toISODate(new Date());

const toMinutes = (hhmm: string): number => {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

/** Слоты записи между открытием и закрытием; последний слот — за шаг до закрытия. */
export const buildSlots = (open: string, close: string, step: number): string[] => {
  const slots: string[] = [];
  for (let t = toMinutes(open); t + step <= toMinutes(close); t += step) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
};

/** Слот в прошлом, если дата сегодняшняя и время уже наступило. */
export const isSlotPast = (dateISO: string, slot: string, now: Date = new Date()): boolean => {
  if (dateISO !== toISODate(now)) return dateISO < toISODate(now);
  return toMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
};

export const isDatePast = (dateISO: string, now: Date = new Date()): boolean => dateISO < toISODate(now);

/** Последняя дата, на которую открыта онлайн-запись (сегодня + N дней). */
export const lastBookingDateISO = (daysAhead: number, now: Date = new Date()): string =>
  toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead));
