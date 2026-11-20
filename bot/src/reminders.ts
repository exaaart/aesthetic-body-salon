import type { Bot } from 'grammy';
import type { Config } from './config.js';
import { bookingSummary, esc } from './texts.js';
import type { BookingStore } from './store.js';
import { diffMinutes, nowIn, toMinutes } from './time.js';

const DAY = 24 * 60;

/**
 * Раз в минуту ищет подтверждённые записи, до которых осталось меньше суток,
 * и присылает клиенту напоминание (один раз). Записи, созданные меньше чем за сутки, не напоминаются.
 */
export function startReminders(bot: Bot, cfg: Config, store: BookingStore): () => void {
  const tick = async () => {
    const now = nowIn(cfg.timezone);
    for (const b of store.all()) {
      if (b.status !== 'confirmed' || b.reminded || b.chatId === null || b.kind === 'callback' || !b.date) continue;
      const left = diffMinutes(now.date, now.minutes, b.date, toMinutes(b.time));
      if (left <= 0 || left > DAY) continue;
      const created = nowIn(cfg.timezone, new Date(b.createdAt));
      if (diffMinutes(created.date, created.minutes, b.date, toMinutes(b.time)) < DAY) {
        await store.update(b.id, { reminded: true });
        continue;
      }
      try {
        await bot.api.sendMessage(
          b.chatId,
          `<b>Напоминаем о записи завтра</b>\n\n${bookingSummary(b)}\n\nАдрес: ${esc(cfg.salonAddress)}\nЕсли планы изменились, отмените запись в разделе «Мои записи».`,
          { parse_mode: 'HTML' },
        );
      } catch (error) {
        console.warn(`[reminders] Не удалось отправить напоминание по записи №${b.id}:`, (error as Error).message);
      }
      await store.update(b.id, { reminded: true });
    }
  };
  const timer = setInterval(() => void tick().catch((e) => console.error('[reminders]', e)), 60_000);
  void tick().catch((e) => console.error('[reminders]', e));
  return () => clearInterval(timer);
}
