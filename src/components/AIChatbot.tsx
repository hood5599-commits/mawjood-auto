import React, { useState, useEffect, useRef } from 'react';

// 🚗 استيراد بيانات السيارات المركزية كخيار موحد
import { CAR_DATA as DEFAULT_CAR_DATA } from '../data/carData';

interface AIChatbotProps {
  lang: 'ar' | 'en';
  carData?: any;
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

// القاموس الذكي للربط اللفظي والأعراض الميكانيكية
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
  const activeCarData = carData || DEFAULT_CAR_DATA;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRtl = lang === 'ar';

  const QUICK_SUGGESTIONS = isRtl
    ? ['كيف اطلب؟', 'مدة التوصيل', 'طرق الدفع', 'قطعة غير متوفرة']
    : ['How to order?', 'Delivery time', 'Payment methods', 'Part not found'];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: isRtl ? 'أهلاً! أنا عبود مساعدك في موجود أوتو. وش القطعة أو السيارة اللي تدور عليها؟' : 'Hi! I am Abboud, your Mawjood Auto assistant. What part or car are you looking for?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang, isRtl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const processSmartAgentResponse = (userText: string) => {
    const lowerText = userText.toLowerCase();

    // 1. الذكاء الخارق: أسئلة خدمة العملاء (FAQs & Intents)
    if (/(كيف اطلب|شلون اطلب|طريقة الطلب|شلون اشتري|كيف اشتري)/.test(lowerText)) {
      return isRtl 
        ? 'الطلب جداً سهل! ابحث عن قطعتك هنا أو في القائمة الجانبية، اضغط على "إضافة للسلة" أو "شراء مباشر"، وكمل بيانات الدفع والتوصيل وبنوصلها لك بأسرع وقت.' 
        : 'Ordering is easy! Search for your part, add it to cart, fill in your details, and we will deliver it ASAP.';
    }

    if (/(توصيل|شحن|متى توصل|كم ياخذ وقت|التوصيل)/.test(lowerText)) {
      return isRtl 
        ? 'التوصيل عندنا سريع ما يطول! ياخذ عادة من ساعتين إلى 24 ساعة كحد أقصى للطلبات داخل قطر.' 
        : 'Delivery is fast! It usually takes 2 to 24 hours maximum within Qatar.';
    }

    if (/(دفع|فلوس|ادفع|طرق الدفع|كاش|ابل باي|بطاقة)/.test(lowerText)) {
      return isRtl 
        ? 'نوفر لك كل طرق الدفع اللي تريحك: الدفع عند الاستلام (كاش)، بطاقات الائتمان، و Apple Pay / Google Pay.' 
        : 'We offer multiple payment methods: Cash on Delivery (COD), Credit/Debit Cards, and Apple/Google Pay.';
    }

    if (/(غير متوفرة|مو موجودة|مش موجودة|ما لقيتها|مالقيت)/.test(lowerText)) {
      return isRtl 
        ? 'ولا تشيل هم! اضغط على زر "طلب قطعة غير متوفرة" الموجود في أعلى الموقع، عطنا تفاصيلها واحنا بنبحث لك عنها في كل الكراجات ونوفرها لك بأفضل سعر.' 
        : 'No worries! Click the "Request Custom Part" button at the top, provide the details, and we will find it for you.';
    }

    if (/(شكرا|تم|خلاص|يعطيك العافية|cancel|thanks|close)/.test(lowerText)) {
      onCloseFilters();
      return isRtl ? 'حياك الله بأي وقت! تم إعادة ضبط الفلاتر لتتصفح براحتك.' : 'Happy to help! Search filters cleared.';
    }

    // 2. الذكاء الخارق: استخراج الشركة، الموديل، السنة من الجملة مباشرة
    let extractedMake = '';
    let extractedModel = '';
    let extractedYear = '';

