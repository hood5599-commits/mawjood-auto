// قاموس RockAuto الموسع للترجمة والكلمات المرادفة (English - Arabic - Slang)
export const PARTS_DICTIONARY: Record<string, { category: string; synonyms: string[] }> = {
  // === 1. ELECTRICAL (الكهرباء) ===
  "Alternator / Generator": {
    category: "Electrical",
    synonyms: ["دينمو", "مولد كهرباء", "دينمو كهرباء", "alternator", "generator", "dynamo"]
  },
  "Starter / Starter Motor": {
    category: "Electrical",
    synonyms: ["سلف", "مارش", "موتور سلف", "starter", "starter motor"]
  },
  "Engine Control Module (ECM Computer)": {
    category: "Electrical",
    synonyms: ["كمبيوتر ماكينة", "كمبيوتر المحرك", "ecm", "ecu", "engine computer", "pcm"]
  },
  "Body Control Module (BCM)": {
    category: "Electrical",
    synonyms: ["كمبيوتر السيارة", "كمبيوتر البدي", "bcm", "body control module"]
  },
  "Battery Cable / Terminal": {
    category: "Electrical",
    synonyms: ["كابل بطارية", "أصابع بطارية", "إصبع بطارية", "battery cable", "battery terminal"]
  },
  "Fuse / Fuse Block": {
    category: "Electrical",
    synonyms: ["فيوز", "علبة فيوزات", "فيوزات", "fuse", "fuse box", "fuse block"]
  },
  "Horn": {
    category: "Electrical",
    synonyms: ["بوري", "هرن", "بوق", "horn"]
  },
  "Keyless Entry Module / Receiver": {
    category: "Electrical",
    synonyms: ["ريموت", "كمبيوتر ريموت", "وحدة بصمة", "keyless entry", "remote module"]
  },
  "HID Lighting Ballast / Bulb": {
    category: "Electrical-Bulb & Socket",
    synonyms: ["محول زنون", "شمعة زنون", "لمبة زنون", "ballast", "xenon"]
  },

  // === 2. ENGINE (المحرك / الماكينة) ===
  "Engine Long Block / Assembly": {
    category: "Engine",
    synonyms: ["ماكينة", "محرك", "ماكينه كاملة", "engine", "motor"]
  },
  "Oil Pan / Crankcase": {
    category: "Engine",
    synonyms: ["كرتير", "كرتير زيت", "كارتير", "oil pan", "sump"]
  },
  "Oil Pump": {
    category: "Engine",
    synonyms: ["طلمبة زيت", "مضخة زيت", "طرمبة زيت", "oil pump"]
  },
  "Timing Chain / Timing Belt": {
    category: "Engine",
    synonyms: ["جنزير ماكينة", "سير جنزير", "سير التايمنج", "timing chain", "timing belt"]
  },
  "Engine Mount": {
    category: "Engine",
    synonyms: ["كرسي ماكينة", "كراسي محرك", "كرسي محرك", "engine mount", "motor mount"]
  },
  "Gasket Set / Head Gasket": {
    category: "Engine",
    synonyms: ["وجه ماكينة", "وجيه", "كاسكيت", "وجه رأس الماكينة", "head gasket"]
  },

  // === 3. BRAKE & WHEEL HUB (الفرامل ومحاور العجلات) ===
  "Brake Pad": {
    category: "Brake & Wheel Hub",
    synonyms: ["فحمات", "قماشات", "فحمات فرامل", "قماشات فرامل", "brake pads", "brake shoes"]
  },
  "Brake Rotor / Disc": {
    category: "Brake & Wheel Hub",
    synonyms: ["هوبات", "هوب", "ديسك فرامل", "دسك", "brake rotor", "brake disc"]
  },
  "Wheel Hub & Bearing Assembly": {
    category: "Brake & Wheel Hub",
    synonyms: ["رمان بلي", "فلنجة", "فلنجه", "رمان عجلة", "wheel hub", "bearing"]
  },
  "ABS Control Module / Sensor": {
    category: "Brake & Wheel Hub",
    synonyms: ["حساس abs", "كمبيوتر فرامل", "جهاز اي بي اس", "abs sensor", "abs module"]
  },

  // === 4. COOLING SYSTEM (نظام التبريد) ===
  "Radiator": {
    category: "Cooling System",
    synonyms: ["راديتر", "رادياتير", "رديتر", "radiator"]
  },
  "Water Pump": {
    category: "Cooling System",
    synonyms: ["طلمبة ماء", "مضخة ماء", "طرمبة ماء", "water pump"]
  },
  "Thermostat": {
    category: "Cooling System",
    synonyms: ["بلف حرارة", "ثرموستات", "ترموستات", "thermostat"]
  },
  "Radiator Cooling Fan Assembly": {
    category: "Cooling System",
    synonyms: ["مروحة راديتر", "مروحة الرديتر", "مروحة تبريد", "cooling fan"]
  },

  // === 5. HEAT & AIR CONDITIONING (التكييف والتدفئة) ===
  "A/C Compressor": {
    category: "Heat & Air Conditioning",
    synonyms: ["كمبروسر", "كمبريسر", "ضاغط مكيف", "ac compressor"]
  },
  "A/C Condenser": {
    category: "Heat & Air Conditioning",
    synonyms: ["راديتر مكيف", "كثاف مكيف", "كوندنسر", "ac condenser"]
  },
  "A/C Evaporator Core": {
    category: "Heat & Air Conditioning",
    synonyms: ["ثلاجة مكيف", "ثلاجة التكييف", "ac evaporator"]
  },

  // === 6. TRANSMISSION (ناقل الحركة / الجيربكس) ===
  "Automatic Transmission": {
    category: "Transmission-Automatic",
    synonyms: ["جيربكس", "قير", "ناقل حركة", "قير اوتوماتيك", "transmission", "gearbox"]
  },
  "Transmission Mount": {
    category: "Transmission-Automatic",
    synonyms: ["كرسي قير", "كرسي جيربكس", "transmission mount"]
  },

  // === 7. SUSPENSION & STEERING (التعليق والتوجيه) ===
  "Shock Absorber / Strut": {
    category: "Suspension",
    synonyms: ["مساعدات", "مساعد", "مساعد أمامي", "مساعد خلفي", "shock absorber", "strut"]
  },
  "Control Arm / Ball Joint": {
    category: "Suspension",
    synonyms: ["مقصات", "مقص", "ركبة", "جلبة مقص", "control arm", "ball joint"]
  },
  "Steering Rack & Pinion": {
    category: "Steering",
    synonyms: ["دودة دركسون", "دودة دركسيون", "مجمع عجلة القيادة", "steering rack"]
  },
  "Power Steering Pump": {
    category: "Steering",
    synonyms: ["طلمبة باور", "طرمبة دركسون", "مضخة باور", "power steering pump"]
  }
};

