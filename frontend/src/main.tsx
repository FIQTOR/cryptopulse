import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { applyTheme } from './lib/store';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// Resolve the initial theme: saved preference > system preference > dark.
function initialTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem('cryptopulse.settings');
    const saved = stored ? (JSON.parse(stored)?.state?.theme as 'dark' | 'light' | undefined) : undefined;
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

applyTheme(initialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

// PWA: register the service worker in production builds.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