    const yearMatch = lowerText.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) extractedYear = yearMatch[1];

    for (const [makeKey, data] of Object.entries(activeCarData as Record<string, any>)) {
      const makeAr = data?.ar || makeKey;
      const makeEn = data?.en || '';
      
      if (lowerText.includes(makeKey.toLowerCase()) || lowerText.includes(makeAr.toLowerCase()) || (makeEn && lowerText.includes(makeEn.toLowerCase()))) {
        extractedMake = makeKey;
      }
      
      const modelsList = data?.models || [];
      for (const model of modelsList) {
        if (lowerText.includes(String(model).toLowerCase())) {
          extractedModel = model;
          extractedMake = makeKey;
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

    // 4. تنفيذ أوامر الفلترة في الخلفية إذا وجدنا معطيات
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
        ? `أبشر! قمت بفلترة النتائج لـ (${partsFound})، تفقد الشاشة خلفي الآن.`
        : `Done! Results for (${partsFound}) are applied to the screen behind me.`;
    }

    // الرد النهائي في حال لم يفهم شيئاً
    return isRtl
      ? 'ما فهمت عليك زين، تقدر تسألني عن طريقة الطلب، أو تعطيني اسم القطعة وموديل سيارتك عشان أبحث لك.'
      : 'I didn\'t quite catch that. You can ask me how to order, or give me a part name and your car model to search.';
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

  const handleQuickSuggestion = (text: string) => {
    if (isTyping) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(() => {
      const responseText = processSmartAgentResponse(text);
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
    <div style={{ position: 'fixed', bottom: '24px', left: isRtl ? '24px' : 'auto', right: isRtl ? 'auto' : '24px', zIndex: 1500, fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>

      <style>{`
        @keyframes mwBotFadeIn {
          from { opacity: 0; transform: translateY(14px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mwBotPulse {
          0% { box-shadow: 0 0 0 0 rgba(224,135,42,0.55); }
          70% { box-shadow: 0 0 0 12px rgba(224,135,42,0); }
          100% { box-shadow: 0 0 0 0 rgba(224,135,42,0); }
        }
        @keyframes mwBotBounceIn {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          60% { opacity: 1; transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mwDotBlink {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes mwOnlineDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
          50% { box-shadow: 0 0 0 4px rgba(74,222,128,0); }
        }
        .mw-bot-trigger { animation: mwBotFadeIn 0.5s cubic-bezier(0.22,1,0.36,1), mwBotPulse 2.6s ease-out 1s infinite; transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .mw-bot-trigger:hover { transform: translateY(-3px) scale(1.03); filter: brightness(1.05); }
        .mw-bot-trigger:active { transform: translateY(0) scale(0.98); }

        .mw-bot-window { animation: mwBotBounceIn 0.4s cubic-bezier(0.22,1,0.36,1); }
        .mw-bot-close { transition: background-color 0.2s ease, transform 0.15s ease; }
        .mw-bot-close:hover { background-color: rgba(255,255,255,0.18); transform: rotate(90deg); }

        .mw-bot-bubble { animation: mwBotFadeIn 0.28s ease; }
        .mw-bot-typing-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; margin: 0 1.5px; animation: mwDotBlink 1.3s infinite ease-in-out; }

        .mw-bot-pill { transition: background-color 0.18s ease, color 0.18s ease, transform 0.15s ease, border-color 0.18s ease; white-space: nowrap; }
        .mw-bot-pill:hover { background-color: #1f3a5f; color: #ffffff; border-color: #1f3a5f; transform: translateY(-1px); }
        .mw-bot-pill:active { transform: translateY(0) scale(0.97); }

        .mw-bot-input:focus { border-color: #1f3a5f !important; box-shadow: 0 0 0 3px rgba(31,58,95,0.10); }

        .mw-bot-send { transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease; }
        .mw-bot-send:hover { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 6px 14px -4px rgba(224,135,42,0.45); }
        .mw-bot-send:active { transform: translateY(0) scale(0.96); }

        .mw-bot-scroll::-webkit-scrollbar { width: 5px; }
        .mw-bot-scroll::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

        @media (max-width: 480px) {
          .mw-bot-window { width: 92vw !important; height: 72vh !important; }
        }
      `}</style>
      
      {!isOpen && (
        <button
          className="mw-bot-trigger"
          onClick={() => setIsOpen(true)}
          style={{
            padding: '13px 22px 13px 16px',
            background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 10px 26px -6px rgba(31,58,95,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0872a, #f0a94e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              flexShrink: 0
            }}
          >
            🤖
          </span>
          <span>{isRtl ? 'عبود مساعد موجود' : 'Abboud · Assistant'}</span>
        </button>
      )}

      {isOpen && (
        <div className="mw-bot-window" style={{
          width: '350px',
          height: '480px',
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '22px',
          boxShadow: '0 25px 60px -12px rgba(15,23,42,0.35), 0 4px 12px rgba(15,23,42,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(226,232,240,0.7)',
          direction: isRtl ? 'rtl' : 'ltr'
        }}>
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #24466f 0%, #1f3a5f 100%)',
            padding: '14px 16px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0872a, #f0a94e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  border: '2px solid rgba(255,255,255,0.25)'
                }}>
                  🤖
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  [isRtl ? 'left' : 'right']: '-1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  border: '2px solid #1f3a5f',
                  animation: 'mwOnlineDot 2s infinite'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, letterSpacing: '-0.1px' }}>
                  {isRtl ? 'عبود - المستشار الذكي' : 'Abboud · AI Advisor'}
                </h4>
                <span style={{ fontSize: '11px', color: '#cfe0f5', fontWeight: 500 }}>
                  {isRtl ? '● متصل الآن لخدمتك' : '● Online now'}
                </span>
              </div>
            </div>
            <button
              className="mw-bot-close"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={isRtl ? 'تصغير' : 'Minimize'}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="mw-bot-scroll" style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#f6f8fb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className="mw-bot-bubble"
                style={{
                  display: 'flex',
                  flexDirection: isRtl
                    ? (msg.sender === 'user' ? 'row' : 'row-reverse')
                    : (msg.sender === 'user' ? 'row-reverse' : 'row'),
                  alignItems: 'flex-end',
                  gap: '6px',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%'
                }}
              >
                {msg.sender === 'assistant' && (
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0872a, #f0a94e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    flexShrink: 0,
                    marginBottom: '2px'
                  }}>
                    🤖
                  </div>
                )}
                <div
                  style={{
                    backgroundColor: msg.sender === 'user' ? '#1f3a5f' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                    padding: '11px 14px',
                    borderRadius: msg.sender === 'user'
                      ? (isRtl ? '14px 14px 14px 3px' : '14px 14px 3px 14px')
                      : (isRtl ? '14px 14px 3px 14px' : '14px 14px 14px 3px'),
                    boxShadow: msg.sender === 'user' ? '0 4px 12px -2px rgba(31,58,95,0.35)' : '0 2px 8px rgba(15,23,42,0.06)',
                    border: msg.sender === 'assistant' ? '1px solid #eef1f5' : 'none',
                    fontSize: '13px',
                    lineHeight: '1.55'
                  }}
                >
                  <div>{msg.text}</div>
                  <span style={{
                    fontSize: '9.5px',
                    opacity: msg.sender === 'user' ? 0.75 : 0.5,
                    marginTop: '4px',
                    display: 'block',
                    textAlign: isRtl ? 'left' : 'right'
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0872a, #f0a94e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  🤖
                </div>
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef1f5',
                  padding: '11px 14px',
                  borderRadius: isRtl ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.06)'
                }}>
                  <span className="mw-bot-typing-dot" style={{ animationDelay: '0s' }} />
                  <span className="mw-bot-typing-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="mw-bot-typing-dot" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestion pills */}
          <div style={{
            display: 'flex',
            gap: '7px',
            padding: '10px 12px',
            overflowX: 'auto',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0
          }}>
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                className="mw-bot-pill"
                onClick={() => handleQuickSuggestion(s)}
                disabled={isTyping}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #dbe2ea',
                  backgroundColor: '#f4f6f9',
                  color: '#1f3a5f',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: isTyping ? 'default' : 'pointer',
                  opacity: isTyping ? 0.5 : 1,
                  flexShrink: 0
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input area */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={isRtl ? 'اسألني أو ابحث عن قطعة...' : 'Ask or search for a part...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="mw-bot-input"
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                backgroundColor: '#f8fafc'
              }}
            />
            <button
              type="submit"
              className="mw-bot-send"
              disabled={!input.trim()}
              style={{
                padding: '11px 18px',
                background: 'linear-gradient(135deg, #e0872a, #ea9a44)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: input.trim() ? 'pointer' : 'default',
                fontSize: '13px',
                opacity: input.trim() ? 1 : 0.6,
                boxShadow: '0 4px 12px -3px rgba(224,135,42,0.4)',
                flexShrink: 0
              }}
            >
              {isRtl ? 'إرسال' : 'Send'}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default AIChatbot;
