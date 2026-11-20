/**
 * Фотографии сайта. Файлы лежат в public/images в трёх форматах (AVIF, WebP, JPEG)
 * и нескольких ширинах: `${base}-${width}.${ext}`.
 * На сайте используется только главное фото (hero) — из профиля организации на Яндекс Картах (см. CREDITS.md).
 * Остальные прежние фото убраны со страниц по просьбе заказчика; их файлы остались в public/images.
 */
export interface Photo {
  /** Путь без ширины и расширения, например `/images/about-room`. */
  base: string;
  widths: number[];
  width: number;
  height: number;
  alt: string;
  /** Точка фокуса при кадрировании (CSS object-position), по умолчанию центр. */
  focus?: string;
}

export interface GalleryPhoto extends Photo {
  id: string;
  caption: string;
}

export const heroPhoto: Photo = {
  base: '/images/hero-room',
  widths: [480, 720, 960],
  width: 960,
  height: 1280,
  alt: 'Светлый кабинет салона: кушетка, аппараты для процедур, овальное зеркало и букет лаванды',
  focus: '62% 50%',
};

/**
 * Галерея «Наша атмосфера» на главной (фотографии заказчика).
 * Если список пуст, секция и пункт меню «Галерея» скрываются.
 */
export const gallery: GalleryPhoto[] = [
  {
    id: 'cabinet',
    base: '/images/gallery-cabinet',
    widths: [480, 960],
    width: 960,
    height: 1280,
    alt: 'Кабинет салона: стена с лавандовым полем и логотипом Aesthetic Body, столик с сухоцветами и препаратами',
    caption: 'Кабинет салона',
  },
  {
    id: 'equipment',
    base: '/images/gallery-equipment',
    widths: [640, 954],
    width: 954,
    height: 1275,
    alt: 'Кабинет с косметологическими аппаратами, овальным зеркалом и белой кушеткой у окна',
    caption: 'Аппараты и кушетка',
  },
  {
    id: 'diplomas',
    base: '/images/gallery-diplomas',
    widths: [640, 960, 1280],
    width: 1280,
    height: 960,
    alt: 'Стена кабинета с дипломами и сертификатами в рамках',
    caption: 'Дипломы и сертификаты',
  },
  {
    id: 'mirror',
    base: '/images/gallery-mirror',
    widths: [640, 798],
    width: 798,
    height: 1270,
    alt: 'Комод с косметикой и сухоцветами под зеркалом, в котором отражается логотип Aesthetic Body',
    caption: 'Косметика для ухода',
  },
  {
    id: 'preparations',
    base: '/images/gallery-preparations',
    widths: [640, 960, 1280],
    width: 1280,
    height: 960,
    alt: 'Препараты и расходные материалы для косметологических процедур на столе',
    caption: 'Препараты для процедур',
  },
];
