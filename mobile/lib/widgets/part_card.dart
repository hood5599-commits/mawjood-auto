import 'package:flutter/material.dart';

import '../models/part_model.dart';
import '../utils/part_share_helper.dart';
import 'ai_translated_text.dart';
import 'add_to_cart_button.dart';

class PartCard extends StatelessWidget {
  final PartModel item;
  final String lang;
  final ValueChanged<PartModel>? onAddToCart;
  final ValueChanged<PartModel>? onInquire;
  final ValueChanged<PartModel>? onShare;

  const PartCard({
    super.key,
    required this.item,
    this.lang = 'ar',
    this.onAddToCart,
    this.onInquire,
    this.onShare,
  });

  bool get isAr => lang == 'ar';

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x0D0F172A)),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0F0F172A),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 🖼️ صورة القطعة + شارة سنة الصنع العائمة
          SizedBox(
            height: 170,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  item.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Image.network(
                    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
                    fit: BoxFit.cover,
                  ),
                ),
                // تدرج لوني ناعم أسفل الصورة لتعزيز الوضوح
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 50,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0x2E000000)],
                      ),
                    ),
                  ),
                ),
                // شارة سنة الصنع
                Positioned(
                  top: 10,
                  left: isAr ? 10 : null,
                  right: isAr ? null : 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF24466F), Color(0xFF1F3A5F)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF1F3A5F).withValues(alpha: 0.4),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      item.year,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 📋 تفاصيل القطعة والمعلومات الميكانيكية
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // اسم القطعة مع الترجمة الذكية التلقائية
                AiTranslatedText(
                  text: item.name,
                  lang: lang,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF16283F),
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // وسوم السيارة (الماركة والموديل والمحرك)
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _buildTag(
                      label: '🚗 ${item.make}',
                      bgColor: const Color(0xFFEAF3FC),
                      textColor: const Color(0xFF1F3A5F),
                    ),
                    _buildTag(
                      label: '🚘 ${item.model}',
                      bgColor: const Color(0xFFEAFAF1),
                      textColor: const Color(0xFF1F7A4D),
                    ),
                    if (item.engine != null && item.engine!.isNotEmpty)
                      _buildTag(
                        label: '🔌 ${item.engine}',
                        bgColor: const Color(0xFFFFF4E6),
                        textColor: const Color(0xFFB25E14),
                        isFullWidth: true,
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // خط فاصل وسعر القطعة
                const Divider(height: 1, color: Color(0xFFF0F2F5)),
                const SizedBox(height: 8),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr ? 'السعر المتوقع:' : 'Expected Price:',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF8A94A3),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '${item.price.toStringAsFixed(0)} ',
                            style: const TextStyle(
                              fontSize: 18,
                              color: Color(0xFFE0872A),
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          TextSpan(
                            text: isAr ? 'ر.ق' : 'QAR',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFFE0872A),
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: AddToCartButton(
                        text: isAr ? 'أضف للسلة' : 'Add to Cart',
                        onPressed: () => onAddToCart?.call(item),
                      ),
                    ),
                    const SizedBox(width: 6),
                    _buildOutlineButton(
                      label: isAr ? 'فحص' : 'Inquire',
                      bgColor: const Color(0xFFF4F6F9),
                      textColor: const Color(0xFF1F3A5F),
                      onTap: () => onInquire?.call(item),
                    ),
                    const SizedBox(width: 6),
                    _buildOutlineButton(
                      label: isAr ? 'مشاركة' : 'Share',
                      bgColor: const Color(0xFFEEF1F5),
                      textColor: const Color(0xFF4A5568),
                      onTap: () {
                        if (onShare != null) {
                          onShare!(item);
                        } else {
                          PartShareHelper.sharePart(item, lang: lang);
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag({
    required String label,
    required Color bgColor,
    required Color textColor,
    bool isFullWidth = false,
  }) {
    return Container(
      width: isFullWidth ? double.infinity : null,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildOutlineButton({
    required String label,
    required Color bgColor,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFDBE2EA)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ),
    );
  }
}
