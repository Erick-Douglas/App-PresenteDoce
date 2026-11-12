import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const Admin = lazy(() => import('./pages/AdminScreen'));
const Pricing = lazy(() => import('./pages/PricingScreen'));
const path = window.location.pathname.replace(/\/$/, '');
const Screen = path === '/admin' ? Admin : path === '/precificacao' ? Pricing : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p className="p-4" role="status">A carregar…</p>}>
      <Screen />
    </Suspense>
  </StrictMode>,
);
