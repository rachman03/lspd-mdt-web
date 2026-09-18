import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle restricted clipboard or sandbox rejections in iframe environments
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = String(reason?.message || reason || '');
  if (
    reason?.name === 'NotAllowedError' ||
    message.includes('Clipboard write is not allowed') ||
    message.includes('clipboard')
  ) {
    console.warn('Silently trapped iframe clipboard rejection:', reason);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

