import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Supabase connection settings.
/// Prefers values from `mobile/.env` (via flutter_dotenv) with hardcoded fallbacks.
class SupabaseConfig {
  static const String _fallbackUrl =
      'https://shszpcjmhkemqwborfwy.supabase.co';
  static const String _fallbackKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoc3pwY2ptaGtlbXF3Ym9yZnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDcxNzMsImV4cCI6MjA5OTY4MzE3M30.QycaUsYnhXX-uyeq3LVht_b1HVR0V0Tp72yMZUkdz2k';

  static String? _env(String key) {
    try {
      final value = dotenv.env[key]?.trim();
      if (value != null && value.isNotEmpty) return value;
    } catch (_) {
      // dotenv not loaded yet / missing asset — use fallbacks.
    }
    return null;
  }

  static String get url => _env('SUPABASE_URL') ?? _fallbackUrl;

  static String get apiKey => _env('SUPABASE_ANON_KEY') ?? _fallbackKey;

  static String get restUrl => '$url/rest/v1';
  static String get authUrl => '$url/auth/v1';

  static Map<String, String> get defaultHeaders => {
        'apikey': apiKey,
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  static Map<String, String> authHeaders(String? token) => {
        'apikey': apiKey,
        'Authorization': 'Bearer ${token ?? apiKey}',
        'Content-Type': 'application/json',
      };
}
