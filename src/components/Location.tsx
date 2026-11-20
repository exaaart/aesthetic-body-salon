import { siteConfig, yandexMap } from '../config/site';
import { typo } from '../lib/typography';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import styles from './Location.module.css';

/** «Как нас найти»: адрес, часы и Яндекс Карта с маркером ТЦ и кнопкой маршрута. */
export function Location() {
  const { map } = siteConfig;
  if (!map.orgId) return null;
  // «ТЦ «Соловьи», Брянск, ул. Дуки, 63, 2 этаж» → крупно название места, ниже улица.
  const street = siteConfig.address.replace(map.title, '').replace(/^,\s*/, '');

  return (
    <section className={styles.location} aria-labelledby="location-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.info}>
          <h2 id="location-title" className={styles.title}>
            Как нас найти
          </h2>
          <p className={styles.place}>{map.title}</p>
          <p className={styles.street}>
            <Icon name="pin" size={18} className={styles.icon} />
            {typo(street)}
          </p>
          {siteConfig.hoursLabel && (
            <p className={styles.street}>
              <Icon name="clock" size={18} className={styles.icon} />
              {siteConfig.hoursLabel}
            </p>
          )}
          <div className={styles.actions}>
            <Button href={yandexMap.routeUrl(map)} variant="outline" arrow target="_blank" rel="noopener noreferrer">
              Построить маршрут
            </Button>
            <Button href={yandexMap.orgUrl(map)} variant="link" target="_blank" rel="noopener noreferrer">
              Открыть в&nbsp;Яндекс Картах
            </Button>
          </div>
        </div>

        <div className={styles.map}>
          <iframe
            src={yandexMap.widgetUrl(map)}
            title={`Карта: ${map.title} на Яндекс Картах`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={styles.frame}
          />
        </div>
      </div>
    </section>
  );
}
