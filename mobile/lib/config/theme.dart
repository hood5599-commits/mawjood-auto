import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  // Brand accents (shared)
  static const Color copper = Color(0xFFEA580C);
  static const Color copperLight = Color(0xFFF97316);
  static const Color copperDeep = Color(0xFFC2410C);
  static const Color copperTint = Color(0xFFFFF7ED);

  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);

  // Dark palette
  static const Color obsidian = Color(0xFF090D16);
  static const Color obsidianSoft = Color(0xFF0F172A);
  static const Color cardBg = Color(0xFF0F172A);
  static const Color surfaceSlate = Color(0xFF1E293B);
  static const Color borderSlate = Color(0xFF334155);
  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);

  // Light palette
  static const Color lightScaffold = Color(0xFFF8FAFC);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightText = Color(0xFF0F172A);
  static const Color lightMuted = Color(0xFF64748B);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: false,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidian,
      primaryColor: copper,
      fontFamily: 'Cairo',
      cardColor: cardBg,
      dividerColor: borderSlate,
      colorScheme: const ColorScheme.dark(
        primary: copper,
        secondary: copperLight,
        surface: cardBg,
        error: danger,
        onPrimary: textWhite,
        onSurface: textWhite,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidian,
        elevation: 0,
        centerTitle: false,
        foregroundColor: textWhite,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: obsidian,
        selectedItemColor: copper,
        unselectedItemColor: Colors.white54,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: copper,
          foregroundColor: textWhite,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: surfaceSlate,
        contentTextStyle: TextStyle(color: textWhite),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: false,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightScaffold,
      primaryColor: copper,
      fontFamily: 'Cairo',
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
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidian,
        elevation: 0,
        centerTitle: false,
        foregroundColor: textWhite,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: copper,
        unselectedItemColor: Color(0xFF94A3B8),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: copper,
          foregroundColor: textWhite,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }
}
