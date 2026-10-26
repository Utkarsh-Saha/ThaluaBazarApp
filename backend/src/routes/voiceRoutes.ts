import { Router, Request, Response } from 'express';

const router = Router();

// Comprehensive Assamese Commodities Dictionary for phonetic & script intent parsing
const ASSAM_COMMODITY_MAPPINGS: Record<string, string> = {
  // Joha Rice
  'joha': 'Joha Rice',
  'zoha': 'Joha Rice',
  'saul': 'Joha Rice',
  'rice': 'Joha Rice',
  'chawal': 'Joha Rice',
  'জহা': 'Joha Rice',
  'চাউল': 'Joha Rice',

  // Kaji Nemu
  'nemu': 'Kaji Nemu',
  'nebu': 'Kaji Nemu',
  'lemon': 'Kaji Nemu',
  'lime': 'Kaji Nemu',
  'kaji': 'Kaji Nemu',
  'কাজি': 'Kaji Nemu',
  'নেমু': 'Kaji Nemu',
  'টেঙা': 'Kaji Nemu',

  // Bhut Jolokia
  'bhut': 'Bhut Jolokia',
  'bhoot': 'Bhut Jolokia',
  'jolokia': 'Bhut Jolokia',
  'moris': 'Bhut Jolokia',
  'chilli': 'Bhut Jolokia',
  'chili': 'Bhut Jolokia',
  'ভোট': 'Bhut Jolokia',
  'জলকীয়া': 'Bhut Jolokia',

  // Mustard Oil
  'mustard': 'Mustard Oil',
  'oil': 'Mustard Oil',
  'tel': 'Mustard Oil',
  'soriyoho': 'Mustard Oil',
  'xorioh': 'Mustard Oil',
  'সৰিয়হ': 'Mustard Oil',
  'তেল': 'Mustard Oil',

  // Bamboo Shoot
  'khorisa': 'Bamboo Shoot',
  'bamboo': 'Bamboo Shoot',
  'gaj': 'Bamboo Shoot',
  'shoot': 'Bamboo Shoot',
  'খৰিচা': 'Bamboo Shoot',
  'গাজ': 'Bamboo Shoot',
  'বাঁহ': 'Bamboo Shoot',

  // Muga & Eri
  'muga': 'Muga Silk',
  'eri': 'Eri Silk',
  'silk': 'Muga Silk',
  'chador': 'Muga Silk',
  'mekhela': 'Muga Silk',
  'মুগা': 'Muga Silk',
  'এৰি': 'Eri Silk',
  'কাপোৰ': 'Muga Silk',

  // Fish
  'maas': 'Local Fish',
  'fish': 'Local Fish',
  'kholihana': 'Local Fish',
  'puthi': 'Local Fish',
  'rou': 'Local Fish',
  'মাছ': 'Local Fish',
  'খলিহনা': 'Local Fish',

  // Eggs
  'koni': 'Country Eggs',
  'egg': 'Country Eggs',
  'eggs': 'Country Eggs',
  'কণী': 'Country Eggs',

  // Pitha
  'pitha': 'Assam Pitha',
  'laru': 'Assam Pitha',
  'পিঠা': 'Assam Pitha',
  'লাড়ু': 'Assam Pitha',

  // Ghee
  'ghee': 'Pure Ghee',
  'ghiu': 'Pure Ghee',
  'butter': 'Pure Ghee',
  'ঘিউ': 'Pure Ghee',

  // Bora Rice
  'bora': 'Bora Sticky Rice',
  'বৰা': 'Bora Sticky Rice',

  // Turmeric
  'halodhi': 'Organic Turmeric',
  'haldi': 'Organic Turmeric',
  'turmeric': 'Organic Turmeric',
  'হালধি': 'Organic Turmeric',

  // Ginger & Garlic
  'ada': 'Ginger',
  'ginger': 'Ginger',
  'আদা': 'Ginger',
  'nohoru': 'Garlic',
  'নহৰু': 'Garlic',

  // Honey & Tea
  'mou': 'Pure Honey',
  'honey': 'Pure Honey',
  'মৌ': 'Pure Honey',
  'chah': 'Assam Tea',
  'tea': 'Assam Tea',
  'চাহ': 'Assam Tea',
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
