import { useState, type KeyboardEvent } from 'react';
import { siteConfig } from '../config/site';
import { reviews } from '../data/reviews';
import { useSwipe } from '../hooks/useSwipe';
import { typo } from '../lib/typography';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Reveal } from './ui/Reveal';
import styles from './Reviews.module.css';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T12:00:00`)).replace(/\s*г\.$/, '');

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" size={16} filled={i < rating} className={i < rating ? styles.starOn : styles.starOff} />
      ))}
    </span>
  );
}

export function Reviews() {
  const [index, setIndex] = useState(0);
  const total = reviews.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);
  const swipe = useSwipe(prev, next);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  return (
    <section id="reviews" className={styles.section} aria-labelledby="reviews-title">
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.aside}>
          <h2 id="reviews-title" className={styles.title}>
            Что говорят наши клиенты
          </h2>
          {siteConfig.reviewsAreDemo && (
            <p className={styles.demo}>Демонстрационные отзывы: будут заменены реальными отзывами клиентов.</p>
          )}
          {siteConfig.reviewsUrl && (
            <Button
              variant="link"
              arrow
              href={siteConfig.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.source}
            >
              Все отзывы на&nbsp;Яндекс Картах
            </Button>
          )}
          {total > 1 && (
            <div className={styles.nav}>
              <button type="button" className={styles.control} onClick={prev} aria-label="Предыдущий отзыв" aria-controls="reviews-slides">
                <Icon name="arrow-left" />
              </button>
              <p className={styles.counter} aria-hidden="true">
                <span className={styles.current}>{index + 1}</span> / {total}
              </p>
              <button type="button" className={styles.control} onClick={next} aria-label="Следующий отзыв" aria-controls="reviews-slides">
                <Icon name="arrow-right" />
              </button>
            </div>
          )}
        </Reveal>

        <Reveal delay={120}>
          <div
            id="reviews-slides"
            className={styles.viewport}
            role="region"
            aria-roledescription="карусель"
            aria-label="Отзывы клиентов. Листайте стрелками влево и вправо"
            tabIndex={0}
            onKeyDown={onKeyDown}
            {...swipe}
          >
            <div className={styles.slides} aria-live="polite">
              {reviews.map((review, i) => {
                const active = i === index;
                return (
                  <figure
                    key={review.id}
                    className={styles.slide}
                    data-active={active || undefined}
                    aria-roledescription="слайд"
                    aria-label={`${i + 1} из ${total}`}
                    aria-hidden={!active}
                    {...(active ? {} : { inert: '' })}
                  >
                    <blockquote className={styles.quote}>
                      <p>{typo(review.text)}</p>
                    </blockquote>
                    <figcaption className={styles.author}>
                      <span className={styles.avatar} aria-hidden="true">
                        {initials(review.name)}
                      </span>
                      <span className={styles.meta}>
                        <span className={styles.name}>{review.name}</span>
                        <span className={styles.service}>
                          {review.service}, <time dateTime={review.date}>{formatDate(review.date)}</time>
                        </span>
                      </span>
                      <Stars rating={review.rating} />
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
