import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'outline' | 'link';

interface CommonProps {
  variant?: Variant;
  /** Стрелка «→» после текста. */
  arrow?: boolean;
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const classes = (variant: Variant, block: boolean, loading: boolean, extra?: string) =>
  [styles.button, styles[variant], block ? styles.block : '', loading ? styles.loading : '', extra ?? '']
    .filter(Boolean)
    .join(' ');

function Content({ children, arrow, loading }: Pick<CommonProps, 'children' | 'arrow' | 'loading'>) {
  return (
    <>
      <span className={styles.label}>{children}</span>
      {arrow && !loading && <Icon name="arrow-right" size={18} className={styles.arrow} />}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </>
  );
}

export function Button(props: ButtonProps | LinkProps) {
  const { variant = 'primary', arrow = false, block = false, loading = false, children, className } = props;

  if (props.href !== undefined) {
    const { variant: _v, arrow: _a, block: _b, loading: _l, children: _c, className: _cn, ...rest } = props;
    return (
      <a {...rest} className={classes(variant, block, loading, className)}>
        <Content arrow={arrow} loading={loading}>
          {children}
        </Content>
      </a>
    );
  }

  const { variant: _v, arrow: _a, block: _b, loading: _l, children: _c, className: _cn, type, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? 'button'}
      aria-busy={loading || undefined}
      className={classes(variant, block, loading, className)}
    >
      <Content arrow={arrow} loading={loading}>
        {children}
      </Content>
    </button>
  );
}
