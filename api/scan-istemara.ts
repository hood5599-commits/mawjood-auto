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

  const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API Key on server' });
  }

  try {
    let { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (imageBase64.includes(',')) {
      imageBase64 = imageBase64.split(',')[1];
    }

    const promptText = `Analyze this Qatari vehicle registration card (استمارة ترخيص تسيير مركبة دولة قطر).
Extract strictly:
1. 17-character Chassis/VIN number (رقم القاعدة / الشاصي).
2. Make / نوع المركبة (e.g. TOYOTA).
3. Model / الطراز (e.g. CAMRY).
4. Year / سنة الصنع (e.g. 2015).
5. Engine / رقم المحرك (e.g. 2AR).

Respond ONLY with a JSON object:
{"vin": "6T1BF9FK9FX540435", "make": "Toyota", "model": "Camry", "year": "2015"}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // استخراج رقم الشاصي (17 حرف/رقم) عبر Regex كخيار أساسي ومضمون
    const vinMatch = rawText.match(/[A-HJ-NPR-Z0-9]{17}/i);
    let detectedVin = vinMatch ? vinMatch[0].toUpperCase() : '';

    // تنظيف نص الرد من علامات Markdown
    const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);

    let parsed: any = {};
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {}
    }

    if (!detectedVin && parsed.vin) {
      detectedVin = String(parsed.vin).replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    }

    return res.status(200).json({
      vin: detectedVin || parsed.vin || '',
      make: parsed.make || '',
      model: parsed.model || '',
      year: parsed.year || '',
      engine: parsed.engine || ''
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
