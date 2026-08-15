export interface CarBrand {
  ar: string;
  en: string;
  models: string[];
}

export const CAR_DATA: Record<string, CarBrand> = {
  // 🇯🇵 سيارات يابانية
  "تويوتا": { ar: "تويوتا", en: "Toyota", models: ["لاندكروزر", "كامري", "كورولا", "هايلوكس", "برادو", "راف فور", "افالون", "فورتشنر", "يارس", "اف جي كروزر"] },
  "نيسان": { ar: "نيسان", en: "Nissan", models: ["باترول", "صني", "التيما", "ماكسيما", "باثفايندر", "اكستيرا", "سنترا", "كيكس", "نافارا"] },
  "لكزس": { ar: "لكزس", en: "Lexus", models: ["LX600", "LX570", "ES350", "LS500", "RX350", "GX460", "IS300", "NX300"] },
  "هوندا": { ar: "هوندا", en: "Honda", models: ["اكورد", "سيفيك", "سي ار في", "بايلوت", "سيتي", "اوديسي", "اتش ار في"] },
  "ميتسوبيشي": { ar: "ميتسوبيشي", en: "Mitsubishi", models: ["باجيرو", "لانسر", "اوتلاندر", "L200", "مونتيرو سبورت", "اكليبس كروس", "اتراج"] },
  "مازدا": { ar: "مازدا", en: "Mazda", models: ["مازدا 6", "مازدا 3", "CX-9", "CX-5", "CX-30", "CX-60"] },
  "سوزوكي": { ar: "سوزوكي", en: "Suzuki", models: ["جيمني", "سويفت", "جراند فيتارا", "ديزاير", "فيتارا", "بالينو"] },

  // 🇰🇷 سيارات كورية
  "هيونداي": { ar: "هيونداي", en: "Hyundai", models: ["النترا", "سوناتا", "توسان", "سانتافي", "اكسنت", "باليسيد", "كريتا", "ازيرا", "كونا"] },
  "كيا": { ar: "كيا", en: "Kia", models: ["سبورتاج", "سورينتو", "اوبتيما / K5", "سيراتو / K3", "تيلورايد", "سيلتوس", "بيجاس", "كرنفال", "ريو"] },
  "جينيسيس": { ar: "جينيسيس", en: "Genesis", models: ["G70", "G80", "G90", "GV70", "GV80"] },

  // 🇺🇸 سيارات أمريكية
  "فورد": { ar: "فورد", en: "Ford", models: ["اف 150", "اكسبلورر", "موستنج", "اكسبيديشن", "توروس", "رينجر", "ايدج", "برونكو"] },
  "جي إم سي": { ar: "جي إم سي", en: "GMC", models: ["يوكن", "سييرا", "اكاديا", "تيرين", "يوكن دينالي"] },
  "شفروليه": { ar: "شفروليه", en: "Chevrolet", models: ["تاهو", "سلفرادو", "كابريس", "ماليبو", "ترافرس", "كابتيفا", "كمارو", "كورفيت", "امبالا"] },
  "جيب": { ar: "جيب", en: "Jeep", models: ["رانجلر", "جراند شيروكي", "شيروكي", "جلاديتور", "كومباس"] },
  "دودج": { ar: "دودج", en: "Dodge", models: ["تشارجر", "تشالنجر", "دورانجو"] },

  // 🇨🇳 سيارات صينية الأكثر انتشاراً بقطر
  "إم جي": { ar: "إم جي", en: "MG", models: ["MG GT", "MG 5", "MG 6", "MG ZS", "MG RX5", "MG RX8", "MG HS", "MG One", "MG Whale"] },
  "جيلي": { ar: "جيلي", en: "Geely", models: ["Monjaro", "Tugella", "Coolray", "Emgrand", "Okavango", "Starray", "GX3 Pro"] },
  "جيتور": { ar: "جيتور", en: "Jetour", models: ["T2 (Traveler)", "Dashing", "X70 Plus", "X90 Plus", "X70"] },
  "هافال": { ar: "هافال", en: "Haval", models: ["H6", "Jolion", "Dargo", "H9", "H6 GT"] },
  "تانك": { ar: "تانك", en: "Tank", models: ["Tank 300", "Tank 500", "Tank 700"] },
  "شانجان": { ar: "شانجان", en: "Changan", models: ["CS95", "CS85", "CS75 Plus", "CS35 Plus", "UNI-K", "UNI-T", "UNI-V", "Eado Plus"] },
  "شيري": { ar: "شيري", en: "Chery", models: ["Tiggo 8 Pro", "Tiggo 7 Pro", "Tiggo 4 Pro", "Arrizo 8", "Omoda C5", "Jaecoo J7"] },
  "بي واي دي": { ar: "بي واي دي", en: "BYD", models: ["Song Plus", "Seal", "Han", "Atto 3", "Qin Plus", "Shark 6"] },
  "جي إيه سي": { ar: "جي إيه سي", en: "GAC", models: ["GS8", "GS4", "GS3 Emzoom", "Empow", "Emkoo", "GA8"] },
  "هونشي": { ar: "هونشي", en: "Hongqi", models: ["HS5", "H9", "H5", "E-HS9", "HS7", "Ousado"] },
  "بايك": { ar: "بايك", en: "BAIC", models: ["BJ40 Plus", "BJ60", "BJ80", "X7", "X35"] },
  "بيستون": { ar: "بيستون", en: "Bestune", models: ["B70", "T77 Pro", "T99", "T55"] },
  "جاك": { ar: "جاك", en: "JAC", models: ["J7", "JS4", "JS6", "T8 Pro"] },
  "جريت وول": { ar: "جريت وول", en: "GWM", models: ["POER", "Wingle 5", "Wingle 7"] },

  // 🇩🇪 سيارات ألمانية وفخمة
  "مرسيدس": { ar: "مرسيدس", en: "Mercedes-Benz", models: ["S-Class", "E-Class", "C-Class", "G-Class", "GLE", "GLC", "A-Class"] },
  "بي إم دبليو": { ar: "بي إم دبليو", en: "BMW", models: ["Series 7", "Series 5", "Series 3", "X5", "X6", "X7", "X3"] },
  "أودي": { ar: "أودي", en: "Audi", models: ["A8", "A6", "A4", "Q7", "Q8", "Q5", "A3"] },
  "فولكس فاجن": { ar: "فولكس فاجن", en: "Volkswagen", models: ["طوارق", "تيجوان", "تيرامونت", "باسات", "جولف"] },
  "بورش": { ar: "بورش", en: "Porsche", models: ["كايين", "باناميرا", "ماكان", "911"] },
  "لاند روفر": { ar: "لاند روفر", en: "Land Rover", models: ["رينج روفر", "ديفندر", "رينج روفر سبورت", "فيلار", "ايفوك"] }
};

export const CAR_YEARS = Array.from({ length: 30 }, (_, i) => String(2026 - i));
