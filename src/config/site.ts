/**
 * Все настройки и контакты салона. Меняйте значения здесь — вёрстку трогать не нужно.
 * Пустая строка означает «не задано»: такая строка или ссылка на сайте не выводится.
 */

export type SocialNetwork = 'telegram' | 'vk' | 'whatsapp';

export interface SocialLink {
  network: SocialNetwork;
  label: string;
  url: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  title: string;
  description: string;
  /** Цитата на главном экране: строки (для переноса) и автор. */
  heroQuote: { lines: string[]; author: string };
  /** Канонический адрес сайта со слешем на конце. */
  siteUrl: string;
  locale: string;
  themeColor: string;
  /** Отображаемый телефон. Для ссылки tel: цифры извлекаются автоматически. */
  phone: string;
  email: string;
  address: string;
  /** Точка на Яндекс Картах: организация (ТЦ) и её координаты для маршрута. Пустой orgId — карта не выводится. */
  map: { orgId: string; title: string; lat: number; lon: number };
  /** Подпись режима работы для футера. */
  hoursLabel: string;
  openingHours: string;
  /** Рабочие часы для слотов записи, формат ЧЧ:ММ. */
  bookingHours: { open: string; close: string; stepMinutes: number };
  /** На сколько дней вперёд открыта онлайн-запись. Должно совпадать с BOOKING_DAYS_AHEAD бота. */
  bookingDaysAhead: number;
  socials: SocialLink[];
  reviewsUrl: string;
  privacyPolicyUrl: string;
  bookingApiUrl: string;
  /** Пока отзывы демонстрационные, над ними выводится заметная пометка. */
  reviewsAreDemo: boolean;
}

export const siteConfig: SiteConfig = {
  name: 'Aesthetic Body',
  tagline: 'Beauty Salon',
  title: 'Aesthetic Body — салон красоты в Брянске',
  // Цитата и автор — по тексту заказчика.
  heroQuote: { lines: ['Самое красивое лицо', 'в мире — ваше'], author: 'Эсте Лаудер' },
  description:
    'Салон красоты Aesthetic Body в Брянске: лазерная эпиляция, вакуумно-роликовый массаж, инъекционная и аппаратная косметология, массаж лица. Цены и онлайн-запись.',
  // TODO: заменить на реальный домен
  siteUrl: 'https://example.com/',
  locale: 'ru_RU',
  themeColor: '#120D17',
  // Контакты, адрес, режим и соцсети — из профиля организации на Яндекс Картах (ссылка заказчика).
  phone: '+7 (920) 832-22-28',
  // Пустое значение скрывает строку в подвале.
  email: '',
  address: 'ТЦ «Соловьи», Брянск, ул. Дуки, 63, 2 этаж',
  // ТЦ «Соловьи» на Яндекс Картах (ссылка заказчика); координаты — те, что Яндекс использует для маршрута.
  map: { orgId: '89858327112', title: 'ТЦ «Соловьи»', lat: 53.265685, lon: 34.358806 },
  hoursLabel: 'Ежедневно 10:00–21:00',
  /** Режим работы в формате schema.org для JSON-LD; пустая строка — не выводить. */
  openingHours: 'Mo-Su 10:00-21:00',
  bookingHours: { open: '10:00', close: '21:00', stepMinutes: 30 },
  bookingDaysAhead: 14,
  // Соцсети без ссылки не выводятся.
  socials: [
    { network: 'telegram', label: 'Telegram', url: 'https://t.me/+79208322228' },
    { network: 'vk', label: 'ВКонтакте', url: 'https://vk.ru/aestheticbody32' },
    { network: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/79208322228' },
  ],
  /** Страница с отзывами и рейтингом; пустая строка — ссылка не выводится. */
  reviewsUrl: 'https://yandex.ru/maps/org/aesthetic_body/126522033047/reviews/',
  // TODO: заменить на страницу политики обработки персональных данных
  privacyPolicyUrl: '/privacy.html',
  bookingApiUrl: (import.meta.env?.VITE_BOOKING_API_URL ?? '').trim(),
  // Отзывы в src/data/reviews.ts — реальные, с Яндекс Карт.
  reviewsAreDemo: false,
};

/** Ссылка tel: для номера; для пустого номера или заглушки из нулей — пустая строка (номер не кликабелен). */
export const phoneHref = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  const national = digits.length === 11 ? digits.slice(1) : digits;
  if (!national || /^0+$/.test(national)) return '';
  return `tel:+7${national}`;
};

/** Ссылки и встраивание Яндекс Карт для точки из конфига. */
export const yandexMap = {
  /** Карточка организации. */
  orgUrl: (m: SiteConfig['map']) => `https://yandex.ru/maps/org/${m.orgId}/`,
  /** Маршрут до точки (Яндекс подставит текущее местоположение пользователя). */
  routeUrl: (m: SiteConfig['map']) =>
    `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=~${m.lat}%2C${m.lon}&ruri=~ymapsbm1%3A%2F%2Forg%3Foid%3D${m.orgId}`,
  /**
   * Встраиваемая карта с фиолетовым маркером в точке ТЦ. Без карточки организации:
   * в ней телефон торгового центра, а не салона.
   */
  widgetUrl: (m: SiteConfig['map']) =>
    `https://yandex.ru/map-widget/v1/?ll=${m.lon}%2C${m.lat}&z=17&pt=${m.lon}%2C${m.lat}%2Cpm2vvm`,
};
