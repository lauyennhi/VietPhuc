/**
 * The Vstyle API as an Express app (health check + Gemini routes), shared by the
 * long-running server (server.ts) and the Vercel serverless function (api/index.js).
 */
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { getApprovedGarments, getCultureRules, getGarments } from '../lib/dal/index';
import { createGeminiRouter } from '../lib/gemini/routes';
import { createGeminiProviders, readGeminiSettings } from '../lib/gemini/provider';
import type { GeminiServiceConfig } from '../lib/gemini/service';

dotenv.config({ quiet: true });

export function createApiApp(): { app: Express; settings: ReturnType<typeof readGeminiSettings>; hasGemini: boolean } {
  const app = express();
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
  app.set('trust proxy', 1);
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
      fallbackModels: { text: settings.textFallbackModel, image: settings.imageFallbackModel },
      features: {
        aiStylist: true,
        design: true,
        adaptive: true,
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
  app.use('/api/gemini', createGeminiRouter(geminiConfig, { renderHourlyCap: settings.renderHourlyCap }));
  app.use('/api', express.json({ limit: '64kb' }));
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Không tìm thấy API.' });
  });

  return { app, settings, hasGemini: Boolean(providers.text) };
}
