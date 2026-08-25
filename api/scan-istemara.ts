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
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Environment Variables' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    let { imageBase64, mimeType } = body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (imageBase64.includes('base64,')) {
      imageBase64 = imageBase64.split('base64,')[1];
    } else if (imageBase64.includes(',')) {
      imageBase64 = imageBase64.split(',')[1];
    }
    imageBase64 = imageBase64.trim().replace(/\s/g, '');

    const promptText = `Analyze this Qatari vehicle registration card (استمارة ترخيص تسيير مركبة دولة قطر).
Extract strictly:
1. Chassis No. / رقم القاعدة (17-character VIN).
2. Make / نوع المركبة.
3. Model / الطراز.
4. Year / سنة الصنع.

Respond ONLY with a valid JSON object:
{"vin": "6T1BF9FK9FX540435", "make": "Toyota", "model": "Camry", "year": "2015"}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    };

    const targetModel = 'gemini-3.6-flash';
    const activeModelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const response = await fetch(activeModelUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `فشل الاتصال بالنموذج (${targetModel})`
      });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const vinRegexMatch = rawText.match(/[A-HJ-NPR-Z0-9]{17}/i);
    let detectedVin = vinRegexMatch ? vinRegexMatch[0].toUpperCase() : '';

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (err) {}
      }
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
