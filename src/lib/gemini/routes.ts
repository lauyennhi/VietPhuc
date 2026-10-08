/**
 * Express router endpoints for Gemini AI backend services
 */

import express, { Router, type NextFunction, type Request, type Response } from 'express';
import {
  parseStylingText,
  rankGeminiCandidates,
  explainStyling,
  createGeminiCaption,
  analyzeOutfitPhoto,
  renderOutfitImage,
  adaptiveAdvice,
  approvedSourceReferences,
  type GeminiServiceConfig,
} from './service';
import { getGarmentById, getEventById } from '../dal';

export function buildParseRequest(text: string): { text: string } {
  return { text };
}

/** Simple in-memory fixed-window rate limiter (per IP, plus an optional global cap). */
export function createRateLimiter(options: { windowMs: number; max: number; globalMax?: number; message: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let global = { count: 0, resetAt: 0 };
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = hits.get(key);
    const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + options.windowMs };
    if (global.resetAt <= now) global = { count: 0, resetAt: now + options.windowMs };
    if (current.count >= options.max || (options.globalMax !== undefined && global.count >= options.globalMax)) {
      const retryAfter = Math.ceil(((current.count >= options.max ? current.resetAt : global.resetAt) - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
      res.status(429).json({ error: options.message });
      return;
    }
    current.count += 1;
    global.count += 1;
    hits.set(key, current);
    next();
  };
}

export function createGeminiRouter(config: GeminiServiceConfig, limits: { renderHourlyCap?: number } = {}): Router {
  const router = Router();

  const textLimit = createRateLimiter({ windowMs: 60_000, max: 40, message: 'Bạn thao tác hơi nhanh — thử lại sau ít giây nhé.' });
  const visionLimit = createRateLimiter({ windowMs: 60_000, max: 8, message: 'Bạn đã đọc nhiều ảnh liên tiếp — đợi 1 phút rồi thử lại nhé.' });
  const renderLimit = createRateLimiter({
    windowMs: 60 * 60_000,
    max: 12,
    globalMax: limits.renderHourlyCap ?? 120,
    message: 'Đã đạt giới hạn tạo ảnh AI trong giờ này — bạn vẫn xem được mockup vector.',
  });

  const jsonLimit64k = express.json({ limit: '64kb' });
  const jsonLimit7m = express.json({ limit: '7mb' });

  // POST /api/gemini/parse
  router.post('/parse', textLimit, jsonLimit64k, async (req: Request, res: Response) => {
    try {
      const text = typeof req.body.text === 'string' ? req.body.text : '';
      const result = await parseStylingText(buildParseRequest(text), config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/gemini/rank & /api/gemini/recommend
  const handleRank = async (req: Request, res: Response) => {
    try {
      const { context, candidates = [] } = req.body;
      const candidateIds = Array.isArray(req.body.candidateIds)
        ? req.body.candidateIds
        : candidates.map((c: any) => c.outfitId);
      const result = await rankGeminiCandidates({ context, candidateIds }, candidates, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
  router.post('/rank', textLimit, jsonLimit64k, handleRank);
  router.post('/recommend', textLimit, jsonLimit64k, handleRank);

  // POST /api/gemini/explain
  router.post('/explain', textLimit, jsonLimit64k, async (req: Request, res: Response) => {
    try {
      const {
        garment,
        cultureCheck,
        eventId,
        eventName,
        styleVibe,
        primaryColor,
        accessoryNames = [],
      } = req.body;

      const garmentObj = typeof garment === 'string' ? getGarmentById(garment) : garment;
      const gName = garmentObj?.name || 'Áo Ngũ Thân';
      const eName = eventName || (eventId ? getEventById(eventId)?.name : 'Sự kiện');

      const result = await explainStyling(
        {
          garmentName: gName,
          eventName: eName ?? 'Sự kiện',
          styleId: styleVibe || 'TRUYEN_THONG_HOANG_GIA',
          primaryColor: primaryColor || '#1E2A38',
          accessoryNames,
          cultureResult: cultureCheck,
          retainedCharacteristics: cultureCheck?.retainedCharacteristics || garmentObj?.characteristics?.slice(0, 3) || [],
          sources: approvedSourceReferences(cultureCheck?.sourceIds || garmentObj?.sourceIds),
        },
        config
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/gemini/caption
  router.post('/caption', textLimit, jsonLimit64k, async (req: Request, res: Response) => {
    try {
      const {
        garmentName,
        styleTitle,
        eventId,
        eventTitle,
        chuanScore = 95,
        chatScore = 90,
        vibe = 'TRUYEN_THONG_HOANG_GIA',
        cultureReasons = [],
        retainedCharacteristics = [],
        sources = [],
      } = req.body;

      const eTitle = eventTitle || (eventId ? getEventById(eventId)?.name : 'Dịp đặc biệt');

      const result = await createGeminiCaption(
        {
          garmentName: garmentName || 'Áo Ngũ Thân',
          styleTitle: styleTitle || 'Việt phục Remix',
          eventTitle: eTitle ?? 'Dịp đặc biệt',
          chuanScore,
          chatScore,
          vibe,
          cultureReasons,
          retainedCharacteristics,
          sources: approvedSourceReferences(sources),
        },
        config
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/gemini/adaptive
  router.post('/adaptive', textLimit, jsonLimit64k, async (req: Request, res: Response) => {
    try {
      const { garmentId, needCodes, adjustments, eventId } = req.body ?? {};
      if (typeof garmentId !== 'string' || !getGarmentById(garmentId)) {
        res.status(400).json({ error: 'Y phục không hợp lệ.' });
        return;
      }
      const codes = Array.isArray(needCodes) ? needCodes.filter((c: unknown): c is string => typeof c === 'string').slice(0, 6) : [];
      res.json(await adaptiveAdvice({ garmentId, needCodes: codes, adjustments, eventId: typeof eventId === 'string' ? eventId : undefined }, config));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/gemini/vision
  router.post('/vision', visionLimit, jsonLimit7m, async (req: Request, res: Response) => {
    try {
      const { image, note } = req.body;
      if (!image || !image.data) {
        res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh (base64 data).' });
        return;
      }
      const result = await analyzeOutfitPhoto({ image, note }, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /api/gemini/render
  router.post('/render', renderLimit, jsonLimit7m, async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (typeof body.garmentId !== 'string' || !getGarmentById(body.garmentId)) {
        res.status(400).json({ error: 'Y phục không hợp lệ.' });
        return;
      }
      const result = await renderOutfitImage(body, config);
      res.json(result);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message = (error as Error)?.message ?? '';
      console.warn('Gemini render failed.', message);
      if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
        res.status(429).json({ error: 'Hết hạn mức tạo ảnh của Gemini — thử lại sau ít phút nhé.' });
      } else if (status === 403 || status === 401 || /API key|PERMISSION_DENIED/i.test(message)) {
        res.status(502).json({ error: 'Khóa Gemini chưa có quyền dùng model tạo ảnh. Bạn vẫn xem được mockup vector.' });
      } else if (message.startsWith('Gemini')) {
        res.status(502).json({ error: message });
      } else {
        res.status(502).json({ error: 'Chưa tạo được ảnh AI lúc này — thử lại sau ít phút nhé.' });
      }
    }
  });

  return router;
}
