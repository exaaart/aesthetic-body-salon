import { Bot, InlineKeyboard, Keyboard, type Context } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import { catalog, findService, fixedPrice, formatPrice, formatVariantPrice, minPrice, type Service } from './catalog.js';
import type { Config } from './config.js';
import { normalizePhone } from './phone.js';
import { availableDates, freeSlots, isSlotFree } from './slots.js';
import { isActive, type Booking, type BookingStore } from './store.js';
import { BTN, STATUS_LABEL, adminCard, bookingSummary, contacts, esc, myBookingLine, priceList, welcome } from './texts.js';
import { formatDate, formatDateShort, isHHMM, isISODate, nowIn } from './time.js';

/** Черновик записи, который клиент заполняет по шагам. */
interface Draft {
  step: 'category' | 'service' | 'variant' | 'date' | 'time' | 'name' | 'phone' | 'confirm';
  categoryId?: string;
  serviceId?: string;
  variantIndex?: number;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
}

const HTML = { parse_mode: 'HTML' as const };

export const mainKeyboard = new Keyboard()
  .text(BTN.book)
  .text(BTN.price)
  .row()
  .text(BTN.mine)
  .text(BTN.contacts)
  .resized()
  .persistent();

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

export interface BotDeps {
  cfg: Config;
  store: BookingStore;
  /** Для тестов: данные бота без запроса getMe. */
  botInfo?: UserFromGetMe;
}

