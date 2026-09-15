import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemePreference { system, light, dark }

/// Persisted theme controller: System / Light / Dark.
class ThemeNotifier extends ChangeNotifier {
  ThemeNotifier._();
  static final ThemeNotifier instance = ThemeNotifier._();

  static const _prefsKey = 'mawjood_theme_preference';

  AppThemePreference _preference = AppThemePreference.system;
  bool _ready = false;

  AppThemePreference get preference => _preference;
  bool get isReady => _ready;

  ThemeMode get themeMode {
    switch (_preference) {
      case AppThemePreference.light:
        return ThemeMode.light;
      case AppThemePreference.dark:
        return ThemeMode.dark;
      case AppThemePreference.system:
        return ThemeMode.system;
    }
  }

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      _preference = switch (raw) {
        'light' => AppThemePreference.light,
        'dark' => AppThemePreference.dark,
        _ => AppThemePreference.system,
      };
    } catch (_) {
      _preference = AppThemePreference.system;
    } finally {
      _ready = true;
      notifyListeners();
    }
  }

  Future<void> setPreference(AppThemePreference value) async {
    if (_preference == value) return;
    _preference = value;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = switch (value) {
        AppThemePreference.light => 'light',
        AppThemePreference.dark => 'dark',
        AppThemePreference.system => 'system',
      };
      await prefs.setString(_prefsKey, key);
    } catch (_) {}
  }
}
