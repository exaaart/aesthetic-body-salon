import { catalog, formatPrice, formatVariantPrice, type Service } from '../../bot/src/catalog';
import type { IconName } from '../components/ui/Icon';

/**
 * Услуги сайта строятся из прайс-листа Telegram-бота (bot/src/catalog.ts) — цены и состав
 * меняются в одном месте. Здесь задаются только иконка и короткое описание направления.
 */
export interface ServiceItem {
  /** Значение для формы записи: id услуги или `id@индекс` для варианта другой длительности. */
  id: string;
  name: string;
  note?: string;
  price?: string;
  /** Подпись в выпадающем списке формы записи. */
  optionLabel: string;
}

export interface ServiceDirection {
  id: string;
  title: string;
  summary: string;
  /** «от 1 000 ₽» — минимальная цена направления. */
  fromPrice: string;
  /** Пояснение к ценам в панели услуг (необязательно). */
  priceNote?: string;
  icon: IconName;
  items: ServiceItem[];
}

const presentation: Record<string, { icon: IconName; summary: string; priceNote?: string }> = {
  laser: {
    icon: 'beam',
    summary: 'Комплексы для тела и отдельные зоны лица: верхняя губа и бакенбарды',
    priceNote: 'Цены комплексов: первичное посещение / последующие сеансы.',
  },
  vacuum: { icon: 'roller', summary: 'Моделирующий массаж всего тела, 40 или 70 минут' },
  injection: {
    icon: 'drop',
    summary: 'Мезотерапия, биоревитализация и липолитики',
  },
  apparatus: { icon: 'pulse', summary: 'Вакуумная чистка, карбокситерапия и радиолифтинг лица' },
  'face-massage': { icon: 'bubbles', summary: 'Восточный массаж лица' },
};

const sameDuration = (s: Service) => s.variants.every((v) => v.minutes === s.variants[0]?.minutes);
const isVisitPricing = (s: Service) => s.variants.length === 2 && s.variants[0]?.label === 'Первичное посещение';
const durationNote = (label: string) => (/минут/.test(label) ? label : undefined);
const joinNotes = (...notes: (string | undefined)[]) => notes.filter(Boolean).join(', ') || undefined;

/** Превращает услугу прайса в строки сайта: одна строка или по строке на вариант длительности. */
function toItems(service: Service): ServiceItem[] {
  if (isVisitPricing(service)) {
    const [first, next] = service.variants;
    return [
      {
        id: service.id,
        name: service.title,
        note: service.note,
        price: `${formatPrice(first?.price ?? 0).replace(/ ₽$/, '')} / ${formatPrice(next?.price ?? 0)}`,
        optionLabel: service.title,
      },
    ];
  }
  if (service.variants.length > 1 && !sameDuration(service)) {
    return service.variants.map((v, i) => ({
      id: `${service.id}@${i}`,
      name: service.title,
      note: joinNotes(v.label, service.note),
      price: formatVariantPrice(v),
      optionLabel: `${service.title} — ${v.label}`,
    }));
  }
  const v = service.variants[0];
  return [
    {
      id: service.id,
      name: service.title,
      note: joinNotes(durationNote(v?.label ?? ''), service.note),
      price: v ? formatVariantPrice(v) : undefined,
      optionLabel: service.title,
    },
  ];
}

export const services: ServiceDirection[] = catalog.map((category) => {
  const view = presentation[category.id] ?? { icon: 'beam' as IconName, summary: '' };
  const min = Math.min(...category.services.flatMap((s) => s.variants.map((v) => v.price)));
  return {
    id: category.id,
    title: category.title,
    summary: view.summary,
    fromPrice: `от ${formatPrice(min)}`,
    priceNote: category.note ? `${category.note}.` : view.priceNote,
    icon: view.icon,
    items: category.services.flatMap(toItems),
  };
});

/** Значение для записи «на направление», когда конкретную услугу подберёт косметолог. */
export const directionOptionId = (directionId: string): string => `${directionId}:any`;

/** В направлении несколько разных процедур (а не одна услуга в вариантах длительности). */
export const hasServiceChoice = (direction: ServiceDirection): boolean =>
  new Set(direction.items.map((item) => item.id.split('@')[0])).size > 1;

/** Что предвыбрать в форме по кнопке «Записаться» направления. */
export const directionBookingValue = (direction: ServiceDirection): string =>
  hasServiceChoice(direction) ? directionOptionId(direction.id) : direction.items[0]?.id ?? '';

/** Человекочитаемое название выбранной услуги (для заявки администратору). */
export const serviceLabel = (id: string): string => {
  for (const direction of services) {
    if (id === directionOptionId(direction.id)) return `${direction.title}: подобрать с косметологом`;
    const item = direction.items.find((service) => service.id === id);
    if (item) return item.optionLabel;
  }
  return id;
};