export function createBot({ cfg, store, botInfo }: BotDeps) {
  const bot = new Bot(cfg.botToken || 'offline:token', botInfo ? { botInfo } : {});
  const drafts = new Map<number, Draft>();
  const isAdminChat = (chatId: number | undefined) => cfg.adminChatId !== null && chatId === cfg.adminChatId;

  // ---------- Уведомления администратора ----------

  const adminKeyboard = (b: Booking) =>
    b.status === 'pending'
      ? new InlineKeyboard().text('Подтвердить', `a:ok:${b.id}`).text('Отклонить', `a:no:${b.id}`)
      : undefined;

  async function notifyAdmin(booking: Booking): Promise<void> {
    if (cfg.adminChatId === null) {
      console.warn(`[bot] ADMIN_CHAT_ID не задан — заявка №${booking.id} сохранена, но никому не отправлена.`);
      return;
    }
    const msg = await bot.api.sendMessage(cfg.adminChatId, adminCard(booking), {
      ...HTML,
      reply_markup: adminKeyboard(booking),
    });
    await store.update(booking.id, { adminMessageId: msg.message_id });
  }

  async function refreshAdminCard(booking: Booking): Promise<void> {
    if (cfg.adminChatId === null || booking.adminMessageId === null) return;
    try {
      await bot.api.editMessageText(cfg.adminChatId, booking.adminMessageId, adminCard(booking), {
        ...HTML,
        reply_markup: adminKeyboard(booking),
      });
    } catch (error) {
      console.warn('[bot] Не удалось обновить карточку заявки:', (error as Error).message);
    }
  }

  // ---------- Шаги записи ----------

  const categoriesView = () => {
    const kb = new InlineKeyboard();
    for (const c of catalog) kb.text(c.title, `c:${c.id}`).row();
    kb.text('Отмена', 'x');
    return { text: '<b>Запись на процедуру</b>\n\nВыберите направление:', kb };
  };

  /** Одна цена — как есть, несколько — «от минимальной». */
  const servicePrice = (s: Service) =>
    s.variants.length === 1 && s.variants[0] ? formatVariantPrice(s.variants[0]) : `от ${formatPrice(minPrice(s))}`;

  const servicesView = (categoryId: string) => {
    const category = catalog.find((c) => c.id === categoryId);
    const kb = new InlineKeyboard();
    for (const s of category?.services ?? []) kb.text(`${s.title} · ${servicePrice(s)}`, `s:${s.id}`).row();
    kb.text('← Назад', 'b:cat').text('Отмена', 'x');
    return { text: `<b>${esc(category?.title ?? '')}</b>\n\nВыберите услугу:`, kb };
  };

  const variantsView = (serviceId: string) => {
    const found = findService(serviceId);
    const kb = new InlineKeyboard();
    found?.service.variants.forEach((v, i) => kb.text(`${v.label} — ${formatVariantPrice(v)}`, `v:${i}`).row());
    kb.text('← Назад', found && found.category.services.length === 1 ? 'b:cat' : 'b:svc').text('Отмена', 'x');
    return { text: `<b>${esc(found?.service.title ?? '')}</b>\n\nВыберите вариант:`, kb };
  };

  const selectedVariant = (d: Draft) => {
    const found = d.serviceId ? findService(d.serviceId) : undefined;
    const variant = found?.service.variants[d.variantIndex ?? 0];
    return found && variant ? { ...found, variant } : undefined;
  };

  const datesView = (d: Draft) => {
    const sel = selectedVariant(d);
    const minutes = sel?.variant.minutes ?? 60;
    const dates = availableDates(cfg, store.all(), minutes);
    const kb = new InlineKeyboard();
    for (const row of chunk(dates, 3)) {
      for (const date of row) kb.text(formatDateShort(date), `d:${date}`);
      kb.row();
    }
    const back = sel && sel.service.variants.length > 1 ? 'b:var' : sel && sel.category.services.length === 1 ? 'b:cat' : 'b:svc';
    kb.text('← Назад', back).text('Отмена', 'x');
    const head = sel ? `<b>${esc(sel.service.title)}</b>\n${esc(sel.variant.label)} — ${formatVariantPrice(sel.variant)}\n\n` : '';
    const text = dates.length
      ? `${head}Выберите дату:`
      : `${head}На ближайшие ${cfg.daysAhead} дней свободного времени нет. Позвоните нам: ${esc(cfg.salonPhone)}`;
    return { text, kb };
  };

  const timesView = (d: Draft) => {
    const sel = selectedVariant(d);
    const slots = d.date ? freeSlots(cfg, store.all(), d.date, sel?.variant.minutes ?? 60) : [];
    const kb = new InlineKeyboard();
    for (const row of chunk(slots, 4)) {
      for (const t of row) kb.text(t, `t:${t}`);
      kb.row();
    }
    kb.text('← Другая дата', 'b:date').text('Отмена', 'x');
    const text = slots.length
      ? `<b>${formatDate(d.date ?? '')}</b>\n\nВыберите время:`
      : `<b>${formatDate(d.date ?? '')}</b>\n\nНа этот день всё занято — выберите другую дату.`;
    return { text, kb };
  };

  const confirmView = (d: Draft) => {
    const sel = selectedVariant(d);
    const text = [
      '<b>Проверьте запись</b>',
      '',
      bookingSummary({
        serviceTitle: sel?.service.title ?? '',
        variantLabel: sel && sel.service.variants.length > 1 ? sel.variant.label : null,
        price: sel?.variant.price ?? null,
        date: d.date ?? '',
        time: d.time ?? '',
        name: d.name ?? '',
        phone: d.phone ?? '',
      }),
    ].join('\n');
    const kb = new InlineKeyboard().text('Подтвердить запись', 'ok').row().text('Изменить время', 'b:date').text('Отмена', 'x');
    return { text, kb };
  };

  /** Показывает экран шага: редактирует сообщение с кнопками или присылает новое. */
  async function show(ctx: Context, view: { text: string; kb: InlineKeyboard }, edit: boolean) {
    if (edit && ctx.callbackQuery?.message) {
      try {
        await ctx.editMessageText(view.text, { ...HTML, reply_markup: view.kb });
        return;
      } catch (error) {
        if (!String((error as Error).message).includes('message is not modified')) throw error;
        return;
      }
    }
    await ctx.reply(view.text, { ...HTML, reply_markup: view.kb });
  }

  async function startBooking(ctx: Context) {
    const chatId = ctx.chat?.id;
    if (chatId === undefined) return;
    drafts.set(chatId, { step: 'category' });
    await show(ctx, categoriesView(), false);
  }

  async function askName(ctx: Context, d: Draft) {
    d.step = 'name';
    const first = ctx.from?.first_name;
    const kb = new Keyboard();
    if (first) kb.text(first).row();
    kb.text('Отмена').resized().oneTime();
    await ctx.reply('Как к вам обращаться? Напишите имя.', { reply_markup: kb });
  }

  async function askPhone(ctx: Context, d: Draft) {
    d.step = 'phone';
    const kb = new Keyboard().requestContact('Отправить мой номер').row().text('Отмена').resized().oneTime();
    await ctx.reply('Оставьте телефон для связи: нажмите кнопку ниже или напишите номер, например +7 912 345-67-89.', {
      reply_markup: kb,
    });
  }

  async function cancelDraft(ctx: Context, edit: boolean) {
    if (ctx.chat) drafts.delete(ctx.chat.id);
    if (edit && ctx.callbackQuery?.message) {
      await ctx.editMessageText('Запись отменена.').catch(() => undefined);
    }
    await ctx.reply('Хорошо. Чем ещё помочь?', { reply_markup: mainKeyboard });
  }

  // ---------- Команды и меню ----------

  bot.command('start', async (ctx) => {
    drafts.delete(ctx.chat.id);
    await ctx.reply(welcome(cfg, ctx.from?.first_name), { ...HTML, reply_markup: mainKeyboard });
  });

  bot.command('id', (ctx) => {
    const title = 'title' in ctx.chat ? ctx.chat.title : ctx.from?.first_name ?? '';
    console.info(`[bot] /id: чат ${ctx.chat.id} (${ctx.chat.type}${title ? `, ${title}` : ''})`);
    return ctx.reply(`ID этого чата: <code>${ctx.chat.id}</code>`, HTML);
  });

  bot.command(['book', 'zapis'], startBooking);
  bot.hears(BTN.book, startBooking);

  const sendPrice = (ctx: Context) => ctx.reply(priceList(), { ...HTML, reply_markup: mainKeyboard });
  bot.command('price', sendPrice);
  bot.hears(BTN.price, sendPrice);

  const sendContacts = (ctx: Context) => ctx.reply(contacts(cfg), { ...HTML, reply_markup: mainKeyboard });
  bot.command('contacts', sendContacts);
  bot.hears(BTN.contacts, sendContacts);

  async function sendMine(ctx: Context) {
    const chatId = ctx.chat?.id;
    if (chatId === undefined) return;
    const today = nowIn(cfg.timezone).date;
    const mine = store
      .all()
      .filter((b) => b.chatId === chatId && isActive(b) && b.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (!mine.length) {
      await ctx.reply('У вас нет предстоящих записей.', { reply_markup: mainKeyboard });
      return;
    }
    for (const b of mine) {
      await ctx.reply(myBookingLine(b), {
        ...HTML,
        reply_markup: new InlineKeyboard().text('Отменить запись', `m:c:${b.id}`),
      });
    }
  }
  bot.command('my', sendMine);
  bot.hears(BTN.mine, sendMine);

  // Администратор: список предстоящих записей.
  bot.command('bookings', async (ctx) => {
    if (!isAdminChat(ctx.chat.id)) return;
    const today = nowIn(cfg.timezone).date;
    const list = store
      .all()
      .filter((b) => isActive(b) && (b.kind === 'callback' || b.date >= today))
      // Заявки без даты («перезвонить») — первыми: по ним нужно действие администратора.
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (!list.length) {
      await ctx.reply('Предстоящих записей нет.');
      return;
    }
    const lines = list.map(
      (b) =>
        `<b>${b.kind === 'callback' ? 'Перезвонить' : `${formatDateShort(b.date)} ${b.time}`}</b> · ${esc(b.serviceTitle)} · ${esc(b.name)} · ${STATUS_LABEL[b.status]} · №${b.id}`,
    );
    await ctx.reply(['<b>Предстоящие записи</b>', '', ...lines].join('\n'), HTML);
  });

  // ---------- Кнопки шагов ----------

  bot.callbackQuery('x', async (ctx) => {
    await ctx.answerCallbackQuery();
    await cancelDraft(ctx, true);
  });

  /** Достаёт черновик или просит начать заново (например, после перезапуска бота). */
  async function draftOf(ctx: Context): Promise<Draft | undefined> {
    const d = ctx.chat ? drafts.get(ctx.chat.id) : undefined;
    if (!d) {
      await ctx.answerCallbackQuery({ text: 'Запись устарела — начните заново.' });
      await startBooking(ctx);
    }
    return d;
  }

  bot.callbackQuery(/^c:(.+)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    const category = catalog.find((c) => c.id === ctx.match[1]);
    const only = category?.services.length === 1 ? category.services[0] : undefined;
    if (only) {
      await selectService(ctx, d, only.id);
      return;
    }
    await ctx.answerCallbackQuery();
    d.categoryId = ctx.match[1];
    d.step = 'service';
    await show(ctx, servicesView(d.categoryId ?? ''), true);
  });

  bot.callbackQuery(/^s:(.+)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    await selectService(ctx, d, ctx.match[1] ?? '');
  });

  async function selectService(ctx: Context, d: Draft, serviceId: string) {
    const found = findService(serviceId);
    if (!found) {
      await ctx.answerCallbackQuery({ text: 'Услуга не найдена' });
      return;
    }
    await ctx.answerCallbackQuery();
    d.serviceId = found.service.id;
    d.categoryId = found.category.id;
    if (found.service.variants.length > 1) {
      d.step = 'variant';
      await show(ctx, variantsView(found.service.id), true);
    } else {
      d.variantIndex = 0;
      d.step = 'date';
      await show(ctx, datesView(d), true);
    }
  }

  bot.callbackQuery(/^v:(\d+)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    await ctx.answerCallbackQuery();
    d.variantIndex = Number(ctx.match[1]);
    d.step = 'date';
    await show(ctx, datesView(d), true);
  });

  bot.callbackQuery(/^d:(.+)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    const date = ctx.match[1] ?? '';
    if (!isISODate(date)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    d.date = date;
    d.step = 'time';
    await show(ctx, timesView(d), true);
  });

  bot.callbackQuery(/^t:(.+)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    const time = ctx.match[1] ?? '';
    const minutes = selectedVariant(d)?.variant.minutes ?? 60;
    if (!isHHMM(time) || !d.date || !isSlotFree(cfg, store.all(), d.date, time, minutes)) {
      await ctx.answerCallbackQuery({ text: 'Это время уже занято, выберите другое.' });
      await show(ctx, timesView(d), true);
      return;
    }
    await ctx.answerCallbackQuery();
    d.time = time;
    await ctx.editMessageText(`Выбрано: <b>${formatDate(d.date)}, ${time}</b>`, HTML).catch(() => undefined);
    if (d.name && d.phone) {
      d.step = 'confirm';
      await show(ctx, confirmView(d), false);
    } else {
      await askName(ctx, d);
    }
  });

  bot.callbackQuery(/^b:(cat|svc|var|date)$/, async (ctx) => {
    const d = await draftOf(ctx);
    if (!d) return;
    await ctx.answerCallbackQuery();
    const target = ctx.match[1];
    if (target === 'cat') {
      d.step = 'category';
      await show(ctx, categoriesView(), true);
    } else if (target === 'svc') {
      d.step = 'service';
      await show(ctx, servicesView(d.categoryId ?? ''), true);
    } else if (target === 'var') {
      d.step = 'variant';
      await show(ctx, variantsView(d.serviceId ?? ''), true);
    } else {
      d.step = 'date';
      await show(ctx, datesView(d), true);
    }
  });

  bot.callbackQuery('ok', async (ctx) => {
    const d = await draftOf(ctx);
    if (!d || ctx.chat === undefined) return;
    const sel = selectedVariant(d);
    if (!sel || !d.date || !d.time || !d.name || !d.phone) {
      await ctx.answerCallbackQuery({ text: 'Не хватает данных — начните заново.' });
      await startBooking(ctx);
      return;
    }
    const minutes = sel.variant.minutes;
    const date = d.date;
    const time = d.time;
    const booking = await store.create(
      {
        source: 'telegram',
        chatId: ctx.chat.id,
        name: d.name,
        phone: d.phone,
        serviceId: sel.service.id,
        serviceTitle: sel.service.title,
        variantLabel: sel.service.variants.length > 1 ? sel.variant.label : null,
        price: fixedPrice(sel.variant),
        date,
        time,
        minutes,
      },
      (existing) => isSlotFree(cfg, existing, date, time, minutes),
    );
    if (!booking) {
      await ctx.answerCallbackQuery({ text: 'Пока вы оформляли запись, это время заняли.' });
      d.step = 'time';
      await show(ctx, timesView(d), true);
      return;
    }
    await ctx.answerCallbackQuery({ text: 'Заявка отправлена' });
    drafts.delete(ctx.chat.id);
    await ctx.editMessageText(
      ['<b>Заявка отправлена</b>', '', bookingSummary(booking), '', 'Администратор подтвердит запись в ближайшее время — мы пришлём сообщение сюда.'].join('\n'),
      HTML,
    );
    await ctx.reply('Если планы изменятся, отменить запись можно в разделе «Мои записи».', { reply_markup: mainKeyboard });
    await notifyAdmin(booking).catch((error) => console.error('[bot] Не удалось уведомить администратора:', error));
  });

  // ---------- Отмена клиентом ----------

  bot.callbackQuery(/^m:c:(.+)$/, async (ctx) => {
    const booking = store.get(ctx.match[1] ?? '');
    if (!booking || booking.chatId !== ctx.chat?.id || !isActive(booking)) {
      await ctx.answerCallbackQuery({ text: 'Запись уже не активна' });
      return;
    }
    const updated = await store.update(booking.id, { status: 'cancelled' });
    await ctx.answerCallbackQuery({ text: 'Запись отменена' });
    if (!updated) return;
    await ctx.editMessageText(myBookingLine(updated), HTML).catch(() => undefined);
    await refreshAdminCard(updated);
    if (cfg.adminChatId !== null) {
      await bot.api
        .sendMessage(cfg.adminChatId, `Клиент отменил запись №${updated.id}: ${formatDateShort(updated.date)} ${updated.time}, ${esc(updated.name)}.`, HTML)
        .catch(() => undefined);
    }
  });

  // ---------- Решение администратора ----------

  bot.callbackQuery(/^a:(ok|no):(.+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) {
      await ctx.answerCallbackQuery({ text: 'Недостаточно прав' });
      return;
    }
    const booking = store.get(ctx.match[2] ?? '');
    if (!booking || booking.status !== 'pending') {
      await ctx.answerCallbackQuery({ text: booking ? `Уже ${STATUS_LABEL[booking.status]}` : 'Заявка не найдена' });
      return;
    }
    const status = ctx.match[1] === 'ok' ? 'confirmed' : 'declined';
    const updated = await store.update(booking.id, { status });
    await ctx.answerCallbackQuery({ text: status === 'confirmed' ? 'Подтверждено' : 'Отклонено' });
    if (!updated) return;
    await ctx.editMessageText(adminCard(updated), HTML).catch(() => undefined);
    if (updated.chatId !== null) {
      const text =
        status === 'confirmed'
          ? `<b>Запись подтверждена</b>\n\n${bookingSummary(updated)}\n\nЖдём вас по адресу: ${esc(cfg.salonAddress)}.`
          : `К сожалению, мы не можем принять вас ${formatDate(updated.date)} в ${updated.time}. Выберите другое время через «${BTN.book}» или позвоните: ${esc(cfg.salonPhone)}.`;
      await bot.api.sendMessage(updated.chatId, text, HTML).catch((e) => console.warn('[bot] Клиенту не доставлено:', e.message));
    }
  });

  // ---------- Текстовые шаги: имя и телефон ----------

  bot.on('message:contact', async (ctx) => {
    const d = drafts.get(ctx.chat.id);
    if (!d || d.step !== 'phone') return;
    await acceptPhone(ctx, d, ctx.message.contact.phone_number);
  });

  async function acceptPhone(ctx: Context, d: Draft, raw: string) {
    const phone = normalizePhone(raw);
    if (!phone) {
      await ctx.reply('Не получилось распознать номер. Нужен российский номер из 10 цифр после +7, например +7 912 345-67-89.');
      return;
    }
    d.phone = phone;
    d.step = 'confirm';
    await ctx.reply('Спасибо!', { reply_markup: mainKeyboard });
    await show(ctx, confirmView(d), false);
  }

  bot.on('message:text', async (ctx) => {
    const d = drafts.get(ctx.chat.id);
    const text = ctx.message.text.trim();
    if (!d) {
      await ctx.reply('Выберите действие в меню ниже.', { reply_markup: mainKeyboard });
      return;
    }
    if (text === 'Отмена') {
      await cancelDraft(ctx, false);
      return;
    }
    if (d.step === 'name') {
      if (text.length < 2 || text.length > 60 || /\d/.test(text)) {
        await ctx.reply('Имя должно быть от 2 до 60 символов, без цифр. Напишите, пожалуйста, ещё раз.');
        return;
      }
      d.name = text;
      if (d.phone) {
        d.step = 'confirm';
        await ctx.reply('Спасибо!', { reply_markup: mainKeyboard });
        await show(ctx, confirmView(d), false);
      } else {
        await askPhone(ctx, d);
      }
      return;
    }
    if (d.step === 'phone') {
      await acceptPhone(ctx, d, text);
      return;
    }
    await ctx.reply('Выберите вариант кнопкой в сообщении выше или нажмите «Отмена».');
  });

  bot.catch((err) => console.error('[bot] Ошибка обработки обновления:', err.error));

  return { bot, notifyAdmin };
}
