import { useCallback, useEffect, useRef, useState } from 'react';
import { gallery } from '../data/gallery';
import { Icon } from './ui/Icon';
import { Lightbox } from './ui/Lightbox';
import { Picture } from './ui/Picture';
import { Reveal } from './ui/Reveal';
import styles from './Gallery.module.css';

export function Gallery() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    updateEdges();
    track.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [updateEdges]);

  /** Прокрутка к следующему/предыдущему кадру с учётом scroll-snap. */
  const scrollByItem = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const paddingLeft = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const current = track.scrollLeft + paddingLeft;
    const target =
      direction === 1
        ? items.find((item) => item.offsetLeft > current + 8)
        : [...items].reverse().find((item) => item.offsetLeft < current - 8);
    const left = target ? target.offsetLeft - paddingLeft : direction === 1 ? track.scrollWidth : 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section id="gallery" className={styles.section} aria-labelledby="gallery-title">
      <div className="container">
        <Reveal className={styles.head}>
          <h2 id="gallery-title" className={styles.title}>
            Наша атмосфера
          </h2>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.control}
              onClick={() => scrollByItem(-1)}
              disabled={atStart}
              aria-label="Предыдущие фото"
              aria-controls="gallery-track"
            >
              <Icon name="arrow-left" />
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => scrollByItem(1)}
              disabled={atEnd}
              aria-label="Следующие фото"
              aria-controls="gallery-track"
            >
              <Icon name="arrow-right" />
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={100}>
        <ul id="gallery-track" ref={trackRef} className={styles.track} aria-label="Фотографии салона">
          {gallery.map((photo, index) => (
            <li
              key={photo.id}
              className={styles.item}
              style={{ '--ratio': `${photo.width} / ${photo.height}`, '--native-h': `${photo.height}px` } as React.CSSProperties}
            >
              <button
                type="button"
                className={styles.open}
                onClick={() => setLightbox(index)}
                aria-label={`Открыть фото: ${photo.caption}`}
              >
                <span className={styles.frame}>
                  <Picture
                    photo={photo}
                    sizes="(max-width: 639px) 80vw, (max-width: 1199px) 50vw, 640px"
                    className={styles.image}
                  />
                </span>
              </button>
              <p className={styles.caption}>{photo.caption}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Lightbox photos={gallery} index={lightbox} onChange={setLightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}
