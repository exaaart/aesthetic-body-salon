/**
 * Прайс-лист салона. Лазерные комплексы и массаж — из обсуждения «ПРАЙС» в группе ВКонтакте
 * (https://vk.ru/topic-220231697_49696718); остальные услуги и цены — по списку заказчика.
 * Меняйте цены и длительности здесь: бот подхватит их после пересборки и перезапуска,
 * сайт (src/data/services.ts) берёт услуги и цены отсюда же.
 */

export interface PriceVariant {
  /** Подпись варианта, например «Первичное посещение» или «70 минут». */
  label: string;
  price: number;
  /** Длительность в минутах — занимает время в расписании. */
  minutes: number;
  /** Цена «от» — точная стоимость зависит от процедуры. */
  priceFrom?: boolean;
}

export interface Service {
  id: string;
  title: string;
  /** Короткое пояснение под названием (необязательно). */
  note?: string;
  variants: PriceVariant[];
}

export interface Category {
  id: string;
  title: string;
  /** Пояснение ко всему направлению (необязательно). */
  note?: string;
  services: Service[];
}

// TODO: уточнить длительность лазерных комплексов — в прайсе она не указана, стоят оценки.
const laser = (first: number, next: number, minutes: number): PriceVariant[] => [
  { label: 'Первичное посещение', price: first, minutes },
  { label: 'Последующие сеансы', price: next, minutes },
];

// TODO: уточнить у заказчика длительность — в списке её нет, стоят оценки для расписания бота.
const once = (price: number, minutes: number, priceFrom?: boolean): PriceVariant[] => [
  { label: 'Процедура', price, minutes, ...(priceFrom ? { priceFrom } : {}) },
];

export const catalog: Category[] = [
  {
    id: 'laser',
    title: 'Лазерная эпиляция',
    services: [
      { id: 'lz-1', title: 'Подмышечные впадины + тотальное бикини', variants: laser(1000, 1200, 30) },
      { id: 'lz-2', title: 'Голени (с коленями) + подмышечные впадины', variants: laser(1250, 1450, 45) },
      { id: 'lz-3', title: 'Голени (с коленями) + тотальное бикини', variants: laser(1800, 2100, 45) },
      {
        id: 'lz-4',
        title: 'Подмышечные впадины + тотальное бикини + голени (с коленями)',
        variants: laser(1800, 2100, 60),
      },
      {
        id: 'lz-5',
        title: 'Подмышечные впадины + тотальное бикини + ноги полностью',
        variants: laser(2200, 2600, 60),
      },
      {
        id: 'lz-6',
        title: 'Всё тело',
        note: 'подмышечные впадины, тотальное бикини, ноги и руки полностью',
        variants: laser(3400, 3700, 90),
      },
      { id: 'lz-lip', title: 'Верхняя губа', variants: once(500, 15) },
      { id: 'lz-sideburns', title: 'Бакенбарды', variants: once(800, 15) },
    ],
  },
  {
    id: 'vacuum',
    title: 'Вакуумно-роликовый массаж',
    services: [
      {
        id: 'vacuum-roller',
        title: 'Вакуумно-роликовый массаж всего тела',
        variants: [
          { label: '40 минут', price: 1000, minutes: 40 },
          { label: '70 минут', price: 1500, minutes: 70 },
        ],
      },
    ],
  },
  {
    id: 'injection',
    title: 'Инъекционная косметология',
    note: 'Препараты производства Испании',
    services: [
      { id: 'meso-face', title: 'Мезотерапия лица', variants: once(5000, 60) },
      { id: 'biorevital', title: 'Биоревитализация лица', variants: once(8000, 60) },
      { id: 'meso-hair', title: 'Мезотерапия волос', variants: once(4000, 60) },
      { id: 'lipolytics', title: 'Липолитики', variants: once(3000, 45, true) },
    ],
  },
  {
    id: 'apparatus',
    title: 'Аппаратная косметология',
    services: [
      { id: 'vacuum-cleansing', title: 'Вакуумная чистка лица', variants: once(2000, 60) },
      { id: 'carboxy-device', title: 'Аппаратная карбокситерапия', variants: once(2500, 60) },
      { id: 'carboxy-care', title: 'Уходовая карбокситерапия', variants: once(2500, 60) },
      { id: 'rf-lifting', title: 'Радиолифтинг лица', variants: once(2000, 60) },
    ],
  },
  {
    id: 'face-massage',
    title: 'Массаж лица',
    services: [{ id: 'oriental-face', title: 'Восточный массаж лица', variants: once(1500, 45) }],
  },
];

export const findService = (serviceId: string): { category: Category; service: Service } | undefined => {
  for (const category of catalog) {
    const service = category.services.find((s) => s.id === serviceId);
    if (service) return { category, service };
  }
  return undefined;
};

/**
 * Значение услуги в заявке с сайта: `id` или `id@индекс` для вариантов разной длительности
 * (например, массаж 40 или 70 минут).
 */
export const parseServiceValue = (value: string) => {
  const [id = '', index] = value.split('@');
  const found = findService(id);
  if (!found) return undefined;
  const variantIndex = index === undefined ? 0 : Number(index);
  const variant = found.service.variants[variantIndex];
  return variant ? { ...found, variant, variantIndex } : undefined;
};

export const formatPrice = (rub: number): string => `${rub.toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;

/** Цена варианта для показа: «3 000 ₽» или «от 3 000 ₽». */
export const formatVariantPrice = (v: PriceVariant): string => `${v.priceFrom ? 'от ' : ''}${formatPrice(v.price)}`;

/** Точная цена для заявки или null, если цена «от». */
export const fixedPrice = (v: PriceVariant): number | null => (v.priceFrom ? null : v.price);

export const minPrice = (service: Service): number => Math.min(...service.variants.map((v) => v.price));
