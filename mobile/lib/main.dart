import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config/supabase_config.dart';
import 'config/theme.dart';
import 'screens/customer/favorites_screen.dart';
import 'screens/customer/home_screen.dart';
import 'screens/customer/order_tracker_screen.dart';
import 'screens/customer/profile_screen.dart';
import 'screens/welcome_screen.dart';
import 'services/active_vehicle_service.dart';
import 'services/admin_notification_service.dart';
import 'services/analytics_service.dart';
import 'services/auth_service.dart';
import 'services/error_logger.dart';
import 'services/notification_center_service.dart';
import 'services/order_notification_service.dart';
import 'services/platform_settings_service.dart';
import 'services/theme_notifier.dart';
import 'widgets/glass_chrome.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    ErrorLogger.log(
      severity: 'CRITICAL',
      componentName: details.library ?? 'UI Widget',
      errorType: details.exception.runtimeType.toString(),
      message: details.exceptionAsString(),
      stackTrace: details.stack?.toString(),
    );
  };

  PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
    ErrorLogger.log(
      severity: 'HIGH',
      componentName: 'AsyncEngine',
      errorType: error.runtimeType.toString(),
      message: error.toString(),
      stackTrace: stack.toString(),
    );
    return true;
  };

  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('Dotenv load skipped or failed: $e');
  }

  await Supabase.initialize(
    url: SupabaseConfig.url,
    publishableKey: SupabaseConfig.apiKey,
  );

  // Theme preference first to avoid first-frame flicker.
  await ThemeNotifier.instance.load();
  await PlatformSettingsService.instance.load(forceNetwork: false);

  await AuthService().loadSession();
  await ActiveVehicleService.instance.load();
  await OrderNotificationService.instance.init();
  await AdminNotificationService.instance.init();
  await NotificationCenterService.instance.init();
  AnalyticsService.instance.trackAppLaunch();

  // Refresh remote settings in background after first paint.
  // ignore: unawaited_futures
  PlatformSettingsService.instance.load(forceNetwork: true);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const MawjoodAutoApp());
}

class MawjoodAutoApp extends StatefulWidget {
  const MawjoodAutoApp({super.key});

  @override
  State<MawjoodAutoApp> createState() => _MawjoodAutoAppState();
}

class _MawjoodAutoAppState extends State<MawjoodAutoApp> {
  String _lang = 'ar';

  void _toggleLanguage() {
    setState(() => _lang = _lang == 'ar' ? 'en' : 'ar');
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ThemeNotifier.instance,
      builder: (context, _) {
        return MaterialApp(
          title: 'Mawjood Auto',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeNotifier.instance.themeMode,
          scrollBehavior: const _MawjoodScrollBehavior(),
          home: WelcomeScreen(lang: _lang, onToggleLang: _toggleLanguage),
        );
      },
    );
  }
}

class _MawjoodScrollBehavior extends MaterialScrollBehavior {
  const _MawjoodScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());
  }
}

/// Customer bottom navigation: Home / Orders / Favorites / Profile.
class MainNavigationWrapper extends StatefulWidget {
  final String lang;
  final VoidCallback onToggleLang;

  const MainNavigationWrapper({
    super.key,
    required this.lang,
    required this.onToggleLang,
  });

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 0;

  bool get isAr => widget.lang == 'ar';

  Future<void> _logout() async {
    await AuthService().clearSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => WelcomeScreen(
          lang: widget.lang,
          onToggleLang: widget.onToggleLang,
        ),
      ),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        lang: widget.lang,
        onToggleLang: widget.onToggleLang,
      ),
      OrderTrackerScreen(lang: widget.lang),
      FavoritesScreen(lang: widget.lang),
      ProfileScreen(
        lang: widget.lang,
        onLogout: _logout,
        onToggleLang: widget.onToggleLang,
      ),
    ];

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        extendBody: true,
        body: IndexedStack(index: _currentIndex, children: screens),
        bottomNavigationBar: FloatingGlassNavBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: [
            FloatingGlassNavItem(
              icon: Icons.home_outlined,
              activeIcon: Icons.home_rounded,
              label: isAr ? 'الرئيسية' : 'Home',
            ),
            FloatingGlassNavItem(
              icon: Icons.receipt_long_outlined,
              activeIcon: Icons.receipt_long,
              label: isAr ? 'طلباتي' : 'Orders',
            ),
            FloatingGlassNavItem(
              icon: Icons.favorite_border_rounded,
              activeIcon: Icons.favorite_rounded,
              label: isAr ? 'المفضلة' : 'Favorites',
            ),
            FloatingGlassNavItem(
              icon: Icons.person_outline,
              activeIcon: Icons.person,
              label: isAr ? 'حسابي' : 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
