/**
 * Vstyle full-stack server (Express + Vite middleware in dev, static dist in production).
 * Runs with `tsx server.ts` in development and with plain `node server.ts` (Node >= 22.18 type stripping)
 * in production, so every import below uses explicit `.ts` extensions and `import type`.
 */
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { getApprovedGarments, getCultureRules, getGarments } from './src/lib/dal/index.ts';
import { createGeminiRouter } from './src/lib/gemini/routes.ts';
import { createGeminiProviders, readGeminiSettings } from './src/lib/gemini/provider.ts';
import type { GeminiServiceConfig } from './src/lib/gemini/service.ts';

dotenv.config({ quiet: true });

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const settings = readGeminiSettings(process.env);
const providers = createGeminiProviders(settings);

const geminiConfig: GeminiServiceConfig = {
  model: settings.textModel,
  provider: providers.text,
  imageModel: settings.imageModel,
  imageProvider: providers.image,
  thinkingLevel: settings.thinkingLevel === 'off' ? undefined : settings.thinkingLevel,
};

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    product: 'Vstyle',
    hasGeminiKey: Boolean(providers.text),
    textModel: settings.textModel,
    imageModel: settings.imageModel,
    features: {
      aiStylist: true,
      explanation: true,
      caption: true,
      vision: Boolean(providers.text),
      imageRender: Boolean(providers.image),
    },
    garmentsCount: getGarments().length,
    approvedGarmentsCount: getApprovedGarments().length,
    rulesCount: getCultureRules().length,
  });
});

// The Gemini router parses its own JSON bodies (64 KB for text, 7 MB for photo endpoints).
app.use('/api/gemini', createGeminiRouter(geminiConfig));
app.use('/api', express.json({ limit: '64kb' }));
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Không tìm thấy API.' });
});

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
    console.log(providers.text
      ? `Gemini: text=${settings.textModel}, image=${settings.imageModel}`
      : 'Gemini: GEMINI_API_KEY not set — using deterministic fallbacks.');
  });
}

startServer().catch((error: unknown) => {
  console.error('Vstyle server failed to start.', error instanceof Error ? error.message : error);
  process.exit(1);
});
