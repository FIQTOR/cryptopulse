import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MarketsPage } from './pages/MarketsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AlertsPage } from './pages/AlertsPage';
import { NewsPage } from './pages/NewsPage';
import { CoinPage } from './pages/CoinPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAlerts } from './lib/store';
import { useLivePrices } from './hooks/useLivePrices';
import { useAlertWatcher } from './hooks/useAlertWatcher';

export function App() {
  // Global alert watcher: subscribe to all alert symbols.
  const alerts = useAlerts((s) => s.alerts);
  const symbols = [...new Set(alerts.map((a) => a.symbol))];
  const { ticks } = useLivePrices(symbols);
  useAlertWatcher(ticks);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MarketsPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="coin/:id" element={<CoinPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
