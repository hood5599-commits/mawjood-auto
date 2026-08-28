import React, { useState, useEffect, useRef } from 'react';
import { CAR_DATA as DEFAULT_CAR_DATA } from '../data/carData';

export interface AIChatbotProps {
  lang: 'ar' | 'en';
  carData?: Record<string, { ar?: string; en?: string; models?: string[] }>;
  categoryTree: Record<string, string[]>;
  onApplyFilters: (filters: {
    query?: string;
    make?: string;
    model?: string;
    year?: string;
    mainCategory?: string;
    subCategory?: string;
  }) => void;
  onCloseFilters: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  appliedFilter?: {
    summary: string;
    make?: string;
    model?: string;
    part?: string;
  };
}

/* ============================================================
   BESPOKE LUXURY ICONS (Stroke 1.75px — Zero Emojis)
   ============================================================ */

const IconRobot: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="4" y="8" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="1.75" />
    <path d="M12 4V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="3" r="1.2" fill="currentColor" />
    <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    <circle cx="15" cy="13" r="1.5" fill="currentColor" />
    <path d="M9.5 17H14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M2 13H4M20 13H22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconSend: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21.5 2.5L10 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.5 2.5L14.5 21.5L10 14L2.5 9.5L21.5 2.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
  </svg>
);

const IconClose: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTrash: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3 6H21M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconFilterCheck: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 9L17.5 11.5L21.5 7.5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevron: React.FC<{ isRtl: boolean }> = ({ isRtl }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}>
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ============================================================
   SMART AUTOMOTIVE & SYMPTOM DIALECT KNOWLEDGE BASE
   ============================================================ */

