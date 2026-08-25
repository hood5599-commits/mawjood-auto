declare const process: any;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.REACT_APP_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel Environment Variables' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    let { imageBase64, mimeType } = body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // تنظيف Base64 من أي بادئات
    if (imageBase64.includes('base64,')) {
      imageBase64 = imageBase64.split('base64,')[1];
    } else if (imageBase64.includes(',')) {
      imageBase64 = imageBase64.split(',')[1];
    }
    imageBase64 = imageBase64.trim().replace(/\s/g, '');

    const promptText = `Analyze this Qatari vehicle registration card (استمارة ترخيص تسيير مركبة - دولة قطر).
Focus strictly on the "بيانات المركبة / Vehicle Information" section at the bottom:
1. Extract Chassis No. / رقم القاعدة (17 alphanumeric characters, e.g. 6T1BF9FK9FX540435).
2. Extract Make / نوع المركبة (e.g. TOYOTA).
3. Extract Model / الطراز (e.g. CAMRY).
4. Extract Year / سنة الصنع (4-digit year, e.g. 2015).

Return JSON with keys: vin, make, model, year.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini API Error'
      });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // 1. استخراج رقم الشاصي (17 حرف ورقم)
    const vinRegexMatch = rawText.match(/[A-HJ-NPR-Z0-9]{17}/i);
    let detectedVin = vinRegexMatch ? vinRegexMatch[0].toUpperCase() : '';

    // 2. تحليل JSON
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (err) {}
      }
    }

    if (!detectedVin && parsed.vin) {
      detectedVin = String(parsed.vin).replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    }

    return res.status(200).json({
      vin: detectedVin || parsed.vin || '',
      make: parsed.make || '',
      model: parsed.model || '',
      year: parsed.year || ''
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
