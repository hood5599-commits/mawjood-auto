import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/part_model.dart';
import '../../services/auth_gate.dart';
import '../../services/cart_service.dart';
import '../../services/favorites_service.dart';
import '../../widgets/ai_translated_text.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/garage_rating_badge.dart';

class FavoritesScreen extends StatefulWidget {
  final String lang;
  final VoidCallback? onBrowseParts;

  const FavoritesScreen({
    super.key,
    this.lang = 'ar',
    this.onBrowseParts,
  });

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final _cart = CartService();
  List<PartModel> _parts = [];
  bool _loading = true;
  String? _error;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final loggedIn = await AuthGate.requireLogin(
      context,
      lang: widget.lang,
      message: isAr
          ? 'يرجى تسجيل الدخول لعرض المفضلة'
          : 'Please sign in to view your favorites',
    );
    if (!loggedIn) {
      if (mounted) {
        setState(() {
          _loading = false;
          _parts = [];
        });
      }
      return;
    }

    try {
      await FavoritesService.instance.loadFavorites(force: true);
      final parts = await FavoritesService.instance.fetchFavoriteParts();
      if (!mounted) return;
      setState(() {
        _parts = parts;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _remove(PartModel part) async {
    final ok = await FavoritesService.instance.remove(part.id);
    if (!mounted) return;
    if (!ok) {
      CustomToast.error(
        context,
        isAr ? 'تعذر إزالة القطعة' : 'Could not remove item',
      );
      return;
    }
    setState(() => _parts.removeWhere((p) => p.id == part.id));
    CustomToast.success(
      context,
      isAr ? 'أُزيلت من المفضلة' : 'Removed from favorites',
    );
  }

  Future<void> _addToCart(PartModel part) async {
    final ok = await AuthGate.requireLogin(context, lang: widget.lang);
    if (!ok) return;
    await _cart.addToCart(partId: part.id, part: part, quantity: 1);
    if (!mounted) return;
    CustomToast.success(
      context,
      isAr ? 'أُضيفت إلى السلة' : 'Added to cart',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFF090D16),
          elevation: 0,
          title: Text(
            isAr ? 'مفضلتي' : 'My Favorites',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70),
              onPressed: _load,
            ),
          ],
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.copper),
              )
            : _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isAr
                            ? 'تعذر تحميل المفضلة'
                            : 'Could not load favorites',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _load,
                        child: Text(isAr ? 'إعادة المحاولة' : 'Retry'),
                      ),
                    ],
                  ),
                ),
              )
            : _parts.isEmpty
            ? _buildEmpty()
            : RefreshIndicator(
                onRefresh: _load,
                color: AppTheme.copper,
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _parts.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, idx) => _buildCard(_parts[idx]),
                ),
              ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: const Icon(
                Icons.favorite_border_rounded,
                size: 42,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              isAr ? 'لا توجد قطع في المفضلة بعد' : 'No favorites yet',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isAr
                  ? 'اضغط على أيقونة القلب على أي قطعة لحفظها هنا'
                  : 'Tap the heart on any part to save it here',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13.5,
                color: Color(0xFF64748B),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 22),
            ElevatedButton.icon(
              onPressed: () {
                if (widget.onBrowseParts != null) {
                  widget.onBrowseParts!();
                } else {
                  Navigator.pop(context);
                }
              },
              icon: const Icon(Icons.storefront_outlined, size: 18),
              label: Text(
                isAr ? 'تصفح قطع الغيار' : 'Browse Parts',
                style: const TextStyle(fontWeight: FontWeight.bold),
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

  Widget _buildCard(PartModel part) {
    final inStock = part.stock > 0;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 88,
              height: 88,
              child: part.imageUrl.isNotEmpty
                  ? Image.network(
                      part.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _imgFallback(),
                    )
                  : _imgFallback(),
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
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                GarageRatingBadge(
                  rating: part.garageRating,
                  positivePct: part.positivePct,
                  reviewCount: part.reviewCount,
                  garageName: part.garageName,
                  isCompact: true,
                  lang: widget.lang,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '${part.price.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.copper,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: inStock
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: inStock
                              ? const Color(0xFFA7F3D0)
                              : const Color(0xFFFECACA),
                        ),
                      ),
                      child: Text(
                        inStock
                            ? (isAr
                                ? 'متوفر (${part.stock})'
                                : 'In stock (${part.stock})')
                            : (isAr ? 'غير متوفر' : 'Out of stock'),
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: inStock
                              ? const Color(0xFF047857)
                              : const Color(0xFFB91C1C),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: inStock ? () => _addToCart(part) : null,
                        icon: const Icon(Icons.shopping_cart_outlined, size: 15),
                        label: Text(
                          isAr ? 'أضف للسلة' : 'Add to Cart',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      tooltip: isAr ? 'إزالة' : 'Remove',
                      onPressed: () => _remove(part),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFFEE2E2),
                        foregroundColor: const Color(0xFFDC2626),
                      ),
                      icon: const Icon(Icons.delete_outline, size: 20),
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

  Widget _imgFallback() {
    return Container(
      color: const Color(0xFFF1F5F9),
      child: const Icon(Icons.build_outlined, color: Color(0xFF94A3B8)),
    );
  }
}
