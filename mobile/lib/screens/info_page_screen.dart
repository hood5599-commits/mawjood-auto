import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/theme.dart';
import '../services/platform_settings_service.dart';
import '../widgets/mawjood_logo.dart';

enum InfoPageType { about, contact, faq, care }

class InfoPageScreen extends StatelessWidget {
  final String lang;
  final InfoPageType type;

  const InfoPageScreen({
    super.key,
    this.lang = 'ar',
    required this.type,
  });

  bool get isAr => lang == 'ar';

  Future<void> _launch(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final title = switch (type) {
      InfoPageType.about => isAr ? 'عن موجود أوتو' : 'About Mawjood Auto',
      InfoPageType.contact => isAr ? 'تواصل معنا' : 'Contact Us',
      InfoPageType.faq => isAr ? 'الأسئلة الشائعة' : 'FAQ',
      InfoPageType.care => isAr ? 'خدمة العملاء' : 'Customer Care',
    };

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: AppTheme.obsidian,
          title: Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        body: SafeArea(
          child: AnimatedBuilder(
            animation: PlatformSettingsService.instance,
            builder: (context, _) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: switch (type) {
                  InfoPageType.about => _about(isDark),
                  InfoPageType.contact => _contact(isDark),
                  InfoPageType.faq => _faq(isDark),
                  InfoPageType.care => _care(isDark),
                },
              );
            },
          ),
        ),
      ),
    );
  }

  PlatformSettings get _s => PlatformSettingsService.instance.settings;

  Widget _about(bool isDark) {
    final bodyColor = isDark ? AppTheme.textMuted : const Color(0xFF475569);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Center(child: MawjoodLogo(size: 64)),
        const SizedBox(height: 16),
        Text(
          isAr
              ? 'موجود أوتو هي المنصة الرقمية الرائدة في قطر لربط ملاك السيارات بكراجات ومحلات قطع الغيار المعتمدة ومندوبي التوصيل في مكان واحد.'
              : 'Mawjood Auto is Qatar’s leading digital platform connecting car owners with certified garages, parts stores, and delivery drivers.',
          style: TextStyle(fontSize: 14.5, height: 1.7, color: bodyColor),
        ),
        const SizedBox(height: 16),
        _card(
          color: isDark ? AppTheme.surfaceSlate : const Color(0xFFFDF1E3),
          border: isDark ? AppTheme.borderSlate : const Color(0xFFFED7AA),
          title: isAr ? 'رؤيتنا' : 'Our Vision',
          body: isAr
              ? 'تحويل البحث عن قطع الغيار من رحلة متعبة إلى تجربة بنقرة زر.'
              : 'Turning spare-parts search into a one-tap experience.',
          isDark: isDark,
        ),
        const SizedBox(height: 12),
        _card(
          color: isDark ? AppTheme.cardBg : const Color(0xFFE8F2FC),
          border: isDark ? AppTheme.borderSlate : const Color(0xFFBFDBFE),
          title: isAr ? 'رسالتنا' : 'Our Mission',
          body: isAr
              ? 'توفير قطع موثوقة بأفضل الأسعار وأعلى مستويات الأمان والسرعة.'
              : 'Trusted parts at fair prices with speed and safety.',
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _contact(bool isDark) {
    final s = _s;
    final bodyColor = isDark ? AppTheme.textMuted : const Color(0xFF475569);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          isAr
              ? 'نحن هنا لمساعدتك في العثور على القطعة المناسبة أو متابعة طلباتك.'
              : 'We’re here to help you find the right part or track your orders.',
          style: TextStyle(color: bodyColor, height: 1.6),
        ),
        const SizedBox(height: 18),
        _actionTile(
          icon: Icons.chat,
          color: const Color(0xFF16A34A),
          title: isAr ? 'واتساب' : 'WhatsApp',
          subtitle: '+${s.whatsappDigits}',
          onTap: () => _launch(Uri.parse('https://wa.me/${s.whatsappDigits}')),
          isDark: isDark,
        ),
        const SizedBox(height: 10),
        _actionTile(
          icon: Icons.phone,
          color: AppTheme.copper,
          title: isAr ? 'اتصال هاتفي' : 'Call Us',
          subtitle: s.phoneTel,
          onTap: () => _launch(Uri.parse('tel:${s.phoneTel}')),
          isDark: isDark,
        ),
        const SizedBox(height: 10),
        _actionTile(
          icon: Icons.email_outlined,
          color: const Color(0xFF1F3A5F),
          title: isAr ? 'البريد الإلكتروني' : 'Email',
          subtitle: s.supportEmail,
          onTap: () => _launch(Uri.parse('mailto:${s.supportEmail}')),
          isDark: isDark,
        ),
        const SizedBox(height: 16),
        _card(
          color: isDark ? AppTheme.cardBg : Colors.white,
          border: isDark ? AppTheme.borderSlate : const Color(0xFFE2E8F0),
          title: isAr ? 'ساعات العمل' : 'Working Hours',
          body: isAr
              ? 'السبت - الخميس: 8:00 صباحاً - 10:00 مساءً'
              : 'Sat – Thu: 8:00 AM – 10:00 PM',
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _care(bool isDark) {
    final s = _s;
    final bodyColor = isDark ? AppTheme.textMuted : const Color(0xFF475569);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          isAr
              ? 'خدمة العملاء المباشرة — تواصل فوري عبر واتساب أو الهاتف.'
              : 'Live customer care — reach us instantly via WhatsApp or phone.',
          style: TextStyle(color: bodyColor, height: 1.6),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () => _launch(
              Uri.parse(
                'https://wa.me/${s.whatsappDigits}?text=${Uri.encodeComponent(isAr ? "مرحباً، أحتاج مساعدة بخصوص طلب في موجود أوتو" : "Hi, I need help with a Mawjood Auto order")}',
              ),
            ),
            icon: const Icon(Icons.support_agent),
            label: Text(isAr ? 'محادثة مباشرة' : 'Live Help Chat'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => _launch(Uri.parse('tel:${s.phoneTel}')),
            icon: const Icon(Icons.phone),
            label: Text(isAr ? 'اتصال هاتفي' : 'Call Support'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.copper,
              side: const BorderSide(color: AppTheme.copper),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _faq(bool isDark) {
    final items = isAr
        ? const [
            ('هل القطع أصلية؟', 'نعم، جميع القطع جديدة وأصلية 100% مع الضمان.'),
            ('كم مدة التوصيل؟', 'عادةً خلال ساعتين إلى 24 ساعة داخل قطر.'),
            ('هل يمكن الدفع عند الاستلام؟', 'نعم، إذا كان خيار COD مفعّلاً من إعدادات المنصة.'),
          ]
        : const [
            ('Are parts genuine?', 'Yes — 100% brand-new OEM parts with warranty.'),
            ('Delivery time?', 'Usually 2–24 hours within Qatar.'),
            ('Cash on delivery?', 'Yes, when COD is enabled in platform settings.'),
          ];

    return Column(
      children: [
        for (final item in items) ...[
          _card(
            color: isDark ? AppTheme.cardBg : Colors.white,
            border: isDark ? AppTheme.borderSlate : const Color(0xFFE2E8F0),
            title: item.$1,
            body: item.$2,
            isDark: isDark,
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }

  Widget _card({
    required Color color,
    required Color border,
    required String title,
    required String body,
    required bool isDark,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 14,
              color: isDark ? AppTheme.textWhite : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: TextStyle(
              height: 1.55,
              fontSize: 13,
              color: isDark ? AppTheme.textMuted : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return Material(
      color: isDark ? AppTheme.cardBg : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? AppTheme.borderSlate : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withValues(alpha: 0.12),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: isDark
                            ? AppTheme.textWhite
                            : const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: isDark
                            ? AppTheme.textMuted
                            : const Color(0xFF64748B),
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: isDark ? AppTheme.textMuted : const Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
