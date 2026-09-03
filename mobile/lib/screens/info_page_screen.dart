import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/theme.dart';
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

  static const whatsapp = '97455000000';
  static const supportEmail = 'support@mawjood.com';
  static const phone = '+97455000000';

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

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: AppTheme.obsidian,
          title: Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: switch (type) {
              InfoPageType.about => _about(),
              InfoPageType.contact => _contact(),
              InfoPageType.faq => _faq(),
              InfoPageType.care => _care(),
            },
          ),
        ),
      ),
    );
  }

  Widget _about() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Center(child: MawjoodLogo(size: 64)),
        const SizedBox(height: 16),
        Text(
          isAr
              ? 'موجود أوتو هي المنصة الرقمية الرائدة في قطر لربط ملاك السيارات بكراجات ومحلات قطع الغيار المعتمدة ومندوبي التوصيل في مكان واحد.'
              : 'Mawjood Auto is Qatar’s leading digital platform connecting car owners with certified garages, parts stores, and delivery drivers.',
          style: const TextStyle(
            fontSize: 14.5,
            height: 1.7,
            color: Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 16),
        _card(
          color: const Color(0xFFFDF1E3),
          border: const Color(0xFFFED7AA),
          title: isAr ? 'رؤيتنا' : 'Our Vision',
          body: isAr
              ? 'تحويل البحث عن قطع الغيار من رحلة متعبة إلى تجربة بنقرة زر.'
              : 'Turning spare-parts search into a one-tap experience.',
        ),
        const SizedBox(height: 12),
        _card(
          color: const Color(0xFFE8F2FC),
          border: const Color(0xFFBFDBFE),
          title: isAr ? 'رسالتنا' : 'Our Mission',
          body: isAr
              ? 'توفير قطع موثوقة بأفضل الأسعار وأعلى مستويات الأمان والسرعة.'
              : 'Trusted parts at fair prices with speed and safety.',
        ),
      ],
    );
  }

  Widget _contact() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          isAr
              ? 'نحن هنا لمساعدتك في العثور على القطعة المناسبة أو متابعة طلباتك.'
              : 'We’re here to help you find the right part or track your orders.',
          style: const TextStyle(color: Color(0xFF475569), height: 1.6),
        ),
        const SizedBox(height: 18),
        _actionTile(
          icon: Icons.chat,
          color: const Color(0xFF16A34A),
          title: isAr ? 'واتساب' : 'WhatsApp',
          subtitle: '+$whatsapp',
          onTap: () => _launch(Uri.parse('https://wa.me/$whatsapp')),
        ),
        const SizedBox(height: 10),
        _actionTile(
          icon: Icons.phone,
          color: AppTheme.copper,
          title: isAr ? 'اتصال هاتفي' : 'Call Us',
          subtitle: phone,
          onTap: () => _launch(Uri.parse('tel:$phone')),
        ),
        const SizedBox(height: 10),
        _actionTile(
          icon: Icons.email_outlined,
          color: const Color(0xFF1F3A5F),
          title: isAr ? 'البريد الإلكتروني' : 'Email',
          subtitle: supportEmail,
          onTap: () => _launch(Uri.parse('mailto:$supportEmail')),
        ),
        const SizedBox(height: 16),
        _card(
          color: Colors.white,
          border: const Color(0xFFE2E8F0),
          title: isAr ? 'ساعات العمل' : 'Working Hours',
          body: isAr
              ? 'السبت - الخميس: 8:00 صباحاً - 10:00 مساءً'
              : 'Sat – Thu: 8:00 AM – 10:00 PM',
        ),
      ],
    );
  }

  Widget _care() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          isAr
              ? 'خدمة العملاء المباشرة — تواصل فوري عبر واتساب أو الهاتف.'
              : 'Live customer care — reach us instantly via WhatsApp or phone.',
          style: const TextStyle(color: Color(0xFF475569), height: 1.6),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () => _launch(
              Uri.parse(
                'https://wa.me/$whatsapp?text=${Uri.encodeComponent(isAr ? "مرحباً، أحتاج مساعدة بخصوص طلب في موجود أوتو" : "Hi, I need help with a Mawjood Auto order")}',
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
            onPressed: () => _launch(Uri.parse('tel:$phone')),
            icon: const Icon(Icons.phone_in_talk),
            label: Text(isAr ? 'اتصل الآن' : 'Call Now'),
          ),
        ),
      ],
    );
  }

  Widget _faq() {
    final items = isAr
        ? const [
            (
              'كيف أضمن أن القطعة مطابقة لسيارتي؟',
              'نطابق VIN والماركة والموديل والسنة تلقائياً، ويمكنك طلب تأكيد الكراج قبل الشراء.'
            ),
            (
              'كم يستغرق وصول الطلب؟',
              'من ساعتين إلى 24 ساعة داخل المناطق الرئيسية في قطر بعد تأكيد التوفر.'
            ),
            (
              'ماذا لو كانت القطعة غير مطابقة؟',
              'استرجاع أو استبدال مجاني خلال 3 أيام بشرط عدم الاستخدام وبقاء التغليف.'
            ),
          ]
        : const [
            (
              'How do I ensure the part fits my car?',
              'We match VIN, make, model and year automatically, and you can ask the garage to confirm.'
            ),
            (
              'How long does delivery take?',
              'Typically 2–24 hours within major Qatar areas after stock confirmation.'
            ),
            (
              'What if the part is wrong?',
              'Free return/replacement within 3 days if unused and in original packaging.'
            ),
          ];

    return Column(
      children: items
          .map(
            (e) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _card(
                color: Colors.white,
                border: const Color(0xFFE2E8F0),
                title: e.$1,
                body: e.$2,
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _card({
    required Color color,
    required Color border,
    required String title,
    required String body,
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
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              color: Color(0xFF1F3A5F),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
              fontSize: 13,
              height: 1.55,
              color: Color(0xFF475569),
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
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: color.withValues(alpha: 0.12),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.open_in_new, size: 18, color: AppTheme.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
