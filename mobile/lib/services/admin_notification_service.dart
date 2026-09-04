import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';

/// Polls Supabase `notifications` for admin broadcasts and surfaces them locally.
class AdminNotificationService {
  AdminNotificationService._();
  static final AdminNotificationService instance = AdminNotificationService._();

  static const int _baseNotifId = 88000;
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _ready = false;
  bool _tableMissing = false;
  Timer? _timer;
  final Set<String> _seenIds = {};

  Future<void> init() async {
    if (_ready) return;

    if (!kIsWeb) {
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings();
      await _plugin.initialize(
        settings: const InitializationSettings(android: android, iOS: ios),
      );
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }

    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList('mawjood_seen_admin_notifs') ?? [];
    _seenIds.addAll(saved);
    _ready = true;
  }

  void startListening({String lang = 'ar'}) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) {
      poll(lang: lang);
    });
    poll(lang: lang);
  }

  void stopListening() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> poll({String lang = 'ar'}) async {
    await init();
    if (_tableMissing) return;

    final phone = AuthService().session?.displayPhone.trim() ?? '';
    final userCode = AuthService().session?.user?['id']?.toString() ?? '';

    try {
      final rows = await Supabase.instance.client
          .from('notifications')
          .select()
          .order('created_at', ascending: false)
          .limit(20);

      final list = List<dynamic>.from(rows as List);
      for (final raw in list) {
        if (raw is! Map) continue;
        final map = Map<String, dynamic>.from(raw);
        final id = map['id']?.toString() ?? '';
        if (id.isEmpty || _seenIds.contains(id)) continue;

        final target = (map['target'] ?? 'all').toString().trim().toLowerCase();
        final matchesAll = target == 'all' || target.isEmpty;
        final matchesPhone =
            phone.isNotEmpty && target.contains(phone.toLowerCase());
        final matchesCode =
            userCode.isNotEmpty && target.contains(userCode.toLowerCase());

        if (!matchesAll && !matchesPhone && !matchesCode) continue;

        _seenIds.add(id);
        await _persistSeen();
        await _show(
          id: id,
          title: (map['title'] ??
                  (lang == 'ar' ? 'تنبيه النظام' : 'System Alert'))
              .toString(),
          body: (map['message'] ?? map['body'] ?? '').toString(),
        );
      }
    } on PostgrestException catch (e) {
      // Table missing / RLS — stop polling noise.
      if (e.code == '42P01' ||
          e.message.contains('does not exist') ||
          e.code == 'PGRST205') {
        _tableMissing = true;
      }
    } catch (_) {
      // Swallow network / client errors silently.
    }
  }

  Future<void> _persistSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = _seenIds.toList();
      if (list.length > 200) {
        list.removeRange(0, list.length - 200);
      }
      await prefs.setStringList('mawjood_seen_admin_notifs', list);
    } catch (_) {}
  }

  Future<void> _show({
    required String id,
    required String title,
    required String body,
  }) async {
    if (kIsWeb) return;
    try {
      final notifId = _baseNotifId + (id.hashCode.abs() % 1000);
      const android = AndroidNotificationDetails(
        'mawjood_admin_alerts',
        'System Alerts',
        channelDescription: 'Admin broadcast notifications',
        importance: Importance.high,
        priority: Priority.high,
      );
      await _plugin.show(
        id: notifId,
        title: title,
        body: body,
        notificationDetails: const NotificationDetails(
          android: android,
          iOS: DarwinNotificationDetails(),
        ),
      );
    } catch (_) {}
  }
}
