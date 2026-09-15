import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/notification_model.dart';
import '../../services/notification_center_service.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/glass_chrome.dart';
import 'order_tracker_screen.dart';

class NotificationsScreen extends StatefulWidget {
  final String lang;

  const NotificationsScreen({super.key, this.lang = 'ar'});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _svc = NotificationCenterService.instance;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _svc.ensureStarted(lang: widget.lang);
    });
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'order_update':
        return Icons.local_shipping_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      case 'system_alert':
        return Icons.campaign_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'order_update':
        return const Color(0xFF0284C7);
      case 'promotion':
        return const Color(0xFFEA580C);
      case 'system_alert':
        return const Color(0xFF7C3AED);
      default:
        return const Color(0xFF475569);
    }
  }

  Future<void> _onTap(AppNotification n) async {
    await _svc.markAsRead(n);
    if (!mounted) return;

    final orderId = n.orderId;
    if (orderId != null && orderId.isNotEmpty) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => OrderTrackerScreen(lang: widget.lang),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: Text(
          n.title,
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        content: Text(
          n.body,
          style: const TextStyle(color: Color(0xFF94A3B8), height: 1.45),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(isAr ? 'إغلاق' : 'Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _markAll() async {
    await _svc.markAllAsRead();
    if (!mounted) return;
    CustomToast.success(
      context,
      isAr ? 'تم تعليم الكل كمقروء' : 'All marked as read',
    );
  }

  Future<void> _clearAll() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isAr ? 'مسح الكل؟' : 'Clear all?'),
        content: Text(
          isAr
              ? 'سيتم إزالة جميع الإشعارات من قائمتك.'
              : 'This will remove all notifications from your list.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(isAr ? 'إلغاء' : 'Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(isAr ? 'مسح' : 'Clear'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await _svc.clearAll();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          elevation: 0,
          leading: const GlassBackButton(iconColor: Colors.white),
          title: Text(
            isAr ? 'مركز الإشعارات' : 'Notification Center',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          actions: [
            IconButton(
              tooltip: isAr ? 'تعليمليم الكل كمقروء' : 'Mark all read',
              onPressed: _markAll,
              icon: const Icon(Icons.done_all, color: Colors.white70),
            ),
            IconButton(
              tooltip: isAr ? 'مسح الكل' : 'Clear all',
              onPressed: _clearAll,
              icon: const Icon(Icons.delete_sweep_outlined, color: Colors.white70),
            ),
          ],
        ),
        body: AnimatedBuilder(
          animation: _svc,
          builder: (context, _) {
            if (_svc.isLoading && _svc.items.isEmpty) {
              return const Center(
                child: CircularProgressIndicator(color: AppTheme.copper),
              );
            }
            if (_svc.items.isEmpty) {
              return _empty();
            }
            return RefreshIndicator(
              color: AppTheme.copper,
              onRefresh: _svc.refresh,
              child: ListView.separated(
                physics: const BouncingScrollPhysics(
                  parent: AlwaysScrollableScrollPhysics(),
                ),
                padding: const EdgeInsets.all(16),
                itemCount: _svc.items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final n = _svc.items[idx];
                  return _tile(n);
                },
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _empty() {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: dark
                    ? AppTheme.surfaceSlate
                    : const Color(0xFFFFF4EC),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppTheme.copper.withValues(alpha: 0.35),
                ),
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                size: 42,
                color: AppTheme.copper,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              isAr ? 'لا توجد إشعارات حالياً' : 'No notifications yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: AppTheme.textOf(context),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isAr
                  ? 'ستظهر هنا تنبيهات الطلبات والعروض والتنبيهات النظامية'
                  : 'Order updates, promos, and system alerts will appear here',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                color: AppTheme.mutedOf(context),
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(AppNotification n) {
    final unread = _svc.isUnread(n);
    final color = _colorFor(n.type);
    final dark = Theme.of(context).brightness == Brightness.dark;

    return Dismissible(
      key: ValueKey('notif_${n.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: AppTheme.danger.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete_outline, color: AppTheme.danger),
      ),
      onDismissed: (_) => _svc.deleteNotification(n),
      child: Material(
        color: unread
            ? (dark
                ? AppTheme.copper.withValues(alpha: 0.12)
                : const Color(0xFFFFF7ED))
            : AppTheme.cardOf(context),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _onTap(n),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: unread
                    ? AppTheme.copper.withValues(alpha: 0.45)
                    : AppTheme.borderOf(context),
              ),
              boxShadow: AppTheme.cardShadow(Theme.of(context).brightness),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(_iconFor(n.type), color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              n.title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: unread
                                    ? FontWeight.w900
                                    : FontWeight.w700,
                                color: AppTheme.textOf(context),
                              ),
                            ),
                          ),
                          if (unread)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.copper,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        n.body,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12.5,
                          color: AppTheme.mutedOf(context),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        n.createdAt != null
                            ? _formatTime(n.createdAt!)
                            : n.type,
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.mutedOf(context),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final local = dt.toLocal();
    final now = DateTime.now();
    final diff = now.difference(local);
    if (diff.inMinutes < 1) return isAr ? 'الآن' : 'Just now';
    if (diff.inHours < 1) {
      return isAr ? 'منذ ${diff.inMinutes} د' : '${diff.inMinutes}m ago';
    }
    if (diff.inDays < 1) {
      return isAr ? 'منذ ${diff.inHours} س' : '${diff.inHours}h ago';
    }
    return '${local.day}/${local.month}/${local.year}';
  }
}
