import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

class PlatformPaymentMethods {
  final bool codEnabled;
  final bool cardEnabled;
  final bool applePayEnabled;
  final bool googlePayEnabled;
  final bool payLaterEnabled;

  const PlatformPaymentMethods({
    this.codEnabled = true,
    this.cardEnabled = true,
    this.applePayEnabled = true,
    this.googlePayEnabled = true,
    this.payLaterEnabled = false,
  });

  factory PlatformPaymentMethods.fromJson(Map<String, dynamic>? json) {
    json ??= const {};
    bool flag(String a, [String? b, bool fallback = true]) {
      if (json![a] is bool) return json[a] as bool;
      if (b != null && json[b] is bool) return json[b] as bool;
      return fallback;
    }

    return PlatformPaymentMethods(
      codEnabled: flag('cod_enabled', null, true),
      cardEnabled: flag('card_enabled', null, true),
      applePayEnabled: flag('apple_pay_enabled', null, true),
      googlePayEnabled: flag('google_pay_enabled', null, true),
      payLaterEnabled: flag('pay_later_enabled', null, false),
    );
  }

  Map<String, dynamic> toJson() => {
        'cod_enabled': codEnabled,
        'card_enabled': cardEnabled,
        'apple_pay_enabled': applePayEnabled,
        'google_pay_enabled': googlePayEnabled,
        'pay_later_enabled': payLaterEnabled,
      };
}

class PlatformSocialLinks {
  final String instagram;
  final String x;
  final String tiktok;
  final String facebook;

  const PlatformSocialLinks({
    this.instagram = '',
    this.x = '',
    this.tiktok = '',
    this.facebook = '',
  });

  factory PlatformSocialLinks.fromJson(Map<String, dynamic>? json) {
    json ??= const {};
    return PlatformSocialLinks(
      instagram: (json['instagram'] ?? '').toString(),
      x: (json['x'] ?? json['twitter'] ?? '').toString(),
      tiktok: (json['tiktok'] ?? '').toString(),
      facebook: (json['facebook'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'instagram': instagram,
        'x': x,
        'tiktok': tiktok,
        'facebook': facebook,
      };
}

class PlatformSettings {
  final String supportPhone;
  final String supportWhatsapp;
  final String supportEmail;
  final PlatformSocialLinks socialLinks;
  final PlatformPaymentMethods paymentMethods;
  final bool maintenanceMode;

  const PlatformSettings({
    this.supportPhone = '97455000000',
    this.supportWhatsapp = '97455000000',
    this.supportEmail = 'support@mawjood.com',
    this.socialLinks = const PlatformSocialLinks(),
    this.paymentMethods = const PlatformPaymentMethods(),
    this.maintenanceMode = false,
  });

  String get whatsappDigits =>
      supportWhatsapp.replaceAll(RegExp(r'[^\d]'), '');

  String get phoneTel {
    final d = supportPhone.replaceAll(RegExp(r'[^\d+]'), '');
    if (d.startsWith('+')) return d;
    if (d.startsWith('00')) return '+${d.substring(2)}';
    return d.startsWith('974') ? '+$d' : '+$d';
  }

  factory PlatformSettings.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? asMap(dynamic v) {
      if (v is Map) return Map<String, dynamic>.from(v);
      if (v is String && v.isNotEmpty) {
        try {
          final decoded = jsonDecode(v);
          if (decoded is Map) return Map<String, dynamic>.from(decoded);
        } catch (_) {}
      }
      return null;
    }

    return PlatformSettings(
      supportPhone: (json['support_phone'] ?? '97455000000').toString(),
      supportWhatsapp: (json['support_whatsapp'] ?? '97455000000').toString(),
      supportEmail:
          (json['support_email'] ?? 'support@mawjood.com').toString(),
      socialLinks: PlatformSocialLinks.fromJson(asMap(json['social_links'])),
      paymentMethods:
          PlatformPaymentMethods.fromJson(asMap(json['payment_methods'])),
      maintenanceMode: json['maintenance_mode'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'support_phone': supportPhone,
        'support_whatsapp': supportWhatsapp,
        'support_email': supportEmail,
        'social_links': socialLinks.toJson(),
        'payment_methods': paymentMethods.toJson(),
        'maintenance_mode': maintenanceMode,
      };
}

/// Fetches + caches `public.platform_settings` (single row id=1).
class PlatformSettingsService extends ChangeNotifier {
  PlatformSettingsService._();
  static final PlatformSettingsService instance = PlatformSettingsService._();

  static const _cacheKey = 'mawjood_platform_settings_v1';

  PlatformSettings _settings = const PlatformSettings();
  bool _loaded = false;

  PlatformSettings get settings => _settings;
  bool get isLoaded => _loaded;

  Future<void> load({bool forceNetwork = true}) async {
    await _loadCache();
    if (!forceNetwork) {
      _loaded = true;
      notifyListeners();
      return;
    }
    try {
      final res = await ApiClient().get(
        '/platform_settings?id=eq.1&select=*&limit=1',
      );
      if (res.statusCode == 200 && res.data is List && (res.data as List).isNotEmpty) {
        final row = Map<String, dynamic>.from((res.data as List).first as Map);
        _settings = PlatformSettings.fromJson(row);
        await _saveCache();
      }
    } catch (e) {
      assert(() {
        // ignore: avoid_print
        print('[PlatformSettings] $e');
        return true;
      }());
    } finally {
      _loaded = true;
      notifyListeners();
    }
  }

  Future<void> _loadCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_cacheKey);
      if (raw == null || raw.isEmpty) return;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      _settings = PlatformSettings.fromJson(map);
    } catch (_) {}
  }

  Future<void> _saveCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cacheKey, jsonEncode(_settings.toJson()));
    } catch (_) {}
  }
}
