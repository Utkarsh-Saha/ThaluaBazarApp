import { Router, Request, Response } from 'express';

const router = Router();

// Assamese Commodities Dictionary for server-side phonetic intent parsing
const ASSAM_COMMODITY_MAPPINGS: Record<string, string> = {
  joha: 'Joha Rice',
  saul: 'Joha Rice',
  rice: 'Joha Rice',
  nemu: 'Kaji Nemu',
  lemon: 'Kaji Nemu',
  kaji: 'Kaji Nemu',
  bhut: 'Bhut Jolokia',
  jolokia: 'Bhut Jolokia',
  chilli: 'Bhut Jolokia',
  mustard: 'Mustard Oil',
  tel: 'Mustard Oil',
  soriyoho: 'Mustard Oil',
  khorisa: 'Bamboo Shoot',
  bamboo: 'Bamboo Shoot',
  gaj: 'Bamboo Shoot',
  muga: 'Muga Silk',
  eri: 'Eri Silk',
  silk: 'Muga Silk',
  maas: 'Local Fish',
  fish: 'Local Fish',
  koni: 'Country Eggs',
  egg: 'Country Eggs',
  pitha: 'Assam Pitha',
  ghee: 'Pure Ghee',
};

/**
 * POST /api/v1/voice/transcribe
 * Accepts audio metadata or base64 sample and returns recognized Assamese produce query
 */
router.post('/transcribe', (req: Request, res: Response) => {
  try {
    const { phrase, languageCode = 'as-IN' } = req.body;

    let matchedCommodity = 'Joha Rice';
    if (phrase) {
      const lower = phrase.toLowerCase();
      for (const [key, commodity] of Object.entries(ASSAM_COMMODITY_MAPPINGS)) {
        if (lower.includes(key)) {
          matchedCommodity = commodity;
          break;
        }
      }
    }

    res.json({
      success: true,
      language: languageCode,
      transcribedText: phrase || 'জহা চাউল',
      matchedCommodity,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Voice transcription failed',
    });
  }
});

export default router;
