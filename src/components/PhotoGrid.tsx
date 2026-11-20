import { useState, type CSSProperties } from 'react';
import type { GalleryPhoto } from '../data/gallery';
import { Lightbox } from './ui/Lightbox';
import { Picture } from './ui/Picture';
import styles from './PhotoGrid.module.css';

interface PhotoGridProps {
  photos: GalleryPhoto[];
  /** Подпись списка для экранных дикторов. */
  label: string;
}

/** Широкий кадр (панорама) занимает всю строку сетки, а не узкую колонку. */
const isWide = (p: GalleryPhoto) => p.width / p.height >= 1.6;

/**
 * Сетка-«кладка»: фото сохраняют свои пропорции, клик открывает лайтбокс.
 * Число колонок — по количеству обычных фото (не больше трёх); если их меньше трёх,
 * сетка сужается, чтобы небольшие снимки не растягивались.
 */
export function PhotoGrid({ photos, label }: PhotoGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const regular = photos.filter((p) => !isWide(p)).length;
  const cols = Math.min(Math.max(regular, 1), 3);
  const onlyOne = photos.length === 1;
  const gridClass = [
    styles.grid,
    onlyOne && !isWide(photos[0]!) ? styles.single : '',
    !onlyOne && cols < 3 ? styles.capped : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <ul className={gridClass} style={{ '--cols': cols } as CSSProperties} aria-label={label}>
        {photos.map((photo, index) => (
          <li key={photo.id} className={`${styles.item} ${isWide(photo) ? styles.wide : ''}`}>
            <button
              type="button"
              className={styles.open}
              onClick={() => setOpen(index)}
              aria-label={`Открыть фото: ${photo.caption || photo.alt}`}
            >
              <span className={styles.frame} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
                <Picture
                  photo={photo}
                  sizes={isWide(photo) ? '(max-width: 1199px) 100vw, 1200px' : '(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 33vw'}
                  className={styles.image}
                />
              </span>
            </button>
            {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
