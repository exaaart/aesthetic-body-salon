import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';
export type BookingSource = 'telegram' | 'site';
/** slot — запись на конкретное время; callback — заявка без времени, администратор перезванивает. */
export type BookingKind = 'slot' | 'callback';

export interface Booking {
  id: string;
  source: BookingSource;
  /** Старые записи без поля считаются записью на время. */
  kind?: BookingKind;
  /** Чат клиента в Telegram (для заявок с сайта — нет). */
  chatId: number | null;
  name: string;
  /** E.164 */
  phone: string;
  serviceId: string;
  serviceTitle: string;
  variantLabel: string | null;
  price: number | null;
  /** YYYY-MM-DD в часовом поясе салона */
  date: string;
  /** HH:MM */
  time: string;
  minutes: number;
  status: BookingStatus;
  createdAt: string;
  reminded: boolean;
  /** Сообщение с заявкой в чате администратора — чтобы обновить его после решения. */
  adminMessageId: number | null;
}

export type NewBooking = Omit<Booking, 'id' | 'status' | 'createdAt' | 'reminded' | 'adminMessageId'>;

export const isActive = (b: Booking): boolean => b.status === 'pending' || b.status === 'confirmed';

/** Хранилище записей в JSON-файле. Все операции идут по очереди, файл перезаписывается атомарно. */
export class BookingStore {
  private bookings: Booking[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.file, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      this.bookings = Array.isArray(parsed) ? (parsed as Booking[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      this.bookings = [];
    }
  }

  all(): readonly Booking[] {
    return this.bookings;
  }

  get(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  /** Выполняет изменение под «замком» и сохраняет файл. */
  private mutate<T>(fn: () => T): Promise<T> {
    const run = this.queue.then(async () => {
      const result = fn();
      await this.persist();
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  /**
   * Создаёт запись, если проверка `canPlace` (выполняется внутри очереди) разрешает.
   * Так две одновременные заявки не займут одно и то же время.
   */
  create(data: NewBooking, canPlace: (existing: readonly Booking[]) => boolean): Promise<Booking | null> {
    return this.mutate(() => {
      if (!canPlace(this.bookings)) return null;
      const booking: Booking = {
        ...data,
        id: randomUUID().slice(0, 8),
        status: 'pending',
        createdAt: new Date().toISOString(),
        reminded: false,
        adminMessageId: null,
      };
      this.bookings.push(booking);
      return booking;
    });
  }

  update(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
    return this.mutate(() => {
      const booking = this.bookings.find((b) => b.id === id);
      if (booking) Object.assign(booking, patch);
      return booking;
    });
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(this.bookings, null, 2), 'utf8');
    await rename(tmp, this.file);
  }
}
