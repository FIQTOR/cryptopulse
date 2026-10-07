import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { api } from './routes/api.js';
import { ApiError } from './http.js';

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: config.corsOrigins,
    }),
  );
  app.use(express.json());

  // Gentle global limiter to protect the free upstreams.
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api', api);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Internal error';
    if (status >= 500) console.error('[error]', err);
    res.status(status).json({ error: message });
  });

  return app;
}
