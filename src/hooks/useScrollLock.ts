import { useEffect } from 'react';

let locks = 0;

const lock = () => {
  locks += 1;
  if (locks > 1) return;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : '';
  document.documentElement.style.setProperty('--scrollbar-comp', `${scrollbar}px`);
  document.body.setAttribute('data-scroll-locked', '');
};

const unlock = () => {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  document.body.style.paddingRight = '';
  document.documentElement.style.removeProperty('--scrollbar-comp');
  document.body.removeAttribute('data-scroll-locked');
};

/** Блокирует прокрутку страницы, пока active === true. Поддерживает вложенные оверлеи. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}
