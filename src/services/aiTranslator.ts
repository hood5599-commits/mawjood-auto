// 🤖 خدمة الترجمة الفورية الاحترافية باستخدام الذكاء الاصطناعي (Gemini API)

// @ts-ignore
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "";

// ذاكرة تخزين مؤقتة (Cache) لكي لا نكرر طلب ترجمة الكلمة نفسها أكثر من مرة
const translationCache: Record<string, string> = {};

export const translateWithAI = async (
  text: string, 
  targetLang: 'ar' | 'en' = 'en'
): Promise<string> => {
  if (!text || text.trim() === '') return text;

  // إذا كانت النص موجوداً في الذاكرة المؤقتة، نجيبه فوراً بدون طلب للـ API
  const cacheKey = `${text}_${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const prompt = `You are an expert automotive parts translator. Translate the following automotive part name or description from Arabic/English to ${
      targetLang === 'en' ? 'English' : 'Arabic'
    }. Keep technical terminology accurate (e.g., DINAMO -> Alternator, COMPRESSOR -> A/C Compressor). Return ONLY the translated string without quotes or markdown.\n\nText: "${text}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) return text;

    const data = await response.json();
    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    // حفظ في الذاكرة لتسريع الأداء مستقبلاً
    translationCache[cacheKey] = translatedText;

    return translatedText;
  } catch (error) {
    console.error("AI Translation Error:", error);
    return text; // في حال حدوث خطأ تعود بالكلمة الأصلية
  }
};
