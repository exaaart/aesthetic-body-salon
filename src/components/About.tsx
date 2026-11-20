import { pagePaths } from '../config/navigation';
import { gallery } from '../data/gallery';
import { typo } from '../lib/typography';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import styles from './About.module.css';

/** «Узнать больше» ведёт в галерею на главной, а пока в ней нет фото — в портфолио. */
const moreHref = gallery.length > 0 ? '#gallery' : pagePaths.portfolio;

export function About() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.head}>
          <p className={styles.eyebrow}>О салоне</p>
          <h2 id="about-title" className={styles.title}>
            <span lang="en">Aesthetic&nbsp;Body</span>&nbsp;— пространство красоты
          </h2>
        </Reveal>

        <Reveal className={styles.text} delay={120}>
          <p className={styles.body}>
            {typo(
              'Мы создаём атмосферу, в которой вы чувствуете себя особенной. Профессиональный подход, внимание к деталям и любовь к своему делу — основа нашей работы.',
            )}
          </p>
          <Button variant="outline" arrow href={moreHref} className={styles.cta}>
            Узнать больше
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
