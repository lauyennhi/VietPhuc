/**
 * Express router endpoints for Gemini AI backend services
 */

import express, { Router, type Request, type Response } from 'express';
import {
  parseStylingText,
  rankGeminiCandidates,
  explainStyling,
  createGeminiCaption,
  analyzeOutfitPhoto,
  renderOutfitImage,
  approvedSourceReferences,
  type GeminiServiceConfig,
} from './service';
import { getGarmentById, getEventById } from '../dal';

export function buildParseRequest(text: string): { text: string } {
  return { text };
}

export function createGeminiRouter(config: GeminiServiceConfig): Router {
  const router = Router();

  const jsonLimit64k = express.json({ limit: '64kb' });
  const jsonLimit7m = express.json({ limit: '7mb' });

  // POST /api/gemini/parse
  router.post('/parse', jsonLimit64k, async (req: Request, res: Response) => {
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
  router.post('/rank', jsonLimit64k, handleRank);
  router.post('/recommend', jsonLimit64k, handleRank);

  // POST /api/gemini/explain
  router.post('/explain', jsonLimit64k, async (req: Request, res: Response) => {
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
  router.post('/caption', jsonLimit64k, async (req: Request, res: Response) => {
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

  // POST /api/gemini/vision
  router.post('/vision', jsonLimit7m, async (req: Request, res: Response) => {
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
  router.post('/render', jsonLimit7m, async (req: Request, res: Response) => {
    try {
      const result = await renderOutfitImage(req.body, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
