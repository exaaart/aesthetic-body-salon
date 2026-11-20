import type { GalleryPhoto, Photo } from './gallery';

/** Косметолог салона. Данные и фото предоставлены заказчиком. */
export interface Cosmetologist {
  name: string;
  role: string;
  facts: { label: string; value: string }[];
  /** Направления работы. */
  specializations: string[];
  photo: Photo;
}

export const cosmetologist: Cosmetologist = {
  name: 'Морозова Елена Васильевна',
  role: 'Косметолог',
  facts: [
    { label: 'Стаж работы', value: '10 лет' },
    { label: 'Образование', value: 'Медицинское' },
  ],
  specializations: ['Инъекционная косметология', 'Аппаратная косметология', 'Лазерная эпиляция'],
  photo: {
    base: '/images/portfolio-01',
    widths: [480, 962],
    width: 962,
    height: 1280,
    alt: 'Косметолог Морозова Елена Васильевна в белом халате в кабинете салона',
  },
};

/**
 * Фотографии работ (фото заказчика). Файлы — в public/images (AVIF, WebP, JPEG, см. gallery.ts).
 * Если список пуст, раздел «Работы» на странице не показывается.
 */
export const portfolio: GalleryPhoto[] = [
  {
    id: 'laser-procedure',
    base: '/images/portfolio-laser',
    widths: [640, 960, 1280],
    width: 1280,
    height: 532,
    alt: 'Косметолог в защитных очках проводит процедуру лазерной эпиляции клиентке на кушетке',
    caption: 'Лазерная эпиляция',
  },
  {
    id: 'injection',
    base: '/images/portfolio-injection',
    widths: [353],
    width: 353,
    height: 400,
    alt: 'Косметолог в перчатках делает инъекцию клиентке в зоне под глазом',
    caption: 'Инъекционная косметология',
  },
  {
    // Подпись не указана: по фото не определить процедуру, заказчик её не назвал.
    id: 'scalp',
    base: '/images/portfolio-scalp',
    widths: [545],
    width: 545,
    height: 672,
    alt: 'Косметолог в чёрных перчатках проводит процедуру на коже головы клиентки, лежащей на кушетке',
    caption: '',
  },
];
