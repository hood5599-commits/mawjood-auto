// القاموس الذكي الشامل لقطع الغيار (RockAuto Taxonomy & Arabic Slang Dictionary)
export interface PartDictItem {
  category: string;
  arabicName: string;
  synonyms: string[];
}

export const PARTS_DICTIONARY: Record<string, PartDictItem> = {
  // ==========================================
  // 1. BELT DRIVE (السيور والبكرات)
  // ==========================================
  "Belt": {
    category: "Belt Drive",
    arabicName: "سير الماكينة / السير الخارجى",
    synonyms: ["سير", "سير مكينة", "سير الماكينة", "سير دينمو", "سير التكييف", "serpentine belt", "v-belt", "drive belt"]
  },
  "Belt Removal / Installation Tool": {
    category: "Belt Drive",
    arabicName: "أداة تركيب وفك السيور",
    synonyms: ["زرادية سير", "مفتاح سير", "مفك سيور", "belt tool"]
  },
  "Belt Tensioner": {
    category: "Belt Drive",
    arabicName: "شداد السير",
    synonyms: ["شداد", "شداد سير", "شداد سير الماكينة", "بكرة شداد", "belt tensioner"]
  },
  "Belt Tensioner Bracket": {
    category: "Belt Drive",
    arabicName: "قاعدة شداد السير",
    synonyms: ["قاعدة شداد", "قاعدة شداد سير", "tensioner bracket"]
  },
  "Idler Pulley": {
    category: "Belt Drive",
    arabicName: "بكرة سير ثابتة",
    synonyms: ["بكرة", "بكرة سير", "بكره", "بكرة ثابته", "idler pulley"]
  },

  // ==========================================
  // 2. BODY & LAMP ASSEMBLY (الهيكل والإضاءة)
  // ==========================================
  "Headlamp Assembly": {
    category: "Body & Lamp Assembly",
    arabicName: "شمعة إضاءة أمامية / كشاف أمامي",
    synonyms: ["شمعة", "شمعات", "اسطب امامي", "إسطب أمامي", "نور أمامي", "أنوار أمامية", "headlight", "headlamp"]
  },
  "Tail Lamp Assembly": {
    category: "Body & Lamp Assembly",
    arabicName: "إسطب خلفي",
    synonyms: ["اسطب خلفي", "إسطب خلفي", "نور خلفي", "أنوار خلفية", "اصطب خلفي", "taillight", "tail light"]
  },
  "Fog / Driving Lamp Assembly": {
    category: "Body & Lamp Assembly",
    arabicName: "كشاف ضباب / كشافات كشافات مهاب",
    synonyms: ["كشافات", "كشاف ضباب", "كشافات مهاب", "كشاف مهاب", "fog light", "fog lamp"]
  },
  "High Mount Brake Light": {
    category: "Body & Lamp Assembly",
    arabicName: "لمبة فرامل علوية",
    synonyms: ["اسطب فرامل ثالث", "لمبة فرامل شنطة", "third brake light"]
  },
  "Bumper / Bumper Cover": {
    category: "Body & Lamp Assembly",
    arabicName: "صدام أمامي / خلفي",
    synonyms: ["صدام", "صدام أمامي", "صدام خلفي", "دعامية", "غلاف صدام", "bumper", "bumper cover"]
  },
  "Bumper Bracket / Support": {
    category: "Body & Lamp Assembly",
    arabicName: "قواعد وقسامات الصدام",
    synonyms: ["قاعدة صدام", "حامل صدام", "جسر صدام", "bumper bracket"]
  },
  "Fender / Inner Fender": {
    category: "Body & Lamp Assembly",
    arabicName: "رفرف / بطانة رفرف",
    synonyms: ["رفرف", "بطانة رفرف", "رفرف أمامي", "رفرف خلفي", "fender", "inner fender"]
  },
  "Hood": {
    category: "Body & Lamp Assembly",
    arabicName: "كبوت / غطاء المحرك",
    synonyms: ["كبوت", "كابوت", "غطاء محرك", "hood"]
  },
  "Grille / Grille Guard": {
    category: "Body & Lamp Assembly",
    arabicName: "شبك أمامي",
    synonyms: ["شبك", "شبك أمامي", "شبك نيكل", "grille"]
  },
  "Outside Mirror & Glass Assembly": {
    category: "Body & Lamp Assembly",
    arabicName: "مرآة جانبية خارجية",
    synonyms: ["مراية", "مرايه", "مرايا جانبية", "مرآة جانبية", "زجاج مراية", "side mirror"]
  },
  "Outside Door Handle": {
    category: "Body & Lamp Assembly",
    arabicName: "مقبض باب خارجي",
    synonyms: ["مسكة باب", "مقبض باب", "يد باب", "door handle"]
  },
  "Tailgate / Trunk": {
    category: "Body & Lamp Assembly",
    arabicName: "باب الشنطة / باب الصندوق الخلفي",
    synonyms: ["شنطة", "باب شنطة", "باب حوض", "باب خلفي", "tailgate", "trunk lid"]
  },
  "Door Lock Actuator / Latch": {
    category: "Body & Lamp Assembly",
    arabicName: "قفل باب / سنتر لوك",
    synonyms: ["قفل باب", "سنترلوك", "سنتلوك", "قفل أبواب", "door actuator", "door latch"]
  },
  "Weatherstrip / Door Seal": {
    category: "Body & Lamp Assembly",
    arabicName: "رباط زجاج / جلد أبواب",
    synonyms: ["جلد أبواب", "رباط زجاج", "جلد زجاج", "رباط أبواب", "weatherstrip", "door seal"]
  },

  // ==========================================
  // 3. BRAKE & WHEEL HUB (الفرامل ومحاور العجلات)
  // ==========================================
  "Brake Pad": {
    category: "Brake & Wheel Hub",
    arabicName: "فحمات فرامل / قماشات",
    synonyms: ["فحمات", "قماشات", "فحمات فرامل", "قماشات فرامل", "فحمات أمامي", "فحمات خلفي", "brake pads", "brake shoes"]
  },
  "Rotor / Disc": {
    category: "Brake & Wheel Hub",
    arabicName: "هوبات / ديسك فرامل",
    synonyms: ["هوبات", "هوب", "ديسك فرامل", "دسك فرامل", "دسك", "brake rotor", "brake disc"]
  },
  "Caliper / Caliper Assembly": {
    category: "Brake & Wheel Hub",
    arabicName: "كاليبر فرامل / قسام فرامل",
    synonyms: ["كاليبر", "كليبر", "قسام فرامل", "كليبر فرامل", "brake caliper"]
  },
  "Master Cylinder": {
    category: "Brake & Wheel Hub",
    arabicName: "علبة فرامل رئيسية / باكم فرامل",
    synonyms: ["علبة فرامل", "علبه فرامل", "باكم فرامل", "مستر فرامل", "brake master cylinder"]
  },
  "Power Brake Booster": {
    category: "Brake & Wheel Hub",
    arabicName: "سيرفو فرامل / سيرفو الباكم",
    synonyms: ["باكم", "سيرفو فرامل", "مكثف فرامل", "brake booster"]
  },
  "ABS Control Module / Sensor": {
    category: "Brake & Wheel Hub",
    arabicName: "حساس ABS / كمبيوتر فرامل ABS",
    synonyms: ["حساس abs", "كمبيوتر فرامل", "جهاز اي بي اس", "حساس مانع انزلاق", "abs sensor", "abs module"]
  },
  "Wheel Hub & Bearing": {
    category: "Brake & Wheel Hub",
    arabicName: "فلنجة / رمان عجلة",
    synonyms: ["فلنجة", "فلنجه", "رمان بلي", "رمان عجلة", "فلنجة كفر", "wheel hub", "wheel bearing"]
  },
  "Brake Hose / Line": {
    category: "Brake & Wheel Hub",
    arabicName: "لي فرامل / أنبوب زيت فرامل",
    synonyms: ["لي فرامل", "هوز فرامل", "انبوب فرامل", "brake hose", "brake line"]
  },
  "Parking Brake Cable / Assembly": {
    category: "Brake & Wheel Hub",
    arabicName: "واير الجلنط / فرامل اليد",
    synonyms: ["جلنط", "هاند بريك", "فرامل يد", "واير جلنط", "parking brake", "handbrake"]
  },

  // ==========================================
  // 4. COOLING SYSTEM (نظام التبريد)
  // ==========================================
  "Radiator": {
    category: "Cooling System",
    arabicName: "راديتر ماء",
    synonyms: ["راديتر", "رديتر", "رادياتير", "مبرد ماء", "radiator"]
  },
  "Radiator Cap": {
    category: "Cooling System",
    arabicName: "غطاء الراديتر",
    synonyms: ["غطاء راديتر", "غطاء رديتر", "غطا رديتر", "radiator cap"]
  },
  "Coolant Reservoir": {
    category: "Cooling System",
    arabicName: "قربة ماء الراديتر",
    synonyms: ["قربة ماء", "مطارة ماء", "قربة راديتر", "قربة رديتر", "coolant tank", "expansion tank"]
  },
  "Radiator Fan Assembly / Motor": {
    category: "Cooling System",
    arabicName: "مروحة الراديتر كاملة / دينمو مروحة",
    synonyms: ["مروحة راديتر", "مراوح تبريد", "مروحة الرديتر", "دينمو مروحة", "radiator fan", "cooling fan"]
  },
  "Thermostat / Housing": {
    category: "Cooling System",
    arabicName: "بلف حرارة / كوع بلف الحرارة",
    synonyms: ["بلف حرارة", "ثرموستات", "ترموستات", "كوع بلف", "thermostat"]
  },
  "Water Pump": {
    category: "Cooling System",
    arabicName: "طرمبة ماء / مضخة ماء",
    synonyms: ["طرمبة ماء", "مضخة ماء", "طلمبة ماء", "طرمبه مويه", "water pump"]
  },
  "Radiator Hose / Coolant Hose": {
    category: "Cooling System",
    arabicName: "خرطوش راديتر / لي ماء",
    synonyms: ["خرطوش راديتر", "لي ماء", "هوز رديتر", "خرطوش فوق", "خرطوش تحت", "radiator hose"]
  },

  // ==========================================
  // 5. DRIVETRAIN (نظام الدفع والعكوس)
  // ==========================================
  "CV Axle / Axle Shaft": {
    category: "Drivetrain",
    arabicName: "عكس كامل / عمود عكس",
    synonyms: ["عكوس", "عكس", "عكس أمامي", "عكس خلفي", "عكس يمين", "عكس يسار", "cv axle", "drive axle"]
  },
  "CV Joint / Boot": {
    category: "Drivetrain",
    arabicName: "رأس عكس / جلدة عكس",
    synonyms: ["راس عكس", "رأس عكس", "جلدة عكس", "جلد عكس", "cv joint", "cv boot"]
  },
  "Differential Assembly / Ring & Pinion": {
    category: "Drivetrain",
    arabicName: "دفرنش / كرونة",
    synonyms: ["دفرنش", "دفنس", "كرونة", "كرونه", "دفرانس", "differential", "ring and pinion"]
  },
  "Drive Shaft / Propeller Shaft": {
    category: "Drivetrain",
    arabicName: "عمود دوران / عمود كردان",
    synonyms: ["عمود دوران", "عمود كردان", "عمود دبل", "drive shaft", "driveshaft"]
  },
  "Drive Shaft Center Support Bearing": {
    category: "Drivetrain",
    arabicName: "شيال عمود الدوران",
    synonyms: ["شيال عمود", "رمان عمود", "شيال عمود دوران", "center support bearing"]
  },
  "Transfer Case / Assembly": {
    category: "Drivetrain",
    arabicName: "دبل / قير الدبل (Transfer Case)",
    synonyms: ["دبل", "قير دبل", "ترانسفير", "دبل فورويل", "transfer case"]
  },
  "Universal Joint": {
    category: "Drivetrain",
    arabicName: "صليبة عمود الدوران",
    synonyms: ["صليبة", "صليبه", "صليبة عمود", "u-joint", "universal joint"]
  },

  // ==========================================
  // 6. ELECTRICAL (الكهرباء والكمبيوترات)
  // ==========================================
  "Alternator / Generator": {
    category: "Electrical",
    arabicName: "دينمو كهرباء / مولد",
    synonyms: ["دينمو", "دينامو", "مولد كهرباء", "دينمو شحن", "alternator", "generator"]
  },
  "Starter Motor": {
    category: "Electrical",
    arabicName: "سلف / مارش",
    synonyms: ["سلف", "مارش", "موتور سلف", "starter", "starter motor"]
  },
  "Engine Control Module (ECM / ECU)": {
    category: "Electrical",
    arabicName: "كمبيوتر المحرك (ECM / ECU)",
    synonyms: ["كمبيوتر ماكينة", "كمبيوتر المحرك", "كمبيوتر ماكينه", "ecm", "ecu", "pcm", "engine computer"]
  },
  "Body Control Module (BCM)": {
    category: "Electrical",
    arabicName: "كمبيوتر السيارة الداخلي (BCM)",
    synonyms: ["كمبيوتر بدي", "كمبيوتر البدي", "كمبيوتر سيارة", "bcm", "body control module"]
  },
  "Battery Cable / Terminal": {
    category: "Electrical",
    arabicName: "كابل بطارية / أصابع بطارية",
    synonyms: ["كابل بطارية", "أصابع بطارية", "إصبع بطارية", "اصبع بطاريه", "battery cable", "battery terminal"]
  },
  "Fuse / Fuse Block": {
    category: "Electrical",
    arabicName: "فيوزات / علبة فيوزات",
    synonyms: ["فيوز", "فيوزات", "علبة فيوزات", "علبه فيوزات", "كتاوت", "fuse", "fuse box", "fuse block"]
  },
  "Horn": {
    category: "Electrical",
    arabicName: "بوري / هرن",
    synonyms: ["بوري", "هرن", "بوق", "horn"]
  },
  "Parking Aid Sensor / Camera": {
    category: "Electrical",
    arabicName: "حساسات ريوس / كاميرا خلفية",
    synonyms: ["حساسات ريوس", "حساس اصطفاف", "كاميرا خلفية", "parking sensor", "park assist camera"]
  },

  // ==========================================
  // 7. ENGINE (المحرك / الماكينة)
  // ==========================================
  "Engine Long Block / Assembly": {
    category: "Engine",
    arabicName: "ماكينة كاملة / محرك",
    synonyms: ["ماكينة", "محرك", "ماكينه كاملة", "مكينة", "مكينه", "engine", "motor"]
  },
  "Cylinder Head": {
    category: "Engine",
    arabicName: "رأس الماكينة (Cylinder Head)",
    synonyms: ["رأس ماكينة", "راس مكينة", "راس ماكينه", "cylinder head"]
  },
  "Cylinder Head Gasket": {
    category: "Engine",
    arabicName: "وجه رأس الماكينة (كاسكيت)",
    synonyms: ["وجه ماكينة", "وجيه", "كاسكيت", "وجه رأس الماكينة", "head gasket"]
  },
  "Camshaft": {
    category: "Engine",
    arabicName: "عمود كامة / ميل الكامة",
    synonyms: ["عمود كامة", "عمود كامات", "ميل كامة", "camshaft"]
  },
  "Crankshaft": {
    category: "Engine",
    arabicName: "عمود كرنك",
    synonyms: ["عمود كرنك", "كرنك", "crankshaft"]
  },
  "Piston / Piston Ring": {
    category: "Engine",
    arabicName: "بستم / شنابر بساتم",
    synonyms: ["بستم", "بساتم", "شنابر", "شنبر", "شنابر بساتم", "piston", "piston ring"]
  },
  "Valve / Intake / Exhaust": {
    category: "Engine",
    arabicName: "بلوف ماكينة / صبابات",
    synonyms: ["بلوف", "صبابات", "بلف ماكينة", "صباب", "valves", "intake valve", "exhaust valve"]
  },
  "Valve Cover / Gasket": {
    category: "Engine",
    arabicName: "غطاء بلوف / وجه غطاء بلوف",
    synonyms: ["غطاء بلوف", "وجه غطاء بلوف", "وجه غطا بلوف", "valve cover", "valve cover gasket"]
  },
  "Timing Chain / Timing Belt": {
    category: "Engine",
    arabicName: "جنزير ماكينة / سير التايمنج",
    synonyms: ["جنزير ماكينة", "سير جنزير", "سير التايمنج", "جنزير مكينة", "timing chain", "timing belt"]
  },
  "Oil Pan / Crankcase": {
    category: "Engine",
    arabicName: "كرتير زيت الماكينة",
    synonyms: ["كرتير", "كرتير زيت", "كارتير", "oil pan", "sump"]
  },
  "Oil Pump": {
    category: "Engine",
    arabicName: "طرمبة زيت ماكينة",
    synonyms: ["طلمبة زيت", "مضخة زيت", "طرمبة زيت", "oil pump"]
  },
  "Engine Mount / Motor Mount": {
    category: "Engine",
    arabicName: "كراسي ماكينة / كرسي محرك",
    synonyms: ["كرسي ماكينة", "كراسي محرك", "كرسي محرك", "كراسي مكينة", "engine mount", "motor mount"]
  },
  "Intake Manifold / Gasket": {
    category: "Engine",
    arabicName: "ثلاجة ماكينة / مجمع السحب",
    synonyms: ["ثلاجة ماكينة", "مجمع سحب", "وجه ثلاجة", "ثلاجة مكينة", "intake manifold"]
  },
  "Harmonic Balancer": {
    category: "Engine",
    arabicName: "بكرة كرنك / بكرة ماكينة",
    synonyms: ["بكرة كرنك", "بكرة ماكينة", "harmonic balancer", "crankshaft pulley"]
  },

  // ==========================================
  // 8. EXHAUST & EMISSION (نظام العادم والتلوث)
  // ==========================================
  "Exhaust Manifold": {
    category: "Exhaust & Emission",
    arabicName: "قزوز / مجمع العادم",
    synonyms: ["قزوز", "مجمع عادم", "وجه قزوز", "منيفولد", "exhaust manifold"]
  },
  "Catalytic Converter": {
    category: "Exhaust & Emission",
    arabicName: "دبة بيئة / دبة تلوث / دبة كربون",
    synonyms: ["دبة بيئة", "دبة تلوث", "دبة كربون", "دبة شكمان", "catalytic converter"]
  },
  "Oxygen (O2) Sensor": {
    category: "Exhaust & Emission",
    arabicName: "حساس شكمان / حساس أكسجين",
    synonyms: ["حساس شكمان", "حساس اكسجين", "حساس أكسجين", "o2 sensor", "oxygen sensor"]
  },
  "MAP / MAF Sensor": {
    category: "Exhaust & Emission",
    arabicName: "حساس هواء (MAF / MAP)",
    synonyms: ["حساس هواء", "حساس ماب", "حساس ماس اير", "map sensor", "maf sensor", "mass air flow"]
  },
  "PCV Valve": {
    category: "Exhaust & Emission",
    arabicName: "بلف تبخير زيت الماكينة",
    synonyms: ["بلف تبخير", "بلف pcv", "pcv valve"]
  },

  // ==========================================
  // 9. FUEL & AIR (نظام الوقود والهواء)
  // ==========================================
  "Throttle Body": {
    category: "Fuel & Air",
    arabicName: "ثروتل / بوابة هواء / دعسة بنزين",
    synonyms: ["ثروتل", "بوابة هواء", "دعسة بنزين", "بوابة مكينة", "throttle body"]
  },
  "Fuel Injector": {
    category: "Fuel & Air",
    arabicName: "بخاخات بنزين",
    synonyms: ["بخاخات", "بخاخ بنزين", "بخاخ", "fuel injector", "fuel injectors"]
  },
  "Fuel Pump Assembly": {
    category: "Fuel & Air",
    arabicName: "طرمبة بنزين / مضخة وقود",
    synonyms: ["طرمبة بنزين", "طلمبة بنزين", "مضخة وقود", "طرمبه بنزين", "fuel pump"]
  },
  "Air Filter": {
    category: "Fuel & Air",
    arabicName: "فلتر هواء الماكينة",
    synonyms: ["فلتر هواء", "فلتر مكينة", "شوار هواء", "air filter"]
  },

  // ==========================================
  // 10. HEAT & AIR CONDITIONING (التكييف والتدفئة)
  // ==========================================
  "A/C Compressor": {
    category: "Heat & Air Conditioning",
    arabicName: "كمبروسر تكييف / ضاغط مكيف",
    synonyms: ["كمبروسر", "كمبريسر", "ضاغط مكيف", "كمبروسر مكيف", "ac compressor"]
  },
  "A/C Condenser": {
    category: "Heat & Air Conditioning",
    arabicName: "راديتر مكيف / كوندنسر",
    synonyms: ["راديتر مكيف", "كثاف مكيف", "كوندنسر", "رديتر مكيف", "ac condenser"]
  },
  "A/C Evaporator Core": {
    category: "Heat & Air Conditioning",
    arabicName: "ثلاجة مكيف",
    synonyms: ["ثلاجة مكيف", "ثلاجة التكييف", "ثلاجه مكيف", "ac evaporator"]
  },
  "Blower Motor": {
    category: "Heat & Air Conditioning",
    arabicName: "مروحة مكيف داخلية / دينمو مكيف",
    synonyms: ["مروحة مكيف", "دينمو مكيف", "موتور مكيف", "blower motor"]
  },
  "Cabin Air Filter": {
    category: "Heat & Air Conditioning",
    arabicName: "فلتر مكيف داخلي",
    synonyms: ["فلتر مكيف", "فلتر كابينة", "cabin filter", "cabin air filter"]
  },

  // ==========================================
  // 11. IGNITION (نظام الإشعال)
  // ==========================================
  "Spark Plug": {
    category: "Ignition",
    arabicName: "بواجي / شمعات إشعال",
    synonyms: ["بواجي", "شمعات إشعال", "بواجي ماكينة", "بوجيهات", "spark plug", "spark plugs"]
  },
  "Ignition Coil": {
    category: "Ignition",
    arabicName: "كويلات إشعال / كويل",
    synonyms: ["كويل", "كويلات", "ملف إشعال", "كويلات ماكينة", "ignition coil"]
  },
  "Camshaft Position Sensor": {
    category: "Ignition",
    arabicName: "حساس كامة / حساس تيمنج",
    synonyms: ["حساس كامة", "حساس تيمنج", "حساس الكامة", "camshaft sensor"]
  },
  "Crankshaft Position Sensor": {
    category: "Ignition",
    arabicName: "حساس كرنك",
    synonyms: ["حساس كرنك", "حساس الكرنك", "crankshaft sensor"]
  },

  // ==========================================
  // 12. INTERIOR (المقصورة الداخلية)
  // ==========================================
  "Air Bag Clockspring": {
    category: "Interior",
    arabicName: "شريط ايرباج / شريط الدركسون",
    synonyms: ["شريط ايرباج", "شريط دركسون", "شريط طارة", "clockspring"]
  },
  "Window Regulator & Motor": {
    category: "Interior",
    arabicName: "ماكينة زجاج / رفع زجاج",
    synonyms: ["ماكينة زجاج", "دينمو زجاج", "رفع زجاج", "ماكينه زجاج", "window regulator", "window motor"]
  },

  // ==========================================
  // 13. STEERING (نظام التوجيه / الدركسون)
  // ==========================================
  "Rack and Pinion": {
    category: "Steering",
    arabicName: "دودة دركسون / مجمع قيادة",
    synonyms: ["دودة دركسون", "دودة دركسيون", "دودة قيادة", "دودة دركسون كهرباء", "rack and pinion", "steering rack"]
  },
  "Tie Rod End": {
    category: "Steering",
    arabicName: "أذرعة دركسون (داخلي / خارجي)",
    synonyms: ["أذرعة", "ذراع دركسون", "أذرعة دركسون", "ذراع خارجي", "ذراع داخلي", "tie rod end"]
  },
  "Power Steering Pump": {
    category: "Steering",
    arabicName: "طرمبة باور / طرمبة دركسون",
    synonyms: ["طرمبة باور", "طرمبة دركسون", "مضخة باور", "power steering pump"]
  },

  // ==========================================
  // 14. SUSPENSION (نظام التعليق / المساعدين)
  // ==========================================
  "Shock / Strut": {
    category: "Suspension",
    arabicName: "مساعدات أمامي / خلفي",
    synonyms: ["مساعدات", "مساعد", "مساعد أمامي", "مساعد خلفي", "مساعدين", "shock absorber", "strut"]
  },
  "Coil Spring / Leaf Spring": {
    category: "Suspension",
    arabicName: "يايات / سست",
    synonyms: ["ياي", "يايات", "سست", "سوستة", "coil spring", "leaf spring"]
  },
  "Control Arm": {
    category: "Suspension",
    arabicName: "مقصات فوق / تحت",
    synonyms: ["مقصات", "مقص", "مقص أمامي", "مقص خلفي", "مقص فوق", "مقص تحت", "control arm"]
  },
  "Ball Joint": {
    category: "Suspension",
    arabicName: "ركبة مقص / جوينت",
    synonyms: ["ركبة", "ركبة مقص", "جوينت", "ball joint"]
  },
  "Sway Bar Link": {
    category: "Suspension",
    arabicName: "مسامير توازن / ميزان",
    synonyms: ["مسامير توازن", "مسمار توازن", "جلب ميزان", "sway bar link"]
  },

  // ==========================================
  // 15. TRANSMISSION-AUTOMATIC (ناقل الحركة / القير)
  // ==========================================
  "Automatic Transmission": {
    category: "Transmission-Automatic",
    arabicName: "جيربكس / قير أوتماتيك كامل",
    synonyms: ["قير", "جيربكس", "قير اوتوماتيك", "ناقل حركة", "قير تماتيك", "transmission", "gearbox"]
  },
  "Torque Converter": {
    category: "Transmission-Automatic",
    arabicName: "بطيخة قير / طنجرة قير",
    synonyms: ["بطيخة قير", "طنجرة قير", "محول عزم", "torque converter"]
  },
  "Valve Body / Solenoid": {
    category: "Transmission-Automatic",
    arabicName: "مخ قير / صمامات سيلنويد",
    synonyms: ["مخ قير", "مخ القير", "صمامات قير", "سيلنويد قير", "valve body", "shift solenoid"]
  },
  "Transmission Filter": {
    category: "Transmission-Automatic",
    arabicName: "فلتر قير",
    synonyms: ["فلتر قير", "صفاية قير", "transmission filter"]
  },
  "Transmission Mount": {
    category: "Transmission-Automatic",
    arabicName: "كرسي قير",
    synonyms: ["كرسي قير", "كراسي قير", "transmission mount"]
  },

  // ==========================================
  // 16. WHEEL (العجلات والجنوط)
  // ==========================================
  "TPMS Sensor": {
    category: "Wheel",
    arabicName: "حساس ضغط الإطارات (TPMS)",
    synonyms: ["حساس إطارات", "حساس هواء كفرات", "حساس طاسات", "tpms sensor"]
  },
  "Lug Nut / Stud": {
    category: "Wheel",
    arabicName: "مسامير وصواميل جنط",
    synonyms: ["مسامير جنط", "صواميل جنط", "مسمار كفر", "lug nut"]
  },

  // ==========================================
  // 17. WIPER & WASHER (المساحات وبخاخات المياه)
  // ==========================================
  "Wiper Blade": {
    category: "Wiper & Washer",
    arabicName: "ريش مساحات",
    synonyms: ["مساحات", "ريش مساحات", "مساحات زجاج", "wiper blade"]
  },
  "Wiper Motor": {
    category: "Wiper & Washer",
    arabicName: "موتور مساحات / ماكينة مساحات",
    synonyms: ["موتور مساحات", "ماكينة مساحات", "wiper motor"]
  },
  "Washer Pump": {
    category: "Wiper & Washer",
    arabicName: "طرمبة مساحات / مضخة ماء المساحات",
    synonyms: ["طرمبة مساحات", "مضخة مساحات", "دينمو مساحات", "washer pump"]
  }
};

