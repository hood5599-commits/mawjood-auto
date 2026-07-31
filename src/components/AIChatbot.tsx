import React, { useState, useRef, useEffect } from 'react';

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
        ? 'أهلاً بك في موجود أوتو! 🏎️ أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم في اختيار قطع الغيار أو الطلب؟' 
        : 'Welcome to Mawjood Auto! 🏎️ I am your AI assistant. How can I help you find parts or place an order today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev: Message[]) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // 🔑 جلب المفتاح بشكل آمن لتفادي أخطاء TypeScript و Vercel
    // @ts-ignore
    const apiKey = (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) || "";

    if (!apiKey) {
      setMessages((prev: Message[]) => [...prev, { 
        sender: 'ai', 
        text: lang === 'ar' 
          ? 'عفواً، مفتاح الذكاء الاصطناعي غير معرف بشكل صحيح في النظام.' 
          : 'Gemini API key is not configured.' 
      }]);
      setLoading(false);
      return;
    }

    const systemPrompt = `You are a helpful customer service AI Assistant for "Mawjood Auto" (موجود أوتو), an online auto parts marketplace in Qatar.
Your goal is to assist customers who don't know how to search or order parts.
Key instructions to guide users:
1. To search: Users can use the search bar by Part Number (PN) or part name (e.g., Alternator, Starter, Brake Pads).
2. To check fitment: Tell them to click on the part, enter their car's VIN (رقم الشاصي) from the registration (الاستمارة), upload an old part photo, and send it to the garage for a 100% compatibility check.
3. Delivery: Delivery takes 2 to 24 hours across Qatar, or free pickup from the store.
4. Payment: Supports Apple Pay, Google Pay, Cards (Visa/MasterCard), or Cash on Delivery (COD).
Answer clearly, concisely, and politely in the same language as the user (${lang === 'ar' ? 'Arabic' : 'English'}).`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: systemPrompt }] },
              // تمرير سجل المحادثة السابق ليفهم السياق
              ...messages.map(m => ({ parts: [{ text: `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}` }] })),
              { parts: [{ text: `User Question: ${userMsg}` }] }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
          || (lang === 'ar' ? 'عفواً، لم أستطع فهم الطلب، حاول مرة أخرى.' : 'Sorry, I could not process that.');
        setMessages((prev: Message[]) => [...prev, { sender: 'ai', text: reply }]);
      } else {
        setMessages((prev: Message[]) => [...prev, { sender: 'ai', text: lang === 'ar' ? 'حدث خطأ في استجابة الذكاء الاصطناعي، يرجى المحاولة لاحقاً.' : 'Error in AI response.' }]);
      }
    } catch (err) {
      setMessages((prev: Message[]) => [...prev, { sender: 'ai', text: lang === 'ar' ? 'تعذر الاتصال بالمساعد الذكي حالياً.' : 'Connection error.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', [isRtl ? 'left' : 'right']: '20px', zIndex: 1000, fontFamily: 'Cairo, sans-serif' }}>
      
      {/* 🔘 زر فتح المساعد المنبثق */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#1f3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(31,58,95,0.35)',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            transition: 'transform 0.2s ease'
          }}
        >
          <span style={{ fontSize: '18px' }}>🤖</span>
          <span>{lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</span>
        </button>
      )}

      {/* 💬 نافذة المحادثة */}
      {isOpen && (
        <div
          style={{
            width: '350px',
            maxWidth: '90vw',
            height: '460px',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {/* هيدر الشات */}
          <div style={{ backgroundColor: '#1f3a5f', color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>{lang === 'ar' ? 'مساعد موجود أوتو' : 'Mawjood AI Helper'}</strong>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>🟢 {lang === 'ar' ? 'متصل الآن' : 'Online'}</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✖</button>
          </div>

          {/* قائمة الرسائل */}
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
                  lineHeight: '1.4',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  maxWidth: '82%'
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', color: '#64748b' }}>
                ⏳ {lang === 'ar' ? 'جاري التفكير...' : 'Thinking...'}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* حقل الإدخال */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '10px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'اسأل المساعد الذكي أي سؤال...' : 'Ask AI anything...'}
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
