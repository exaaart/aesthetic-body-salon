import { createContext, useContext } from 'react';
import type { PageId } from '../config/navigation';

/** Текущая страница: от неё зависят ссылки меню и подсветка активного пункта. */
export const PageContext = createContext<PageId>('home');

export const usePage = (): PageId => useContext(PageContext);
