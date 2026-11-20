import { useBooking } from '../context/BookingContext';
import { directionOptionId } from '../data/services';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import styles from './LaserVideo.module.css';

/** Видео заказчика: процедура лазерной эпиляции в кабинете салона (720×1280, 12 с). */
const VIDEO = { src: '/videos/laser-epilation.mp4', width: 720, height: 1280 };

export function LaserVideo() {
  const { openBooking } = useBooking();

  return (
    <section id="video" className={styles.section} aria-labelledby="video-title">
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.media}>
          <figure className={styles.figure}>
            <div className={styles.frame}>
              {/* Без автозапуска: видео загружается и играет только по нажатию. #t — кадр-превью. */}
              <video
                className={styles.video}
                src={`${VIDEO.src}#t=0.5`}
                width={VIDEO.width}
                height={VIDEO.height}
                controls
                playsInline
                preload="metadata"
                aria-describedby="video-caption"
              />
            </div>
            <figcaption id="video-caption" className={styles.caption}>
              Процедура лазерной эпиляции зоны подмышек в&nbsp;кабинете салона
            </figcaption>
          </figure>
        </Reveal>

        <Reveal className={styles.text} delay={120}>
          <h2 id="video-title" className={styles.title}>
            Как проходит лазерная эпиляция
          </h2>
          <p className={styles.body}>
            Короткое видео из&nbsp;нашего кабинета: так выглядит процедура лазерной эпиляции.
          </p>
          <div className={styles.actions}>
            <Button arrow onClick={() => openBooking(directionOptionId('laser'))} aria-haspopup="dialog">
              Записаться на&nbsp;эпиляцию
            </Button>
            <Button variant="link" arrow href="#services">
              Цены на&nbsp;комплексы
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