// دالة لمعرفة القسم الرئيسي تلقائياً من اسم القطعة
export const getPartCategory = (partName: string): string => {
  if (!partName) return "Engine";
  
  const lowerName = partName.toLowerCase().trim();

  for (const [key, data] of Object.entries(PARTS_DICTIONARY)) {
    if (lowerName.includes(key.toLowerCase())) return data.category;
    if (data.synonyms.some(syn => lowerName.includes(syn.toLowerCase()))) {
      return data.category;
    }
  }

  // تصنيف احتياطي عند عدم المطابقة المباشرة
  if (lowerName.includes("شمعة") || lowerName.includes("إسطب") || lowerName.includes("ضوء") || lowerName.includes("lamp")) return "Body & Lamp Assembly";
  if (lowerName.includes("باب") || lowerName.includes("كابوت") || lowerName.includes("صدام") || lowerName.includes("hood") || lowerName.includes("door")) return "Body & Lamp Assembly";
  if (lowerName.includes("سير") || lowerName.includes("بكرة") || lowerName.includes("belt")) return "Belt Drive";
  if (lowerName.includes("بنزين") || lowerName.includes("بخاخ") || lowerName.includes("fuel") || lowerName.includes("injector")) return "Fuel & Air";
  if (lowerName.includes("بواجي") || lowerName.includes("كويل") || lowerName.includes("spark") || lowerName.includes("ignition")) return "Ignition";

  return "Engine";
};

// دالة فحص مطابقة البحث الذكية (تتحقق من الاسم، القسم، الاختصارات، والكلمات المرادفة)
export const matchesSmartSearch = (part: any, searchQuery: string): boolean => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase().trim();

  const name = (part.name || '').toLowerCase();
  const partNo = (part.part_number || part.code || part.sku || '').toLowerCase();
  const make = (part.make || '').toLowerCase();
  const model = (part.model || '').toLowerCase();
  const year = String(part.year || '').toLowerCase();

  // 1. مطابقة مباشرة لاسم القطعة أو الرقم أو الماركة
  if (name.includes(q) || partNo.includes(q) || make.includes(q) || model.includes(q) || year.includes(q)) {
    return true;
  }

  // 2. البحث داخل القاموس الموسع للكلمات المرادفة (Synonyms)
  for (const [key, data] of Object.entries(PARTS_DICTIONARY)) {
    const isQueryInDict = key.toLowerCase().includes(q) || data.synonyms.some(s => s.toLowerCase().includes(q));
    
    if (isQueryInDict) {
      // إذا كانت القطعة تطابق هذا المصطلح
      const isPartMatchingDict = name.includes(key.toLowerCase()) || data.synonyms.some(s => name.includes(s.toLowerCase()));
      if (isPartMatchingDict) return true;
    }
  }

  return false;
};
