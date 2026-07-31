import React, { useState, useRef, useEffect } from 'react';

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

  const fetchUserContext = async () => {
    if (!session) return "Customer is a guest. No active logged-in session.";
    const phone = session.phone || session.email || '';
    if (!phone) return "Customer is logged in, but no phone/email found.";

    try {
      const [ordersRes, inqRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/orders?customer_phone=eq.${phone}&limit=3&order=id.desc`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }).catch(() => null),
        fetch(`${supabaseUrl}/rest/v1/fitment_inquiries?customer_phone=eq.${phone}&limit=3&order=id.desc`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }).catch(() => null)
      ]);

      const orders = ordersRes && ordersRes.ok ? await ordersRes.json() : [];
      const inquiries = inqRes && inqRes.ok ? await inqRes.json() : [];

      return `Customer Phone/ID: ${phone}. Active Orders: ${JSON.stringify(orders)}. Inquiries: ${JSON.stringify(inquiries)}.`;
    } catch (e) {
      return "Logged in user, context unavailable.";
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

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

    const userContext = await fetchUserContext();

    // 🔑 جلب المفتاح المباشر المضمون
    // @ts-ignore
    const apiKey = (typeof process !== 'undefined' && (process.env?.REACT_APP_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) || import.meta.env?.VITE_GEMINI_API_KEY || "";

    const systemPrompt = `You are "Mawjood Auto AI", an expert automotive assistant in Qatar.
Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
Context: ${userContext}

Instructions:
1. ORDER TRACKING: If user asks "تتبع طلبي" or "هل لدي طلبات", read Context and give order details clearly.
2. PARTS SEARCH: If asking for parts (e.g., مروحه كامري 2006, كم قطعة في تويوتا), tell them politely to use the top search bar or upload VIN (رقم الشاصي).
3. Always answer friendly, concisely, directly, and as a human car expert. NO code blocks.`;

    try {
      // 1️⃣ تجربة الاتصال المباشر أولاً بـ Supabase Function
      let aiReply = "";
      const edgeRes = await fetch(`${supabaseUrl}/functions/v1/chat_assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
        body: JSON.stringify({ userMsg, previousMessages: messages, lang, userContext })
      }).catch(() => null);

      if (edgeRes && edgeRes.ok) {
        const edgeData = await edgeRes.json();
        if (edgeData.reply) aiReply = edgeData.reply;
      }

      // 2️⃣ إذا فشل Edge Function، يتصل تلقائياً بـ Gemini API المباشر
      if (!aiReply && apiKey) {
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: systemPrompt }] },
                ...messages.map(m => ({ parts: [{ text: `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}` }] })),
                { parts: [{ text: `User: ${userMsg}` }] }
              ]
            })
          }
        );

        if (directRes.ok) {
          const directData = await directRes.json();
          aiReply = directData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      }

      if (aiReply) {
        setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
      } else {
        throw new Error("No response generated");
      }

    } catch (err) {
      console.error("Chatbot Error:", err);
      let smartFallback = "";
      if (userMsg.includes("تتبع") || userMsg.includes("طلبي") || userMsg.includes("طلبات")) {
        smartFallback = lang === 'ar' 
          ? "لمتابعة طلباتك واستفساراتك، يرجى الضغط على زر **'📦 متابعة استفساراتي وطلباتي'** الموجود في أعلى الصفحة! 🚚"
          : "To track your orders, please click **'📦 Track Inquiries & Orders'** at the top of the page! 🚚";
      } else {
        smartFallback = lang === 'ar'
          ? `للبحث عن **"${userMsg}"**: اكتب الكلمة في خانة البحث العلوية مباشرة، أو أرسل رقم الشاصي للكراج! 🚘`
          : `To find **"${userMsg}"**: Type it in the search bar above or submit your VIN! 🚘`;
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: smartFallback }]);
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
