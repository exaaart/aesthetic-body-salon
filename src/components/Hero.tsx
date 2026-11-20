import { siteConfig } from '../config/site';
import { useBooking } from '../context/BookingContext';
import { heroPhoto } from '../data/gallery';
import { Button } from './ui/Button';
import { Picture } from './ui/Picture';
import styles from './Hero.module.css';

export function Hero() {
  const { openBooking } = useBooking();
  const quote = siteConfig.heroQuote;

  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.media}>
        <Picture
          photo={heroPhoto}
          sizes="(max-width: 899px) 100vw, 58vw"
          className={styles.image}
          priority
        />
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <figure className={styles.quote}>
            <blockquote className={styles.blockquote}>
              <h1 id="hero-title" className={styles.title}>
                {quote.lines.map((line, i) => (
                  <span key={line} className={`${styles.line} ${i > 0 ? styles.indent : ''}`}>
                    {i === 0 && '«'}
                    {line}
                    {i === quote.lines.length - 1 && '»'}
                    {i < quote.lines.length - 1 && ' '}
                  </span>
                ))}
              </h1>
            </blockquote>
            <figcaption className={styles.author}>—&nbsp;{quote.author}</figcaption>
          </figure>
          <p className={styles.lead}>Профессиональный уход, атмосфера уюта и&nbsp;заботы</p>
          <div className={styles.action}>
            <Button arrow onClick={() => openBooking()}>
              Записаться на&nbsp;процедуру
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
