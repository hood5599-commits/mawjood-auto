declare const process: any;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const PROMPT = `You are an automotive spare-parts OCR engine for Qatar (Arabic + English).

Analyze this image of a mechanic workshop sheet, handwritten parts list, OR agency quotation (e.g. Mannai Trading Co. Quotation / عرض أسعار).

Extract EVERY line item that is a spare part request. Expand abbreviations to clear searchable names:
- GASKET CYL HD → Cylinder Head Gasket / حشية رأس الأسطوانة
- GASKET W/PMP → Water Pump Gasket / حشية مضخة الماء
- HOUSING CR/SHF RR OIL SEAL → Rear Crankshaft Oil Seal Housing
- SEAL KIT VLV STM OIL → Valve Stem Oil Seal Kit
- سفايف امامي → Front Brake Pads

Also detect handwritten exclusions like "without → Piston STD, CAM Shaft".

Respond ONLY with valid JSON:
{
  "items": [
    {
      "nameEn": "Cylinder Head Gasket",
      "nameAr": "حشية رأس الأسطوانة",
      "rawLine": "GASKET CYL HD",
      "qty": 2,
      "unitPrice": 530,
      "searchTerms": ["cylinder", "head", "gasket", "حشية", "رأس", "أسطوانة"]
    }
  ],
  "exclusions": ["Piston STD", "CAM Shaft"],
  "unrecognized": ["blurry handwritten line if any"],
  "notes": "optional short note"
}

Rules:
- Prefer technical English nameEn + Arabic nameAr.
- searchTerms: 4-8 keywords useful for inventory search (EN + AR).
- qty default 1. unitPrice null if unknown.
- Skip totals, bank info, headers, page numbers.
- Do not invent parts that are not on the sheet.
- Exclude items listed in handwritten "without" notes from items (put them in exclusions only).`;

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
      try {
        body = JSON.parse(body);
      } catch (_) {}
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
    imageBase64 = String(imageBase64).trim().replace(/\s/g, '');

    const models = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
    ];

    let lastError = 'AI scan failed';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: PROMPT },
                    {
                      inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: imageBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          lastError = data?.error?.message || `Model ${model} failed`;
          continue;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        let parsed: any = {};
        try {
          parsed = JSON.parse(rawText);
        } catch (_) {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
            } catch (_) {}
          }
        }

        const items = Array.isArray(parsed.items) ? parsed.items : [];
        return res.status(200).json({
          items: items.map((it: any, idx: number) => ({
            id: `ocr_${idx}`,
            nameEn: String(it.nameEn || it.name || it.rawLine || 'Unknown part'),
            nameAr: String(it.nameAr || it.nameEn || it.rawLine || 'قطعة غير معروفة'),
            rawLine: String(it.rawLine || it.nameEn || ''),
            qty: Number(it.qty) > 0 ? Number(it.qty) : 1,
            unitPrice:
              it.unitPrice != null && !Number.isNaN(Number(it.unitPrice))
                ? Number(it.unitPrice)
                : null,
            searchTerms: Array.isArray(it.searchTerms)
              ? it.searchTerms.map((t: any) => String(t)).filter(Boolean)
              : [],
          })),
          exclusions: Array.isArray(parsed.exclusions)
            ? parsed.exclusions.map((e: any) => String(e))
            : [],
          unrecognized: Array.isArray(parsed.unrecognized)
            ? parsed.unrecognized.map((u: any) => String(u))
            : [],
          notes: parsed.notes ? String(parsed.notes) : '',
        });
      } catch (err: any) {
        lastError = err?.message || lastError;
      }
    }

    return res.status(502).json({ error: lastError });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
