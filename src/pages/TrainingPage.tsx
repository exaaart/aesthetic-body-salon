import { PageIntro } from '../components/PageIntro';
import { PhotoGrid } from '../components/PhotoGrid';
import { Button } from '../components/ui/Button';
import { Reveal } from '../components/ui/Reveal';
import { phoneHref, siteConfig } from '../config/site';
import { reviews } from '../data/reviews';
import { laserTraining, trainingPhotos } from '../data/training';
import { typo } from '../lib/typography';
import styles from './TrainingPage.module.css';

const ENROLL_TEXT = 'Здравствуйте! Хочу записаться на обучение лазерной эпиляции.';

/** Запись на обучение: WhatsApp с готовым текстом, иначе звонок. */
function enrollHref(): string {
  const whatsapp = siteConfig.socials.find((s) => s.network === 'whatsapp')?.url.trim();
  if (whatsapp) return `${whatsapp}?text=${encodeURIComponent(ENROLL_TEXT)}`;
  return phoneHref(siteConfig.phone);
}

export function TrainingPage() {
  const course = laserTraining;
  const review = reviews.find((r) => r.id === course.reviewId);
  const testimonials = [
    ...(review ? [{ id: review.id, name: review.name, text: review.text }] : []),
    ...course.testimonials,
  ];
  const enroll = enrollHref();
  const phone = phoneHref(siteConfig.phone);

  return (
    <>
      <PageIntro title="Обучение" crumb="Обучение" />

      <section id="laser" className={styles.course} aria-labelledby="laser-title">
        <div className={`container ${styles.grid}`}>
          <Reveal className={styles.main}>
            <h2 id="laser-title" className={styles.title}>
              {course.title}
            </h2>
          </Reveal>

          <Reveal as="aside" className={styles.aside} delay={120}>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt>Преподаватель</dt>
                <dd>
                  {course.teacher}
                  <span className={styles.factNote}>{typo(course.teacherRole)}</span>
                </dd>
              </div>
              <div className={styles.fact}>
                <dt>Документ об окончании</dt>
                <dd>{typo(course.certificate.charAt(0).toUpperCase() + course.certificate.slice(1))}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Стоимость</dt>
                <dd className={styles.price}>{course.price}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              {enroll && (
                <Button href={enroll} arrow target="_blank" rel="noopener noreferrer" block>
                  Записаться на&nbsp;обучение
                </Button>
              )}
              {phone && (
                <p className={styles.call}>
                  Или позвоните: <a href={phone}>{siteConfig.phone}</a>
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {trainingPhotos.length > 0 && (
        <section className={styles.photos} aria-labelledby="training-photos-title">
          <div className="container">
            <h2 id="training-photos-title" className={styles.photosTitle}>
              Фотографии с&nbsp;курса
            </h2>
            <PhotoGrid photos={trainingPhotos} label="Фотографии с курса" />
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className={styles.review} aria-labelledby="training-review-title">
          <div className="container">
            <h2 id="training-review-title" className={styles.reviewTitle}>
              Отзывы выпускниц
            </h2>
            <div className={styles.quotes}>
              {testimonials.map((t, i) => (
                <Reveal as="figure" key={t.id} className={styles.quote} delay={i * 100}>
                  <blockquote>
                    <p>{typo(t.text)}</p>
                  </blockquote>
                  <figcaption className={styles.author}>{t.name}</figcaption>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
