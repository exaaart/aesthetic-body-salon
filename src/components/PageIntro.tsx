import type { ReactNode } from 'react';
import { pagePaths } from '../config/navigation';
import { Reveal } from './ui/Reveal';
import styles from './PageIntro.module.css';

interface PageIntroProps {
  title: string;
  lead?: ReactNode;
  /** Подпись текущей страницы в «хлебных крошках». */
  crumb: string;
}

/** Шапка внутренней страницы: «хлебные крошки», заголовок h1 и вводный абзац. */
export function PageIntro({ title, lead, crumb }: PageIntroProps) {
  return (
    <section className={styles.intro} aria-labelledby="page-title">
      <div className="container">
        <Reveal>
          <nav aria-label="Вы здесь" className={styles.crumbs}>
            <a href={pagePaths.home}>Главная</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{crumb}</span>
          </nav>
          <h1 id="page-title" className={styles.title}>
            {title}
          </h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </Reveal>
      </div>
    </section>
  );
}
