import { pagePaths } from '../config/navigation';
import { siteConfig } from '../config/site';
import { usePage } from '../context/PageContext';
import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export function Logo({ className, onClick }: LogoProps) {
  const page = usePage();
  return (
    <a
      href={page === 'home' ? '#top' : pagePaths.home}
      className={[styles.logo, className ?? ''].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-label={`${siteConfig.name} — ${siteConfig.tagline}, ${page === 'home' ? 'наверх' : 'на главную'}`}
    >
      <span className={styles.name} lang="en">
        {siteConfig.name}
      </span>
      <span className={styles.tagline} lang="en">
        {siteConfig.tagline}
      </span>
    </a>
  );
}
