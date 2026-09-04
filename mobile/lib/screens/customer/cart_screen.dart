import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/part_model.dart';
import '../../services/cart_service.dart';
import '../../widgets/ai_translated_text.dart';
import '../../widgets/custom_toast.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  final String lang;

  const CartScreen({super.key, this.lang = 'ar'});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();

  static const double _deliveryFee = 35.0;
  static const double _platformFeeRate = 0.02;

  bool get isAr => widget.lang == 'ar';

  void _proceedToCheckout(List<PartModel> items) {
    if (items.isEmpty) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CheckoutScreen(
          lang: widget.lang,
          part: items.first,
          initialStep: 'checkout',
        ),
      ),
    );
  }

  void _confirmClearCart() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          isAr ? 'تفريغ السلة' : 'Clear Cart',
          style: const TextStyle(
            color: AppTheme.textWhite,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        content: Text(
          isAr
              ? 'هل أنت متأكد من حذف جميع العناصر من السلة؟'
              : 'Are you sure you want to remove all items from your cart?',
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              isAr ? 'إلغاء' : 'Cancel',
              style: const TextStyle(color: AppTheme.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              _cartService.clearCart();
              Navigator.of(ctx).pop();
              CustomToast.info(
                context,
                isAr ? 'تم تفريغ السلة بنجاح' : 'Cart cleared successfully',
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: Text(
              isAr ? 'تفريغ' : 'Clear',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: AnimatedBuilder(
        animation: _cartService,
        builder: (context, _) {
          final items = _cartService.items;
          final totalCount = _cartService.totalCount;
          final subtotal = _cartService.totalPrice;
          final platformFee = subtotal * _platformFeeRate;
          final grandTotal = subtotal + _deliveryFee + platformFee;
          final installmentValue = (grandTotal / 4).toStringAsFixed(2);

          return Scaffold(
            backgroundColor: AppTheme.obsidian,
            appBar: AppBar(
              backgroundColor: AppTheme.obsidian,
              elevation: 0,
              title: Row(
                children: [
                  const Text('🛒', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(
                    isAr ? 'سلة المشتريات' : 'Your Shopping Cart',
                    style: const TextStyle(
                      color: Color(0xFFF8FAFC),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (totalCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.copper,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$totalCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              actions: [
                if (items.isNotEmpty)
                  IconButton(
                    tooltip: isAr ? 'حذف الكل' : 'Clear All',
                    icon: const Icon(
                      Icons.delete_sweep_outlined,
                      color: Color(0xFF94A3B8),
                    ),
                    onPressed: _confirmClearCart,
                  ),
              ],
            ),
            body: items.isEmpty
                ? _buildEmptyState()
                : Column(
                    children: [
                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          itemCount: items.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            return _buildCartItemCard(items[index]);
                          },
                        ),
                      ),
                      _buildCheckoutBottomBar(
                        items: items,
                        subtotal: subtotal,
                        deliveryFee: _deliveryFee,
                        platformFee: platformFee,
                        totalPrice: grandTotal,
                        installmentValue: installmentValue,
                      ),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: const Color(0xFF1A2232),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: const Center(
                child: Text('🛒', style: TextStyle(fontSize: 40)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isAr ? 'السلة فارغة حالياً' : 'Your cart is currently empty',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFFF8FAFC),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              isAr
                  ? 'تصفح المتجر وأضف القطع المتوافقة للمتابعة.'
                  : 'Explore the catalog to add compatible parts.',
              style: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.search, size: 18),
              label: Text(
                isAr ? 'تصفح قطع الغيار' : 'Browse Catalog',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.copper,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartItemCard(PartModel part) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF121824), Color(0xFF1A2232)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF475569)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.network(
              part.imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Center(
                child: Icon(
                  Icons.build_outlined,
                  size: 28,
                  color: Color(0xFF94A3B8),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AiTranslatedText(
                  text: part.name,
                  lang: widget.lang,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFF8FAFC),
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  (part.partNumber != null && part.partNumber!.trim().isNotEmpty)
                      ? '${isAr ? 'رقم القطعة' : 'PN'}: ${part.partNumber}'
                      : '${part.make} · ${part.model} (${part.year})',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w600,
                    fontFamily: 'monospace',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '${(part.price * part.quantity).toStringAsFixed(0)} ',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.copper,
                      ),
                    ),
                    Text(
                      isAr ? 'ر.ق' : 'QAR',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.copper,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            children: [
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF475569)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: () => _cartService.updateQuantity(
                        part.id,
                        part.quantity - 1,
                      ),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 7,
                        ),
                        child: Icon(
                          Icons.remove,
                          size: 14,
                          color: Color(0xFFF8FAFC),
                        ),
                      ),
                    ),
                    Text(
                      '${part.quantity}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF8FAFC),
                      ),
                    ),
                    InkWell(
                      onTap: () => _cartService.updateQuantity(
                        part.id,
                        part.quantity + 1,
                      ),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 7,
                        ),
                        child: Icon(
                          Icons.add,
                          size: 14,
                          color: Color(0xFFF8FAFC),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () {
                  _cartService.removeFromCart(part.id);
                  CustomToast.info(
                    context,
                    isAr ? 'تمت إزالة القطعة من السلة' : 'Item removed',
                  );
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3F1D1D),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF7F1D1D)),
                  ),
                  child: const Icon(
                    Icons.delete_outline,
                    size: 16,
                    color: Color(0xFFFCA5A5),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutBottomBar({
    required List<PartModel> items,
    required double subtotal,
    required double deliveryFee,
    required double platformFee,
    required double totalPrice,
    required String installmentValue,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
      decoration: BoxDecoration(
        color: const Color(0xFF121824),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        border: const Border(
          top: BorderSide(color: Color(0xFF334155), width: 1.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _summaryRow(
              isAr ? 'المجموع الفرعي' : 'Subtotal',
              '${subtotal.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
            ),
            const SizedBox(height: 6),
            _summaryRow(
              isAr ? 'رسوم التوصيل' : 'Delivery Fee',
              '${deliveryFee.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
            ),
            const SizedBox(height: 6),
            _summaryRow(
              isAr ? 'رسوم المنصة' : 'Platform Fee',
              '${platformFee.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Divider(color: Color(0xFF334155), height: 1),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.copper.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.copper.withValues(alpha: 0.45),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isAr ? 'الإجمالي' : 'Total',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFF8FAFC),
                    ),
                  ),
                  Text(
                    '${totalPrice.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.copper,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text(
              isAr
                  ? 'أو 4 دفعات بدون فوائد بقيمة $installmentValue ر.ق'
                  : 'Or 4 interest-free payments of $installmentValue QAR',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () => _proceedToCheckout(items),
                icon: const Icon(Icons.lock_outline, size: 18),
                label: Text(
                  isAr ? 'إتمام الشراء والدفع' : 'Checkout & Pay',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14.5,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.copper,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF94A3B8),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFFF8FAFC),
          ),
        ),
      ],
    );
  }
}
