/**
 * Vstyle full-stack server (Express + Vite middleware in dev, static dist in production).
 * Runs with `tsx server.ts` in both development (`npm run dev`) and production (`npm start`),
 * because the data layer imports JSON modules that plain Node cannot load without import attributes.
 * On Vercel the same API runs as a serverless function instead (api/index.js).
 */
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { createApiApp } from './src/server/app.ts';

const { app, settings, hasGemini } = createApiApp();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer(): Promise<void> {
  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vstyle server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
    console.log(hasGemini
      ? `Gemini: text=${settings.textModel}, image=${settings.imageModel}`
      : 'Gemini: GEMINI_API_KEY not set — using deterministic fallbacks.');
  });
}

startServer().catch((error: unknown) => {
  console.error('Vstyle server failed to start.', error instanceof Error ? error.message : error);
  process.exit(1);
});
