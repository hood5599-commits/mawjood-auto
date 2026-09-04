import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../models/part_model.dart';
import '../utils/part_share_helper.dart';
import 'ai_translated_text.dart';

class PartCard extends StatelessWidget {
  final PartModel item;
  final String lang;
  final ValueChanged<PartModel>? onAddToCart;
  final ValueChanged<PartModel>? onInquire;
  final ValueChanged<PartModel>? onShare;
  final ValueChanged<PartModel>? onMore;

  const PartCard({
    super.key,
    required this.item,
    this.lang = 'ar',
    this.onAddToCart,
    this.onInquire,
    this.onShare,
    this.onMore,
  });

  bool get isAr => lang == 'ar';

  String get _partNo {
    final pn = item.partNumber?.trim();
    if (pn != null && pn.isNotEmpty) return pn;
    return item.id;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF121824),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x14FFFFFF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 148,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  item.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: const Color(0xFF1A2232),
                    child: const Icon(
                      Icons.build_outlined,
                      color: Color(0xFF94A3B8),
                      size: 40,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 48,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.55),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isAr ? 'الحالة: جديدة 100%' : 'Condition: 100% New',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x33FFFFFF)),
                    ),
                    child: Text(
                      item.year,
                      style: const TextStyle(
                        color: Color(0xFFF8FAFC),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AiTranslatedText(
                    text: item.name,
                    lang: lang,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFF8FAFC),
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A2232),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0x14FFFFFF)),
                    ),
                    child: Text(
                      '${isAr ? 'رقم القطعة' : 'PN'}: $_partNo',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'monospace',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _chip(item.make, Icons.directions_car_outlined),
                      _chip(item.model, Icons.car_repair_outlined),
                    ],
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Text(
                        isAr ? 'السعر' : 'Price',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF94A3B8),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${item.price.toStringAsFixed(0)} ',
                        style: const TextStyle(
                          fontSize: 17,
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        isAr ? 'ر.ق' : 'QAR',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 40,
                    child: ElevatedButton.icon(
                      onPressed: () => onAddToCart?.call(item),
                      icon: const Icon(Icons.shopping_cart_outlined, size: 16),
                      label: Text(
                        isAr ? 'أضف للسلة' : 'Add to Cart',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 12.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.copper,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _actionBtn(
                          icon: Icons.document_scanner_outlined,
                          label: isAr ? 'فحص التوافق' : 'Fitment',
                          onTap: () => onInquire?.call(item),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _actionBtn(
                          icon: Icons.share_outlined,
                          label: isAr ? 'مشاركة' : 'Share',
                          onTap: () {
                            if (onShare != null) {
                              onShare!(item);
                            } else {
                              PartShareHelper.sharePart(item, lang: lang);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _actionBtn(
                          icon: Icons.info_outline,
                          label: isAr ? 'المزيد' : 'More',
                          onTap: () => onMore?.call(item),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2232),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFFF8FAFC),
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionBtn({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1A2232),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0x14FFFFFF)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: const Color(0xFFF8FAFC)),
            const SizedBox(height: 3),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
