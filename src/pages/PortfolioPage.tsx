import { BookingCta } from '../components/BookingCta';
import { PageIntro } from '../components/PageIntro';
import { PhotoGrid } from '../components/PhotoGrid';
import { Button } from '../components/ui/Button';
import { Picture } from '../components/ui/Picture';
import { Reveal } from '../components/ui/Reveal';
import { useBooking } from '../context/BookingContext';
import { cosmetologist, portfolio } from '../data/portfolio';
import { typo } from '../lib/typography';
import styles from './PortfolioPage.module.css';

export function PortfolioPage() {
  const { openBooking } = useBooking();
  const c = cosmetologist;

  return (
    <>
      <PageIntro title="Портфолио" crumb="Портфолио" />

      <section className={styles.profile} aria-labelledby="cosmetologist-title">
        <div className={`container ${styles.grid}`}>
          <Reveal className={styles.media}>
            <Picture
              photo={c.photo}
              sizes="(max-width: 899px) 100vw, 40vw"
              className={styles.photo}
              priority
            />
          </Reveal>

          <Reveal className={styles.text} delay={120}>
            <p className={styles.role}>{c.role}</p>
            <h2 id="cosmetologist-title" className={styles.name}>
              {c.name}
            </h2>

            <dl className={styles.facts}>
              {c.facts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.areas}>
              <h3 className={styles.areasTitle}>Направления работы</h3>
              <ul className={styles.list}>
                {c.specializations.map((s) => (
                  <li key={s}>{typo(s)}</li>
                ))}
              </ul>
            </div>

            <Button arrow onClick={() => openBooking()} aria-haspopup="dialog" className={styles.cta}>
              Записаться к&nbsp;косметологу
            </Button>
          </Reveal>
        </div>
      </section>

      {portfolio.length > 0 && (
        <section className={styles.works} aria-labelledby="works-title">
          <div className="container">
            <h2 id="works-title" className={styles.worksTitle}>
              Работы
            </h2>
            <PhotoGrid photos={portfolio} label="Фотографии работ" />
          </div>
        </section>
      )}

      <BookingCta title={<>Красивой быть легко</>} />
    </>
  );
}
