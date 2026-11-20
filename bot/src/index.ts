import { createBot } from './bot.js';
import { loadConfig } from './config.js';
import { startHttp } from './http.js';
import { startReminders } from './reminders.js';
import { BookingStore } from './store.js';

const cfg = loadConfig();
if (!cfg.botToken) {
  console.error('Не задан BOT_TOKEN. Создайте бота у @BotFather и пропишите токен в файле .env (см. .env.example).');
  process.exit(1);
}
if (cfg.adminChatId === null) {
  console.warn('ADMIN_CHAT_ID не задан: заявки будут сохраняться, но не придут администратору. Отправьте боту /id из нужного чата.');
}

const store = new BookingStore(cfg.dataFile);
await store.load();

const { bot, notifyAdmin } = createBot({ cfg, store });

await bot.api
  .setMyCommands([
    { command: 'book', description: 'Записаться на процедуру' },
    { command: 'price', description: 'Прайс-лист' },
    { command: 'my', description: 'Мои записи' },
    { command: 'contacts', description: 'Адрес и телефон' },
  ])
  .catch((e: Error) => console.warn('[bot] Не удалось установить меню команд:', e.message));

const server = cfg.httpPort > 0 ? startHttp(cfg, store, notifyAdmin) : null;
const stopReminders = startReminders(bot, cfg, store);

const shutdown = async () => {
  stopReminders();
  server?.close();
  await bot.stop();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

await bot.start({
  drop_pending_updates: false,
  onStart: (me) => console.info(`[bot] @${me.username} запущен`),
});
