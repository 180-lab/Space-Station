import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Central Gateway URL Interceptor logic
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: function (input: RequestInfo | URL, init?: RequestInit) {
      let targetInput = input;
      if (typeof targetInput === 'string' && targetInput.startsWith('/api')) {
        const backendUrl = localStorage.getItem('space_station_backend_url') || 'https://space-station-commander.onrender.com';
        const cleanBase = backendUrl.replace(/\/+$/, '');
        targetInput = `${cleanBase}${targetInput}`;
      }
      return originalFetch(targetInput, init);
    },
    writable: true,
    configurable: true
  });
} catch (error) {
  console.error('Failed to intercept global fetch:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

