/** Настройки берутся из переменных окружения (файл .env, см. .env.example). */

const env = (name: string, fallback = ''): string => (process.env[name] ?? fallback).trim();

const int = (name: string, fallback: number): number => {
  const raw = env(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Переменная ${name} должна быть числом, получено «${raw}»`);
  return value;
};

export interface Config {
  botToken: string;
  /** Чат администратора (личный или группа), куда приходят заявки. */
  adminChatId: number | null;
  timezone: string;
  open: string;
  close: string;
  slotStep: number;
  daysAhead: number;
  /** Сколько клиентов можно принять одновременно (кабинеты/косметологи). */
  capacity: number;
  /** Минимум минут от «сейчас» до записи. */
  leadMinutes: number;
  dataFile: string;
  httpPort: number;
  allowedOrigins: string[];
  salonName: string;
  salonPhone: string;
  salonAddress: string;
  salonHours: string;
}

export function loadConfig(): Config {
  const admin = env('ADMIN_CHAT_ID');
  return {
    botToken: env('BOT_TOKEN'),
    adminChatId: admin ? Number(admin) : null,
    timezone: env('TIMEZONE', 'Europe/Moscow'),
    open: env('WORK_OPEN', '10:00'),
    close: env('WORK_CLOSE', '21:00'),
    slotStep: int('SLOT_STEP_MINUTES', 30),
    daysAhead: int('BOOKING_DAYS_AHEAD', 14),
    capacity: int('CAPACITY', 1),
    leadMinutes: int('LEAD_MINUTES', 60),
    dataFile: env('DATA_FILE', 'data/bookings.json'),
    httpPort: int('HTTP_PORT', 8787),
    allowedOrigins: env('ALLOWED_ORIGINS')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    salonName: env('SALON_NAME', 'Aesthetic Body'),
    salonPhone: env('SALON_PHONE', '+7 (920) 832-22-28'),
    salonAddress: env('SALON_ADDRESS', 'ТЦ «Соловьи», Брянск, ул. Дуки, 63, 2 этаж'),
    salonHours: env('SALON_HOURS', 'ежедневно 10:00–21:00'),
  };
}