// دالة لمعرفة القسم الرئيسي تلقائياً من اسم القطعة
export const getPartCategory = (partName: string): string => {
  if (!partName) return "Engine";
  
  const lowerName = partName.toLowerCase().trim();

  for (const [key, item] of Object.entries(PARTS_DICTIONARY)) {
    if (lowerName.includes(key.toLowerCase()) || lowerName.includes(item.arabicName.toLowerCase())) {
      return item.category;
    }
    if (item.synonyms.some(syn => lowerName.includes(syn.toLowerCase()))) {
      return item.category;
    }
  }

  // تصنيف احترافي احتياطي عند كتابة مصطلحات عامة
  if (lowerName.includes("شمعة") || lowerName.includes("إسطب") || lowerName.includes("ضوء") || lowerName.includes("lamp") || lowerName.includes("صدام") || lowerName.includes("كبوت")) return "Body & Lamp Assembly";
  if (lowerName.includes("فرامل") || lowerName.includes("فحمات") || lowerName.includes("قماشات") || lowerName.includes("هوب") || lowerName.includes("brake")) return "Brake & Wheel Hub";
  if (lowerName.includes("راديتر") || lowerName.includes("حرارة") || lowerName.includes("مروحة") || lowerName.includes("coolant")) return "Cooling System";
  if (lowerName.includes("عكس") || lowerName.includes("دفرنش") || lowerName.includes("عمود") || lowerName.includes("دبل")) return "Drivetrain";
  if (lowerName.includes("دينمو") || lowerName.includes("سلف") || lowerName.includes("كمبيوتر") || lowerName.includes("فيوز")) return "Electrical";
  if (lowerName.includes("مكيف") || lowerName.includes("كمبروسر") || lowerName.includes("ثلاجة")) return "Heat & Air Conditioning";
  if (lowerName.includes("بواجي") || lowerName.includes("كويل") || lowerName.includes("spark")) return "Ignition";
  if (lowerName.includes("مساعد") || lowerName.includes("مقص") || lowerName.includes("ياي") || lowerName.includes("سست")) return "Suspension";
  if (lowerName.includes("قير") || lowerName.includes("جيربكس") || lowerName.includes("transmission")) return "Transmission-Automatic";

  return "Engine";
};

