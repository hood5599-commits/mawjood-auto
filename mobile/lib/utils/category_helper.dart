import '../models/part_model.dart';

class PartDictionaryItem {
  final String arabicName;
  final List<String> synonyms;
  final String category;

  const PartDictionaryItem({
    required this.arabicName,
    required this.synonyms,
    required this.category,
  });
}

class PartTierInfo {
  final String tier; // 'oem' | 'aftermarket'
  final String label;

  const PartTierInfo({required this.tier, required this.label});
}

class CategoryHelper {
  // 🗂️ قاموس قطع الغيار الشامل والمترجم للمطابقة الفورية بالذكاء الاصطناعي
  static const Map<String, PartDictionaryItem> partsDictionary = {
    'Brake Pad': PartDictionaryItem(
      arabicName: 'فحمات وقماشات الفرامل',
      synonyms: [
        'سفايف',
        'سفايف قدام',
        'سفايف ورا',
        'فحمات',
        'قماشات',
        'بريك باد',
      ],
      category: 'Brake & Wheel Hub > Brake Pad',
    ),
    'Rotor': PartDictionaryItem(
      arabicName: 'هوبات وأقراص الفرامل',
      synonyms: ['درامات', 'درام ويل', 'ديسكات', 'هوب', 'هوبات', 'روتور'],
      category: 'Brake & Wheel Hub > Rotor',
    ),
    'Shock / Strut': PartDictionaryItem(
      arabicName: 'المساعدات وممتص الصدمات',
      synonyms: ['جامبينات', 'جامبين', 'مساعد', 'مساعدات', 'شوكات'],
      category: 'Suspension > Shock / Strut',
    ),
    'Control Arm': PartDictionaryItem(
      arabicName: 'المقصات وأذرعة التحكم',
      synonyms: ['شيالات', 'شيال', 'مقص', 'مقصات', 'أذرعة'],
      category: 'Suspension > Control Arm',
    ),
    'Radiator': PartDictionaryItem(
      arabicName: 'رديتر تبريد المحرك',
      synonyms: ['لديتر', 'رديتر ماي', 'رديتر', 'مشعاع'],
      category: 'Cooling System > Radiator',
    ),
    'Radiator Fan Assembly': PartDictionaryItem(
      arabicName: 'مروحة تبريد الرديتر',
      synonyms: ['مروحة', 'مروحه', 'مروحة رديتر', 'دينمو مروحة'],
      category: 'Cooling System > Radiator Fan Assembly',
    ),
    'Water Pump': PartDictionaryItem(
      arabicName: 'طرمبة ومضخة الماء',
      synonyms: ['طرمبة ماي', 'واتر بمب', 'مضخة ماء', 'طرمبة ماء'],
      category: 'Cooling System > Water Pump',
    ),
    'A/C Compressor': PartDictionaryItem(
      arabicName: 'كمبروسر وضاغط المكيف',
      synonyms: ['كمبريسر', 'كمبرسر', 'ضاغط مكيف', 'كمبروسر'],
      category: 'Heat & Air Conditioning > A/C Compressor',
    ),
    'A/C Condenser': PartDictionaryItem(
      arabicName: 'مكثف ورديتر المكيف',
      synonyms: ['كوندنسر', 'رديتر مكيف', 'مكثف مكيف'],
      category: 'Heat & Air Conditioning > A/C Condenser',
    ),
    'Cabin Air Filter': PartDictionaryItem(
      arabicName: 'فلتر مكيف ومقصورة',
      synonyms: ['فلتر مكيف', 'فلتر كابينة', 'فلتر مقصورة'],
      category: 'Heat & Air Conditioning > Cabin Air Filter',
    ),
    'Spark Plug': PartDictionaryItem(
      arabicName: 'بواجي وشمعات الاحتراق',
      synonyms: ['بواجي', 'بلاكات', 'بلكات', 'شمعات'],
      category: 'Ignition > Spark Plug',
    ),
    'Ignition Coil': PartDictionaryItem(
      arabicName: 'كويلات وملفات الإشعال',
      synonyms: ['كويل', 'كويلات', 'ملف إشعال'],
      category: 'Ignition > Ignition Coil',
    ),
    'Alternator / Generator': PartDictionaryItem(
      arabicName: 'دينمو وشاحن البطارية',
      synonyms: ['دينمة', 'دينامو', 'دينمو', 'شاحن كهرباء'],
      category: 'Electrical > Alternator / Generator',
    ),
    'Starter Motor': PartDictionaryItem(
      arabicName: 'سلف ومارش التشغيل',
      synonyms: ['ستارتر', 'سلف', 'مارش'],
      category: 'Electrical > Starter Motor',
    ),
    'Air Filter': PartDictionaryItem(
      arabicName: 'فلتر هواء المحرك',
      synonyms: ['فلتر مكينة', 'فلتر هواء', 'شوكة هواء'],
      category: 'Fuel & Air > Air Filter',
    ),
    'Fuel Pump': PartDictionaryItem(
      arabicName: 'طرمبة ومضخة الوقود',
      synonyms: ['طرمبة بترول', 'فيول بمب', 'مضخة بنزين', 'طرمبة بنزين'],
      category: 'Fuel & Air > Fuel Pump & Housing Assembly',
    ),
    'Motor Mount': PartDictionaryItem(
      arabicName: 'كراسي وقواعد المحرك',
      synonyms: ['كرسي مكينة', 'كراسي مكينة', 'كرسي قير', 'قواعد محرك'],
      category: 'Engine > Motor Mount',
    ),
    'Oil Filter': PartDictionaryItem(
      arabicName: 'فلتر وزيت المحرك',
      synonyms: ['فلتر آيل', 'فلتر زيت', 'سيفون'],
      category: 'Engine > Oil Filter',
    ),
    'Wiper Blade': PartDictionaryItem(
      arabicName: 'مساحات وشفرات الزجاج',
      synonyms: ['مساحات جام', 'مساحات', 'شفرات مساحات'],
      category: 'Wiper & Washer > Wiper Blade',
    ),
  };

