import React, { useState, useRef, useEffect } from 'react';

// 🔑 نستخدم نفس طريقة الاستدعاء التي نجحت معك في aiTranslator.ts
// @ts-ignore
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "ضع_المفتاح_هنا_إن_أردت_أو_اتركه_ليقرأ_من_البيئة";

interface AIChatbotProps {
  lang: 'ar' | 'en';
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: lang === 'ar' 
        ? 'أهلاً بك في موجود أوتو! 🏎️ أنا خبير القطع الذكي. كيف يمكنني إرشادك اليوم لتجد قطع سيارتك أو تطلبها؟' 
        : 'Welcome to Mawjood Auto! 🏎️ I am your smart parts expert. How can I guide you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const quickQuestions = lang === 'ar' ? [
    '🔍 كيف أبحث عن قطعة؟',
    '🔑 أين أجد رقم الشاصي (VIN)؟',
    '🚚 كم يستغرق التوصيل؟',
    '💬 التواصل مع الدعم الفني'
  ] : [
    '🔍 How to search?',
    '🔑 Where is the VIN?',
    '🚚 Delivery time?',
    '💬 Contact Support'
  ];

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev: Message[]) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // 💬 الرد السريع على الدعم الفني
    if (userMsg.includes('الدعم') || userMsg.includes('Support')) {
      setMessages((prev: Message[]) => [...prev, { 
        sender: 'ai', 
        text: lang === 'ar' 
          ? 'يمكنك التواصل المباشر مع خدمة العملاء عبر الواتساب على الرقم: 97455000000+ 📱' 
          : 'You can contact customer support directly on WhatsApp: +97455000000 📱' 
      }]);
      setLoading(false);
      return;
    }

    const systemPrompt = `You are an expert automotive parts AI consultant for "Mawjood Auto" (موجود أوتو) in Qatar.
Help customers who don't know how to search or order:
1. Searching: Advise them to type Part Number (PN) or part name in the top search bar (e.g., Camry 2006 alternator -> اكتب دينمو كامري 2006).
2. Fitment & Ordering: Tell them to open any part, enter 17-digit VIN (رقم الشاصي من استمارة السيارة), and attach an old part photo so the garage verifies 100% compatibility before shipping.
3. Delivery: Delivery takes 2 to 24 hours across Qatar, or free store pickup.
4. Payment: Supports Apple Pay, Google Pay, Visa/MasterCard, Cash on Delivery (COD).
Answer clearly and concisely in ${lang === 'ar' ? 'Arabic' : 'English'}.
User Question: "${userMsg}"`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          setMessages((prev: Message[]) => [...prev, { sender: 'ai', text: reply }]);
        } else {
          throw new Error("No response text");
        }
      } else {
        throw new Error("API Response Error");
      }
    } catch (err) {
      // 🛡️ إجابة ذكية بديلة متجاوبة مع العميل حتى عند تعذر الخدمة
      let fallbackText = lang === 'ar'
        ? `للبحث عن "${userMsg}": اكتب الكلمة في خانة البحث العلوية مباشرة، أو اضغط على أي قطعة وأدخل رقم الشاصي لتأكيد التوافق مع الكراج! 🚘`
        : `To find "${userMsg}": Type it directly in the top search bar, or select a part and enter your VIN for garage compatibility check! 🚘`;
        
      setMessages((prev: Message[]) => [...prev, { sender: 'ai', text: fallbackText }]);
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
            fontSize: '14px'
          }}
        >
          <span style={{ fontSize: '18px' }}>🤖</span>
          <span>{lang === 'ar' ? 'مساعد القطع الذكي' : 'AI Parts Helper'}</span>
        </button>
      )}

      {isOpen && (
        <div
          style={{
            width: '360px',
            maxWidth: '90vw',
            height: '490px',
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
              <span style={{ fontSize: '22px' }}>🤖</span>
              <div>
                <strong style={{ fontSize: '14.5px', display: 'block' }}>{lang === 'ar' ? 'خبير موجود أوتو' : 'Mawjood Auto Expert'}</strong>
                <span style={{ fontSize: '11px', opacity: 0.85, color: '#4ade80' }}>🟢 {lang === 'ar' ? 'متصل وجاهز للمساعدة' : 'Online & Ready'}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✖</button>
          </div>

          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'user' ? '#e0872a' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  maxWidth: '85%'
                }}
              >
                {m.text}
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #1f3a5f',
                      color: '#1f3a5f',
                      borderRadius: '12px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', color: '#64748b' }}>
                ⏳ {lang === 'ar' ? 'جاري التحقق والمساعدة...' : 'Checking...'}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: '8px', padding: '10px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'اسأل المساعد (مثال: قطع كامري 2006)...' : 'Ask AI (e.g. Camry 2006 parts)...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              🚀
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
