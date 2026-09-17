import 'dart:async';

import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../services/cart_service.dart';
import '../../services/favorites_service.dart';
import '../../services/notification_center_service.dart';
import '../../services/order_notification_service.dart';
import '../../services/admin_notification_service.dart';
import '../../widgets/ai_chatbot_sheet.dart';
import '../../widgets/glass_chrome.dart';
import '../../widgets/image_action_card.dart';
import '../../widgets/onboarding_walkthrough.dart';
import 'cart_screen.dart';
import 'catalog_destinations.dart';
import 'notifications_screen.dart';
import 'quote_request_screen.dart';

class HomeScreen extends StatefulWidget {
  final String lang;
  final VoidCallback? onToggleLang;

  const HomeScreen({
    super.key,
    this.lang = 'ar',
    this.onToggleLang,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _oemCtrl = TextEditingController();
  final _statsPageCtrl = PageController();
  Timer? _statsTimer;
  int _statsIndex = 0;

  bool get isAr => widget.lang == 'ar';
  String get _lang => widget.lang;

  List<_StatSlide> get _slides => [
        _StatSlide(
          title: isAr ? 'متوسط سرعة التوصيل' : 'Average delivery speed',
          value: isAr ? 'ساعتان - 24 ساعة' : '2 – 24 hours',
          icon: Icons.bolt_outlined,
        ),
        _StatSlide(
          title: isAr ? 'القطع المتوفرة' : 'Parts available',
          value: isAr ? '+500 قطعة أصلية ومعتمدة' : '+500 genuine certified parts',
          icon: Icons.inventory_2_outlined,
        ),
        _StatSlide(
          title: isAr ? 'الكراجات المعتمدة' : 'Verified garages',
          value: isAr ? '+15 كراج معتمد' : '+15 verified garages',
          icon: Icons.storefront_outlined,
        ),
      ];

  @override
  void initState() {
    super.initState();
    FavoritesService.instance.loadFavorites();
    OrderNotificationService.instance.startTracking(lang: widget.lang);
    AdminNotificationService.instance.startListening(lang: widget.lang);
    NotificationCenterService.instance.start(lang: widget.lang);
    _statsTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_statsPageCtrl.hasClients) return;
      final next = (_statsIndex + 1) % _slides.length;
      _statsPageCtrl.animateToPage(
        next,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        OnboardingWalkthrough.showIfNeeded(context, lang: widget.lang);
      }
    });
  }

  @override
  void dispose() {
    _statsTimer?.cancel();
    _statsPageCtrl.dispose();
    _oemCtrl.dispose();
    OrderNotificationService.instance.stopTracking();
    AdminNotificationService.instance.stopListening();
    NotificationCenterService.instance.stop();
    super.dispose();
  }

  void _openAbboud() {
    AiChatbotSheet.showModal(context, lang: _lang);
  }

  void _submitOem() {
    final q = _oemCtrl.text.trim();
    if (q.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CategoryTreeScreen(
          lang: _lang,
          initialOemQuery: q,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: _buildAppBar(),
        floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
        floatingActionButton: Padding(
          padding: const EdgeInsets.only(bottom: 78),
          child: TactileScale(
            onTap: _openAbboud,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.navy, AppTheme.obsidianSoft],
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: AppTheme.copper.withValues(alpha: 0.65),
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.copper.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      color: AppTheme.copper,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.smart_toy_outlined,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isAr ? 'اسأل عبود' : 'Ask Abboud',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        body: RefreshIndicator(
          color: AppTheme.copper,
          onRefresh: () async {
            await NotificationCenterService.instance.refresh();
          },
          child: ListView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            children: [
              _buildStatsBanner(),
              const SizedBox(height: 16),
              ImageActionCard(
                title: isAr
                    ? 'امسح استمارة سيارتك الآن'
                    : 'Scan your registration now',
                subtitle: isAr
                    ? 'استخراج VIN فوري لمطابقة قطع 100% مع سيارتك'
                    : 'Instant VIN extraction for 100% fitment accuracy',
                icon: Icons.document_scanner_outlined,
                assetImage: 'assets/images/cards/estimara_bg.jpg',
                height: 156,
                badge: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.copper,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isAr ? 'تنبيه' : 'Alert',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => EstimaraScanScreen(lang: _lang),
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),
              _buildOemSearchBar(),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ImageActionCard(
                      title: isAr ? 'البحث البصري' : 'Visual Search',
                      subtitle: isAr
                          ? 'اختر سيارتك بالبطاقات خطوة بخطوة'
                          : 'Pick your car step by step',
                      icon: Icons.dashboard_customize_outlined,
                      assetImage: 'assets/images/cards/visual_search_bg.jpg',
                      height: 168,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => VisualSearchScreen(lang: _lang),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ImageActionCard(
                      title: isAr ? 'كتالوج شجرة التصفية' : 'Category Tree',
                      subtitle: isAr
                          ? 'تصفح حسب المجموعات والمصنعين'
                          : 'Browse by groups & makers',
                      icon: Icons.account_tree_outlined,
                      assetImage: 'assets/images/cards/tree_catalog_bg.jpg',
                      height: 168,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => CategoryTreeScreen(lang: _lang),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ImageActionCard(
                title: isAr
                    ? 'طلب تسعيرة قطعة غير متوفرة'
                    : 'Request unavailable part quote',
                subtitle: isAr
                    ? 'أرسل بيانات القطعة أو صورتها وسنوفرها لك من الكراجات المعتمدة'
                    : 'Send part details or a photo — sourced from verified garages',
                icon: Icons.request_quote_outlined,
                assetImage: 'assets/images/cards/quote_request_bg.jpg',
                height: 148,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => QuoteRequestScreen(lang: _lang),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: AppTheme.navy,
      elevation: 0,
      titleSpacing: 16,
      title: Text(
        isAr ? 'موجود أوتو' : 'Mawjood Auto',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 17,
        ),
      ),
      actions: [
        TactileScale(
          onTap: () => widget.onToggleLang?.call(),
          child: Container(
            margin: const EdgeInsetsDirectional.only(end: 4),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
            ),
            child: Text(
              isAr ? 'English' : 'عربي',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
        ),
        AnimatedBuilder(
          animation: NotificationCenterService.instance,
          builder: (context, _) {
            final count = NotificationCenterService.instance.unreadCount;
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  tooltip: isAr ? 'الإشعارات' : 'Notifications',
                  icon: const Icon(
                    Icons.notifications_outlined,
                    color: Colors.white,
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => NotificationsScreen(lang: _lang),
                      ),
                    );
                  },
                ),
                if (count > 0)
                  Positioned(
                    top: 8,
                    right: isAr ? null : 6,
                    left: isAr ? 6 : null,
                    child: _badge('$count'),
                  ),
              ],
            );
          },
        ),
        AnimatedBuilder(
          animation: CartService(),
          builder: (context, _) {
            final count = CartService().totalCount;
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  tooltip: isAr ? 'السلة' : 'Cart',
                  icon: const Icon(
                    Icons.shopping_cart_outlined,
                    color: Colors.white,
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CartScreen(lang: _lang),
                      ),
                    );
                  },
                ),
                if (count > 0)
                  Positioned(
                    top: 8,
                    right: isAr ? null : 6,
                    left: isAr ? 6 : null,
                    child: _badge('$count'),
                  ),
              ],
            );
          },
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _badge(String text) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: const BoxDecoration(
        color: AppTheme.copper,
        shape: BoxShape.circle,
      ),
      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildStatsBanner() {
    final slides = _slides;
    return Column(
      children: [
        SizedBox(
          height: 96,
          child: PageView.builder(
            controller: _statsPageCtrl,
            itemCount: slides.length,
            onPageChanged: (i) => setState(() => _statsIndex = i),
            itemBuilder: (context, i) {
              final s = slides[i];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 1),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.navy, AppTheme.obsidianSoft],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppTheme.copper.withValues(alpha: 0.35),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.copper.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(s.icon, color: AppTheme.copper),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            s.title,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            s.value,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15.5,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(slides.length, (i) {
            final active = i == _statsIndex;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active
                    ? AppTheme.copper
                    : AppTheme.copper.withValues(alpha: 0.28),
                borderRadius: BorderRadius.circular(8),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildOemSearchBar() {
    return Container(
      decoration: AppTheme.cardDecoration(context, radius: 16),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: TextField(
        controller: _oemCtrl,
        textInputAction: TextInputAction.search,
        onSubmitted: (_) => _submitOem(),
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppTheme.textOf(context),
          letterSpacing: 0.4,
        ),
        decoration: InputDecoration(
          hintText: isAr
              ? 'ابحث برقم القطعة فقط (OEM Number)...'
              : 'Search by OEM Part Number only...',
          hintStyle: TextStyle(
            color: AppTheme.mutedOf(context),
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
          prefixIcon: Icon(Icons.tag, color: AppTheme.mutedOf(context)),
          suffixIcon: IconButton(
            onPressed: _submitOem,
            icon: const Icon(Icons.search, color: AppTheme.copper),
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

class _StatSlide {
  final String title;
  final String value;
  final IconData icon;

  const _StatSlide({
    required this.title,
    required this.value,
    required this.icon,
  });
}