const SYMPTOM_AND_DIALECT_MAP: Record<string, { main: string; sub: string; query: string; tipAr: string; tipEn: string }> = {
  'حرارة': { main: 'Cooling System', sub: 'Radiator Fan Assembly', query: 'Fan', tipAr: 'ارتفاع الحرارة غالباً يرتبط بمروحة التبريد أو الرديتر أو الثرموستات.', tipEn: 'Overheating is usually caused by radiator fan or coolant leak.' },
  'مروحة': { main: 'Cooling System', sub: 'Radiator Fan Assembly', query: 'Fan', tipAr: 'مروحة التبريد ومجموعتها الكهربائية.', tipEn: 'Radiator cooling fan assembly.' },
  'مروحه': { main: 'Cooling System', sub: 'Radiator Fan Assembly', query: 'Fan', tipAr: 'مروحة التبريد ومجموعتها الكهربائية.', tipEn: 'Radiator cooling fan assembly.' },
  'رديتر': { main: 'Cooling System', sub: 'Radiator', query: 'Radiator', tipAr: 'رديتر ماء تبريد أصلي بالكرتون.', tipEn: 'Engine cooling radiator.' },
  'لديتر': { main: 'Cooling System', sub: 'Radiator', query: 'Radiator', tipAr: 'رديتر ماء تبريد أصلي بالكرتون.', tipEn: 'Engine cooling radiator.' },
  'طرمبة ماي': { main: 'Cooling System', sub: 'Water Pump', query: 'Water Pump', tipAr: 'مضخة ماء تبريد المحرك (Water Pump).', tipEn: 'Engine water pump.' },
  'طرمبة ماء': { main: 'Cooling System', sub: 'Water Pump', query: 'Water Pump', tipAr: 'مضخة ماء تبريد المحرك (Water Pump).', tipEn: 'Engine water pump.' },
  'كمبروسر': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor', tipAr: 'كمبروسر مكيف جديد مع صمام التحكم والكلتش.', tipEn: 'Factory-sealed A/C Compressor.' },
  'كمبريسر': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor', tipAr: 'كمبروسر مكيف جديد مع صمام التحكم والكلتش.', tipEn: 'Factory-sealed A/C Compressor.' },
  'مكيف': { main: 'Heat & Air Conditioning', sub: 'A/C Compressor', query: 'Compressor', tipAr: 'نظام التكييف وقطع التبريد الداخلي.', tipEn: 'Air conditioning components.' },
  'فلتر مكيف': { main: 'Heat & Air Conditioning', sub: 'Cabin Air Filter', query: 'Cabin Filter', tipAr: 'فلتر هواء المقصورة الداخلي لتنقية هواء التكييف.', tipEn: 'Cabin A/C air filter.' },
  'سفايف': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad', tipAr: 'سفايف / فحمات فرامل سيراميك وشبه معدنية معتمدة.', tipEn: 'High-performance brake pads.' },
  'فحمات': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad', tipAr: 'فحمات فرامل أمامية وخلفية جديدة 100%.', tipEn: 'Front & Rear Brake pads.' },
  'قماشات': { main: 'Brake & Wheel Hub', sub: 'Brake Pad', query: 'Brake Pad', tipAr: 'أقمشة فرامل أصلية.', tipEn: 'Brake shoes / pads.' },
  'دسيين': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor', tipAr: 'ديسكات وهوبات فرامل مهواة عالية التحمل.', tipEn: 'Ventilated brake discs / rotors.' },
  'هوبات': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor', tipAr: 'هوبات فرامل أصلية بدون رجة.', tipEn: 'Brake rotors.' },
  'رجة مع البريك': { main: 'Brake & Wheel Hub', sub: 'Rotor', query: 'Rotor', tipAr: 'الرجة عند الضغط على الفرامل تدل على تلف أو اعوجاج الهوبات (Discs).', tipEn: 'Vibration under braking indicates warped brake rotors.' },
  'بيرنج': { main: 'Brake & Wheel Hub', sub: 'Wheel Bearing / Hub', query: 'Bearing', tipAr: 'بيرنج ويل / رولمان بلي وفلنجة العجل.', tipEn: 'Wheel bearing & hub assembly.' },
  'فلنجة': { main: 'Brake & Wheel Hub', sub: 'Wheel Bearing / Hub', query: 'Bearing', tipAr: 'فلنجة العجلات ومجموعة البيرنجات.', tipEn: 'Wheel hub bearing.' },
  'جامبينات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock', tipAr: 'جامبينات ومساعدات هيدروليك وغاز أصلية.', tipEn: 'OEM shock absorbers / struts.' },
  'مساعدات': { main: 'Suspension', sub: 'Shock / Strut', query: 'Shock', tipAr: 'مساعدات امتصاص الصدمات الأمامية والخلفية.', tipEn: 'Shock absorbers & struts.' },
  'شيال': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm', tipAr: 'شيالات ومقصات العفشة مع الجلب الكروية (Bushings).', tipEn: 'Suspension control arms.' },
  'مقصات': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm', tipAr: 'مقصات نظام التعليق العلوي والسفلي.', tipEn: 'Suspension control arms.' },
  'طقطقة بالمطبات': { main: 'Suspension', sub: 'Control Arm', query: 'Control Arm', tipAr: 'أصوات الطقطقة مع المطبات تشير غالباً للمقصات، مسامير التوازن، أو كراسي المساعدات.', tipEn: 'Clunking over bumps usually indicates worn control arms or sway bar links.' },
  'مسمار توازن': { main: 'Suspension', sub: 'Sway Bar Link', query: 'Sway Bar', tipAr: 'مسامير توازن عمود التثبيت (Sway Bar Links).', tipEn: 'Sway bar stabilizer links.' },
  'دينمو': { main: 'Electrical', sub: 'Alternator / Generator', query: 'Alternator', tipAr: 'دينمو تعبئة البطارية وتوليد الكهرباء (Alternator).', tipEn: 'Alternator charging unit.' },
  'سلف': { main: 'Electrical', sub: 'Starter Motor', query: 'Starter', tipAr: 'سلف تشغيل المحرك (Starter Motor) جديد بالكرتون.', tipEn: 'Engine starter motor.' },
  'بلاكات': { main: 'Ignition', sub: 'Spark Plug', query: 'Spark Plug', tipAr: 'بواجي / بلاكات إيريديوم وليزر لإشعال قوي وتوفير استهلاك الوقود.', tipEn: 'Iridium / Platinum spark plugs.' },
  'بواجي': { main: 'Ignition', sub: 'Spark Plug', query: 'Spark Plug', tipAr: 'بواجي إشعال أصلية وكالة.', tipEn: 'OEM spark plugs.' },
  'كويلات': { main: 'Ignition', sub: 'Ignition Coil', query: 'Ignition Coil', tipAr: 'كويلات إشعال كهربائية لمنع تقطيع المحرك (Misfire).', tipEn: 'Direct ignition coils.' },
  'كويل': { main: 'Ignition', sub: 'Ignition Coil', query: 'Ignition Coil', tipAr: 'كويل إشعال عالي الجهد.', tipEn: 'Ignition coil.' },
  'تقطيع بالمكينة': { main: 'Ignition', sub: 'Ignition Coil', query: 'Ignition Coil', tipAr: 'تقطيع وعطسة المحرك (Misfire) سببه بنسبة 85% تلف البواجي أو الكويلات.', tipEn: 'Engine misfiring is typically caused by worn spark plugs or faulty ignition coils.' },
  'فلتر بترول': { main: 'Fuel & Air', sub: 'Fuel Filter', query: 'Fuel Filter', tipAr: 'فلتر وقود وبنزين نقي لتغذية البخاخات.', tipEn: 'Fuel filter element.' },
  'فلتر هواء': { main: 'Fuel & Air', sub: 'Air Filter', query: 'Air Filter', tipAr: 'فلتر هواء المحرك لضمان نقاء سحب الهواء وسلاسة العزم.', tipEn: 'Engine air intake filter.' },
  'طرمبة بترول': { main: 'Fuel & Air', sub: 'Fuel Pump', query: 'Fuel Pump', tipAr: 'مضخة بنزين وفيول بمب كهربائي أصلي.', tipEn: 'Electric in-tank fuel pump.' },
  'سير مكينة': { main: 'Belt Drive', sub: 'Serpentine Belt', query: 'Belt', tipAr: 'سير مجموعة المحرك والدينمو ومشدات السيور.', tipEn: 'Engine serpentine drive belt.' },
  'كرسي مكينة': { main: 'Engine', sub: 'Motor Mount', query: 'Mount', tipAr: 'كراسي محرك وجير هيدروليكية لمنع الاهتزاز.', tipEn: 'Engine motor mounts.' },
  'اهتزاز بالسيارة': { main: 'Engine', sub: 'Motor Mount', query: 'Mount', tipAr: 'الاهتزاز والرجّة عند التوقف في وضعية D تدل بنسبة كبيرة على تلف كراسي المكينة.', tipEn: 'Vibration at idle/D gear points directly to collapsed motor mounts.' }
};

