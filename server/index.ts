import express, { type Request, type Response } from 'express';
import path from 'node:path';
import app, { ai } from './app.js';
import { config } from './config.js';

/**
 * Local and single-server entry point: the API plus the frontend.
 * Vite middleware in development, the static build in production.
 */
async function start() {
  if (config.isProduction) {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(config.port, '0.0.0.0', () => {
    const mode = config.isProduction ? 'production' : 'development';
    console.log(`Plantzy running at http://localhost:${config.port} (${mode}, AI ${ai ? 'enabled' : 'disabled'})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
