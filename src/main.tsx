import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './App';
import type { PageId } from './config/navigation';

const isPage = (value: string | undefined): value is PageId => value === 'home' || value === 'training' || value === 'portfolio';

const root = document.getElementById('root');
if (root) {
  // Каждая HTML-страница задаёт свою страницу атрибутом data-page на #root.
  const page = isPage(root.dataset.page) ? root.dataset.page : 'home';
  createRoot(root).render(
    <StrictMode>
      <App page={page} />
    </StrictMode>,
  );
}