// دالة فحص مطابقة البحث الذكية (تنظر في الأسماء، الأرقام، الماركة، والاختصارات الهندسية مثل ECM, BCM, ABS)
export const matchesSmartSearch = (part: any, searchQuery: string): boolean => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase().trim();

  const name = (part.name || '').toLowerCase();
  const partNo = (part.part_number || part.code || part.sku || '').toLowerCase();
  const make = (part.make || '').toLowerCase();
  const model = (part.model || '').toLowerCase();
  const year = String(part.year || '').toLowerCase();

  // 1. مطابقة مباشرة
  if (name.includes(q) || partNo.includes(q) || make.includes(q) || model.includes(q) || year.includes(q)) {
    return true;
  }

  // 2. البحث الذكي داخل قاموس الكلمات والمرادفات
  for (const [key, item] of Object.entries(PARTS_DICTIONARY)) {
    const isQueryInDict = key.toLowerCase().includes(q) || 
                          item.arabicName.toLowerCase().includes(q) || 
                          item.synonyms.some(s => s.toLowerCase().includes(q));
    
    if (isQueryInDict) {
      const isPartMatchingDict = name.includes(key.toLowerCase()) || 
                                 name.includes(item.arabicName.toLowerCase()) || 
                                 item.synonyms.some(s => name.includes(s.toLowerCase()));
      if (isPartMatchingDict) return true;
    }
  }

  return false;
};
