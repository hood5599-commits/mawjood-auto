import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../services/onboarding_service.dart';

class OnboardingWalkthrough {
  static Future<void> showIfNeeded(
    BuildContext context, {
    required String lang,
  }) async {
    if (await OnboardingService.hasCompleted()) return;
    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (_) => _OnboardingSheet(lang: lang),
    );
  }
}

class _OnboardingSheet extends StatefulWidget {
  final String lang;
  const _OnboardingSheet({required this.lang});

  @override
  State<_OnboardingSheet> createState() => _OnboardingSheetState();
}

class _OnboardingSheetState extends State<_OnboardingSheet> {
  final _pageCtrl = PageController();
  int _page = 0;

  bool get isAr => widget.lang == 'ar';

  List<_OnboardPage> get _pages => [
        _OnboardPage(
          icon: Icons.document_scanner_outlined,
          titleAr: 'الفحص الذكي بالاستمارة والشاصي',
          titleEn: 'AI VIN & Registration Scan',
          bodyAr:
              'ارفع صورة الاستمارة أو أدخل رقم الشاصي ليطابق النظام القطعة مع سيارتك فوراً بدقة عالية.',
          bodyEn:
              'Upload your registration or enter a VIN to instantly match genuine parts to your vehicle.',
        ),
        _OnboardPage(
          icon: Icons.account_tree_outlined,
          titleAr: 'كتالوج القطع وشجرة التوافق',
          titleEn: 'Catalog & Fitment Tree',
          bodyAr:
              'تصفح الماركات والموديلات والسنوات بصرياً، واعثر على القطع المتوافقة عبر شجرة التصفية الذكية.',
          bodyEn:
              'Browse makes, models, and years visually and find compatible parts through the fitment tree.',
        ),
        _OnboardPage(
          icon: Icons.verified_outlined,
          titleAr: 'ضمان القطع الجديدة والتوصيل الفوري',
          titleEn: 'Genuine Parts & Fast Delivery',
          bodyAr:
              'قطع جديدة 100% مع توصيل سريع داخل قطر خلال ساعتين إلى 24 ساعة حسب المنطقة.',
          bodyEn:
              '100% brand-new genuine parts with fast Qatar delivery — typically 2 to 24 hours.',
        ),
      ];

  Future<void> _finish() async {
    await OnboardingService.markCompleted();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = _pages;
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Container(
        height: MediaQuery.of(context).size.height * 0.78,
        decoration: const BoxDecoration(
          color: Color(0xFF090D16),
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
          border: Border(top: BorderSide(color: Color(0x14FFFFFF))),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 12, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        isAr
                            ? 'مرحباً بك في موجود أوتو'
                            : 'Welcome to Mawjood Auto',
                        style: const TextStyle(
                          color: Color(0xFFF8FAFC),
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: _finish,
                      child: Text(
                        isAr ? 'تخطي' : 'Skip',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageCtrl,
                  itemCount: pages.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) {
                    final p = pages[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppTheme.copper.withValues(alpha: 0.25),
                                  const Color(0xFF1A2232),
                                ],
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.copper.withValues(alpha: 0.5),
                              ),
                            ),
                            child: Icon(p.icon, size: 42, color: AppTheme.copper),
                          ),
                          const SizedBox(height: 28),
                          Text(
                            isAr ? p.titleAr : p.titleEn,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFFF8FAFC),
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            isAr ? p.bodyAr : p.bodyEn,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 14,
                              height: 1.55,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(pages.length, (i) {
                  final active = i == _page;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: active ? AppTheme.copper : const Color(0xFF334155),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  );
                }),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_page < pages.length - 1) {
                        _pageCtrl.nextPage(
                          duration: const Duration(milliseconds: 280),
                          curve: Curves.easeOutCubic,
                        );
                      } else {
                        _finish();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.copper,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      _page < pages.length - 1
                          ? (isAr ? 'التالي' : 'Next')
                          : (isAr ? 'ابدأ الاستكشاف' : 'Get Started'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardPage {
  final IconData icon;
  final String titleAr;
  final String titleEn;
  final String bodyAr;
  final String bodyEn;

  const _OnboardPage({
    required this.icon,
    required this.titleAr,
    required this.titleEn,
    required this.bodyAr,
    required this.bodyEn,
  });
}
