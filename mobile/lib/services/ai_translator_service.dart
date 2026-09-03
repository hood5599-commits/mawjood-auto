class AiTranslatorService {
  static bool hasArabic(String text) {
    return RegExp(r'[\u0600-\u06FF]').hasMatch(text);
  }

  static Future<String> translateWithAi(
    String text, {
    String targetLang = 'en',
  }) async {
    if (text.contains('سفايف') || text.contains('فحمات')) {
      return 'Brake Pads';
    }
    if (text.contains('هوبات') || text.contains('ديسكات')) {
      return 'Brake Rotors';
    }
    if (text.contains('رديتر')) {
      return 'Radiator';
    }
    if (text.contains('مروحة')) {
      return 'Radiator Fan Assembly';
    }
    if (text.contains('كمبروسر')) {
      return 'A/C Compressor';
    }
    if (text.contains('مساعدات') || text.contains('جامبينات')) {
      return 'Shock Absorbers';
    }
    if (text.contains('مقصات') || text.contains('شيالات')) {
      return 'Control Arms';
    }
    if (text.contains('بواجي') || text.contains('بلاكات')) {
      return 'Spark Plugs';
    }
    if (text.contains('دينمو')) {
      return 'Alternator';
    }
    if (text.contains('سلف')) {
      return 'Starter Motor';
    }
    return text;
  }
}
