import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryPhoto } from '../../data/gallery';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useSwipe } from '../../hooks/useSwipe';
import { Icon } from './Icon';
import { Picture } from './Picture';
import styles from './Lightbox.module.css';

interface LightboxProps {
  photos: GalleryPhoto[];
  /** Индекс открытого фото или null, если лайтбокс закрыт. */
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
}

const CLOSE_MS = 200;

export function Lightbox({ photos, index, onChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const open = index !== null;
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(index ?? 0);

  useScrollLock(mounted);
  useFocusTrap(dialogRef as React.RefObject<HTMLElement>, mounted);

  useEffect(() => {
    if (index !== null) setShown(index);
  }, [index]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (open) {
      if (!dialog.open) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        closeRef.current?.focus();
      }
      // Принудительный reflow фиксирует стартовое состояние, после чего переход проигрывается.
      void dialog.offsetHeight;
      setVisible(true);
      return undefined;
    }
    setVisible(false);
    const timer = window.setTimeout(() => {
      if (dialog.open) dialog.close();
      setMounted(false);
      returnFocusRef.current?.focus({ preventScroll: true });
      returnFocusRef.current = null;
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  const total = photos.length;
  const prev = useCallback(() => onChange((shown - 1 + total) % total), [onChange, shown, total]);
  const next = useCallback(() => onChange((shown + 1) % total), [onChange, shown, total]);
  const swipe = useSwipe(prev, next);

  if (!mounted) return null;
  const photo = photos[shown];
  if (!photo) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-visible={visible || undefined}
      aria-label={`Фото ${shown + 1} из ${total}: ${photo.caption || photo.alt}`}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          prev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          next();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget || event.target === event.currentTarget.firstElementChild) onClose();
      }}
    >
      <div className={styles.stage} {...swipe}>
        <figure className={styles.figure} key={photo.id}>
          <Picture
            photo={photo}
            sizes="(max-width: 899px) 100vw, 80vw"
            className={styles.image}
            priority
            draggable={false}
          />
          <figcaption className={styles.caption}>
            <span>{photo.caption}</span>
            <span className={styles.counter} aria-hidden="true">
              {shown + 1} / {total}
            </span>
          </figcaption>
        </figure>
      </div>

      <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Закрыть просмотр">
        <Icon name="close" size={28} />
      </button>
      <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={prev} aria-label="Предыдущее фото">
        <Icon name="arrow-left" size={28} />
      </button>
      <button type="button" className={`${styles.nav} ${styles.next}`} onClick={next} aria-label="Следующее фото">
        <Icon name="arrow-right" size={28} />
      </button>
    </dialog>
  );
}
