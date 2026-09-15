import 'package:flutter/material.dart';

import '../config/theme.dart';

/// Displays live garage reputation: e.g. `4.8 ★ | 95%`.
class GarageRatingBadge extends StatelessWidget {
  final double rating;
  final double? positivePct;
  final int? reviewCount;
  final String? garageName;
  final bool isVerified;
  final bool isCompact;
  final String lang;

  const GarageRatingBadge({
    super.key,
    this.rating = 0,
    this.positivePct,
    this.reviewCount,
    this.garageName,
    this.isVerified = true,
    this.isCompact = false,
    this.lang = 'ar',
  });

  bool get isAr => lang == 'ar';
  bool get hasReviews => (reviewCount ?? 0) > 0 || rating > 0;

  @override
  Widget build(BuildContext context) {
    final displayName = garageName?.trim().isNotEmpty == true
        ? garageName!
        : (isAr ? 'كراج معتمد' : 'Verified Garage');

    final pctLabel = positivePct != null
        ? '${positivePct!.toStringAsFixed(0)}%'
        : null;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 5 : 7,
            vertical: isCompact ? 1.5 : 2.5,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: const Color(0xFFEA580C).withValues(alpha: 0.28),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.star_rounded,
                size: 13,
                color: Color(0xFFC2410C),
              ),
              const SizedBox(width: 3),
              Text(
                hasReviews ? rating.toStringAsFixed(1) : '—',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFC2410C),
                  fontFamily: 'Cairo',
                ),
              ),
              if (pctLabel != null) ...[
                const SizedBox(width: 4),
                Text(
                  '| $pctLabel',
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF9A3412),
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isVerified) ...[
                const Icon(Icons.verified, size: 13, color: AppTheme.success),
                const SizedBox(width: 3),
              ],
              Flexible(
                child: Text(
                  displayName,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Cairo',
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
