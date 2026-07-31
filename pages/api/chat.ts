// مسار الملف: api/chat.ts

export default async function handler(req: any, res: any) {
  // نقبل فقط طلبات من نوع POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // استلام البيانات من الواجهة الأمامية
  const { userMsg, previousMessages, lang, userContext } = req.body;

  // 🔑 قراءة المفتاح بأمان من بيئة Vercel المخبأة
  const apiKey = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing in Vercel' });
  }

  const systemPrompt = `You are "Mawjood Auto AI", a legendary, highly intelligent auto parts assistant in Qatar.
You must speak in ${lang === 'ar' ? 'Arabic' : 'English'} naturally, politely, and as an automotive expert.

Context about the user talking to you right now:
${userContext}

Instructions:
1. ORDER TRACKING: If the user asks about their orders or asks to track them (تتبع طلباتي), read their "Recent Orders" from the Context. Map statuses (pending=جاري التجهيز, ready_for_pickup=جاهز, handed_to_driver=مع المندوب, delivered=تم التسليم).
2. INQUIRY TRACKING: Check "Recent Fitment Inquiries". Statuses: pending_check, confirmed_compatible, rejected.
3. SEARCHING PARTS: Tell them to use the top search bar, or advise them to upload their VIN through the fitment request.
4. CAR KNOWLEDGE: Explain professionally.
DO NOT use code blocks or JSON in your response. Respond in a warm, helpful, human-like chat format.`;

  try {
    // الخادم هو من يتصل بـ Google، وليس متصفح المستخدم
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemPrompt }] },
            ...previousMessages.map((m: any) => ({ parts: [{ text: `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}` }] })),
            { parts: [{ text: `User: ${userMsg}` }] }
          ]
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect to AI Server' });
  }
}
