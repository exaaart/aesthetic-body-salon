import type { ReactElement, SVGProps } from 'react';

/** Единый набор линейных иконок: viewBox 24×24, stroke 1.25, currentColor. */
const paths = {
  /** Вакуумно-роликовый массаж: насадка с двумя роликами. */
  roller: (
    <>
      <path d="M6.5 5.5h11a1.5 1.5 0 0 1 1.5 1.5v3.5H5V7a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M12 5.5V3" />
      <circle cx="8.25" cy="15" r="3.25" />
      <circle cx="15.75" cy="15" r="3.25" />
      <path d="M3.5 21h17" />
    </>
  ),
  /** Бандажное обёртывание: силуэт с витками бинта. */
  bandage: (
    <>
      <path d="M8.5 3c0 3-1.75 5.25-1.75 9S8.5 18 8.5 21M15.5 3c0 3 1.75 5.25 1.75 9S15.5 18 15.5 21" />
      <path d="M7.3 8.5 16.8 6.6M6.8 13l10.4-2.1M7.4 17.6l9.3-1.9" />
    </>
  ),
  /** Инъекционная косметология: капля. */
  drop: (
    <>
      <path d="M12 3.25c3.1 3.7 5.75 6.9 5.75 10.5a5.75 5.75 0 0 1-11.5 0c0-3.6 2.65-6.8 5.75-10.5z" />
      <path d="M9.4 14.25a2.6 2.6 0 0 0 2.6 2.6" />
    </>
  ),
  /** Массаж лица: пузырьки. */
  bubbles: (
    <>
      <circle cx="9" cy="15" r="4.75" />
      <circle cx="16.5" cy="7.5" r="2.75" />
      <circle cx="17.5" cy="16.5" r="1.75" />
      <circle cx="9.5" cy="4.5" r="1.25" />
    </>
  ),
  /** Аппаратная косметология: импульс. */
  pulse: <path d="M2.75 12h4l2-5 3.25 10 2.5-7 1.75 2h5" />,
  beam: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'arrow-right': <path d="M4 12h15.5M14 6.5l5.5 5.5-5.5 5.5" />,
  'arrow-left': <path d="M20 12H4.5M10 6.5 4.5 12l5.5 5.5" />,
  close: <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />,
  menu: <path d="M3.5 8.5h17M3.5 15.5h17" />,
  star: (
    <path d="m12 3.6 2.55 5.33 5.85.73-4.3 4.03 1.1 5.8L12 16.66 6.8 19.5l1.1-5.8-4.3-4.04 5.85-.72z" />
  ),
  phone: (
    <path d="M8.6 3.75H5.75a2 2 0 0 0-2 2.17A16.5 16.5 0 0 0 18.08 20.25a2 2 0 0 0 2.17-2v-2.84a1.5 1.5 0 0 0-1.2-1.47l-3-.6a1.5 1.5 0 0 0-1.4.42l-.98.98a12.3 12.3 0 0 1-5.4-5.4l.98-.98a1.5 1.5 0 0 0 .42-1.4l-.6-3a1.5 1.5 0 0 0-1.47-1.2z" />
  ),
  pin: (
    <>
      <path d="M12 21s-6.75-6.1-6.75-11.25a6.75 6.75 0 0 1 13.5 0C18.75 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.75" r="2.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7.25V12l3.25 2" />
    </>
  ),
  mail: (
    <>
      <rect x="3.25" y="5.75" width="17.5" height="12.5" rx="1" />
      <path d="m3.75 6.5 8.25 6.25 8.25-6.25" />
    </>
  ),
  telegram: <path d="M20.75 4.25 3.25 11.1l5.4 2 2 6.15 3.05-3.6 4.6 3.6zM8.65 13.1l9.1-6.35-7.1 7.9" />,
  vk: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4" />
      <path d="M7 8.75c.4 4.2 2.6 6.75 6 6.75v-2.6c1.3.2 2.3 1.2 2.7 2.6H17.5c-.5-1.9-1.8-3.2-3-3.75 1.2-.7 2.3-2 2.6-3h-1.7c-.4 1.2-1.6 2.6-2.4 2.75V8.75h-1.7v4.9c-1-.3-2.4-1.8-2.5-4.9z" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.2 19.8l1.1-3.6a8.25 8.25 0 1 1 3.1 2.75z" />
      <path d="M9.2 8.6c.1 2.9 3 5.8 6 6l1-1.3-1.8-1-.9.8c-1-.4-2.3-1.6-2.7-2.7l.8-.9-1-1.8z" />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof paths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 24, filled = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
