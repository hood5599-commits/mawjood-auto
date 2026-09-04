import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/supabase_config.dart';
import 'api_client.dart';

class AuthSession {
  final String? token;
  final String? email;
  final String? phone;
  final String role;
  final Map<String, dynamic>? user;
  final String? fullName;

  const AuthSession({
    this.token,
    this.email,
    this.phone,
    this.role = 'customer',
    this.user,
    this.fullName,
  });

  bool get isLoggedIn => token != null && token!.isNotEmpty;
  bool get isDriver =>
      role == 'driver' || (email?.endsWith('@driver.mawjood.com') ?? false);

  String get displayPhone =>
      phone ??
      user?['user_metadata']?['phone']?.toString() ??
      email?.split('@').first ??
      '';

  Map<String, dynamic> toJson() => {
        'token': token,
        'email': email,
        'phone': phone,
        'role': role,
        'user': user,
        'fullName': fullName,
      };

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? user;
    if (json['user'] is Map) {
      user = Map<String, dynamic>.from(json['user'] as Map);
    }
    String? metaName;
    final meta = user?['user_metadata'];
    if (meta is Map) {
      metaName = meta['full_name']?.toString();
    }
    return AuthSession(
      token: json['token']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      role: (json['role'] ?? 'customer').toString(),
      user: user,
      fullName: json['fullName']?.toString() ?? metaName,
    );
  }
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  AuthSession? _session;
  AuthSession? get session => _session;
  bool get isLoggedIn => _session?.isLoggedIn ?? false;

  static const _sessionKey = 'mawjood_session';

  Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null || raw.isEmpty) {
      _session = null;
      return;
    }
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      _session = AuthSession.fromJson(map);
      ApiClient().setAuthToken(_session?.token);
    } catch (_) {
      _session = null;
    }
  }

  Future<void> saveSession(AuthSession session) async {
    _session = session;
    ApiClient().setAuthToken(session.token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionKey, jsonEncode(session.toJson()));
    if (session.phone != null && session.phone!.isNotEmpty) {
      await prefs.setString('customer_phone', session.phone!);
    }
    if (session.fullName != null && session.fullName!.isNotEmpty) {
      await prefs.setString('customer_name', session.fullName!);
    }
  }

  Future<void> clearSession() async {
    _session = null;
    ApiClient().setAuthToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
  }

  String _formatInput(String input, {String domain = 'customer.mawjood.com'}) {
    final trimmed = input.trim();
    if (RegExp(r'^\d+$').hasMatch(trimmed)) {
      return '$trimmed@$domain';
    }
    return trimmed;
  }

  Dio _authDio({String? token}) {
    return Dio(
      BaseOptions(
        baseUrl: SupabaseConfig.authUrl,
        headers: {
          'apikey': SupabaseConfig.apiKey,
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        validateStatus: (s) => s != null && s < 500,
      ),
    );
  }

  Future<AuthSession> login({
    required String identifier,
    required String password,
  }) async {
    final inputVal = identifier.trim();
    var formattedEmail = _formatInput(inputVal);
    final dio = _authDio();

    var response = await dio.post(
      '/token?grant_type=password',
      data: {'email': formattedEmail, 'password': password},
    );

    if (response.statusCode != 200 && RegExp(r'^\d+$').hasMatch(inputVal)) {
      for (final dom in ['driver.mawjood.com', 'garage.mawjood.com']) {
        final altEmail = '$inputVal@$dom';
        final altRes = await dio.post(
          '/token?grant_type=password',
          data: {'email': altEmail, 'password': password},
        );
        if (altRes.statusCode == 200) {
          response = altRes;
          formattedEmail = altEmail;
          break;
        }
      }
    }

    if (response.statusCode != 200) {
      throw Exception('invalid_credentials');
    }

    final data = Map<String, dynamic>.from(response.data as Map);
    final user = data['user'] is Map
        ? Map<String, dynamic>.from(data['user'] as Map)
        : null;
    var role = user?['user_metadata']?['role']?.toString() ?? 'customer';
    final email = user?['email']?.toString() ?? formattedEmail;
    if (email.endsWith('@driver.mawjood.com')) role = 'driver';
    if (email.endsWith('@garage.mawjood.com')) role = 'garage';
    if (email.endsWith('@admin.mawjood.com')) role = 'admin';

    final session = AuthSession(
      token: data['access_token']?.toString(),
      user: user,
      email: email,
      phone: inputVal,
      role: role,
      fullName: user?['user_metadata']?['full_name']?.toString(),
    );
    await saveSession(session);
    return session;
  }

  Future<AuthSession> registerCustomer({
    required String identifier,
    required String password,
    required String fullName,
  }) async {
    final formattedEmail = _formatInput(identifier);
    final dio = _authDio();

    final response = await dio.post(
      '/signup',
      data: {
        'email': formattedEmail,
        'password': password,
        'data': {
          'role': 'customer',
          'full_name': fullName,
          'phone': identifier.trim(),
        },
      },
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final msg = response.data is Map
          ? (response.data['msg'] ??
              response.data['error_description'] ??
              'registration_failed')
          : 'registration_failed';
      throw Exception(msg.toString());
    }

    final data = Map<String, dynamic>.from(response.data as Map);
    final token = data['access_token']?.toString() ??
        data['session']?['access_token']?.toString();
    final user = data['user'] is Map
        ? Map<String, dynamic>.from(data['user'] as Map)
        : null;

    final session = AuthSession(
      token: token,
      user: user,
      email: formattedEmail,
      phone: identifier.trim(),
      role: 'customer',
      fullName: fullName,
    );
    await saveSession(session);
    return session;
  }

  Future<void> updateProfile(Map<String, dynamic> metadata) async {
    final token = _session?.token;
    if (token == null) throw Exception('not_authenticated');

    final response = await _authDio(token: token).put(
      '/user',
      data: {'data': metadata},
    );
    if (response.statusCode != 200) {
      throw Exception('update_failed');
    }

    final updated = Map<String, dynamic>.from(_session!.user ?? {});
    final meta = Map<String, dynamic>.from(
      (updated['user_metadata'] as Map?) ?? {},
    );
    meta.addAll(metadata);
    updated['user_metadata'] = meta;

    await saveSession(
      AuthSession(
        token: _session!.token,
        email: _session!.email,
        phone: metadata['phone']?.toString() ?? _session!.phone,
        role: _session!.role,
        user: updated,
        fullName: metadata['full_name']?.toString() ?? _session!.fullName,
      ),
    );
  }

  Future<void> changePassword(String newPassword) async {
    final token = _session?.token;
    if (token == null) throw Exception('not_authenticated');
    if (newPassword.length < 6) throw Exception('password_too_short');

    final response = await _authDio(token: token).put(
      '/user',
      data: {'password': newPassword},
    );
    if (response.statusCode != 200) {
      throw Exception('password_update_failed');
    }
  }

  Future<void> deleteAccount() async {
    final token = _session?.token;
    if (token == null) throw Exception('not_authenticated');

    await _authDio(token: token).put(
      '/user',
      data: {
        'data': {
          'account_deleted': true,
          'deleted_at': DateTime.now().toIso8601String(),
        },
      },
    );

    try {
      await ApiClient().post('/rpc/delete_own_account', data: {});
    } catch (_) {}

    await clearSession();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('customer_name');
    await prefs.remove('customer_phone');
    await prefs.remove('customer_address');
    await prefs.remove('customer_code');
  }
}
