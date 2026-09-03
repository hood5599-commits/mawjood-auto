class ChatFilterData {
  final String summary;
  final String? make;
  final String? model;
  final String? part;

  ChatFilterData({required this.summary, this.make, this.model, this.part});
}

class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final String timestamp;
  final ChatFilterData? appliedFilter;

  ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    required this.timestamp,
    this.appliedFilter,
  });
}

class AiChatService {
  static ChatMessage getWelcomeMessage({bool isAr = true}) {
    final now = DateTime.now();
    final timeStr = '${now.hour}:${now.minute.toString().padLeft(2, '0')}';
    return ChatMessage(
      id: 'welcome',
      isUser: false,
      text: isAr
          ? 'مرحباً بك! أنا عبود، مهندسك ومستشارك الذكي في موجود أوتو. كل القطع لدينا جديدة وأصلية 100% بالكرتون مع الضمان.\n\nتقدر تكتب لي اسم القطعة، أو نوع وموديل سيارتك، أو العطل الميكانيكي وسأوجهك فوراً!'
          : 'Welcome! I am Abboud, your AI advisor at Mawjood Auto. We provide 100% Brand-New Genuine OEM parts.\n\nTell me the part name, car model, or mechanical issue!',
      timestamp: timeStr,
    );
  }

  static ChatMessage processQuery(String query, {bool isAr = true}) {
    final now = DateTime.now();
    final timeStr = '${now.hour}:${now.minute.toString().padLeft(2, '0')}';
    final lower = query.toLowerCase().trim();

    if (lower.contains('سفايف') ||
        lower.contains('فحمات') ||
        lower.contains('brake')) {
      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        isUser: false,
        text: isAr
            ? 'تم تصفية المتجر لعرض فحمات وسفايف الفرامل المعتمدة مع الضمان الذهبي.'
            : 'Filters applied for certified Brake Pads with warranty.',
        timestamp: timeStr,
        appliedFilter: ChatFilterData(
          summary: isAr ? 'فحمات الفرامل' : 'Brake Pads',
          part: 'Brake Pad',
        ),
      );
    }

    if (lower.contains('حرارة') ||
        lower.contains('رديتر') ||
        lower.contains('مروحة')) {
      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        isUser: false,
        text: isAr
            ? 'ارتفاع الحرارة غالباً يرتبط بمروحة التبريد أو الرديتر أو الثرموستات. قمت بتصفية قطع دورة التبريد.'
            : 'Overheating is usually caused by radiator fan or coolant leak. Cooling parts filtered.',
        timestamp: timeStr,
        appliedFilter: ChatFilterData(
          summary: isAr ? 'نظام التبريد' : 'Cooling System',
          part: 'Radiator',
        ),
      );
    }

    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      isUser: false,
      text: isAr
          ? 'أهلاً بك! يمكنك تصفح الأقسام أو كتابة اسم القطعة والموديل وسأقوم بالبحث عنها فوراً.'
          : 'Hello! You can browse categories or mention the part and vehicle model.',
      timestamp: timeStr,
    );
  }
}
