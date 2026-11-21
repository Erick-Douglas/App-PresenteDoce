import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StoreProvider } from './features/platform/StoreProvider';
import './index.css';
import { OnboardingScreen } from './pages/OnboardingScreen';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/criar-loja' ? (
      <OnboardingScreen />
    ) : (
      <StoreProvider>
        <App />
      </StoreProvider>
    )}
  </StrictMode>,
);
