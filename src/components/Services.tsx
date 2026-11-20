import { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { directionBookingValue, services } from '../data/services';
import { typo } from '../lib/typography';
import { ServicesPanel } from './ServicesPanel';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Reveal } from './ui/Reveal';
import styles from './Services.module.css';

/** null — панель закрыта, 'all' — все направления, иначе id направления. */
type PanelState = null | 'all' | string;

export function Services() {
  const [panel, setPanel] = useState<PanelState>(null);
  const { openBooking } = useBooking();

  // Сначала закрываем панель (фокус вернётся на направление), затем открываем форму —
  // так после закрытия формы фокус окажется на исходной кнопке.
  const book = (serviceId: string) => {
    setPanel(null);
    window.setTimeout(() => openBooking(serviceId), 240);
  };

  return (
    <section id="services" className={styles.section} aria-labelledby="services-title">
      <div className="container">
        <Reveal className={styles.head}>
          <div className={styles.titles}>
            <h2 id="services-title" className={styles.title}>
              Наши услуги
            </h2>
            <p className={styles.subtitle}>{typo('Качественный уход для вашей красоты и уверенности в себе')}</p>
          </div>
          <Button variant="link" arrow onClick={() => setPanel('all')} aria-haspopup="dialog">
            Все услуги
          </Button>
        </Reveal>

        <ul className={styles.grid}>
          {services.map((direction, index) => (
            <Reveal as="li" key={direction.id} delay={(index % 3) * 70} className={styles.cell}>
              <button
                type="button"
                className={styles.item}
                onClick={() => setPanel(direction.id)}
                aria-haspopup="dialog"
              >
                <Icon name={direction.icon} size={32} className={styles.icon} />
                <span className={styles.name}>{direction.title}</span>
                <span className={styles.summary}>{typo(direction.summary)}</span>
                <span className={styles.price}>{direction.fromPrice}</span>
                <span className={styles.more}>
                  Подробнее
                  <Icon name="arrow-right" size={18} />
                </span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <ServicesPanel
        state={panel}
        onClose={() => setPanel(null)}
        onBook={(direction) => book(directionBookingValue(direction))}
        onBookItem={book}
      />
    </section>
  );
}
