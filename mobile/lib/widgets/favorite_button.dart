import 'package:flutter/material.dart';

import '../services/auth_gate.dart';
import '../services/auth_service.dart';
import '../services/favorites_service.dart';
import 'custom_toast.dart';

/// Heart toggle with optimistic FavoritesService updates.
class FavoriteButton extends StatelessWidget {
  final String partId;
  final String lang;
  final double size;
  final Color? backgroundColor;

  const FavoriteButton({
    super.key,
    required this.partId,
    this.lang = 'ar',
    this.size = 22,
    this.backgroundColor,
  });

  bool get isAr => lang == 'ar';

  Future<void> _onTap(BuildContext context) async {
    final ok = await AuthGate.requireLogin(
      context,
      lang: lang,
      message: isAr
          ? 'يرجى تسجيل الدخول لحفظ القطع في المفضلة'
          : 'Please sign in to save parts to your favorites',
    );
    if (!ok) return;

    await FavoritesService.instance.loadFavorites();

    if (AuthService().session?.userId == null) {
      if (context.mounted) {
        CustomToast.error(
          context,
          isAr ? 'تعذر تحديد المستخدم' : 'Unable to identify user',
        );
      }
      return;
    }

    final added = !FavoritesService.instance.isFavorite(partId);
    final success = await FavoritesService.instance.toggle(partId);
    if (!context.mounted) return;
    if (!success) {
      CustomToast.error(
        context,
        isAr ? 'تعذر تحديث المفضلة' : 'Could not update favorites',
      );
      return;
    }
    CustomToast.success(
      context,
      added
          ? (isAr ? 'أُضيفت إلى المفضلة' : 'Added to favorites')
          : (isAr ? 'أُزيلت من المفضلة' : 'Removed from favorites'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: FavoritesService.instance,
      builder: (context, _) {
        final fav = FavoritesService.instance.isFavorite(partId);
        return Material(
          color: backgroundColor ??
              const Color(0xFF0F172A).withValues(alpha: 0.72),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => _onTap(context),
            child: Padding(
              padding: const EdgeInsets.all(7),
              child: Icon(
                fav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                size: size,
                color: fav ? const Color(0xFFEF4444) : Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }
}
