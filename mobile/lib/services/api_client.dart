import 'package:dio/dio.dart';

import '../config/supabase_config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  String? _authToken;

  // Configure Dio to avoid unhandled console noise on expected 4xx telemetry misses.
  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: SupabaseConfig.restUrl,
        headers: SupabaseConfig.defaultHeaders,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        validateStatus: (status) => status != null && status < 500,
      ),
    );
  }

  void setAuthToken(String? token) {
    _authToken = token;
    dio.options.headers = {
      ...SupabaseConfig.defaultHeaders,
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Map<String, dynamic> get _headers => {
        ...SupabaseConfig.defaultHeaders,
        if (_authToken != null && _authToken!.isNotEmpty)
          'Authorization': 'Bearer $_authToken',
      };

  /// Accepts `/parts?select=*` style paths. Builds a single Uri so PostgREST
  /// operators and Arabic make/model values are not double-encoded.
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    final opts = Options(headers: _headers);
    final normalized = path.startsWith('/') ? path : '/$path';

    if (queryParameters != null && queryParameters.isNotEmpty) {
      return dio.get(normalized, queryParameters: queryParameters, options: opts);
    }

    final full = '${SupabaseConfig.restUrl}$normalized';
    return dio.getUri(Uri.parse(full), options: opts);
  }

  Future<Response> post(String path, {dynamic data}) {
    return dio.post(
      path,
      data: data,
      options: Options(
        headers: {
          ..._headers,
          'Prefer': 'return=minimal',
        },
      ),
    );
  }

  Future<Response> patch(String path, {dynamic data}) {
    return dio.patch(
      path,
      data: data,
      options: Options(
        headers: {
          ..._headers,
          'Prefer': 'return=minimal',
        },
      ),
    );
  }

  Future<Response> delete(String path) {
    return dio.delete(path, options: Options(headers: _headers));
  }
}
