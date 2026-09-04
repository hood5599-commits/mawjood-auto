import 'dart:async';

import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../models/order_model.dart';
import '../screens/customer/order_tracker_screen.dart';
import '../services/order_notification_service.dart';

/// Home-screen active order progress card (hidden when none).
class ActiveOrderTracker extends StatefulWidget {
  final String lang;

  const ActiveOrderTracker({super.key, this.lang = 'ar'});

  @override
  State<ActiveOrderTracker> createState() => _ActiveOrderTrackerState();
}

class _ActiveOrderTrackerState extends State<ActiveOrderTracker> {
  OrderModel? _order;
  bool _loading = true;
  Timer? _timer;

  bool get isAr => widget.lang == 'ar';

  static const _stagesAr = [
    'تم الاستلام',
    'جاري التجهيز',
    'مع المندوب',
    'تم التوصيل',
  ];
  static const _stagesEn = [
    'Received',
    'Preparing',
    'With Driver',
    'Delivered',
  ];

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 40), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final order =
        await OrderNotificationService.instance.fetchLatestActiveOrder();
    if (!mounted) return;
    setState(() {
      _order = order;
      _loading = false;
    });
    if (order != null) {
      await OrderNotificationService.instance
          .showOngoingForOrder(order, lang: widget.lang);
    } else {
      await OrderNotificationService.instance.clearOngoing();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeInOut,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 280),
        opacity: (!_loading && _order != null) ? 1 : 0,
        child: (!_loading && _order != null)
            ? _buildCard(_order!)
            : const SizedBox.shrink(),
      ),
    );
  }

  Widget _buildCard(OrderModel order) {
    final stages = isAr ? _stagesAr : _stagesEn;
    final activeIdx =
        OrderNotificationService.stageIndex(order.status).clamp(0, 3);
    final code = order.orderCode ?? '#${order.id}';
    final eta = isAr ? 'خلال 2–24 ساعة' : 'Within 2–24 hours';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => OrderTrackerScreen(lang: widget.lang),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1A2232)],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF334155)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.local_shipping_outlined,
                    color: AppTheme.copper,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isAr ? 'تتبع الطلب الحالي' : 'Active Order Tracker',
                      style: const TextStyle(
                        color: Color(0xFFF8FAFC),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.copper.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppTheme.copper.withValues(alpha: 0.5),
                      ),
                    ),
                    child: Text(
                      code,
                      style: const TextStyle(
                        color: AppTheme.copper,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                order.partName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isAr ? 'وقت التوصيل المتوقع: $eta' : 'ETA: $eta',
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: List.generate(stages.length * 2 - 1, (i) {
                  if (i.isOdd) {
                    final after = i ~/ 2;
                    final filled = activeIdx > after;
                    return Expanded(
                      child: Container(
                        height: 2,
                        color: filled
                            ? AppTheme.copper
                            : const Color(0xFF334155),
                      ),
                    );
                  }
                  final idx = i ~/ 2;
                  final reached = activeIdx >= idx;
                  return Column(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: reached
                              ? AppTheme.copper
                              : const Color(0xFF1E293B),
                          border: Border.all(
                            color: reached
                                ? AppTheme.copperLight
                                : const Color(0xFF475569),
                          ),
                        ),
                        child: Icon(
                          reached ? Icons.check : Icons.circle,
                          size: reached ? 12 : 6,
                          color: reached
                              ? Colors.white
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  );
                }),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: stages
                    .map(
                      (s) => Expanded(
                        child: Text(
                          s,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            color: stages.indexOf(s) <= activeIdx
                                ? const Color(0xFFF8FAFC)
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
