import 'package:flutter/foundation.dart';

import 'api_client.dart';
import 'auth_service.dart';
import 'error_logger_platform_stub.dart'
    if (dart.library.io) 'error_logger_platform_io.dart' as platform_info;

class ErrorLogger {
  static Future<void> log({
    required String message,
    String? stackTrace,
    String? componentName,
    String severity = 'HIGH',
    String? errorType,
  }) async {
    try {
      final String platformName;
      final String osDetails;

      if (kIsWeb) {
        platformName = 'web_pwa';
        osDetails = 'Web Browser';
      } else {
        platformName = platform_info.detectPlatformName();
        osDetails = platform_info.detectDeviceOs();
      }

      final session = AuthService().session;
      final currentUserInfo = _resolveUserInfo(session);

      final payload = {
        'platform': platformName,
        'device_os': osDetails,
        'app_version': '1.0.0',
        'component_name': componentName ?? 'FlutterApp',
        'error_type': errorType ?? 'FlutterError',
        'severity': severity,
        'message': message,
        'stack_trace': stackTrace,
        'user_info': currentUserInfo,
      };

      await ApiClient().post('/system_errors', data: payload);
    } catch (e, st) {
      debugPrint('[ErrorLogger] Failed to report telemetry: $e');
      debugPrint('$st');
    }
  }

  static String _resolveUserInfo(AuthSession? session) {
    if (session == null || !session.isLoggedIn) {
      return 'زائر';
    }
    final id = session.user?['id']?.toString();
    final phone = session.displayPhone;
    final email = session.email;
    if (id != null && id.isNotEmpty) return id;
    if (phone.isNotEmpty) return phone;
    if (email != null && email.isNotEmpty) return email;
    return 'زائر';
  }
}
