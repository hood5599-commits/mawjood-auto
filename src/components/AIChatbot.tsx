import React, { useState, useEffect, useRef } from 'react';

interface AIChatbotProps {
  lang: 'ar' | 'en';
  supabaseUrl: string;
  apiKey: string;
  categoryTree: Record<string, string[]>;
  onOpenCategoryTree: (mainCategory: string, subCategory: string) => void;
  onCloseCategoryTree: () => void;
  onFilterCatalog: (searchQuery: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// قاموس الربط بين المصطلحات العامية الخليجية/الأعراض والتصنيفات المعيارية
const SYMPTOM_AND_DIALECT_MAP: Record<string, { main: string; sub: string; query: string }> = {
  // الفرامل والفرع الفني
  'سفايف': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad' },
  'قماشات': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad' },
  'دسيين': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor' },
  'هوبات': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor' },
  'صرير': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad' },
  
  // التعليق والمساعدات
  'جامبينات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock' },
  'مساعدات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock' },
  'شيال': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm' },
  'مقصات': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm' },
  'طقطقة': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm' },

  // التكييف والتبريد
  'كمبروسر': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor' },
  'مكيف': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor' },
  'رديتر': { main: 'Cooling System', sub: 'Radiator', query: 'Radiator' },
  'حرارة': { main: 'Cooling System', sub: 'Thermostat', query: 'Thermostat' },

  // الكهرباء والمحرك
  'دينمو': { main: 'Electrical', sub: 'Alternator / Generator', query: 'Alternator' },
  'سلف': { main: 'Electrical', sub: 'Starter Motor', query: 'Starter' },
  'بواجي': { main: 'Ignition', sub: 'Spark Plug', query: 'Spark Plug' },
  'تفتفة': { main: 'Ignition', sub: 'Spark Plug', query: 'Spark Plug' },
  'موبينات': { main: 'Ignition', sub: 'Ignition Coil', query: 'Coil' }
};

export const AIChatbot: React.FC<AIChatbotProps> = ({
  lang,
  categoryTree,
  onOpenCategoryTree,
  onCloseCategoryTree,
  onFilterCatalog
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
          text: isRtl
            ? 'أهلاً بك مع خبير موجود أوتو للقطع والصيانة. كيف يمكنني مساعدتك اليوم في اختيار القطعة المناسبة لسيارتك؟'
            : 'Welcome to Mawjood Auto Sales & Technical Expert. How can I assist you in finding the right part today?',
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

    // 1. فحص إغلاق الشجرة وإكمال الطلب
    if (lowerText.includes('شكرا') || lowerText.includes('تم') || lowerText.includes('خلاص') || lowerText.includes('cancel') || lowerText.includes('thanks')) {
      onCloseCategoryTree();
      return isRtl
        ? 'العفو! سعيد بخدمتك. تم إغلاق الشجرة، وإذا احتجت أي قطعة أخرى أنا موجود دائماً لخدمتك.'
        : 'You are welcome! Category tree closed. Let me know if you need anything else.';
    }

    // 2. البحث عن المطابقات التشخيصية واللفظية
    let matchedCategory: { main: string; sub: string; query: string } | null = null;

    for (const [key, val] of Object.entries(SYMPTOM_AND_DIALECT_MAP)) {
      if (lowerText.includes(key.toLowerCase())) {
        matchedCategory = val;
        break;
      }
    }

    // إذا لم نجد في القاموس العامي، نبحث بداخل شجرة التصنيفات المباشرة
    if (!matchedCategory) {
      for (const [mainCat, subCats] of Object.entries(categoryTree)) {
        for (const subCat of subCats) {
          if (lowerText.includes(subCat.toLowerCase())) {
            matchedCategory = { main: mainCat, sub: subCat, query: subCat };
            break;
          }
        }
        if (matchedCategory) break;
      }
    }

    // 3. اتخاذ القرار التفاعلي المباشر
    if (matchedCategory) {
      // فتح الشجرة آلياً وتصفية الكتالوج
      onOpenCategoryTree(matchedCategory.main, matchedCategory.sub);
      onFilterCatalog(matchedCategory.query);

      return isRtl
        ? `بناءً على طلبك، قمت بفتح قسم (${matchedCategory.main} > ${matchedCategory.sub}) لك على الشاشة فوراً، وتم تصفية القطع المتاحة. تنبيه هام: هذا التشخيص الأولي مبني على الأعراض المذكورة، وننصحك دائماً بزيارة كراج فحص مختص لمعاينة السيارة على الطبيعة وتأكيد السبب قبل الشراء.`
        : `I have opened (${matchedCategory.main} > ${matchedCategory.sub}) for you on screen. Note: This initial assessment is based on described symptoms; we strongly recommend visiting a professional garage to inspect the car in person before purchasing.`;
    }

    // 4. الرد المباشر لمدير المبيعات والمستشار
    return isRtl
      ? 'يسعدني مساعدتك! يرجى تزويدي باسم القطعة أو نوع المشكلة التي تظهر بسيارتك، وسأقوم بفتح التصنيف المناسب لك وتحديد أفضل الخيارات المتاحة لدى الكراجات.'
      : 'I am happy to assist! Please provide the part name or symptom, and I will navigate the category tree and show available parts directly.';
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
    }, 800);
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
          <span>خبير موجود أوتو الذكي</span>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '360px',
          height: '500px',
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
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>خبير ومستشار المبيعات</h4>
              <span style={{ fontSize: '11px', color: '#cbd5e0' }}>متصل الآن لمساعدتك بالمبيعات والتوافق</span>
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
                جاري التحليل واستدعاء الواجهة...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={isRtl ? 'اكتب اسم القطعة أو العطل...' : 'Type part name or symptom...'}
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
