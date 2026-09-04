import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config/theme.dart';
import '../../models/order_model.dart';
import '../../models/part_model.dart';
import '../../services/api_client.dart';
import '../../widgets/ai_translated_text.dart';
import '../../widgets/custom_toast.dart';
import 'checkout_screen.dart';

enum TrackerTab { orders, previousOrders, customRequests, inquiries }

class OrderTrackerScreen extends StatefulWidget {
  final String lang;
  final String? customerPhone;
  final ValueChanged<PartModel>? onSelectPartForCheckout;

  const OrderTrackerScreen({
    super.key,
    this.lang = 'ar',
    this.customerPhone,
    this.onSelectPartForCheckout,
  });

  @override
  State<OrderTrackerScreen> createState() => _OrderTrackerScreenState();
}

class _OrderTrackerScreenState extends State<OrderTrackerScreen> {
  TrackerTab _activeTab = TrackerTab.orders;
  bool _isLoading = true;

  List<OrderModel> _orders = [];
  List<FitmentInquiryModel> _inquiries = [];
  List<Map<String, dynamic>> _customRequests = [];

  String _resolvedIdentifier = '';
  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    _initAndFetch();
  }

  Future<void> _initAndFetch() async {
    final prefs = await SharedPreferences.getInstance();
    final savedPhone = prefs.getString('customer_phone') ?? '';

    String fallback = '';
    if (widget.customerPhone != null && widget.customerPhone!.isNotEmpty) {
      fallback = widget.customerPhone!;
    } else if (savedPhone.isNotEmpty) {
      fallback = savedPhone;
    } else {
      fallback = 'CUST-GUEST';
    }

    _resolvedIdentifier = fallback;
    await _fetchData();
  }

  Future<void> _fetchData() async {
    if (_resolvedIdentifier.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }

    setState(() => _isLoading = true);
    final phone = _resolvedIdentifier;

    try {
      List<dynamic> orderRows = const [];
      List<dynamic> inquiryRows = const [];
      List<dynamic> customRows = const [];

      try {
        orderRows = await Supabase.instance.client
            .from('orders')
            .select()
            .ilike('customer_phone', '%$phone%')
            .order('id', ascending: false)
            .limit(50);
      } on PostgrestException {
        try {
          orderRows = await Supabase.instance.client
              .from('orders')
              .select()
              .eq('customer_phone', phone)
              .order('id', ascending: false)
              .limit(50);
        } on PostgrestException {
          orderRows = const [];
        }
      }

      try {
        inquiryRows = await Supabase.instance.client
            .from('fitment_inquiries')
            .select()
            .ilike('customer_phone', '%$phone%')
            .order('id', ascending: false)
            .limit(50);
      } on PostgrestException {
        inquiryRows = const [];
      }

      try {
        customRows = await Supabase.instance.client
            .from('custom_part_requests')
            .select()
            .ilike('customer_phone', '%$phone%')
            .order('id', ascending: false)
            .limit(50);
      } on PostgrestException {
        customRows = const [];
      }

      if (mounted) {
        setState(() {
          _orders = orderRows
              .whereType<Map>()
              .map((j) => OrderModel.fromJson(Map<String, dynamic>.from(j)))
              .toList();
          _inquiries = inquiryRows
              .whereType<Map>()
              .map(
                (j) =>
                    FitmentInquiryModel.fromJson(Map<String, dynamic>.from(j)),
              )
              .toList();
          _customRequests = customRows
              .whereType<Map>()
              .map((j) => Map<String, dynamic>.from(j))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _viewQuotesForRequest(Map<String, dynamic> request) async {
    try {
      final reqId = request['id'];
      final res = await ApiClient().get(
        '/garage_quotes?request_id=eq.$reqId&order=id.desc',
      );

      if (!mounted) {
        return;
      }

      final quotes = (res.statusCode == 200 && res.data is List)
          ? List<Map<String, dynamic>>.from(res.data)
          : <Map<String, dynamic>>[];

      showModalBottomSheet(
        context: context,
        backgroundColor: AppTheme.cardBg,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => Directionality(
          textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr ? '🏷️ عروض أسعار الكراجات' : '🏷️ Garage Quotes',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppTheme.textMuted),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(color: AppTheme.borderSlate),
                if (quotes.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Text(
                      isAr
                          ? 'بانتظار تقديم عروض الأسعار من الكراجات المعتمدة...'
                          : 'Waiting for verified garage quotes...',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppTheme.textMuted),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: quotes.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, idx) {
                        final q = quotes[idx];
                        final price = q['price'] ?? 0;
                        final garageName =
                            q['garage_name'] ??
                            (isAr ? 'كراج معتمد' : 'Verified Garage');

                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceSlate,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.borderSlate),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    garageName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textWhite,
                                    ),
                                  ),
                                  Text(
                                    '$price QAR',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.copperLight,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  final selectedPart = PartModel(
                                    id: 'custom-${q['id']}',
                                    name:
                                        '${request['notes'] ?? "طلب خاص"} (${q['part_type'] ?? "قطعة مخصصة"})',
                                    make: (request['make'] ?? '').toString(),
                                    model: (request['model'] ?? '').toString(),
                                    year: (request['year'] ?? '').toString(),
                                    price: (price as num).toDouble(),
                                    imageUrl: request['part_image_url'] ?? '',
                                  );

                                  if (widget.onSelectPartForCheckout != null) {
                                    widget.onSelectPartForCheckout!(
                                      selectedPart,
                                    );
                                  } else {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => CheckoutScreen(
                                          lang: widget.lang,
                                          part: selectedPart,
                                          initialStep: 'checkout',
                                        ),
                                      ),
                                    );
                                  }
                                },
                                icon: const Icon(
                                  Icons.shopping_cart_checkout,
                                  size: 16,
                                ),
                                label: Text(
                                  isAr ? 'قبول العرض والشراء' : 'Accept & Buy',
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.success,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    } catch (_) {}
  }

  void _openReviewDialog(OrderModel order) {
    int rating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppTheme.cardBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          title: Text(
            isAr ? '⭐ تقييم التجربة' : '⭐ Rate Experience',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.textWhite,
              fontSize: 16,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isAr ? 'تقييم الخدمة والكراج:' : 'Garage Service Rating:',
                style: const TextStyle(
                  fontSize: 12.5,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final starIndex = index + 1;
                  return IconButton(
                    icon: Icon(
                      starIndex <= rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 32,
                    ),
                    onPressed: () => setModalState(() => rating = starIndex),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: commentController,
                maxLines: 2,
                style: const TextStyle(color: AppTheme.textWhite, fontSize: 13),
                decoration: InputDecoration(
                  hintText: isAr
                      ? 'أضف تعليقك حول الجودة وسرعة التوصيل...'
                      : 'Add feedback...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                isAr ? 'إلغاء' : 'Cancel',
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiClient().post(
                    '/garage_reviews',
                    data: {
                      'order_id': order.id,
                      'customer_phone': _resolvedIdentifier,
                      'garage_rating': rating,
                      'comment': commentController.text.trim().isEmpty
                          ? null
                          : commentController.text.trim(),
                    },
                  );

                  await ApiClient().patch(
                    '/orders?id=eq.${order.id}',
                    data: {'is_reviewed': true},
                  );

                  if (mounted) {
                    CustomToast.success(
                      // ignore: use_build_context_synchronously
                      context,
                      isAr ? 'شكراً لتقييمك!' : 'Review submitted!',
                    );
                    _fetchData();
                  }
                } catch (_) {
                  if (mounted) {
                    CustomToast.error(
                      // ignore: use_build_context_synchronously
                      context,
                      isAr
                          ? 'حدث خطأ أثناء حفظ التقييم'
                          : 'Error saving review',
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.success,
              ),
              child: Text(isAr ? 'حفظ التقييم 🚀' : 'Submit Review'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeOrders = _orders
        .where((o) => !o.isReviewed && o.status != 'cancelled')
        .toList();
    final previousOrders = _orders
        .where((o) => o.isReviewed || o.status == 'cancelled')
        .toList();
    final activeInquiries = _inquiries
        .where((i) => i.status != 'ordered')
        .toList();

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFF090D16),
          elevation: 0,
          title: Row(
            children: [
              const Text('📦', style: TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Text(
                isAr ? 'متابعة استفساراتي وطلباتي' : 'My Inquiries & Orders',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70),
              onPressed: _fetchData,
            ),
          ],
        ),
        body: Column(
          children: [
            _buildTabBar(
              activeOrdersCount: activeOrders.length,
              prevOrdersCount: previousOrders.length,
              customCount: _customRequests.length,
              inquiriesCount: activeInquiries.length,
            ),
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.copper),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchData,
                      color: AppTheme.copper,
                      child: _buildTabBody(
                        activeOrders: activeOrders,
                        previousOrders: previousOrders,
                        activeInquiries: activeInquiries,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBar({
    required int activeOrdersCount,
    required int prevOrdersCount,
    required int customCount,
    required int inquiriesCount,
  }) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildTabButton(
              tab: TrackerTab.orders,
              title: isAr ? '🛒 طلبات الشراء' : 'Active Orders',
              count: activeOrdersCount,
              activeColor: AppTheme.success,
            ),
            const SizedBox(width: 8),
            _buildTabButton(
              tab: TrackerTab.previousOrders,
              title: isAr ? '📜 طلباتي السابقة' : 'Past Orders',
              count: prevOrdersCount,
              activeColor: const Color(0xFF475569),
            ),
            const SizedBox(width: 8),
            _buildTabButton(
              tab: TrackerTab.customRequests,
              title: isAr ? '🛠️ طلباتي المخصصة' : 'Custom Requests',
              count: customCount,
              activeColor: AppTheme.copper,
            ),
            const SizedBox(width: 8),
            _buildTabButton(
              tab: TrackerTab.inquiries,
              title: isAr ? '❓ الاستفسارات' : 'Inquiries',
              count: inquiriesCount,
              activeColor: const Color(0xFF7C5FD0),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton({
    required TrackerTab tab,
    required String title,
    required int count,
    required Color activeColor,
  }) {
    final isSelected = _activeTab == tab;
    return InkWell(
      onTap: () => setState(() => _activeTab = tab),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(10),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: activeColor.withValues(alpha: 0.35),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          '$title ($count)',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF475569),
            fontFamily: 'Cairo',
          ),
        ),
      ),
    );
  }

  Widget _buildTabBody({
    required List<OrderModel> activeOrders,
    required List<OrderModel> previousOrders,
    required List<FitmentInquiryModel> activeInquiries,
  }) {
    switch (_activeTab) {
      case TrackerTab.orders:
        if (activeOrders.isEmpty) {
          return _buildEmptyList(
            isAr ? 'لا توجد طلبات شراء نشطة حالياً.' : 'No active orders.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: activeOrders.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, idx) =>
              _buildOrderCard(activeOrders[idx], isActive: true),
        );
      case TrackerTab.previousOrders:
        if (previousOrders.isEmpty) {
          return _buildEmptyList(
            isAr ? 'لا توجد طلبات سابقة مُقيّمة.' : 'No past orders.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: previousOrders.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, idx) =>
              _buildOrderCard(previousOrders[idx], isActive: false),
        );
      case TrackerTab.customRequests:
        if (_customRequests.isEmpty) {
          return _buildEmptyList(
            isAr ? 'لا توجد طلبات قطع مخصصة حالياً.' : 'No custom requests.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _customRequests.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, idx) =>
              _buildCustomRequestCard(_customRequests[idx]),
        );
      case TrackerTab.inquiries:
        if (activeInquiries.isEmpty) {
          return _buildEmptyList(
            isAr ? 'لا توجد استفسارات متوافقة حالياً.' : 'No inquiries.',
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: activeInquiries.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, idx) =>
              _buildInquiryCard(activeInquiries[idx]),
        );
    }
  }

  Widget _buildOrderCard(OrderModel order, {required bool isActive}) {
    final isDelivered =
        order.status == 'delivered' || order.status == 'completed';

    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEBF8FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  order.orderCode ?? '',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2B6CB0),
                  ),
                ),
              ),
              Text(
                isDelivered
                    ? (isAr ? '✅ تم التسليم' : '✅ Delivered')
                    : (isAr ? '⏳ جاري التجهيز والتوصيل' : '⏳ Processing'),
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.bold,
                  color: isDelivered
                      ? AppTheme.success
                      : const Color(0xFFC05621),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AiTranslatedText(
            text: order.partName,
            lang: widget.lang,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${order.price.toStringAsFixed(0)} QAR',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: AppTheme.copper,
            ),
          ),
          if (order.deliveryCode != null &&
              order.deliveryCode!.isNotEmpty &&
              isActive) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFDBA74)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isAr ? '🔑 كود التسليم للمندوب:' : '🔑 Delivery Code:',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFC2410C),
                    ),
                  ),
                  Text(
                    order.deliveryCode!,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                      color: Color(0xFFEA580C),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (isDelivered) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openReviewDialog(order),
                icon: const Icon(Icons.star, size: 16),
                label: Text(
                  isActive
                      ? (isAr ? 'قيّم التجربة لإنهاء الطلب' : 'Rate Experience')
                      : (isAr ? 'تحديث التقييم' : 'Update Review'),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isActive
                      ? const Color(0xFF7C5FD0)
                      : const Color(0xFF64748B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInquiryCard(FitmentInquiryModel inq) {
    final isCompatible = inq.status == 'confirmed_compatible';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                inq.inquiryCode,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2B6CB0),
                ),
              ),
              Text(
                isCompatible
                    ? (isAr ? '✅ متوافق 100%' : '✅ 100% Fit')
                    : (isAr ? '⏳ بانتظار فحص الشاصي' : '⏳ Checking'),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isCompatible
                      ? AppTheme.success
                      : const Color(0xFFC05621),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          AiTranslatedText(
            text: inq.partName,
            lang: widget.lang,
            style: const TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF16304F),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${inq.partPrice.toStringAsFixed(0)} QAR',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppTheme.copper,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomRequestCard(Map<String, dynamic> req) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF5),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '#${req['id']} · ${req['make']} ${req['model']} (${req['year']})',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFFB45309),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '🛠️ ${req['notes'] ?? ""}',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F3A5F),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _viewQuotesForRequest(req),
              icon: const Icon(Icons.search, size: 16),
              label: Text(
                isAr ? 'عرض عروض الأسعار المقدمة' : 'View Quotes',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.copper,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyList(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          message,
          style: const TextStyle(fontSize: 13.5, color: AppTheme.textMuted),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
