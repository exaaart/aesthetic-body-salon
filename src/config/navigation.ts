import { gallery } from '../data/gallery';

/** Страницы сайта. Пути совпадают с папками HTML-входов (obuchenie/index.html, portfolio/index.html). */
export type PageId = 'home' | 'training' | 'portfolio';

export const pagePaths: Record<PageId, string> = {
  home: '/',
  training: '/obuchenie/',
  portfolio: '/portfolio/',
};

export interface NavItem {
  key: string;
  label: string;
  /** Якорь секции главной страницы. */
  section?: string;
  /** Отдельная страница. */
  page?: PageId;
}

/** Пункты меню (шапка и подвал). Галерея появляется, когда в ней есть фото. */
export const navItems: NavItem[] = [
  { key: 'services', label: 'Услуги', section: 'services' },
  { key: 'about', label: 'О нас', section: 'about' },
  ...(gallery.length > 0 ? [{ key: 'gallery', label: 'Галерея', section: 'gallery' }] : []),
  { key: 'portfolio', label: 'Портфолио', page: 'portfolio' },
  { key: 'training', label: 'Обучение', page: 'training' },
  { key: 'reviews', label: 'Отзывы', section: 'reviews' },
  { key: 'contacts', label: 'Контакты', section: 'contacts' },
];

/** Подвал с контактами есть на каждой странице — его якорь работает везде. */
const sectionOnEveryPage = new Set(['contacts']);

export function navHref(item: NavItem, current: PageId): string {
  if (item.page) return pagePaths[item.page];
  const section = item.section ?? '';
  return current === 'home' || sectionOnEveryPage.has(section) ? `#${section}` : `${pagePaths.home}#${section}`;
}

/** Ссылка на секцию главной с любой страницы. */
export const homeSectionHref = (section: string, current: PageId): string =>
  current === 'home' ? `#${section}` : `${pagePaths.home}#${section}`;
