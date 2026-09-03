import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../services/api_client.dart';
import '../../services/auth_service.dart';
import '../../widgets/custom_toast.dart';
import '../welcome_screen.dart';
import 'delivery_map_screen.dart';

class OrdersToDeliverScreen extends StatefulWidget {
  final String lang;
  final AuthSession? session;

  const OrdersToDeliverScreen({
    super.key,
    this.lang = 'ar',
    this.session,
  });

  @override
  State<OrdersToDeliverScreen> createState() => _OrdersToDeliverScreenState();
}

class _OrdersToDeliverScreenState extends State<OrdersToDeliverScreen> {
  String _tab = 'available';
  List<Map<String, dynamic>> _orders = [];
  bool _loading = false;
  Timer? _poll;
  final Map<int, String> _pickupImages = {};
  final Map<int, String> _deliveryImages = {};
  final Map<int, TextEditingController> _codeCtrls = {};

  bool get isAr => widget.lang == 'ar';

  String get _driverId {
    final s = widget.session ?? AuthService().session;
    return s?.user?['id']?.toString() ??
        s?.phone ??
        s?.email ??
        'driver_1';
  }

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _poll = Timer.periodic(const Duration(seconds: 8), (_) => _fetchOrders());
  }

  @override
  void dispose() {
    _poll?.cancel();
    for (final c in _codeCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchOrders() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final response = await ApiClient().get('/orders?select=*&order=id.desc');
      Map<String, dynamic> profilesMap = {};
      try {
        final profRes =
            await ApiClient().get('/profiles?select=id,garage_name,garage_address,phone');
        if (profRes.statusCode == 200 && profRes.data is List) {
          for (final p in profRes.data) {
            if (p['id'] != null) profilesMap[p['id'].toString()] = p;
          }
        }
      } catch (_) {}

      if (response.statusCode == 200 && response.data is List) {
        final updated = <Map<String, dynamic>>[];
        for (final raw in response.data) {
          final ord = Map<String, dynamic>.from(raw as Map);
          final garageId = ord['garage_id']?.toString();
          final garageProfile =
              garageId != null ? profilesMap[garageId] : null;
          ord['resolved_garage_address'] = ord['garage_address'] ??
              ord['garage_location'] ??
              garageProfile?['garage_address'] ??
              (isAr
                  ? 'المنطقة الصناعية - الدوحة، قطر'
                  : 'Industrial Area - Doha, Qatar');
          ord['resolved_garage_name'] = ord['garage_name'] ??
              garageProfile?['garage_name'] ??
              (isAr ? 'كراج السيارات المعتمد' : 'Certified Garage');
          updated.add(ord);
        }
        if (mounted) setState(() => _orders = updated);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _pickProofImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1280,
    );
    if (file == null) return null;
    final bytes = await file.readAsBytes();
    return 'data:image/jpeg;base64,${base64Encode(bytes)}';
  }

  Future<void> _acceptDelivery(Map<String, dynamic> order) async {
    final id = order['id'] is int
        ? order['id'] as int
        : int.tryParse(order['id'].toString()) ?? 0;
    final pickupImg = _pickupImages[id] ?? order['pickup_image_url']?.toString();
    if (pickupImg == null || pickupImg.isEmpty) {
      CustomToast.error(
        context,
        isAr
            ? 'يرجى تصوير القطعة في الكراج أولاً'
            : 'Please take a pickup photo first',
      );
      return;
    }
    try {
      final res = await ApiClient().patch(
        '/orders?id=eq.$id',
        data: {
          'status': 'handed_to_driver',
          'driver_id': _driverId,
          'pickup_image_url': pickupImg,
        },
      );
      if (res.statusCode == 200 || res.statusCode == 204) {
        CustomToast.success(
          context,
          isAr ? 'تم تأكيد الاستلام' : 'Pickup confirmed',
        );
        setState(() => _tab = 'active');
        _fetchOrders();
      }
    } catch (_) {
      CustomToast.error(context, isAr ? 'فشل التحديث' : 'Update failed');
    }
  }

  Future<void> _confirmDelivery(Map<String, dynamic> order) async {
    final id = order['id'] is int
        ? order['id'] as int
        : int.tryParse(order['id'].toString()) ?? 0;
    final entered = (_codeCtrls[id]?.text ?? '').trim();
    final expected = (order['pickup_code'] ?? '').toString().trim();
    final deliveryImg =
        _deliveryImages[id] ?? order['delivery_image_url']?.toString();

    if (expected.isNotEmpty && entered != expected) {
      CustomToast.error(
        context,
        isAr ? 'كود التسليم غير صحيح' : 'Invalid delivery code',
      );
      return;
    }
    if (deliveryImg == null || deliveryImg.isEmpty) {
      CustomToast.error(
        context,
        isAr ? 'يرجى تصوير التسليم أولاً' : 'Please take a delivery photo',
      );
      return;
    }

    try {
      final res = await ApiClient().patch(
        '/orders?id=eq.$id',
        data: {
          'status': 'delivered',
          'delivery_image_url': deliveryImg,
        },
      );
      if (res.statusCode == 200 || res.statusCode == 204) {
        CustomToast.success(
          context,
          isAr ? 'تم التسليم بنجاح' : 'Delivered successfully',
        );
        _fetchOrders();
      }
    } catch (_) {
      CustomToast.error(context, isAr ? 'فشل التسليم' : 'Delivery failed');
    }
  }

  Future<void> _whatsapp(String? phone, String message) async {
    if (phone == null || phone.isEmpty) return;
    var clean = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (!clean.startsWith('974')) clean = '974$clean';
    await launchUrl(
      Uri.parse('https://wa.me/$clean?text=${Uri.encodeComponent(message)}'),
      mode: LaunchMode.externalApplication,
    );
  }

  Future<void> _logout() async {
    await AuthService().clearSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => WelcomeScreen(lang: widget.lang),
      ),
      (_) => false,
    );
  }

  List<Map<String, dynamic>> get _available => _orders.where((o) {
        final s = (o['status'] ?? '').toString();
        final dt = o['delivery_type'];
        return (s == 'ready' ||
                s == 'ready_for_pickup' ||
                s == 'confirmed_compatible') &&
            (dt == null || dt == 'delivery' || dt.toString().isEmpty);
      }).toList();

  List<Map<String, dynamic>> get _active => _orders.where((o) {
        final s = (o['status'] ?? '').toString();
        final d = o['driver_id']?.toString();
        return s == 'handed_to_driver' &&
            (d == null || d.isEmpty || d == _driverId);
      }).toList();

  List<Map<String, dynamic>> get _completed => _orders.where((o) {
        final s = (o['status'] ?? '').toString();
        return s == 'delivered' || s == 'completed';
      }).toList();

  @override
  Widget build(BuildContext context) {
    final list = switch (_tab) {
      'active' => _active,
      'completed' => _completed,
      _ => _available,
    };

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFF1F3A5F),
          title: Text(
            isAr ? 'لوحة المندوب' : 'Driver Dashboard',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          actions: [
            IconButton(
              onPressed: _fetchOrders,
              icon: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.refresh),
            ),
            IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout),
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    _tabChip('available', isAr ? 'جاهزة' : 'Ready',
                        _available.length, const Color(0xFF3182CE)),
                    const SizedBox(width: 8),
                    _tabChip('active', isAr ? 'توصيل' : 'Transit',
                        _active.length, AppTheme.copper),
                    const SizedBox(width: 8),
                    _tabChip('completed', isAr ? 'مكتمل' : 'Done',
                        _completed.length, AppTheme.success),
                  ],
                ),
              ),
              Expanded(
                child: list.isEmpty
                    ? Center(
                        child: Text(
                          isAr ? 'لا توجد طلبات حالياً' : 'No orders right now',
                          style: const TextStyle(color: AppTheme.textMuted),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
                        itemCount: list.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 10),
                        itemBuilder: (_, i) => _orderCard(list[i]),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tabChip(String id, String label, int count, Color color) {
    final selected = _tab == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tab = id),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? color : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? color : const Color(0xFFE2E8F0),
            ),
          ),
          child: Text(
            '$label ($count)',
            style: TextStyle(
              color: selected ? Colors.white : const Color(0xFF4A5568),
              fontWeight: FontWeight.bold,
              fontSize: 12.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _orderCard(Map<String, dynamic> order) {
    final id = order['id'] is int
        ? order['id'] as int
        : int.tryParse(order['id'].toString()) ?? 0;
    _codeCtrls.putIfAbsent(id, () => TextEditingController());

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '#$id · ${order['resolved_garage_name'] ?? ''}',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          ),
          const SizedBox(height: 6),
          Text(
            '${isAr ? 'من' : 'From'}: ${order['resolved_garage_address']}',
            style: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
          ),
          Text(
            '${isAr ? 'إلى' : 'To'}: ${order['delivery_address'] ?? order['address'] ?? '—'}',
            style: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (_tab == 'available') ...[
                OutlinedButton.icon(
                  onPressed: () async {
                    final img = await _pickProofImage();
                    if (img != null) setState(() => _pickupImages[id] = img);
                  },
                  icon: const Icon(Icons.camera_alt, size: 18),
                  label: Text(isAr ? 'صورة الاستلام' : 'Pickup photo'),
                ),
                ElevatedButton(
                  onPressed: () => _acceptDelivery(order),
                  child: Text(isAr ? 'بدء التوصيل' : 'Start delivery'),
                ),
              ],
              if (_tab == 'active') ...[
                OutlinedButton.icon(
                  onPressed: () async {
                    final img = await _pickProofImage();
                    if (img != null) {
                      setState(() => _deliveryImages[id] = img);
                    }
                  },
                  icon: const Icon(Icons.camera_alt, size: 18),
                  label: Text(isAr ? 'صورة التسليم' : 'Drop-off photo'),
                ),
                SizedBox(
                  width: 120,
                  child: TextField(
                    controller: _codeCtrls[id],
                    decoration: InputDecoration(
                      isDense: true,
                      labelText: isAr ? 'كود' : 'Code',
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => _confirmDelivery(order),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                  ),
                  child: Text(isAr ? 'تسليم' : 'Deliver'),
                ),
                TextButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => DeliveryMapScreen(
                        order: order,
                        lang: widget.lang,
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.map_outlined, size: 18),
                  label: Text(isAr ? 'الخريطة' : 'Map'),
                ),
                TextButton.icon(
                  onPressed: () => _whatsapp(
                    order['customer_phone']?.toString(),
                    isAr
                        ? 'مندوب موجود أوتو في الطريق إليك لطلب #$id'
                        : 'Mawjood driver is on the way for order #$id',
                  ),
                  icon: const Icon(Icons.chat, size: 18),
                  label: const Text('WhatsApp'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
