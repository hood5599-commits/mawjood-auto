import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';
import 'error_logger_platform_stub.dart'
    if (dart.library.io) 'error_logger_platform_io.dart' as platform_info;

/// Logs unique app sessions so mobile traffic can appear on the admin dashboard.
class AnalyticsService {
  AnalyticsService._();
  static final AnalyticsService instance = AnalyticsService._();

  static const _sessionKey = 'mawjood_analytics_session_day';

  Future<void> trackAppLaunch() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().substring(0, 10);
      final last = prefs.getString(_sessionKey);
      final isNewSession = last != today;
      if (isNewSession) {
        await prefs.setString(_sessionKey, today);
      }

      final platformName =
          kIsWeb ? 'web_pwa' : platform_info.detectPlatformName();
      final deviceOs = kIsWeb ? 'Web Browser' : platform_info.detectDeviceOs();
      final session = AuthService().session;

      final payload = <String, dynamic>{
        'event_type': isNewSession ? 'unique_visit' : 'app_open',
        'platform': platformName,
        'device_os': deviceOs,
        'app_version': '1.0.0',
        'source': 'mobile_flutter',
        'user_info': session?.displayPhone.isNotEmpty == true
            ? session!.displayPhone
            : (session?.user?['id']?.toString() ?? 'guest'),
        'created_at': DateTime.now().toIso8601String(),
      };

      // Best-effort only — never throw / never spam console.
      if (await _tryRpc(platformName, deviceOs, isNewSession)) return;
      if (await _tryInsert('app_analytics', payload)) return;
      await _tryInsert('site_traffic', {
        ...payload,
        'path': '/mobile',
        'referrer': 'flutter_app',
      });
    } catch (_) {
      // Telemetry must never affect UX or console noise.
    }
  }

  Future<bool> _tryRpc(
    String platformName,
    String deviceOs,
    bool isUnique,
  ) async {
    try {
      await Supabase.instance.client.rpc(
        'increment_app_visits',
        params: {
          'p_platform': platformName,
          'p_device_os': deviceOs,
          'p_unique': isUnique,
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _tryInsert(String table, Map<String, dynamic> payload) async {
    try {
      await Supabase.instance.client.from(table).insert(payload);
      return true;
    } catch (_) {
      return false;
    }
  }
}
