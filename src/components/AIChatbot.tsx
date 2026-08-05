import React, { useState, useEffect, useRef } from 'react';

interface AIChatbotProps {
  lang: 'ar' | 'en';
  carData: Record<string, { models: string[], engines: string[] }>;
  categoryTree: Record<string, string[]>;
  onApplyFilters: (filters: { query?: string; make?: string; model?: string; year?: string; mainCategory?: string; subCategory?: string }) => void;
  onCloseFilters: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// القاموس الذكي للربط اللفظي
const SYMPTOM_AND_DIALECT_MAP: Record<string, { main: string; sub: string; query: string }> = {
  'مروحة': { main: 'Cooling System', sub: 'Radiator Fan Assembly', query: 'Fan' },
  'مروحه': { main: 'Cooling System', sub: 'Radiator Fan Assembly', query: 'Fan' },
  'رديتر': { main: 'Cooling System', sub: 'Radiator', query: 'Radiator' },
  'لديتر': { main: 'Cooling System', sub: 'Radiator', query: 'Radiator' },
  'سفايف': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad' },
  'قماشات': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad' },
  'دسيين': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor' },
  'هوبات': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor' },
  'جامبينات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock' },
  'مساعدات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock' },
  'شيال': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm' },
  'مقصات': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm' },
  'كمبروسر': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor' },
  'مكيف': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor' },
  'دينمو': { main: 'Electrical', sub: 'Alternator / Generator', query: 'Alternator' },
  'سلف': { main: 'Electrical', sub: 'Starter Motor', query: 'Starter' },
  'بلاكات': { main: 'Ignition', sub: 'Spark Plug', query: 'Spark Plug' }
};

export const AIChatbot: React.FC<AIChatbotProps> = ({
  lang,
  carData,
  categoryTree,
  onApplyFilters,
  onCloseFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: isRtl ? 'أهلاً! أنا عبود مساعد موجود. وش القطعة أو السيارة اللي تدور عليها؟' : 'Hi! I am Abboud, Mawjood assistant. What part or car are you looking for?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang, isRtl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processSmartAgentResponse = (userText: string) => {
    const lowerText = userText.toLowerCase();

    // 1. التحقق من إنهاء الطلب وإغلاق الشجرة
    if (/(شكرا|تم|خلاص|يعطيك العافية|cancel|thanks|close)/.test(lowerText)) {
      onCloseFilters();
      return isRtl ? 'حياك الله بأي وقت! تم تصفية البحث.' : 'Happy to help! Search cleared.';
    }

    // 2. الذكاء الخارق: استخراج الشركة، الموديل، السنة من الجملة مباشرة
    let extractedMake = '';
    let extractedModel = '';
    let extractedYear = '';

    // استخراج السنة (أرقام بين 1900 و 2029)
    const yearMatch = lowerText.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) extractedYear = yearMatch[1];

    // استخراج الماركة والموديل بذكاء
    for (const [make, data] of Object.entries(carData)) {
      if (lowerText.includes(make.toLowerCase())) extractedMake = make;
      
      for (const model of data.models) {
        if (lowerText.includes(model.toLowerCase())) {
          extractedModel = model;
          extractedMake = make; // استنتاج الماركة تلقائياً إذا عرف الموديل
          break;
        }
      }
    }

    // 3. استخراج القطعة المطلوبة
    let matchedCategory: { main: string; sub: string; query: string } | null = null;
    for (const [key, val] of Object.entries(SYMPTOM_AND_DIALECT_MAP)) {
      if (lowerText.includes(key.toLowerCase())) {
        matchedCategory = val;
        break;
      }
    }

    if (!matchedCategory) {
      for (const [mainCat, subCats] of Object.entries(categoryTree)) {
        for (const subCat of subCats) {
          if (lowerText.includes(subCat.toLowerCase()) || lowerText.includes(subCat.split(' ')[0].toLowerCase())) {
            matchedCategory = { main: mainCat, sub: subCat, query: subCat };
            break;
          }
        }
        if (matchedCategory) break;
      }
    }

    // 4. تنفيذ أوامر الفلترة في الخلفية
    if (matchedCategory || extractedMake || extractedModel || extractedYear) {
      onApplyFilters({
        query: matchedCategory?.query || '',
        make: extractedMake,
        model: extractedModel,
        year: extractedYear,
        mainCategory: matchedCategory?.main,
        subCategory: matchedCategory?.sub
      });

      const partsFound = [extractedMake, extractedModel, extractedYear, (matchedCategory?.sub || '')].filter(Boolean).join(' ');
      
      return isRtl
        ? `أبشر! جهزت لك نتائج (${partsFound}) في الصفحة، تفقدها الآن.`
        : `Done! Results for (${partsFound}) are ready.`;
    }

    return isRtl
      ? 'ما فهمت عليك زين، ياليت توضح لي اسم القطعة وموديل السيارة.'
      : 'Could you clarify the part name and your car model?';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = processSmartAgentResponse(currentInput);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: isRtl ? '24px' : 'auto', right: isRtl ? 'auto' : '24px', zIndex: 1500, fontFamily: 'Cairo, sans-serif' }}>
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '14px 22px',
            backgroundColor: '#1f3a5f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(31,58,95,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>عبود مساعد موجود</span>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '340px',
          height: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          direction: isRtl ? 'rtl' : 'ltr'
        }}>
          
          <div style={{ backgroundColor: '#1f3a5f', padding: '16px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>عبود مساعد موجود</h4>
              <span style={{ fontSize: '11px', color: '#cbd5e0' }}>متصل الآن لمساعدتك</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  backgroundColor: msg.sender === 'user' ? '#1f3a5f' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  padding: '12px 14px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                <div>{msg.text}</div>
                <span style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', display: 'block', textAlign: 'left' }}>{msg.timestamp}</span>
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', color: '#64748b' }}>
                جاري البحث...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={isRtl ? 'وش تبحث عنه؟' : 'What are you looking for?'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '13px', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ padding: '10px 16px', backgroundColor: '#e0872a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              إرسال
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default AIChatbot;
