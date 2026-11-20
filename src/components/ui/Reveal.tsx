import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
import styles from './Reveal.module.css';

interface RevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Задержка в миллисекундах для последовательного появления. */
  delay?: number;
}

export function Reveal({ as: Tag = 'div', children, className, delay = 0 }: RevealProps) {
  const [ref, shown] = useReveal<HTMLElement>();
  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;
  return (
    <Tag
      ref={ref}
      className={[styles.reveal, shown ? styles.shown : '', className ?? ''].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </Tag>
  );
}
