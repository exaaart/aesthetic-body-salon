import { useEffect, type ReactNode } from 'react';
import { BookingModal } from './components/BookingModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import type { PageId } from './config/navigation';
import { BookingProvider } from './context/BookingContext';
import { PageContext } from './context/PageContext';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { TrainingPage } from './pages/TrainingPage';

const pages: Record<PageId, () => ReactNode> = {
  home: () => <HomePage />,
  training: () => <TrainingPage />,
  portfolio: () => <PortfolioPage />,
};

/** Общая оболочка всех страниц: шапка, подвал и форма записи. */
export function App({ page }: { page: PageId }) {
  // Переход с другой страницы по ссылке вида /#services: браузер ищет якорь до отрисовки React,
  // поэтому прокручиваем к нему сами, когда секции уже на месте.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, []);

  return (
    <PageContext.Provider value={page}>
      <BookingProvider>
        <a className="skip-link" href="#main">
          Перейти к&nbsp;содержимому
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {pages[page]()}
        </main>
        <Footer />
        <BookingModal />
      </BookingProvider>
    </PageContext.Provider>
  );
}