export const AIChatbot: React.FC<AIChatbotProps> = ({
  lang,
  carData,
  categoryTree,
  onApplyFilters,
  onCloseFilters
}) => {
  const activeCarData = carData || DEFAULT_CAR_DATA;
  const isRtl = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const QUICK_SUGGESTIONS = isRtl
    ? ['سفايف لكزس', 'حرارة الموتر', 'تقطيع بالمكينة', 'مدة التوصيل', 'ضمان القطع']
    : ['Lexus Brake Pads', 'Engine Overheating', 'Engine Misfire', 'Delivery Time', 'Warranty'];

  // Welcome Message Init
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: isRtl
            ? 'مرحباً بك! أنا عبود، مهندسك ومستشارك الذكي في موجود أوتو. كل القطع لدينا جديدة وأصلية 100% بالكرتون مع الضمان الذهبي.\n\nتقدر تكتب لي اسم القطعة، أو نوع سيارتك وموديلها، أو حتى العطل اللي يواجهك وبوجّهك فوراً!'
            : 'Welcome! I am Abboud, your AI advisor at Mawjood Auto. We provide strictly 100% Brand-New Genuine OEM & certified parts.\n\nTell me the part name, your car model, or the mechanical symptom you are experiencing!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang, isRtl, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus on Open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'assistant',
        text: isRtl
          ? 'تم مسح المحادثة. كيف أقدر أساعدك الآن في سيارتك؟'
          : 'Chat cleared. How can I assist you with your car today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const processSmartAgentResponse = (userText: string): { text: string; filterData?: Message['appliedFilter'] } => {
    const lowerText = userText.toLowerCase().trim();

    if (/(سكراب|مستعمل|تشليح|مستعمله|مستعملة|سكرابات|used|scrap)/.test(lowerText)) {
      return {
        text: isRtl
          ? 'في موجود أوتو قمنا بإلغاء السكراب والمستعمل نهائياً! جميع القطع المتوفرة لدينا جديدة 100% بالكرتون (وكالة وتجارية درجة أولى معتمدة) لضمان أعلى مستويات الأمان والاعتمادية لسيارتك.'
          : 'At Mawjood Auto, we have completely eliminated scrap and used parts. We exclusively provide 100% Factory-New Genuine OEM and certified tier-1 parts with full warranty.'
      };
    }

    if (/(توصيل|شحن|متى توصل|كم ياخذ|التوصيل|delivery|shipping)/.test(lowerText)) {
      return {
        text: isRtl
          ? 'توصيلنا فوري وفائق السرعة داخل دولة قطر: من ساعتين إلى 24 ساعة كحد أقصى مباشرة إلى باب منزلك أو الكراج.'
          : 'Hyper-fast fulfillment across all Qatar municipalities: within 2 to 24 hours directly to your doorstep or garage.'
      };
    }

    if (/(دفع|فلوس|ادفع|طرق الدفع|كاش|ابل باي|بطاقة|payment|pay)/.test(lowerText)) {
      return {
        text: isRtl
          ? 'نوفر لك خيارات دفع مرنة وآمنة: الدفع عند الاستلام (كاش)، بطاقات الائتمان والخصم المباشر، بالإضافة إلى Apple Pay و Google Pay.'
          : 'Flexible and secure payment options: Cash on Delivery (COD), Credit/Debit Cards, and Apple/Google Pay.'
      };
    }

    if (/(ضمان|مضمونة|مضمونه|warranty|guarantee)/.test(lowerText)) {
      return {
        text: isRtl
          ? 'نعم بكل تأكيد! نوفر الضمان الذهبي مع ميزة ضمان المطابقة والتوافق 100% مع رقم الشاصي (VIN) لسيارتك قبل استلام القطعة.'
          : 'Yes, 100%! We provide full manufacturer warranty backed by our 100% Vehicle Fitment Guarantee via VIN matching.'
      };
    }

    if (/(غير متوفرة|مو موجودة|مش موجودة|ما لقيتها|مالقيت|custom part)/.test(lowerText)) {
      return {
        text: isRtl
          ? 'إذا لم تجد القطعة في الكتالوج، اضغط على زر "طلب قطعة خاصة" في أعلى الهيدر، وسيقوم فريقنا بتوريدها لك من الوكلاء والمصانع مباشرة بأفضل سعر.'
          : 'If your part is not listed, click "Custom Request" in the top header, and our engineering desk will source it directly for you.'
      };
    }

    if (/(شكرا|تم|خلاص|يعطيك العافية|إلغاء الفلتر|cancel|thanks|clear filter)/.test(lowerText)) {
      onCloseFilters();
      return {
        text: isRtl
          ? 'العفو، بالخدمة دائماً! تم إلغاء الفلاتر وإعادة عرض كافة قطع المتجر لتتصفح براحتك.'
          : 'You are welcome! Filters have been reset to show the full catalog.'
      };
    }

    // Extract Make, Model, Year
    let extractedMake = '';
    let extractedModel = '';
    let extractedYear = '';

    const yearMatch = lowerText.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) extractedYear = yearMatch[1];

    if (activeCarData) {
      for (const [makeKey, data] of Object.entries(activeCarData)) {
        const makeAr = data?.ar || makeKey;
        const makeEn = data?.en || '';

        if (
          lowerText.includes(makeKey.toLowerCase()) ||
          lowerText.includes(makeAr.toLowerCase()) ||
          (makeEn && lowerText.includes(makeEn.toLowerCase()))
        ) {
          extractedMake = makeKey;
        }

        const modelsList = data?.models || [];
        for (const model of modelsList) {
          if (lowerText.includes(String(model).toLowerCase())) {
            extractedModel = String(model);
            extractedMake = makeKey;
            break;
          }
        }
      }
    }

    // Extract Category / Symptoms
    let matchedCategory: { main: string; sub: string; query: string; tipAr?: string; tipEn?: string } | null = null;

    for (const [key, val] of Object.entries(SYMPTOM_AND_DIALECT_MAP)) {
      if (lowerText.includes(key.toLowerCase())) {
        matchedCategory = val;
        break;
      }
    }

    if (!matchedCategory && categoryTree) {
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

    // Live Screen Filtering
    if (matchedCategory || extractedMake || extractedModel || extractedYear) {
      onApplyFilters({
        query: matchedCategory?.query || '',
        make: extractedMake,
        model: extractedModel,
        year: extractedYear,
        mainCategory: matchedCategory?.main,
        subCategory: matchedCategory?.sub
      });

      const partsFound = [extractedMake, extractedModel, extractedYear, matchedCategory?.sub || matchedCategory?.query]
        .filter(Boolean)
        .join(' · ');

      const diagnosisTip = isRtl ? matchedCategory?.tipAr : matchedCategory?.tipEn;

      return {
        text: isRtl
          ? `أبشر! قمت بتصفية المتجر وتجهيز القطع المتوافقة لـ (${partsFound}).\n\n${diagnosisTip ? `💡 إرشاد هندسي: ${diagnosisTip}` : 'تفقد شاشة الموقع خلفي الآن لمشاهدة القطع المتوفرة مع الأسعار.'}`
          : `Filters applied for (${partsFound}).\n\n${diagnosisTip ? `💡 Tech Tip: ${diagnosisTip}` : 'Explore the live results on the store screen behind me.'}`,
        filterData: {
          summary: partsFound,
          make: extractedMake,
          model: extractedModel,
          part: matchedCategory?.sub || matchedCategory?.query
        }
      };
    }

    // Fallback Guidance
    return {
      text: isRtl
        ? 'ما فهمت قصدك تماماً، تقدر تكتب لي اسم القطعة (مثل: سفايف، رديتر، بواجي) ونوع سيارتك وموديلها، أو تصف لي المشكلة اللي تواجهها وبساعدك فوراً!'
        : 'I didn\'t quite catch that. You can enter the part name (e.g., Brake Pads, Radiator, Spark Plugs) with your vehicle model, or describe your mechanical issue!'
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processSmartAgentResponse(query);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.text,
        appliedFilter: response.filterData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 550);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        [isRtl ? 'left' : 'right']: 0,
        zIndex: 1500,
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: isRtl ? "'Cairo', sans-serif" : "'Cairo', system-ui, sans-serif"
      }}
    >
      <style>{`
        @keyframes mwSideTabGleam {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 10px rgba(234,88,12,0.25); }
          50% { box-shadow: 0 6px 25px rgba(0,0,0,0.5), 0 0 20px rgba(234,88,12,0.55); }
        }
        @keyframes mwSlideFromEdge {
          0% { opacity: 0; transform: translateX(${isRtl ? '-100%' : '100%'}); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes mwRadarPing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes mwDotBlink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }

        .mw-side-docked-tab {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease;
        }
        .mw-side-docked-tab:hover {
          transform: translateX(${isRtl ? '4px' : '-4px'}) scale(1.02);
        }

        .mw-bot-panel {
          animation: mwSlideFromEdge 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mw-chip-tag {
          transition: all 0.2s ease;
        }
        .mw-chip-tag:hover {
          background: rgba(234,88,12,0.18) !important;
          border-color: rgba(234,88,12,0.5) !important;
          color: #fdba74 !important;
          transform: translateY(-1.5px);
        }

        .mw-scroll-box::-webkit-scrollbar { width: 4px; }
        .mw-scroll-box::-webkit-scrollbar-thumb { background: rgba(248,250,252,0.15); border-radius: 99px; }

        @media (max-width: 480px) {
          .mw-bot-panel {
            width: calc(100vw - 20px) !important;
            height: 75vh !important;
            margin: 0 10px;
          }
        }
      `}</style>

      {/* ============================================================
          1. DOCKED SIDE TAB (ملتصق تماماً بحافة الشاشة ولا يغطي المحتوى)
      ============================================================ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mw-side-docked-tab"
          title={isRtl ? 'فتح مساعد موجود أوتو' : 'Open Mawjood AI Assistant'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px 10px 12px',
            borderTopRightRadius: isRtl ? '16px' : '0px',
            borderBottomRightRadius: isRtl ? '16px' : '0px',
            borderTopLeftRadius: isRtl ? '0px' : '16px',
            borderBottomLeftRadius: isRtl ? '0px' : '16px',
            background: 'linear-gradient(135deg, #090D16 0%, #0F172A 100%)',
            color: '#F8FAFC',
            border: '1.5px solid rgba(234, 88, 12, 0.5)',
            borderLeft: isRtl ? 'none' : '1.5px solid rgba(234, 88, 12, 0.5)',
            borderRight: isRtl ? '1.5px solid rgba(234, 88, 12, 0.5)' : 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '12.5px',
            letterSpacing: isRtl ? '0px' : '0.3px',
            animation: 'mwSideTabGleam 4s ease-in-out infinite'
          }}
        >
          <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0, boxShadow: '0 0 10px rgba(234,88,12,0.6)' }}>
            <IconRobot size={15} />
            <span style={{ position: 'absolute', top: '-1px', [isRtl ? 'left' : 'right']: '-1px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #090D16' }} />
          </div>

          <span style={{ color: '#F8FAFC', whiteSpace: 'nowrap' }}>
            {isRtl ? 'عبود مساعد موجود' : 'Abboud AI'}
          </span>

          <span style={{ color: '#EA580C', display: 'flex', alignItems: 'center' }}>
            <IconChevron isRtl={isRtl} />
          </span>
        </button>
      )}

      {/* ============================================================
          2. EXPANDED LUXURY CHAT DECK (منزلق من جانب الصفحة)
      ============================================================ */}
      {isOpen && (
        <div
          className="mw-bot-panel"
          style={{
            margin: isRtl ? '0 0 0 16px' : '0 16px 0 0',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: '82vh',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1.5px solid rgba(226, 232, 240, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 30px 80px -15px rgba(0,0,0,0.85), 0 0 25px rgba(234,88,12,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'rgba(9, 13, 22, 0.8)',
              borderBottom: '1px solid rgba(226, 232, 240, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 0 14px rgba(234,88,12,0.45)' }}>
                <IconRobot size={20} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '12px', border: '1px solid #22c55e', animation: 'mwRadarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              </div>

              <div>
                <strong style={{ color: '#F8FAFC', fontSize: '14px', display: 'block', fontWeight: 800 }}>
                  {isRtl ? 'عبود · المستشار الذكي' : 'Abboud · Smart Advisor'}
                </strong>
                <span style={{ fontSize: '11px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                  {isRtl ? 'قطع جديدة 100% · فحص فوري' : '100% Brand-New · Online'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={clearChat}
                title={isRtl ? 'مسح المحادثة' : 'Clear Chat'}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(248,250,252,0.65)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconTrash size={13} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title={isRtl ? 'إخفاء إلى جانب الشاشة' : 'Hide to side'}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconClose size={13} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="mw-scroll-box"
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isRtl ? (msg.sender === 'user' ? 'row' : 'row-reverse') : (msg.sender === 'user' ? 'row-reverse' : 'row'),
                  alignItems: 'flex-end',
                  gap: '8px',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%'
                }}
              >
                {msg.sender === 'assistant' && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0, marginBottom: '2px' }}>
                    <IconRobot size={13} />
                  </div>
                )}

                <div
                  style={{
                    backgroundColor: msg.sender === 'user' ? '#EA580C' : 'rgba(30, 41, 59, 0.75)',
                    color: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: msg.sender === 'user'
                      ? (isRtl ? '16px 16px 4px 16px' : '16px 16px 16px 4px')
                      : (isRtl ? '16px 16px 16px 4px' : '16px 16px 4px 16px'),
                    border: msg.sender === 'assistant' ? '1px solid rgba(226,232,240,0.12)' : 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    fontSize: '12.8px',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <div>{msg.text}</div>

                  {msg.appliedFilter && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(74, 222, 128, 0.35)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#86EFAC'
                      }}
                    >
                      <IconFilterCheck size={14} />
                      <span>{msg.appliedFilter.summary}</span>
                    </div>
                  )}

                  <span style={{ fontSize: '9.5px', opacity: 0.6, marginTop: '5px', display: 'block', textAlign: isRtl ? 'left' : 'right' }}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <IconRobot size={13} />
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(30, 41, 59, 0.75)', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.12)', display: 'flex', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#EA580C', animation: 'mwDotBlink 1.2s infinite ease-in-out 0s' }} />
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#EA580C', animation: 'mwDotBlink 1.2s infinite ease-in-out 0.2s' }} />
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#EA580C', animation: 'mwDotBlink 1.2s infinite ease-in-out 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 12px',
              overflowX: 'auto',
              backgroundColor: 'rgba(9, 13, 22, 0.65)',
              borderTop: '1px solid rgba(226, 232, 240, 0.08)',
              flexShrink: 0
            }}
          >
            {QUICK_SUGGESTIONS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                className="mw-chip-tag"
                onClick={() => handleSendMessage(tag)}
                disabled={isTyping}
                style={{
                  padding: '5px 11px',
                  borderRadius: '999px',
                  border: '1px solid rgba(248, 250, 252, 0.12)',
                  backgroundColor: 'rgba(248, 250, 252, 0.04)',
                  color: '#CBD5E1',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isTyping ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '12px',
              backgroundColor: 'rgba(9, 13, 22, 0.95)',
              borderTop: '1px solid rgba(226, 232, 240, 0.1)',
              display: 'flex',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={isRtl ? 'اسألني عن قطعة، سيارة، أو عطل ميكانيكي...' : 'Ask about a part, car, or mechanical issue...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid rgba(226, 232, 240, 0.15)',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#F8FAFC',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                padding: '10px 16px',
                background: input.trim() ? 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' : 'rgba(255,255,255,0.08)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: input.trim() ? 'pointer' : 'default',
                opacity: input.trim() ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: input.trim() ? '0 4px 14px rgba(234,88,12,0.45)' : 'none',
                flexShrink: 0
              }}
            >
              <IconSend size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
