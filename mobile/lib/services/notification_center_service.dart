import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/notification_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

/// Unified notification center: fetch, realtime badge, mark read, delete.
class NotificationCenterService extends ChangeNotifier {
  NotificationCenterService._();
  static final NotificationCenterService instance =
      NotificationCenterService._();

  static const _broadcastReadKey = 'mawjood_notif_broadcast_reads';

  final List<AppNotification> _items = [];
  final Set<String> _broadcastReadIds = {};
  RealtimeChannel? _channel;
  bool _loading = false;
  bool _started = false;

  List<AppNotification> get items => List.unmodifiable(_items);
  bool get isLoading => _loading;

  int get unreadCount => _items.where((n) => !_isEffectivelyRead(n)).length;

  bool _isEffectivelyRead(AppNotification n) {
    if (n.isBroadcast) return _broadcastReadIds.contains(n.id) || n.isRead;
    return n.isRead;
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _broadcastReadIds
      ..clear()
      ..addAll(prefs.getStringList(_broadcastReadKey) ?? const []);
  }

  Future<void> start({String lang = 'ar'}) async {
    await init();
    await refresh();
    _subscribeRealtime();
    _started = true;
  }

  void stop() {
    _channel?.unsubscribe();
    _channel = null;
    _started = false;
  }

  Future<void> refresh() async {
    _loading = true;
    notifyListeners();

    try {
      final uid = AuthService().session?.userId;
      final phone = AuthService().session?.displayPhone.trim() ?? '';

      // Prefer authenticated REST (JWT via ApiClient) for personal + broadcasts.
      final res = await ApiClient().get(
        '/notifications?select=*&order=created_at.desc&limit=100',
      );

      final list = <AppNotification>[];
      if (res.statusCode == 200 && res.data is List) {
        for (final raw in List<dynamic>.from(res.data as List)) {
          if (raw is! Map) continue;
          final n = AppNotification.fromJson(Map<String, dynamic>.from(raw));
          if (!_isVisibleToCurrentUser(n, uid: uid, phone: phone)) continue;
          list.add(n);
        }
      }
      _items
        ..clear()
        ..addAll(list);
    } catch (_) {
      // Keep prior list on failure.
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  bool _isVisibleToCurrentUser(
    AppNotification n, {
    required String? uid,
    required String phone,
  }) {
    if (n.userId != null && n.userId!.isNotEmpty) {
      return uid != null && n.userId == uid;
    }
    // Broadcast / legacy target filters
    final target = (n.target ?? 'all').trim().toLowerCase();
    if (target.isEmpty || target == 'all') return true;
    if (phone.isNotEmpty && target.contains(phone.toLowerCase())) return true;
    if (uid != null && target.contains(uid.toLowerCase())) return true;
    return false;
  }

  void _subscribeRealtime() {
    _channel?.unsubscribe();
    try {
      _channel = Supabase.instance.client
          .channel('public:notifications:center')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'notifications',
            callback: (payload) {
              final row = payload.newRecord;
              final n = AppNotification.fromJson(
                Map<String, dynamic>.from(row),
              );
              final uid = AuthService().session?.userId;
              final phone = AuthService().session?.displayPhone.trim() ?? '';
              if (!_isVisibleToCurrentUser(n, uid: uid, phone: phone)) return;
              final exists = _items.any((e) => e.id == n.id);
              if (exists) return;
              _items.insert(0, n);
              notifyListeners();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'notifications',
            callback: (payload) {
              final row = payload.newRecord;
              final n = AppNotification.fromJson(
                Map<String, dynamic>.from(row),
              );
              final idx = _items.indexWhere((e) => e.id == n.id);
              if (idx >= 0) {
                _items[idx] = n;
                notifyListeners();
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.delete,
            schema: 'public',
            table: 'notifications',
            callback: (payload) {
              final old = payload.oldRecord;
              final id = old['id']?.toString();
              if (id == null) return;
              _items.removeWhere((e) => e.id == id);
              notifyListeners();
            },
          )
          .subscribe();
    } catch (_) {
      // Realtime optional — badge still updates via refresh().
    }
  }

  Future<void> markAsRead(AppNotification n) async {
    if (_isEffectivelyRead(n)) return;

    if (n.isBroadcast) {
      _broadcastReadIds.add(n.id);
      await _persistBroadcastReads();
      final idx = _items.indexWhere((e) => e.id == n.id);
      if (idx >= 0) _items[idx] = n.copyWith(isRead: true);
      notifyListeners();
      return;
    }

    final idx = _items.indexWhere((e) => e.id == n.id);
    if (idx >= 0) _items[idx] = n.copyWith(isRead: true);
    notifyListeners();

    try {
      await ApiClient().patch(
        '/notifications?id=eq.${n.id}',
        data: {'is_read': true},
      );
    } catch (_) {
      if (idx >= 0) _items[idx] = n.copyWith(isRead: false);
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    for (final n in List<AppNotification>.from(_items)) {
      if (!_isEffectivelyRead(n)) {
        await markAsRead(n);
      }
    }
  }

  Future<void> deleteNotification(AppNotification n) async {
    _items.removeWhere((e) => e.id == n.id);
    _broadcastReadIds.add(n.id);
    await _persistBroadcastReads();
    notifyListeners();

    if (!n.isBroadcast) {
      try {
        await ApiClient().delete('/notifications?id=eq.${n.id}');
      } catch (_) {}
    }
  }

  Future<void> clearAll() async {
    final personal = _items.where((n) => !n.isBroadcast).toList();
    for (final n in _items) {
      _broadcastReadIds.add(n.id);
    }
    _items.clear();
    await _persistBroadcastReads();
    notifyListeners();

    for (final n in personal) {
      try {
        await ApiClient().delete('/notifications?id=eq.${n.id}');
      } catch (_) {}
    }
  }

  Future<void> _persistBroadcastReads() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = _broadcastReadIds.toList();
      if (list.length > 300) {
        list.removeRange(0, list.length - 300);
      }
      await prefs.setStringList(_broadcastReadKey, list);
    } catch (_) {}
  }

  bool isUnread(AppNotification n) => !_isEffectivelyRead(n);

  /// Ensure realtime is up after login without restarting the whole screen.
  Future<void> ensureStarted({String lang = 'ar'}) async {
    if (_started) {
      await refresh();
      _subscribeRealtime();
      return;
    }
    await start(lang: lang);
  }
}
