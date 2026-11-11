import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const Admin = lazy(() => import('./pages/AdminScreen'));
const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p className="p-4" role="status">A carregar…</p>}>
      {isAdmin ? <Admin /> : <App />}
    </Suspense>
  </StrictMode>,
);
