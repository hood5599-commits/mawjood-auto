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
      setMessages([{ sender: 'ai', text: 'أهلاً بك! مساعد التشخيص جاهز. اكتب أي سؤال لنفحص الاتصال سوياً ⚙️' }]);
    }
  }, [messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    const baseUrl = supabaseUrl && supabaseUrl.startsWith('http') 
      ? supabaseUrl 
      : "https://shszpcjmhkemqwborfwy.supabase.co";

    let debugLog: string[] = [];
    debugLog.push(`🔍 **بداية التست:**`);
    debugLog.push(`- URL: ${baseUrl}`);
    debugLog.push(`- Key Present: ${!!supabaseKey}`);

    try {
      // 🧪 1. اختبار الاتصال بـ Supabase Edge Function
      const functionUrl = `${baseUrl}/functions/v1/chat_assistant`;
      debugLog.push(`- جاري الاتصال بـ: ${functionUrl}`);

      const edgeRes = await fetch(functionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': supabaseKey || '',
          'Authorization': `Bearer ${supabaseKey || ''}`
        },
        body: JSON.stringify({ userMsg, previousMessages: messages, lang, userContext: "Test Context" })
      }).catch((err) => {
        debugLog.push(`❌ فشل شبكة (Fetch Failed): ${err.message}`);
        return null;
      });

      if (edgeRes) {
        debugLog.push(`📡 رمز استجابة السيرفر (Status): ${edgeRes.status}`);
        const textBody = await edgeRes.text();
        
        if (edgeRes.ok) {
          try {
            const parsed = JSON.parse(textBody);
            if (parsed.reply) {
              // 🟢 نجاح كامل!
              setMessages((prev) => [...prev, { sender: 'ai', text: parsed.reply }]);
              setLoading(false);
              return;
            } else {
              debugLog.push(`⚠️ السيرفر رد بنجاح لكن بدون reply: ${textBody}`);
            }
          } catch (e) {
            debugLog.push(`⚠️ الرد ليس JSON صالح: ${textBody.substring(0, 100)}`);
          }
        } else {
          debugLog.push(`❌ خطأ من Supabase: ${textBody}`);
        }
      }

      // 🧪 2. فحص المفتاح المباشر لـ Gemini إذا توفر
      // @ts-ignore
      const apiKey = (typeof process !== 'undefined' && (process.env?.REACT_APP_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) || import.meta.env?.VITE_GEMINI_API_KEY || "";
      debugLog.push(`- Direct Gemini Key Present: ${!!apiKey}`);

      if (apiKey) {
        debugLog.push(`- جاري تجربة الاتصال المباشر بـ Google Gemini...`);
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `User question: ${userMsg}` }] }]
            })
          }
        ).catch((err) => {
          debugLog.push(`❌ فشل الاتصال المباشر بجوجل: ${err.message}`);
          return null;
        });

        if (directRes) {
          debugLog.push(`📡 Google Gemini Status: ${directRes.status}`);
          const directText = await directRes.text();
          if (directRes.ok) {
            const parsed = JSON.parse(directText);
            const directReply = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (directReply) {
              setMessages((prev) => [...prev, { sender: 'ai', text: `(رد من Gemini المباشر):\n${directReply}` }]);
              setLoading(false);
              return;
            }
          } else {
            debugLog.push(`❌ خطأ من Google API: ${directText}`);
          }
        }
      }

      // 🔴 إظهار تقرير التست الكامل داخل الشات للمستخدم
      setMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: debugLog.join('\n') 
      }]);

    } catch (globalErr: any) {
      setMessages((prev) => [...prev, { 
        sender: 'ai', 
        text: `💥 خطأ عام في الكود: ${globalErr?.message || globalErr}` 
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
            fontSize: '14px'
          }}
        >
          <span style={{ fontSize: '18px' }}>🛠️</span>
          <span>{lang === 'ar' ? 'فحص خبير أوتو' : 'Debug AI Expert'}</span>
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
              <span style={{ fontSize: '26px' }}>⚙️</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block' }}>وضع كشف الأخطاء (Debug Mode)</strong>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✖</button>
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
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '16px', fontSize: '13px', color: '#64748b' }}>
                ⏳ جاري تشخيص الاتصال بالخوادم...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <input
              type="text"
              placeholder="اكتب أي شيء لاختبار الاتصال..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '13.5px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '12px', padding: '0 18px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🚀
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
