import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../models/part_model.dart';
import '../utils/part_share_helper.dart';
import 'ai_translated_text.dart';
import 'favorite_button.dart';
import 'garage_rating_badge.dart';
import 'glass_chrome.dart';

class PartCard extends StatelessWidget {
  final PartModel item;
  final String lang;
  final ValueChanged<PartModel>? onAddToCart;
  final ValueChanged<PartModel>? onInquire;
  final ValueChanged<PartModel>? onShare;
  final ValueChanged<PartModel>? onMore;
  final ValueChanged<PartModel>? onAskAbboud;

  const PartCard({
    super.key,
    required this.item,
    this.lang = 'ar',
    this.onAddToCart,
    this.onInquire,
    this.onShare,
    this.onMore,
    this.onAskAbboud,
  });

  bool get isAr => lang == 'ar';

  String get _partNo {
    final pn = item.partNumber?.trim();
    if (pn != null && pn.isNotEmpty) return pn;
    return item.id;
  }

  bool get _isGenuine {
    final t = (item.partType ?? '').toLowerCase();
    return t.contains('original') ||
        t.contains('genuine') ||
        t.contains('oem') ||
        t.contains('أصلي') ||
        t.contains('اصلي');
  }

  int? get _discountPct {
    // Soft visual: stock urgency / category promo cue — no pricing logic change.
    if (item.stock > 0 && item.stock <= 2) return 12;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final text = AppTheme.textOf(context);
    final muted = AppTheme.mutedOf(context);
    final surface = AppTheme.surfaceOf(context);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final discount = _discountPct;

    return Container(
      decoration: AppTheme.cardDecoration(context, radius: 18),
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
                    color: surface,
                    child: Icon(
                      Icons.build_outlined,
                      color: muted,
                      size: 40,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 52,
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
                if (_isGenuine)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: _GenuineBadge(isAr: isAr),
                  )
                else
                  Positioned(
                    top: 10,
                    left: 10,
                    child: _PillBadge(
                      label: isAr ? 'جديدة 100%' : '100% New',
                      bg: AppTheme.success,
                      fg: Colors.white,
                    ),
                  ),
                if (discount != null)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: _PillBadge(
                      label: '-$discount%',
                      bg: AppTheme.copper,
                      fg: Colors.white,
                    ),
                  )
                else
                  Positioned(
                    top: 10,
                    right: 10,
                    child: _PillBadge(
                      label: item.year,
                      bg: AppTheme.navy.withValues(alpha: 0.88),
                      fg: AppTheme.textWhite,
                      border: AppTheme.copper.withValues(alpha: 0.45),
                    ),
                  ),
                Positioned(
                  bottom: 10,
                  right: 10,
                  child: FavoriteButton(
                    partId: item.id,
                    lang: lang,
                    size: 20,
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
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: text,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  GarageRatingBadge(
                    rating: item.garageRating,
                    positivePct: item.positivePct,
                    reviewCount: item.reviewCount,
                    garageName: item.garageName,
                    isCompact: true,
                    lang: lang,
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderOf(context)),
                    ),
                    child: Text(
                      '${isAr ? 'رقم القطعة' : 'OEM'}: $_partNo',
                      style: TextStyle(
                        color: muted,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'monospace',
                        letterSpacing: 0.3,
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
                      _chip(context, item.make, Icons.directions_car_outlined),
                      _chip(context, item.model, Icons.car_repair_outlined),
                    ],
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Text(
                        isAr ? 'السعر' : 'Price',
                        style: TextStyle(
                          fontSize: 11,
                          color: muted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${item.price.toStringAsFixed(0)} ',
                        style: const TextStyle(
                          fontSize: 18,
                          color: AppTheme.copper,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        isAr ? 'ر.ق' : 'QAR',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.copper.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TactileScale(
                    onTap: () => onAddToCart?.call(item),
                    child: Container(
                      width: double.infinity,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppTheme.copper,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.copper.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.shopping_cart_outlined,
                            size: 16,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isAr ? 'أضف للسلة' : 'Add to Cart',
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 12.5,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TactileScale(
                    onTap: () => (onAskAbboud ?? onInquire)?.call(item),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: dark
                            ? AppTheme.navy.withValues(alpha: 0.55)
                            : AppTheme.navy.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.copper.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.smart_toy_outlined,
                            size: 15,
                            color: dark ? AppTheme.copperLight : AppTheme.navy,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isAr ? 'اسأل عبود' : 'Ask Abboud',
                            style: TextStyle(
                              color:
                                  dark ? AppTheme.textWhite : AppTheme.navy,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _actionBtn(
                          context,
                          icon: Icons.document_scanner_outlined,
                          label: isAr ? 'التوافق' : 'Fitment',
                          onTap: () => onInquire?.call(item),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _actionBtn(
                          context,
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
                          context,
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

  Widget _chip(BuildContext context, String label, IconData icon) {
    final muted = AppTheme.mutedOf(context);
    final text = AppTheme.textOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.surfaceOf(context),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: muted),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 90),
            child: Text(
              label,
              style: TextStyle(
                color: text,
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

  Widget _actionBtn(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return TactileScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.surfaceOf(context),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderOf(context)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: AppTheme.textOf(context)),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: AppTheme.mutedOf(context),
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

class _GenuineBadge extends StatelessWidget {
  final bool isAr;
  const _GenuineBadge({required this.isAr});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.copper.withValues(alpha: 0.75),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.copper.withValues(alpha: 0.25),
            blurRadius: 8,
          ),
        ],
      ),
      child: Text(
        isAr ? 'أصلي / Genuine' : 'Genuine OEM',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _PillBadge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;
  final Color? border;

  const _PillBadge({
    required this.label,
    required this.bg,
    required this.fg,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: border != null ? Border.all(color: border!) : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
