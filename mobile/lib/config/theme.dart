import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Premium automotive × Apple Glass design tokens.
class AppTheme {
  // ── Dynamic accent (Automotive Papaya Orange) ────────────────────────────
  static const Color copper = Color(0xFFFF6B00);
  static const Color copperLight = Color(0xFFFF8533);
  static const Color copperDeep = Color(0xFFE55A00);
  static const Color copperTint = Color(0xFFFFF4EC);
  static const Color papayaGlow = Color(0x33FF6B00);

  // ── Semantic ─────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);

  // ── Sovereign Royal Navy (headers / badges) ──────────────────────────────
  static const Color navy = Color(0xFF0B192C);
  static const Color navySoft = Color(0xFF112240);

  // ── Dark palette (Midnight Abyss) ────────────────────────────────────────
  static const Color obsidian = Color(0xFF050C16);
  static const Color obsidianSoft = Color(0xFF0E1B2E);
  static const Color cardBg = Color(0xFF0E1B2E);
  static const Color surfaceSlate = Color(0xFF112240);
  static const Color borderSlate = Color(0x14FFFFFF);
  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);

  // ── Light palette ────────────────────────────────────────────────────────
  static const Color lightScaffold = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFF8F9FA);
  static const Color lightSurface = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightText = Color(0xFF0B192C);
  static const Color lightMuted = Color(0xFF64748B);

  /// Soft ambient card shadow (light).
  static List<BoxShadow> get softShadow => const [
        BoxShadow(
          color: Color(0x08000000),
          blurRadius: 16,
          offset: Offset(0, 4),
        ),
      ];

  /// Deep diffused shadow (dark).
  static List<BoxShadow> get deepShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.45),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ];

  static List<BoxShadow> cardShadow(Brightness brightness) =>
      brightness == Brightness.dark ? deepShadow : softShadow;

  static Color scaffoldOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? obsidian
          : lightScaffold;

  static Color cardOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? cardBg : lightCard;

  static Color surfaceOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? surfaceSlate
          : lightSurface;

  static Color borderOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
          ? Colors.white.withValues(alpha: 0.08)
          : lightBorder;

  static Color textOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textWhite : lightText;

  static Color mutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textMuted : lightMuted;

  static BoxDecoration cardDecoration(BuildContext context, {double radius = 18}) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: dark ? cardBg : lightCard,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: dark ? Colors.white.withValues(alpha: 0.08) : lightBorder,
      ),
      boxShadow: cardShadow(Theme.of(context).brightness),
    );
  }

  static TextTheme _textTheme(Brightness brightness) {
    final base = brightness == Brightness.dark
        ? ThemeData.dark().textTheme
        : ThemeData.light().textTheme;
    final colored = base.apply(
      bodyColor: brightness == Brightness.dark ? textWhite : lightText,
      displayColor: brightness == Brightness.dark ? textWhite : lightText,
    );
    try {
      return GoogleFonts.cairoTextTheme(colored);
    } catch (_) {
      return colored.apply(fontFamily: 'Cairo');
    }
  }

  static PageTransitionsTheme get _pageTransitions => PageTransitionsTheme(
        builders: {
          for (final platform in TargetPlatform.values)
            platform: const CupertinoPageTransitionsBuilder(),
        },
      );

  static ThemeData get darkTheme {
    final text = _textTheme(Brightness.dark);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidian,
      primaryColor: copper,
      fontFamily: 'Cairo',
      textTheme: text,
      cardColor: cardBg,
      dividerColor: Colors.white.withValues(alpha: 0.08),
      colorScheme: const ColorScheme.dark(
        primary: copper,
        secondary: copperLight,
        surface: cardBg,
        error: danger,
        onPrimary: textWhite,
        onSurface: textWhite,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: navy,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        foregroundColor: textWhite,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: text.titleMedium?.copyWith(
          color: textWhite,
          fontWeight: FontWeight.w800,
          fontSize: 17,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: copper,
        unselectedItemColor: Colors.white54,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: copper,
          foregroundColor: textWhite,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: surfaceSlate,
        contentTextStyle: TextStyle(color: textWhite),
      ),
      pageTransitionsTheme: _pageTransitions,
      extensions: const [MawjoodTokens.dark],
    );
  }

  static ThemeData get lightTheme {
    final text = _textTheme(Brightness.light);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightScaffold,
      primaryColor: copper,
      fontFamily: 'Cairo',
      textTheme: text,
      cardColor: lightCard,
      dividerColor: lightBorder,
      colorScheme: const ColorScheme.light(
        primary: copper,
        secondary: copperLight,
        surface: lightCard,
        error: danger,
        onPrimary: textWhite,
        onSurface: lightText,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: navy,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        foregroundColor: textWhite,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: text.titleMedium?.copyWith(
          color: textWhite,
          fontWeight: FontWeight.w800,
          fontSize: 17,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: copper,
        unselectedItemColor: Color(0xFF94A3B8),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: copper,
          foregroundColor: textWhite,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        ),
      ),
      pageTransitionsTheme: _pageTransitions,
      extensions: const [MawjoodTokens.light],
    );
  }
}

