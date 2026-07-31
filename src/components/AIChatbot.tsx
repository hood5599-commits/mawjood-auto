import React, { useState, useRef, useEffect } from 'react';

// 🔴 ضع مفتاح Gemini الخاص بك هنا مباشرة داخل علامتي التنصيص ليعمل الذكاء الاصطناعي دون فشل!
const GEMINI_API_KEY = "ضع_مفتاح_جيميني_الخاص_بك_هنا"; 

interface AIChatbotProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  supabaseKey: string;
  session: any;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ lang, supabaseUrl, supabaseKey, session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  // رسالة الترحيب الذكية بناءً على حالة تسجيل الدخول
  useEffect(() => {
    if (messages.length === 0) {
      const userName = session?.user?.user_metadata?.name || session?.phone || '';
      const greeting = lang === 'ar' 
        ? `أهلاً بك${userName ? ` يا ${userName}` : ''} في موجود أوتو! 🏎️ أنا خبيرك الذكي. يمكنني مساعدتك في اختيار القطع، التحقق من أصالتها، أو تتبع طلباتك المباشرة. كيف أخدمك؟` 
        : `Welcome${userName ? ` ${userName}` : ''} to Mawjood Auto! 🏎️ I am your smart expert. I can help you find parts, check authenticity, or track your live orders. How can I help?`;
      setMessages([{ sender: 'ai', text: greeting }]);
    }
  }, [lang, session, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const quickQuestions = lang === 'ar' ? [
    'وين أحصل قطعة لسيارتي؟',
    'كيف أعرف القطعة أصلية؟',
    '📦 تتبع طلباتي الحالية',
    '💬 التواصل مع الدعم الفني'
  ] : [
    'Where to find a part?',
    'How to check if OEM?',
    '📦 Track my orders',
    '💬 Contact Support'
  ];

  // دالة لجلب الطلبات الحية للعميل لإطعامها للذكاء الاصطناعي
  const fetchUserContext = async () => {
    let contextStr = "Customer is a guest. No active orders.";
    if (session) {
      const phone = session.phone || session.email;
      try {
        const [ordersRes, inqRes] = await Promise.all([
          fetch(`${supabaseUrl}/orders?customer_phone=eq.${phone}&limit=3&order=id.desc`, { headers: { 'apikey': supabaseKey } }),
          fetch(`${supabaseUrl}/fitment_inquiries?customer_phone=eq.${phone}&limit=3&order=id.desc`, { headers: { 'apikey': supabaseKey } })
        ]);
        const orders = await ordersRes.json();
        const inquiries = await inqRes.json();
        
        contextStr = `Customer is Logged In. 
        Recent Orders: ${JSON.stringify(orders)}. 
        Recent Fitment Inquiries: ${JSON.stringify(inquiries)}.`;
      } catch (e) {
        console.error("Failed to fetch context", e);
      }
    }
    return contextStr;
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // 💬 الرد المباشر للدعم الفني
    if (userMsg.includes('الدعم') || userMsg.includes('Support')) {
      setMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: lang === 'ar' 
          ? 'يمكنك التواصل المباشر مع خدمة العملاء عبر الواتساب على الرقم: 97455000000+ 📱' 
          : 'You can contact customer support directly on WhatsApp: +97455000000 📱' 
      }]);
      setLoading(false);
      return;
    }

    // جلب سياق العميل (طلباته الحالية)
    const userContext = await fetchUserContext();

    const systemPrompt = `You are "Mawjood Auto AI", a legendary, highly intelligent auto parts assistant in Qatar.
You must speak in ${lang === 'ar' ? 'Arabic' : 'English'} naturally, politely, and as an automotive expert.

Context about the user talking to you right now:
${userContext}

Instructions:
1. ORDER TRACKING: If the user asks about their orders or asks to track them (تتبع طلباتي), read their "Recent Orders" from the Context.
   - Map order statuses: 'pending' (جاري التجهيز), 'ready_for_pickup' (جاهزة لانتظار المندوب), 'handed_to_driver' (مع المندوب في الطريق إليك 🚚), 'delivered' (تم التسليم ✅).
   - Tell them exactly what is happening with their order. Example: "بخصوص طلبك رقم ORD-123 الخاص بالدينمو، فهو الآن مع المندوب في الطريق إليك!".
2. INQUIRY TRACKING: If they ask about fitment inquiries, check "Recent Fitment Inquiries". 
   - Statuses: 'pending_check' (بانتظار فحص الكراج), 'confirmed_compatible' (الكراج يؤكد أنها تركب 100%), 'rejected' (القطعة لا تتوافق ❌).
3. SEARCHING PARTS (e.g. "وين احصل قطعه مروحه كامري"): Tell them to use the top search bar, or advise them to upload their VIN (رقم الشاصي) through the fitment request feature so the garage guarantees the match.
4. CAR KNOWLEDGE (e.g. "كيف اعرف القطعه اصليه"): Explain professionally (e.g., check for OEM stamps, original packaging, and assure them Mawjood Auto verifies sellers).
5. If the user asks to track an order but the Context says they are a guest, tell them to log in or ask for the Order Number.
DO NOT use code blocks or JSON in your response. Respond in a warm, helpful, human-like chat format.`;

    try {
      if (GEMINI_API_KEY === "ضع_مفتاح_جيميني_الخاص_بك_هنا" || !GEMINI_API_KEY) {
        throw new Error("Missing API Key");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: systemPrompt }] },
              // تمرير المحادثات السابقة ليفهم السياق
              ...messages.map(m => ({ parts: [{ text: `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}` }] })),
              { parts: [{ text: `User: ${userMsg}` }] }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
        } else {
          throw new Error("No response text");
        }
      } else {
        throw new Error("API Response Error");
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: lang === 'ar' 
          ? 'عذراً، لم أتمكن من الاتصال بالخادم الذكي. تأكد من أنك قمت بوضع مفتاح Gemini الصحيح في كود المساعد! 🤖' 
          : 'AI Server connection failed. Please ensure the Gemini API key is set in the code.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', [isRtl ? 'left' : 'right']: '20px', zIndex: 1000, fontFamily: 'Cairo, sans-serif' }}>
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#1f3a5f',
            color: 'white',
            border: '2px solid #e0872a',
            borderRadius: '50px',
            padding: '12px 22px',
            boxShadow: '0 8px 24px rgba(31,58,95,0.35)',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            animation: 'bounce 2s infinite'
          }}
        >
          <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }`}</style>
          <span style={{ fontSize: '18px' }}>🚀</span>
          <span>{lang === 'ar' ? 'خبير موجود أوتو' : 'Mawjood AI Expert'}</span>
        </button>
      )}

      {isOpen && (
        <div
          style={{
            width: '380px',
            maxWidth: '90vw',
            height: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #cbd5e0',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          <div style={{ backgroundColor: '#1f3a5f', color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '26px' }}>🤖</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block' }}>{lang === 'ar' ? 'خبير موجود أوتو الذكي' : 'Mawjood Auto Expert'}</strong>
                <span style={{ fontSize: '11.5px', opacity: 0.9, color: '#4ade80' }}>🟢 {lang === 'ar' ? 'متصل وجاهز لتتبع طلباتك' : 'Online & Ready'}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', opacity: 0.8 }}>✖</button>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'user' ? '#e0872a' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  padding: '12px 16px',
                  borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  maxWidth: '85%'
                }}
              >
                {/* استخدام dangerouslySetInnerHTML لجعل النص يقبل التنسيق الغامق والفقرات */}
                <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #1f3a5f',
                      color: '#1f3a5f',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '16px', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⏳ {lang === 'ar' ? 'جاري التحقق من النظام...' : 'Checking database...'}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'اسأل الخبير (مثال: تتبع طلبي، كيف أعرف الأصلي؟)...' : 'Ask Expert (e.g. Track order)...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', outline: 'none', backgroundColor: '#f8fafc' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', padding: '0 18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px' }}
            >
              🚀
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
