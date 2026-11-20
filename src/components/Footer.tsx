import { navHref, navItems } from '../config/navigation';
import { phoneHref, siteConfig } from '../config/site';
import { usePage } from '../context/PageContext';
import { Location } from './Location';
import { Logo } from './Logo';
import { Icon } from './ui/Icon';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  const page = usePage();
  const phone = phoneHref(siteConfig.phone);
  const socials = siteConfig.socials.filter((s) => s.url.trim());
  const contacts = [
    siteConfig.phone && {
      key: 'phone',
      icon: 'phone' as const,
      content: phone ? <a href={phone}>{siteConfig.phone}</a> : <span>{siteConfig.phone}</span>,
    },
    siteConfig.email && {
      key: 'email',
      icon: 'mail' as const,
      content: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>,
    },
    siteConfig.address && { key: 'address', icon: 'pin' as const, content: <span>{siteConfig.address}</span> },
    siteConfig.hoursLabel && { key: 'hours', icon: 'clock' as const, content: <span>{siteConfig.hoursLabel}</span> },
  ].filter((item): item is Exclude<typeof item, '' | false> => Boolean(item));

  return (
    <footer id="contacts" className={styles.footer} aria-labelledby="contacts-title">
      <Location />
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Logo />
          <p className={styles.brandText}>Профессиональный уход, атмосфера уюта и&nbsp;заботы</p>
        </div>

        <nav className={styles.col} aria-label="Навигация в подвале">
          <h2 className={styles.heading}>Навигация</h2>
          <ul className={styles.links}>
            {navItems.map((item) => (
              <li key={item.key}>
                <a href={navHref(item, page)} className={styles.link}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 id="contacts-title" className={styles.heading}>
            Контакты
          </h2>
          <ul className={styles.contacts}>
            {contacts.map((item) => (
              <li key={item.key} className={styles.contact}>
                <Icon name={item.icon} size={18} className={styles.contactIcon} />
                {item.content}
              </li>
            ))}
          </ul>
          {socials.length > 0 && (
            <ul className={styles.socials}>
              {socials.map((social) => (
                <li key={social.network}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} (откроется в новой вкладке)`}
                    className={styles.social}
                  >
                    <Icon name={social.network} size={22} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          ©&nbsp;{year} <span lang="en">{siteConfig.name}</span>
        </p>
        {siteConfig.privacyPolicyUrl && (
          <a href={siteConfig.privacyPolicyUrl} className={styles.link}>
            Политика конфиденциальности
          </a>
        )}
      </div>
    </footer>
  );
}
