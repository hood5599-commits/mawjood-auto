import 'package:dio/dio.dart';

import '../config/supabase_config.dart';

class ErrorLogger {
  static final Dio _dio = Dio();

  static Future<void> logError(
    String message, {
    String? stackTrace,
    String? component,
    Map<String, dynamic>? extraData,
  }) async {
    try {
      final payload = {
        'error_message': message,
        'stack_trace': stackTrace,
        'component': component ?? 'mobile_app',
        'extra_data': extraData,
        'created_at': DateTime.now().toIso8601String(),
      };

      await _dio.post(
        '${SupabaseConfig.restUrl}/error_logs',
        data: payload,
        options: Options(headers: SupabaseConfig.defaultHeaders),
      );
    } catch (_) {
      // الصمت لتجنب التكرار المتسلسل للأخطاء
    }
  }
}
