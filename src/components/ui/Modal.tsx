import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Icon } from './Icon';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Короткий текст под заголовком. */
  description?: ReactNode;
  children: ReactNode;
  size?: 'md' | 'lg';
  /** Элемент, который получит фокус при открытии (по умолчанию — кнопка закрытия). */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const CLOSE_MS = 200;

/** Модальное окно на <dialog>: фокус-ловушка, Esc, клик по фону, блокировка прокрутки, возврат фокуса. */
export function Modal({ open, onClose, title, description, children, size = 'md', initialFocusRef }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const descId = useId();

  useScrollLock(mounted);
  useFocusTrap(dialogRef as React.RefObject<HTMLElement>, mounted);

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
        (initialFocusRef?.current ?? closeRef.current)?.focus();
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
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target && document.contains(target)) target.focus({ preventScroll: true });
    }, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted, initialFocusRef]);

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${styles[size]}`}
      data-visible={visible || undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.titles}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
