import type { ReactNode } from 'react';
import { useBooking } from '../context/BookingContext';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import styles from './BookingCta.module.css';

interface BookingCtaProps {
  /** Заголовок блока: на главной и в портфолио он разный. */
  title: ReactNode;
}

export function BookingCta({ title }: BookingCtaProps) {
  const { openBooking } = useBooking();
  return (
    <section id="booking" className={styles.section} aria-labelledby="booking-title">
      <Reveal className={`container ${styles.inner}`}>
        <h2 id="booking-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.side}>
          <p className={styles.subtitle}>Запишитесь на&nbsp;процедуру прямо сейчас</p>
          <Button arrow onClick={() => openBooking()} aria-haspopup="dialog">
            Записаться онлайн
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
