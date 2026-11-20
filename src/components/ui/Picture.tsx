import type { Photo } from '../../data/gallery';

interface PictureProps {
  photo: Photo;
  sizes: string;
  className?: string;
  priority?: boolean;
  draggable?: boolean;
}

const srcSet = (photo: Photo, ext: string) =>
  photo.widths.map((w) => `${photo.base}-${w}.${ext} ${w}w`).join(', ');

/** <picture> с AVIF/WebP и запасным JPEG, явными размерами и ленивой загрузкой. */
export function Picture({ photo, sizes, className, priority = false, draggable }: PictureProps) {
  const largest = photo.widths[photo.widths.length - 1] ?? photo.width;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(photo, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(photo, 'webp')} sizes={sizes} />
      <img
        src={`${photo.base}-${largest}.jpg`}
        srcSet={srcSet(photo, 'jpg')}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        className={className}
        style={photo.focus ? { objectPosition: photo.focus } : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        draggable={draggable}
        {...(priority ? { fetchpriority: 'high' } : {})}
      />
    </picture>
  );
}
