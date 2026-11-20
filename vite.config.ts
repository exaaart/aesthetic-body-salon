import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { phoneHref, siteConfig, yandexMap } from './src/config/site';
import { heroPhoto } from './src/data/gallery';

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Заголовок и описание каждой страницы (страница определяется по data-page на #root). */
const pageMeta: Record<string, { path: string; title: string; description: string }> = {
  home: { path: '/', title: siteConfig.title, description: siteConfig.description },
  training: {
    path: '/obuchenie/',
    title: `Обучение лазерной эпиляции — ${siteConfig.name}`,
    description: `Обучение лазерной эпиляции от салона ${siteConfig.name} в Брянске: курс ведёт Морозова Елена Васильевна, диплом государственного образца, 8 000 ₽.`,
  },
  portfolio: {
    path: '/portfolio/',
    title: `Портфолио — ${siteConfig.name}`,
    description: `Косметолог салона ${siteConfig.name} в Брянске Морозова Елена Васильевна: стаж 10 лет, медицинское образование. Инъекционная и аппаратная косметология, лазерная эпиляция.`,
  },
};

/** SEO-теги, превью и JSON-LD собираются из src/config/site.ts — правка в одном месте. */
function seoFromConfig(): Plugin {
  return {
    name: 'salon-seo-from-config',
    transformIndexHtml(html) {
      const c = siteConfig;
      const pageId = /data-page="(\w+)"/.exec(html)?.[1] ?? 'home';
      const isHome = pageId === 'home';
      const meta = pageMeta[pageId] ?? pageMeta.home!;
      const pageUrl = new URL(meta.path, c.siteUrl).href;
      const ogImage = new URL(`${heroPhoto.base}-${heroPhoto.widths[heroPhoto.widths.length - 1]}.jpg`, c.siteUrl).href;
      // В JSON-LD попадают только заполненные поля без заглушек.
      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'BeautySalon',
        name: c.name,
        description: c.description,
        url: c.siteUrl,
        image: ogImage,
      };
      const tel = phoneHref(c.phone).replace('tel:', '');
      if (tel) jsonLd.telephone = tel;
      if (c.email) jsonLd.email = c.email;
      if (c.address) jsonLd.address = { '@type': 'PostalAddress', streetAddress: c.address, addressCountry: 'RU' };
      if (c.openingHours) jsonLd.openingHours = c.openingHours;
      if (c.map.orgId) {
        jsonLd.geo = { '@type': 'GeoCoordinates', latitude: c.map.lat, longitude: c.map.lon };
        jsonLd.hasMap = yandexMap.orgUrl(c.map);
      }
      const sameAs = c.socials.map((s) => s.url.trim()).filter(Boolean);
      if (sameAs.length) jsonLd.sameAs = sameAs;

      const srcset = heroPhoto.widths.map((w) => `${heroPhoto.base}-${w}.avif ${w}w`).join(', ');
      const tags = [
        `<title>${escape(meta.title)}</title>`,
        `<meta name="description" content="${escape(meta.description)}" />`,
        `<link rel="canonical" href="${escape(pageUrl)}" />`,
        `<meta name="theme-color" content="${escape(c.themeColor)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:locale" content="${escape(c.locale)}" />`,
        `<meta property="og:site_name" content="${escape(c.name)}" />`,
        `<meta property="og:title" content="${escape(meta.title)}" />`,
        `<meta property="og:description" content="${escape(meta.description)}" />`,
        `<meta property="og:url" content="${escape(pageUrl)}" />`,
        `<meta property="og:image" content="${escape(ogImage)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escape(meta.title)}" />`,
        `<meta name="twitter:description" content="${escape(meta.description)}" />`,
        `<meta name="twitter:image" content="${escape(ogImage)}" />`,
        // Hero-фото и разметка организации — только на главной.
        isHome ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset}" imagesizes="(max-width: 899px) 100vw, 58vw" fetchpriority="high" />` : '',
        isHome ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
      ].filter(Boolean);
      return html.replace('<!-- seo -->', tags.join('\n    '));
    },
  };
}

/**
 * /booking проксируется на Telegram-бота (bot/, порт 8787): форма может слать заявки на тот же адрес,
 * что и сайт (VITE_BOOKING_API_URL=/booking), — удобно для показа через туннель и для dev.
 */
const bookingProxy = {
  '/booking': { target: 'http://localhost:8787', changeOrigin: true, xfwd: true },
};

export default defineConfig({
  plugins: [react(), seoFromConfig()],
  build: {
    rollupOptions: {
      // Отдельные HTML-страницы: главная, «Обучение», «Портфолио».
      input: {
        main: 'index.html',
        obuchenie: 'obuchenie/index.html',
        portfolio: 'portfolio/index.html',
      },
    },
  },
  server: { proxy: bookingProxy },
  preview: { proxy: bookingProxy },
});
