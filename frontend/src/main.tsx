import 'reflect-metadata'
// Capture affiliate ref code from URL (?ref=CODE) into localStorage
try {
  const _ref = new URLSearchParams(window.location.search).get('ref');
  if (_ref) localStorage.setItem('pr_ref', _ref.trim());
} catch { /* ignore */ }
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'simplebar-react/dist/simplebar.min.css';
import { MotionConfig } from 'framer-motion';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the worker and wait for it to be ready
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </StrictMode>,
  );
});