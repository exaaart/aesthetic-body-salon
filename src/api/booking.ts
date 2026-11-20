import { siteConfig } from '../config/site';

/** Тело запроса на запись. Контракт описан в README. */
export interface BookingPayload {
  name: string;
  /** Телефон в формате E.164, например +79123456789. */
  phone: string;
  serviceId: string;
  /** Название услуги для администратора, например «Маникюр: Маникюр с покрытием гель-лаком». */
  serviceTitle: string;
  /** slot — запись на выбранные дату и время; callback — время согласуют по телефону. */
  mode: 'slot' | 'callback';
  /** Дата в формате ISO YYYY-MM-DD (только для mode: slot). */
  date?: string;
  /** Время в формате HH:MM (только для mode: slot). */
  time?: string;
  consent: true;
}

export type BookingResult =
  | { status: 'success' }
  | { status: 'not-configured' }
  | { status: 'error'; message: string };

const REQUEST_TIMEOUT_MS = 15000;

export async function submitBooking(payload: BookingPayload): Promise<BookingResult> {
  const url = siteConfig.bookingApiUrl;
  if (!url) {
    console.info('[Aesthetic Body] Демо-режим: VITE_BOOKING_API_URL не задан, заявка никуда не отправлена.', payload);
    return { status: 'not-configured' };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (response.ok) return { status: 'success' };
    // Сервер может вернуть понятное сообщение: { "message": "Это время уже занято…" }.
    const body: unknown = await response.json().catch(() => null);
    const serverMessage =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string' ? body.message : '';
    return {
      status: 'error',
      message: serverMessage || `Сервер записи ответил ошибкой (код ${response.status}). Попробуйте ещё раз или позвоните нам.`,
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      status: 'error',
      message: aborted
        ? 'Сервер записи не ответил вовремя. Проверьте соединение и попробуйте ещё раз.'
        : 'Не удалось отправить заявку: нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.',
    };
  } finally {
    window.clearTimeout(timer);
  }
}
