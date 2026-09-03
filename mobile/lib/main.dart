import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'config/theme.dart';
import 'screens/customer/cart_screen.dart';
import 'screens/customer/catalog_screen.dart';
import 'screens/customer/profile_screen.dart';
import 'screens/welcome_screen.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService().loadSession();

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
    return MaterialApp(
      title: 'Mawjood Auto',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: WelcomeScreen(lang: _lang, onToggleLang: _toggleLanguage),
    );
  }
}

/// Customer-only bottom navigation (Shop / Cart / Profile).
/// Driver portal is reachable only via authenticated backstage login.
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
      CatalogScreen(initialLang: widget.lang),
      CartScreen(lang: widget.lang),
      ProfileScreen(
        lang: widget.lang,
        onLogout: _logout,
        onToggleLang: widget.onToggleLang,
      ),
    ];

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: IndexedStack(index: _currentIndex, children: screens),
        bottomNavigationBar: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            backgroundColor: const Color(0xFF090D16),
            selectedItemColor: AppTheme.copper,
            unselectedItemColor: Colors.white54,
            type: BottomNavigationBarType.fixed,
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 11,
              fontFamily: 'Cairo',
            ),
            unselectedLabelStyle: const TextStyle(
              fontSize: 11,
              fontFamily: 'Cairo',
            ),
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.storefront_outlined),
                activeIcon: const Icon(Icons.storefront),
                label: isAr ? 'المتجر' : 'Shop',
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.shopping_cart_outlined),
                activeIcon: const Icon(Icons.shopping_cart),
                label: isAr ? 'السلة' : 'Cart',
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person_outline),
                activeIcon: const Icon(Icons.person),
                label: isAr ? 'حسابي' : 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
