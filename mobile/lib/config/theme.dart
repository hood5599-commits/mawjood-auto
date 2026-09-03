import 'package:flutter/material.dart';

class AppTheme {
  // Obsidian & Copper Palette
  static const Color obsidian = Color(0xFF090D16);
  static const Color obsidianSoft = Color(0xFF0F172A);
  static const Color cardBg = Color(0xFF0F172A);
  static const Color surfaceSlate = Color(0xFF1E293B);
  static const Color borderSlate = Color(0xFF334155);

  static const Color copper = Color(0xFFEA580C);
  static const Color copperLight = Color(0xFFF97316);
  static const Color copperDeep = Color(0xFFC2410C);
  static const Color copperTint = Color(0xFFFFF7ED);

  static const Color textWhite = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);

  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidian,
      primaryColor: copper,
      fontFamily: 'Cairo',
      cardColor: cardBg,
      colorScheme: const ColorScheme.dark(
        primary: copper,
        secondary: copperLight,
        surface: cardBg,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidian,
        elevation: 0,
        centerTitle: false,
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