  /// استخراج القسم الرئيسي والفرعي من اسم القطعة تلقائياً
  static String getPartCategory(String partName) {
    if (partName.trim().isEmpty) return 'عام';

    final lower = partName.toLowerCase();

    for (final entry in partsDictionary.entries) {
      if (lower.contains(entry.key.toLowerCase()) ||
          lower.contains(entry.value.arabicName.toLowerCase()) ||
          entry.value.synonyms.any(
            (syn) => lower.contains(syn.toLowerCase()),
          )) {
        return entry.value.category;
      }
    }

    if (lower.contains('brake') ||
        lower.contains('فرامل') ||
        lower.contains('بريك')) {
      return 'Brake & Wheel Hub > عام';
    }
    if (lower.contains('suspension') ||
        lower.contains('مساعد') ||
        lower.contains('شيال')) {
      return 'Suspension > عام';
    }
    if (lower.contains('engine') ||
        lower.contains('محرك') ||
        lower.contains('مكينة')) {
      return 'Engine > عام';
    }
    if (lower.contains('cooling') ||
        lower.contains('تبريد') ||
        lower.contains('رديتر')) {
      return 'Cooling System > عام';
    }
    if (lower.contains('air') ||
        lower.contains('تكييف') ||
        lower.contains('مكيف')) {
      return 'Heat & Air Conditioning > عام';
    }

    return 'عام';
  }

  /// تصنيف نوع وفئة القطعة (أصلي وكالة OEM أو تجاري معتمد Aftermarket)
  static PartTierInfo classifyPartTier(dynamic part) {
    String typeStr = '';
    String nameStr = '';

    if (part is PartModel) {
      typeStr = (part.partType ?? '').toLowerCase();
      nameStr = part.name.toLowerCase();
    } else if (part is Map) {
      typeStr = (part['part_type'] ?? part['type'] ?? '')
          .toString()
          .toLowerCase();
      nameStr = (part['name'] ?? part['part_name'] ?? '')
          .toString()
          .toLowerCase();
    }

    final isOem =
        typeStr.contains('oem') ||
        typeStr.contains('أصلي') ||
        typeStr.contains('وكالة') ||
        typeStr.contains('original') ||
        nameStr.contains('أصلي') ||
        nameStr.contains('وكالة') ||
        nameStr.contains('oem');

    if (isOem) {
      return const PartTierInfo(tier: 'oem', label: 'أصلي وكالة (OEM)');
    }

    return const PartTierInfo(
      tier: 'aftermarket',
      label: 'تجاري معتمد درجة أولى',
    );
  }
}
