import 'package:flutter/material.dart';
import '../../config/theme.dart';

class DeliveryMapScreen extends StatelessWidget {
  final Map<String, dynamic> order;
  final String lang;

  const DeliveryMapScreen({
    super.key,
    required this.order,
    this.lang = 'ar',
  });

  bool get isAr => lang == 'ar';

  @override
  Widget build(BuildContext context) {
    final address = order['delivery_address'] ?? order['address'] ?? '';
    final customerPhone = order['customer_phone'] ?? '';
    final status = order['status'] ?? '';

    return Scaffold(
      backgroundColor: AppTheme.obsidian,
      appBar: AppBar(
        title: Text(isAr ? 'تفاصيل التوصيل' : 'Delivery Details'),
        backgroundColor: AppTheme.obsidian,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _infoCard(
              icon: Icons.location_on,
              label: isAr ? 'عنوان التوصيل' : 'Delivery Address',
              value: address.toString(),
            ),
            const SizedBox(height: 14),
            _infoCard(
              icon: Icons.phone,
              label: isAr ? 'هاتف العميل' : 'Customer Phone',
              value: customerPhone.toString(),
            ),
            const SizedBox(height: 14),
            _infoCard(
              icon: Icons.local_shipping,
              label: isAr ? 'حالة الطلب' : 'Order Status',
              value: status.toString(),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back),
                label: Text(isAr ? 'رجوع' : 'Back'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.copper, size: 28),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value.isEmpty ? '—' : value,
                  style: const TextStyle(
                    color: AppTheme.textWhite,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
