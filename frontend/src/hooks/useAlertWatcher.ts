import { useEffect } from 'react';
import { useAlerts } from '../lib/store';

/**
 * Watches live ticks and fires a browser Notification (free Web Notifications
 * API) when a price alert target is crossed.
 */
export function useAlertWatcher(ticks: Record<string, { price: number }>) {
  const { alerts, markTriggered } = useAlerts();

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    for (const alert of alerts) {
      if (alert.triggered) continue;
      const tick = ticks[`${alert.symbol.toUpperCase()}USDT`];
      if (!tick) continue;
      const hit =
        alert.direction === 'above' ? tick.price >= alert.target : tick.price <= alert.target;
      if (hit) {
        markTriggered(alert.id);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`🔔 ${alert.name} alert`, {
            body: `${alert.name} is ${alert.direction} ${alert.target} (now ${tick.price})`,
          });
        }
      }
    }
  }, [ticks, alerts, markTriggered]);
}
