// api/scan-istemara.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // قراءة المفتاح بأمان وسرية تامة من السيرفر
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const promptText = `You are a precision OCR engine for the State of Qatar Ministry of Interior Vehicle Registration Card (ترخيص تسيير مركبة - دولة قطر).
Focus strictly on the "بيانات المركبة / Vehicle Information" section in the lower card:
1. "Chassis No." / "رقم القاعدة": Extract the exact 17-character alphanumeric VIN (e.g. 6T1BF9FK9FX540435).
2. "نوع المركبة": Extract vehicle Make (e.g. TOYOTA).
3. "الطراز": Extract vehicle Model (e.g. CAMRY).
4. "سنة الصنع": Extract 4-digit Year (e.g. 2015).
5. "رقم المحرك / Engine No." & "الاسطوانات": Extract engine code/cylinders.

Respond ONLY with a clean JSON object without backticks or markdown, exactly like this:
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
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return res.status(200).json(JSON.parse(jsonMatch[0]));
    }

    return res.status(422).json({ error: 'Could not extract structured data' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
