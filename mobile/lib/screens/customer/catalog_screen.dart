import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/part_model.dart';
import '../../services/api_client.dart';
import '../../services/cart_service.dart';
import '../../widgets/ai_chatbot_sheet.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/request_part_modal.dart';
import '../../widgets/sidebar_filters.dart';
import '../info_page_screen.dart';
import 'cart_screen.dart';
import 'checkout_screen.dart';
import 'order_tracker_screen.dart';

class CatalogScreen extends StatefulWidget {
  final String initialLang;

  const CatalogScreen({super.key, this.initialLang = 'ar'});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  late String _lang;
  bool get isAr => _lang == 'ar';

  final CartService _cartService = CartService();
  List<PartModel> _inventory = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _lang = widget.initialLang;
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ApiClient().get('/parts?select=*');

      if (response.statusCode == 200 && response.data is List) {
        final List raw = response.data;
        final parts = raw.map((json) => PartModel.fromJson(json)).toList();
        parts.sort((a, b) => b.id.compareTo(a.id));

        if (mounted) {
          setState(() {
            _inventory = parts;
            _isLoading = false;
          });
        }
      } else {
        throw Exception('فشل في جلب البيانات من السيرفر');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _openCart() {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => CartScreen(lang: _lang)));
  }

  void _openOrderTracker() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => OrderTrackerScreen(lang: _lang)));
  }

  void _openCustomPartRequest() {
    RequestPartModal.show(
      context,
      onSuccess: () => CustomToast.success(
        context,
        isAr ? 'تم استلام طلبك بنجاح' : 'Request received successfully',
      ),
    );
  }

  void _openAbboudAssistant() {
    AiChatbotSheet.showModal(
      context,
      lang: _lang,
      onApplyFilters: (filter) {
        CustomToast.info(
          context,
          isAr
              ? 'تم تطبيق تصفية: ${filter.summary}'
              : 'Filters applied: ${filter.summary}',
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final uniqueGarages = _inventory
        .map((p) => p.garageName ?? 'عام')
        .where((name) => name.isNotEmpty)
        .toSet()
        .length;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: _buildAppBar(),
        body: RefreshIndicator(
          onRefresh: _fetchInventory,
          color: AppTheme.copper,
          child: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: AppTheme.copper),
                )
              : _errorMessage != null
              ? _buildErrorView()
              : SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildOrderTrackerBanner(),
                      const SizedBox(height: 14),
                      _buildExecutiveStatsGrid(
                        uniqueGarages: uniqueGarages > 0 ? uniqueGarages : 5,
                      ),
                      const SizedBox(height: 18),
                      SidebarFilters(
                        lang: _lang,
                        inventory: _inventory,
                        onAddToCart: (part, qty) {
                          _cartService.addToCart(
                            partId: part.id,
                            part: part,
                            quantity: qty,
                          );
                          CustomToast.success(
                            context,
                            isAr
                                ? 'تمت إضافة القطعة إلى السلة 🛒'
                                : 'Added to cart 🛒',
                          );
                        },
                        onInquire: (part) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => CheckoutScreen(
                                lang: _lang,
                                part: part,
                                initialStep: 'inquire',
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
        ),
        floatingActionButton: _buildAbboudFloatingTab(),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF090D16),
      elevation: 0,
      titleSpacing: 16,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEA580C), Color(0xFFF97316)],
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'MAWJOOD',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isAr ? 'موجود أوتو' : 'Auto Parts',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
      actions: [
        PopupMenuButton<InfoPageType>(
          icon: const Icon(Icons.more_vert, color: Colors.white70),
          onSelected: (type) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InfoPageScreen(lang: _lang, type: type),
              ),
            );
          },
          itemBuilder: (_) => [
            PopupMenuItem(
              value: InfoPageType.about,
              child: Text(isAr ? 'عن موجود أوتو' : 'About'),
            ),
            PopupMenuItem(
              value: InfoPageType.care,
              child: Text(isAr ? 'خدمة العملاء' : 'Customer Care'),
            ),
            PopupMenuItem(
              value: InfoPageType.contact,
              child: Text(isAr ? 'تواصل معنا' : 'Contact Us'),
            ),
            PopupMenuItem(
              value: InfoPageType.faq,
              child: Text(isAr ? 'الأسئلة الشائعة' : 'FAQ'),
            ),
          ],
        ),
        IconButton(
          tooltip: isAr ? 'طلب قطعة خاصة' : 'Custom Request',
          icon: const Icon(
            Icons.add_circle_outline,
            color: AppTheme.copperLight,
          ),
          onPressed: _openCustomPartRequest,
        ),
        TextButton(
          onPressed: () => setState(() => _lang = isAr ? 'en' : 'ar'),
          child: Text(
            isAr ? 'English' : 'عربي',
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.bold,
              fontSize: 12.5,
            ),
          ),
        ),
        AnimatedBuilder(
          animation: _cartService,
          builder: (context, _) {
            final count = _cartService.totalCount;
            return Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  tooltip: isAr ? 'السلة' : 'Cart',
                  icon: const Icon(
                    Icons.shopping_cart_outlined,
                    color: Colors.white,
                  ),
                  onPressed: _openCart,
                ),
                if (count > 0)
                  Positioned(
                    top: 8,
                    right: isAr ? null : 6,
                    left: isAr ? 6 : null,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppTheme.copper,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 18,
                        minHeight: 18,
                      ),
                      child: Text(
                        '$count',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        const SizedBox(width: 6),
      ],
    );
  }

  Widget _buildOrderTrackerBanner() {
    return Align(
      alignment: isAr ? Alignment.centerLeft : Alignment.centerRight,
      child: ElevatedButton.icon(
        onPressed: _openOrderTracker,
        icon: const Text('📦', style: TextStyle(fontSize: 14)),
        label: Text(
          isAr ? 'متابعة استفساراتي وطلباتي' : 'Track Inquiries & Orders',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0F172A),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 3,
        ),
      ),
    );
  }

  Widget _buildExecutiveStatsGrid({required int uniqueGarages}) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 640;
        final cardWidth = isWide
            ? (constraints.maxWidth - 36) / 4
            : (constraints.maxWidth - 12) / 2;

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildStatCard(
              cardWidth,
              isAr ? 'ساعتان - 24 ساعة' : '2 - 24 Hours',
              isAr ? '⚡ متوسط سرعة التوصيل' : '⚡ Avg. Delivery Speed',
              const Color(0xFF0F172A),
            ),
            _buildStatCard(
              cardWidth,
              _inventory.length.toString(),
              isAr ? '📦 القطع المتوفرة بالمستودعات' : '📦 Parts in Stock',
              AppTheme.copper,
            ),
            _buildStatCard(
              cardWidth,
              '+$uniqueGarages',
              isAr ? '🏪 كراج ومعرض معتمد' : '🏪 Verified Garages',
              const Color(0xFF0F172A),
            ),
            _buildStatCard(
              cardWidth,
              '+15',
              isAr ? '⭐ عملاء راضون وموثوقون' : '⭐ Happy Customers',
              AppTheme.success,
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
    double width,
    String mainValue,
    String label,
    Color valueColor,
  ) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Text(
            mainValue,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: valueColor,
              fontFamily: 'Cairo',
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAbboudFloatingTab() {
    return InkWell(
      onTap: _openAbboudAssistant,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF090D16), Color(0xFF0F172A)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppTheme.copper.withValues(alpha: 0.6),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: AppTheme.copper,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.smart_toy_outlined,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              isAr ? 'عبود مساعد موجود' : 'Abboud AI',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12.5,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_left, color: AppTheme.copper, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: AppTheme.danger),
          const SizedBox(height: 12),
          Text(
            isAr ? 'تعذر تحميل قطع الغيار' : 'Failed to load parts catalog',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _fetchInventory,
            icon: const Icon(Icons.refresh, size: 18),
            label: Text(isAr ? 'إعادة المحاولة' : 'Try Again'),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.copper),
          ),
        ],
      ),
    );
  }
}
