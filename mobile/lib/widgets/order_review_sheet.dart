import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/theme.dart';
import '../models/order_model.dart';
import '../services/api_client.dart';
import 'custom_toast.dart';

/// Post-delivery review bottom sheet: garage/part, delivery, platform (1–5).
class OrderReviewSheet extends StatefulWidget {
  final OrderModel order;
  final String customerPhone;
  final String lang;

  const OrderReviewSheet({
    super.key,
    required this.order,
    required this.customerPhone,
    this.lang = 'ar',
  });

  /// Returns `true` if the review was saved successfully.
  static Future<bool?> show(
    BuildContext context, {
    required OrderModel order,
    required String customerPhone,
    String lang = 'ar',
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => OrderReviewSheet(
        order: order,
        customerPhone: customerPhone,
        lang: lang,
      ),
    );
  }

  @override
  State<OrderReviewSheet> createState() => _OrderReviewSheetState();
}

class _OrderReviewSheetState extends State<OrderReviewSheet> {
  int _garageRating = 5;
  int _deliveryRating = 5;
  int _platformRating = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;

  bool get isAr => widget.lang == 'ar';

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    setState(() => _submitting = true);

    final orderId = int.tryParse(widget.order.id);
    final comment = _commentCtrl.text.trim();
    final overall = ((_garageRating + _deliveryRating + _platformRating) / 3)
        .round();

    try {
      await Supabase.instance.client.from('order_reviews').insert({
        'order_id': ?orderId,
        'garage_id': widget.order.garageId,
        'customer_id': widget.customerPhone,
        'user_id': widget.customerPhone,
        'garage_rating': _garageRating,
        'delivery_rating': _deliveryRating,
        'platform_rating': _platformRating,
        'rating': overall,
        'comment': comment.isEmpty ? null : comment,
      });

      await ApiClient().patch(
        '/orders?id=eq.${widget.order.id}',
        data: {'is_reviewed': true},
      );

      if (!mounted) return;
      CustomToast.success(
        context,
        isAr ? 'شكراً لتقييمك!' : 'Review submitted!',
      );
      Navigator.pop(context, true);
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitting = false);
      CustomToast.error(
        context,
        isAr ? 'حدث خطأ أثناء حفظ التقييم' : 'Error saving review',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Padding(
        padding: EdgeInsets.only(bottom: bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF121824),
            borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF334155),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                Text(
                  isAr ? 'قيّم تجربتك' : 'Rate Your Experience',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.order.partName,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF94A3B8),
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 18),
                _ratingRow(
                  label: isAr
                      ? 'جودة الكراج وقطعة الغيار'
                      : 'Garage & Spare Part Quality',
                  value: _garageRating,
                  onChanged: (v) => setState(() => _garageRating = v),
                ),
                const SizedBox(height: 14),
                _ratingRow(
                  label: isAr ? 'خدمة التوصيل' : 'Delivery Service',
                  value: _deliveryRating,
                  onChanged: (v) => setState(() => _deliveryRating = v),
                ),
                const SizedBox(height: 14),
                _ratingRow(
                  label: isAr
                      ? 'تجربة التطبيق والمنصة'
                      : 'App & Platform Experience',
                  value: _platformRating,
                  onChanged: (v) => setState(() => _platformRating = v),
                ),
                const SizedBox(height: 16),
                Text(
                  isAr
                      ? 'ملاحظات / شكاوى / اقتراحات (اختياري)'
                      : 'Feedback / Complaints / Suggestions (optional)',
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _commentCtrl,
                  maxLines: 3,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontFamily: 'Cairo',
                  ),
                  decoration: InputDecoration(
                    hintText: isAr
                        ? 'اكتب ملاحظاتك هنا...'
                        : 'Write your feedback here...',
                    hintStyle: const TextStyle(color: Color(0xFF64748B)),
                    filled: true,
                    fillColor: const Color(0xFF1A2232),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF334155)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF334155)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.copper),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          isAr ? 'إرسال التقييم' : 'Submit Review',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                            fontFamily: 'Cairo',
                          ),
                        ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _submitting
                      ? null
                      : () => Navigator.pop(context, false),
                  child: Text(
                    isAr ? 'لاحقاً' : 'Later',
                    style: const TextStyle(color: Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _ratingRow({
    required String label,
    required int value,
    required ValueChanged<int> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            fontFamily: 'Cairo',
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: List.generate(5, (i) {
            final star = i + 1;
            return IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              onPressed: () => onChanged(star),
              icon: Icon(
                star <= value ? Icons.star_rounded : Icons.star_border_rounded,
                color: const Color(0xFFFBBF24),
                size: 30,
              ),
            );
          }),
        ),
      ],
    );
  }
}