/// Custom token extension for glass / badge / gradient surfaces.
@immutable
class MawjoodTokens extends ThemeExtension<MawjoodTokens> {
  final Color glassFill;
  final Color glassBorder;
  final Color badgeNavy;
  final Color discountBadge;
  final Color oemTagBg;
  final LinearGradient speedline;

  const MawjoodTokens({
    required this.glassFill,
    required this.glassBorder,
    required this.badgeNavy,
    required this.discountBadge,
    required this.oemTagBg,
    required this.speedline,
  });

  static const light = MawjoodTokens(
    glassFill: Color(0xCCFFFFFF),
    glassBorder: Color(0x33FFFFFF),
    badgeNavy: Color(0xFF0B192C),
    discountBadge: Color(0xFFFF6B00),
    oemTagBg: Color(0xFFF1F5F9),
    speedline: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF0B192C), Color(0xFF112240), Color(0xFFFF6B00)],
      stops: [0.0, 0.72, 1.0],
    ),
  );

  static const dark = MawjoodTokens(
    glassFill: Color(0x99112240),
    glassBorder: Color(0x14FFFFFF),
    badgeNavy: Color(0xFF0B192C),
    discountBadge: Color(0xFFFF6B00),
    oemTagBg: Color(0xFF112240),
    speedline: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF050C16), Color(0xFF0E1B2E), Color(0xFFFF6B00)],
      stops: [0.0, 0.7, 1.0],
    ),
  );

  @override
  MawjoodTokens copyWith({
    Color? glassFill,
    Color? glassBorder,
    Color? badgeNavy,
    Color? discountBadge,
    Color? oemTagBg,
    LinearGradient? speedline,
  }) {
    return MawjoodTokens(
      glassFill: glassFill ?? this.glassFill,
      glassBorder: glassBorder ?? this.glassBorder,
      badgeNavy: badgeNavy ?? this.badgeNavy,
      discountBadge: discountBadge ?? this.discountBadge,
      oemTagBg: oemTagBg ?? this.oemTagBg,
      speedline: speedline ?? this.speedline,
    );
  }

  @override
  MawjoodTokens lerp(ThemeExtension<MawjoodTokens>? other, double t) {
    if (other is! MawjoodTokens) return this;
    return MawjoodTokens(
      glassFill: Color.lerp(glassFill, other.glassFill, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      badgeNavy: Color.lerp(badgeNavy, other.badgeNavy, t)!,
      discountBadge: Color.lerp(discountBadge, other.discountBadge, t)!,
      oemTagBg: Color.lerp(oemTagBg, other.oemTagBg, t)!,
      speedline: speedline,
    );
  }
}

/// Frosted glass surface helper.
class GlassStyle {
  static Widget frost({
    required Widget child,
    double sigma = 18,
    BorderRadius? borderRadius,
    Color? fill,
    Color? border,
    List<BoxShadow>? shadows,
  }) {
    final radius = borderRadius ?? BorderRadius.circular(24);
    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: fill ?? Colors.white.withValues(alpha: 0.72),
            borderRadius: radius,
            border: Border.all(
              color: border ?? Colors.white.withValues(alpha: 0.22),
            ),
            boxShadow: shadows,
          ),
          child: child,
        ),
      ),
    );
  }
}
