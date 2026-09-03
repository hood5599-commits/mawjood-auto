import 'package:flutter/material.dart';

import '../config/theme.dart';

class GarageRatingBadge extends StatelessWidget {
  final double rating;
  final String? garageName;
  final bool isVerified;
  final bool isCompact;
  final String lang;

  const GarageRatingBadge({
    super.key,
    this.rating = 4.9,
    this.garageName,
    this.isVerified = true,
    this.isCompact = false,
    this.lang = 'ar',
  });

  bool get isAr => lang == 'ar';

  @override
  Widget build(BuildContext context) {
    final displayName = garageName?.trim().isNotEmpty == true
        ? garageName!
        : (isAr ? 'كراج معتمد' : 'Verified Garage');

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // وسام التقييم بالنجوم
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
                rating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFC2410C),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),

        // اسم الكراج وشارة الاعتماد
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
