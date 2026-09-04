import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/order_model.dart';
import 'auth_service.dart';

/// Persistent / ongoing lock-screen notification for active order tracking.
class OrderNotificationService {
  OrderNotificationService._();
  static final OrderNotificationService instance = OrderNotificationService._();

  static const int _notifId = 77001;
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _ready = false;
  Timer? _pollTimer;
  String? _lastStatusKey;

  Future<void> init() async {
    if (_ready || kIsWeb) return;

    try {
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      await _plugin.initialize(
        settings: const InitializationSettings(android: android, iOS: ios),
      );

      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();

      _ready = true;
    } catch (_) {
      _ready = false;
    }
  }

  void startTracking({String lang = 'ar'}) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 45), (_) {
      refreshActiveOrderNotification(lang: lang);
    });
    refreshActiveOrderNotification(lang: lang);
  }

  void stopTracking() {
    _pollTimer?.cancel();
    _pollTimer = null;
    clearOngoing();
  }

  Future<void> refreshActiveOrderNotification({String lang = 'ar'}) async {
    await init();
    final order = await fetchLatestActiveOrder();
    if (order == null) {
      await clearOngoing();
      return;
    }
    await showOngoingForOrder(order, lang: lang);
  }

  Future<OrderModel?> fetchLatestActiveOrder() async {
    final phone = AuthService().session?.displayPhone.trim() ?? '';
    if (phone.isEmpty || phone == 'CUST-GUEST') return null;

    try {
      // Prefer phone equality; fall back to recent orders list if needed.
      List<dynamic> rows;
      try {
        rows = await Supabase.instance.client
            .from('orders')
            .select()
            .eq('customer_phone', phone)
            .order('created_at', ascending: false)
            .limit(10);
      } on PostgrestException {
        // created_at may be missing — order by id instead.
        rows = await Supabase.instance.client
            .from('orders')
            .select()
            .eq('customer_phone', phone)
            .order('id', ascending: false)
            .limit(10);
      }

      if (rows.isEmpty) {
        // Soft match via ilike without malformed PostgREST or() strings.
        try {
          rows = await Supabase.instance.client
              .from('orders')
              .select()
              .ilike('customer_phone', '%$phone%')
              .order('id', ascending: false)
              .limit(10);
        } on PostgrestException {
          return null;
        }
      }

      for (final raw in rows) {
        if (raw is! Map) continue;
        final order =
            OrderModel.fromJson(Map<String, dynamic>.from(raw));
        if (_isActiveStatus(order.status)) return order;
      }
    } on PostgrestException {
      // Invalid filter / missing column — fail quietly.
    } catch (_) {}
    return null;
  }

  static bool _isActiveStatus(String status) {
    final s = status.toLowerCase();
    return s == 'pending' ||
        s == 'processing' ||
        s == 'preparing' ||
        s == 'confirmed' ||
        s == 'ready' ||
        s == 'ready_for_pickup' ||
        s == 'with_driver' ||
        s == 'handed_to_driver' ||
        s == 'out_for_delivery';
  }

  static int stageIndex(String status) {
    final s = status.toLowerCase();
    if (s == 'delivered' || s == 'completed') return 3;
    if (s == 'with_driver' ||
        s == 'handed_to_driver' ||
        s == 'out_for_delivery') {
      return 2;
    }
    if (s == 'processing' ||
        s == 'preparing' ||
        s == 'confirmed' ||
        s == 'ready' ||
        s == 'ready_for_pickup') {
      return 1;
    }
    return 0;
  }

  static String stageLabel(String status, {required bool isAr}) {
    switch (stageIndex(status)) {
      case 3:
        return isAr ? 'تم التوصيل' : 'Delivered';
      case 2:
        return isAr ? 'مع المندوب' : 'With Driver';
      case 1:
        return isAr ? 'جاري التجهيز' : 'Preparing';
      default:
        return isAr ? 'تم الاستلام' : 'Received';
    }
  }

  Future<void> showOngoingForOrder(
    OrderModel order, {
    String lang = 'ar',
  }) async {
    if (kIsWeb) return;
    await init();
    if (!_ready) return;

    final isAr = lang == 'ar';
    final stage = stageLabel(order.status, isAr: isAr);
    final code = order.orderCode ?? '#${order.id}';
    final key = '${order.id}:${order.status}';
    if (_lastStatusKey == key) return;
    _lastStatusKey = key;

    final title = isAr ? 'تتبع الطلب الحالي' : 'Active Order Tracking';
    final body = '$code · $stage · ${order.partName}';

    try {
      const androidDetails = AndroidNotificationDetails(
        'mawjood_order_tracking',
        'Order Tracking',
        channelDescription: 'Ongoing active order status',
        importance: Importance.low,
        priority: Priority.low,
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        category: AndroidNotificationCategory.progress,
        visibility: NotificationVisibility.public,
      );
      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: false,
      );

      await _plugin.show(
        id: _notifId,
        title: title,
        body: body,
        notificationDetails: const NotificationDetails(
          android: androidDetails,
          iOS: iosDetails,
        ),
      );
    } catch (_) {}
  }

  Future<void> clearOngoing() async {
    _lastStatusKey = null;
    if (!_ready || kIsWeb) return;
    try {
      await _plugin.cancel(id: _notifId);
    } catch (_) {}
  }
}
