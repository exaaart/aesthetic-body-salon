import { useEffect, useRef, useState } from 'react';
import { navHref, navItems, type NavItem } from '../config/navigation';
import { phoneHref, siteConfig } from '../config/site';
import { useBooking } from '../context/BookingContext';
import { usePage } from '../context/PageContext';
import { useActiveSection } from '../hooks/useActiveSection';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useScrolled } from '../hooks/useScrolled';
import { useScrollLock } from '../hooks/useScrollLock';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import styles from './Header.module.css';

const sectionIds = navItems.flatMap((item) => (item.section ? [item.section] : []));

export function Header() {
  const scrolled = useScrolled();
  const active = useActiveSection(sectionIds);
  const page = usePage();
  /** Страница — «page», секция главной — «location» (только там, где она видна). */
  const current = (item: NavItem): 'page' | 'location' | undefined => {
    if (item.page) return item.page === page ? 'page' : undefined;
    return item.section && active === item.section ? 'location' : undefined;
  };
  const { openBooking } = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useScrollLock(menuOpen);
  useFocusTrap(panelRef, menuOpen);

  useEffect(() => {
    if (!menuOpen) return undefined;
    // Откладываем фокус до следующей задачи, когда панель уже видима и фокусируема.
    const timer = window.setTimeout(() => firstLinkRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    const mq = window.matchMedia('(min-width: 1280px)');
    const onMq = () => mq.matches && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const phone = phoneHref(siteConfig.phone);

  return (
    <header className={styles.header} data-solid={scrolled || menuOpen || undefined}>
      <div className={`container ${styles.inner}`}>
        <Logo className={styles.logo} onClick={closeMenu} />

        <nav className={styles.nav} aria-label="Основная навигация">
          <ul className={styles.list}>
            {navItems.map((item) => (
              <li key={item.key}>
                <a href={navHref(item, page)} className={styles.link} aria-current={current(item)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Button className={styles.cta} onClick={() => openBooking()}>
          Записаться
        </Button>

        <button
          ref={burgerRef}
          type="button"
          className={styles.burger}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={26} />
        </button>
      </div>

      <div
        className={styles.overlay}
        data-open={menuOpen || undefined}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="mobile-menu"
        className={styles.panel}
        data-open={menuOpen || undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        {...(menuOpen ? {} : { inert: '' })}
      >
        <div className={styles.panelTop}>
          <button
            type="button"
            className={styles.burger}
            aria-label="Закрыть меню"
            onClick={() => {
              closeMenu();
              burgerRef.current?.focus();
            }}
          >
            <Icon name="close" size={26} />
          </button>
        </div>
        <nav aria-label="Мобильная навигация">
          <ul className={styles.mobileList}>
            {navItems.map((item, index) => (
              <li key={item.key}>
                <a
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={navHref(item, page)}
                  className={styles.mobileLink}
                  aria-current={current(item)}
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.panelFoot}>
          <Button
            block
            arrow
            onClick={() => {
              closeMenu();
              openBooking();
            }}
          >
            Записаться
          </Button>
          {phone && (
            <a href={phone} className={styles.phone}>
              <Icon name="phone" size={18} />
              {siteConfig.phone}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
