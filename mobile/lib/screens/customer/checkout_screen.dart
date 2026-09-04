import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/supabase_config.dart';
import '../../config/theme.dart';
import '../../models/part_model.dart';
import '../../services/api_client.dart';
import '../../services/auth_service.dart';
import '../../services/cart_service.dart';
import '../../services/error_logger.dart';
import '../../services/istemara_service.dart';
import '../../services/order_notification_service.dart';
import '../../widgets/ai_translated_text.dart';
import '../../widgets/custom_toast.dart';
import 'order_tracker_screen.dart';

enum CheckoutStep { inquire, checkout, success }

enum DeliveryType { delivery, pickup }

enum PaymentMethod { applePay, googlePay, card, cod, installments }

class CheckoutScreen extends StatefulWidget {
  final String lang;
  final PartModel part;
  final String initialStep; // 'inquire' | 'checkout'
  final String customerPhone;
  final VoidCallback? onSuccess;

  const CheckoutScreen({
    super.key,
    this.lang = 'ar',
    required this.part,
    this.initialStep = 'inquire',
    this.customerPhone = '',
    this.onSuccess,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const Color _bg = Color(0xFF090D16);
  static const Color _bgAlt = Color(0xFF0B0E14);
  static const Color _surface = Color(0xFF121824);
  static const Color _surfaceElevated = Color(0xFF1A2232);
  static const Color _border = Color(0x14FFFFFF);
  static const Color _text = Color(0xFFF8FAFC);
  static const Color _muted = Color(0xFF94A3B8);
  static const Color _copper = Color(0xFFEA580C);
  static const Color _amber = Color(0xFFD97706);
  static const Color _success = Color(0xFF22C55E);

  static const List<String> _qatarMunicipalities = [
    'الدوحة',
    'الريان',
    'الوكرة',
    'أم صلال',
    'الخور',
    'الشمال',
    'الضعاين',
    'الشحانية',
  ];

  late CheckoutStep _step;
  late final String _draftRef;
  final ImagePicker _picker = ImagePicker();
  final Dio _dio = Dio();

  final TextEditingController _vinController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _recipientNameController =
      TextEditingController();
  final TextEditingController _recipientPhoneController =
      TextEditingController();
  final TextEditingController _promoController = TextEditingController();
  final TextEditingController _cardNumberController = TextEditingController();
  final TextEditingController _cardHolderController = TextEditingController();
  final TextEditingController _cardExpiryController = TextEditingController();
  final TextEditingController _cardCvcController = TextEditingController();

  String? _oldPartImgUrl;
  String? _carRegistrationImgUrl;
  bool _uploadingOldPart = false;
  bool _uploadingReg = false;
  bool _scanningVin = false;

  DeliveryType _deliveryType = DeliveryType.delivery;
  bool _gettingLocation = false;
  bool _editingAddress = false;
  String _municipality = _qatarMunicipalities.first;

  PaymentMethod _paymentMethod = PaymentMethod.card;
  bool _isLoading = false;
  String _createdOrderCode = '';

  String? _appliedPromo;
  double _discountAmount = 0;
  bool _freeDeliveryPromo = false;
  String? _promoFeedback;
  bool _promoValid = false;

  bool get isAr => widget.lang == 'ar';

  bool get _isApplePlatform {
    if (kIsWeb) return true;
    return !kIsWeb && Platform.isIOS;
  }

  List<PartModel> get _orderItems {
    final cart = CartService().items;
    if (cart.isNotEmpty) return cart;
    return [widget.part];
  }

  double get _subtotal => _orderItems.fold(
        0.0,
        (sum, p) => sum + (p.price * p.quantity),
      );

  double get _baseDeliveryFee =>
      _deliveryType == DeliveryType.delivery ? 35.0 : 0.0;

  double get deliveryFee =>
      _freeDeliveryPromo ? 0.0 : _baseDeliveryFee;

  double get totalPrice {
    final raw = _subtotal - _discountAmount + deliveryFee;
    return raw < 0 ? 0 : raw;
  }

  String get _recipientName {
    final typed = _recipientNameController.text.trim();
    if (typed.isNotEmpty) return typed;
    return AuthService().session?.fullName?.trim().isNotEmpty == true
        ? AuthService().session!.fullName!.trim()
        : (isAr ? 'عميل موجود أوتو' : 'Mawjood Customer');
  }

  String get _recipientPhoneDisplay {
    final typed = _recipientPhoneController.text.trim();
    if (typed.isNotEmpty) return typed;
    final session = AuthService().session?.displayPhone ?? '';
    if (session.isNotEmpty) return session;
    if (widget.customerPhone.isNotEmpty) return widget.customerPhone;
    return isAr ? 'غير محدد' : 'Not set';
  }

  @override
  void initState() {
    super.initState();
    _step = widget.initialStep == 'checkout'
        ? CheckoutStep.checkout
        : CheckoutStep.inquire;
    final stamp = DateTime.now().millisecondsSinceEpoch % 1000000;
    _draftRef = '#ORD-DRAFT-${stamp.toString().padLeft(6, '0')}';

    final session = AuthService().session;
    if (session?.fullName != null) {
      _recipientNameController.text = session!.fullName!;
    }
    final phone = widget.customerPhone.isNotEmpty
        ? widget.customerPhone
        : (session?.displayPhone ?? '');
    if (phone.isNotEmpty) {
      _recipientPhoneController.text = phone;
    }
    _addressController.text = isAr
        ? 'الدوحة، قطر — يرجى تحديد الشارع ورقم المبنى'
        : 'Doha, Qatar — please specify street & building';

    if (_isApplePlatform) {
      _paymentMethod = PaymentMethod.applePay;
    } else if (!kIsWeb && Platform.isAndroid) {
      _paymentMethod = PaymentMethod.googlePay;
    }
  }

  @override
  void dispose() {
    _vinController.dispose();
    _notesController.dispose();
    _addressController.dispose();
    _recipientNameController.dispose();
    _recipientPhoneController.dispose();
    _promoController.dispose();
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _cardExpiryController.dispose();
    _cardCvcController.dispose();
    super.dispose();
  }

  Future<String?> _uploadImageToStorage(File file) async {
    final fileExt = file.path.split('.').last.toLowerCase();
    final fileName =
        '${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(99999)}.$fileExt';
    final mimeType = fileExt == 'png' ? 'image/png' : 'image/jpeg';

    try {
      final bytes = await file.readAsBytes();
      final uploadUrl =
          '${SupabaseConfig.url}/storage/v1/object/part-images/$fileName';

      final res = await _dio.post(
        uploadUrl,
        data: bytes,
        options: Options(
          headers: {
            'apikey': SupabaseConfig.apiKey,
            'Authorization': 'Bearer ${SupabaseConfig.apiKey}',
            'Content-Type': mimeType,
          },
        ),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        return '${SupabaseConfig.url}/storage/v1/object/public/part-images/$fileName';
      }
    } catch (_) {}
    return null;
  }

  Future<void> _handleRegImagePick() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    final file = File(picked.path);
    setState(() {
      _uploadingReg = true;
      _scanningVin = true;
    });

    try {
      final publicUrl = await _uploadImageToStorage(file);
      if (publicUrl != null) {
        setState(() => _carRegistrationImgUrl = publicUrl);
      }

      final scanResult = await IstemaraService.scanIstemara(imageFile: file);
      if (scanResult.success &&
          scanResult.vin != null &&
          scanResult.vin!.isNotEmpty) {
        _vinController.text = scanResult.vin!;
        if (mounted) {
          CustomToast.success(
            context,
            isAr ? 'تم استخراج رقم الشاصي بنجاح' : 'VIN extracted',
          );
        }
      }
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          isAr ? 'فشل قراءة الاستمارة' : 'Failed to scan registration',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _uploadingReg = false;
          _scanningVin = false;
        });
      }
    }
  }

  Future<void> _handleOldPartImagePick() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    final file = File(picked.path);
    setState(() => _uploadingOldPart = true);

    try {
      final publicUrl = await _uploadImageToStorage(file);
      if (publicUrl != null) {
        setState(() => _oldPartImgUrl = publicUrl);
      }
    } finally {
      if (mounted) setState(() => _uploadingOldPart = false);
    }
  }

  void _handleGetGPSLocation() {
    setState(() => _gettingLocation = true);
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      const gMapsUrl = 'https://www.google.com/maps?q=25.2854,51.5310';
      setState(() {
        _addressController.text = isAr
            ? '$_municipality، موقع محدد عبر الخريطة ($gMapsUrl)'
            : '$_municipality, Map Location ($gMapsUrl)';
        _gettingLocation = false;
        _editingAddress = false;
      });
      CustomToast.success(
        context,
        isAr ? 'تم تحديد إحداثيات موقعك' : 'Location captured',
      );
    });
  }

  void _applyPromo() {
    final code = _promoController.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() {
        _appliedPromo = null;
        _discountAmount = 0;
        _freeDeliveryPromo = false;
        _promoValid = false;
        _promoFeedback =
            isAr ? 'يرجى إدخال كود الخصم' : 'Enter a promo code';
      });
      return;
    }

    setState(() {
      switch (code) {
        case 'MAWJOOD10':
          _appliedPromo = code;
          _discountAmount = _subtotal * 0.10;
          _freeDeliveryPromo = false;
          _promoValid = true;
          _promoFeedback = isAr
              ? 'تم تطبيق خصم 10%'
              : '10% discount applied';
          break;
        case 'SAVE20':
          _appliedPromo = code;
          _discountAmount = 20;
          _freeDeliveryPromo = false;
          _promoValid = true;
          _promoFeedback =
              isAr ? 'تم خصم 20 ر.ق' : '20 QAR discount applied';
          break;
        case 'FREEDEL':
          _appliedPromo = code;
          _discountAmount = 0;
          _freeDeliveryPromo = true;
          _promoValid = true;
          _promoFeedback =
              isAr ? 'التوصيل مجاني لهذا الطلب' : 'Free delivery unlocked';
          break;
        default:
          _appliedPromo = null;
          _discountAmount = 0;
          _freeDeliveryPromo = false;
          _promoValid = false;
          _promoFeedback =
              isAr ? 'كود الخصم غير صالح' : 'Invalid promo code';
      }
    });
  }

  Future<void> _handleSendInquiry() async {
    setState(() => _isLoading = true);
    final inqCode = 'INQ-${Random().nextInt(899999) + 100000}';

    try {
      final payload = {
        'inquiry_code': inqCode,
        'part_id': widget.part.id.startsWith('custom-')
            ? null
            : int.tryParse(widget.part.id),
        'part_name': widget.part.name,
        'part_number': widget.part.partNumber,
        'part_price': widget.part.price,
        'part_image': widget.part.imageUrl,
        'garage_id': widget.part.garageId ?? 'garage',
        'customer_phone': widget.customerPhone.isNotEmpty
            ? widget.customerPhone
            : 'CUST-GUEST',
        'car_make': widget.part.make,
        'car_model': widget.part.model,
        'car_year': widget.part.year,
        'vin_number': _vinController.text.trim().toUpperCase().isNotEmpty
            ? _vinController.text.trim().toUpperCase()
            : null,
        'customer_notes': _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
        'old_part_img': _oldPartImgUrl,
        'car_registration_img': _carRegistrationImgUrl,
        'status': 'pending_check',
      };

      await ApiClient().post('/fitment_inquiries', data: payload);
      await CartService().addToCart(
        partId: widget.part.id,
        part: widget.part,
        quantity: 1,
      );

      setState(() {
        _createdOrderCode = inqCode;
        _step = CheckoutStep.success;
      });
      widget.onSuccess?.call();
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          isAr ? 'فشل إرسال الاستفسار' : 'Failed to send inquiry',
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<String> _resolveCustomerPhone() async {
    if (_recipientPhoneController.text.trim().isNotEmpty) {
      return _recipientPhoneController.text.trim();
    }
    if (widget.customerPhone.trim().isNotEmpty) {
      return widget.customerPhone.trim();
    }
    final sessionPhone = AuthService().session?.displayPhone ?? '';
    if (sessionPhone.isNotEmpty) return sessionPhone;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('customer_phone') ?? 'CUST-GUEST';
  }

  Future<void> _handleFinalCheckout() async {
    if (_isLoading) return;

    if (_deliveryType == DeliveryType.delivery &&
        _addressController.text.trim().isEmpty) {
      CustomToast.error(
        context,
        isAr ? 'يرجى إدخال عنوان التوصيل' : 'Enter delivery address',
      );
      return;
    }

    setState(() => _isLoading = true);
    final ordCode = 'ORD-${Random().nextInt(899999) + 100000}';
    final pickupCode = (Random().nextInt(8999) + 1000).toString();
    final customerPhone = await _resolveCustomerPhone();
    final customerId = AuthService().session?.user?['id']?.toString();
    final deliveryAddress = _deliveryType == DeliveryType.delivery
        ? '${_addressController.text.trim()} · $_municipality'
        : (isAr ? 'استلام من المقر' : 'Store Pickup');

    try {
      final items = _orderItems;
      final primary = items.first;
      final partId = primary.id.startsWith('custom-')
          ? null
          : int.tryParse(primary.id);

      final itemsJson = items
          .map(
            (p) => {
              'part_id':
                  p.id.startsWith('custom-') ? null : int.tryParse(p.id),
              'part_name': p.name,
              'part_number': p.partNumber,
              'quantity': p.quantity,
              'price': p.price,
              'make': p.make,
              'model': p.model,
              'year': p.year,
            },
          )
          .toList();

      final payload = <String, dynamic>{
        'order_code': ordCode,
        'part_id': partId,
        'part_name': items.length == 1
            ? primary.name
            : (isAr
                ? '${primary.name} (+${items.length - 1})'
                : '${primary.name} (+${items.length - 1})'),
        'price': totalPrice,
        'total_price': totalPrice,
        'total': totalPrice,
        'garage_id': primary.garageId ?? 'garage',
        if (customerId != null && customerId.isNotEmpty)
          'customer_id': customerId,
        'customer_phone': customerPhone,
        'delivery_type':
            _deliveryType == DeliveryType.delivery ? 'delivery' : 'pickup',
        'address_details': deliveryAddress,
        'delivery_address': deliveryAddress,
        'payment_method': _paymentMethod.name,
        'payment_status':
            _paymentMethod == PaymentMethod.cod ? 'cod' : 'pending',
        'pickup_code': pickupCode,
        'status': 'pending',
        'items': itemsJson,
        if (_appliedPromo != null) 'promo_code': _appliedPromo,
        if (_discountAmount > 0) 'discount': _discountAmount,
        'recipient_name': _recipientName,
        'draft_ref': _draftRef,
      };

      var res = await ApiClient().post('/orders', data: payload);
      var ok = res.statusCode == 200 ||
          res.statusCode == 201 ||
          res.statusCode == 204;

      if (!ok) {
        res = await ApiClient().post(
          '/orders',
          data: {
            if (customerId != null && customerId.isNotEmpty)
              'customer_id': customerId,
            'customer_phone': customerPhone,
            'items': itemsJson,
            'delivery_address': deliveryAddress,
            'total_price': totalPrice,
            'price': totalPrice,
            'payment_method': _paymentMethod.name,
            'status': 'pending',
            'part_name': primary.name,
            'garage_id': primary.garageId ?? 'garage',
            'order_code': ordCode,
          },
        );
        ok = res.statusCode == 200 ||
            res.statusCode == 201 ||
            res.statusCode == 204;
      }

      if (!ok) {
        res = await ApiClient().post(
          '/orders',
          data: {
            'part_name': primary.name,
            'price': totalPrice,
            'garage_id': primary.garageId ?? 'garage',
            'customer_phone': customerPhone,
            'status': 'pending',
            'payment_method': _paymentMethod.name,
            'delivery_address': deliveryAddress,
            'total_price': totalPrice,
          },
        );
        ok = res.statusCode == 200 ||
            res.statusCode == 201 ||
            res.statusCode == 204;
      }

      if (!ok) {
        throw Exception(
          'order_create_failed status=${res.statusCode} body=${res.data}',
        );
      }

      for (final item in items) {
        await CartService().removeFromCart(item.id);
      }

      if (mounted) {
        CustomToast.success(
          context,
          isAr
              ? 'تم تأكيد الطلب بنجاح ($ordCode)'
              : 'Order confirmed ($ordCode)',
        );
        setState(() {
          _createdOrderCode = ordCode;
          _step = CheckoutStep.success;
        });
      }

      OrderNotificationService.instance.startTracking(lang: widget.lang);
      widget.onSuccess?.call();
    } catch (e, st) {
      await ErrorLogger.log(
        severity: 'HIGH',
        componentName: 'CheckoutScreen',
        errorType: 'OrderSubmitError',
        message: e.toString(),
        stackTrace: st.toString(),
      );
      if (mounted) {
        CustomToast.error(
          context,
          isAr ? 'فشل معالجة الدفع' : 'Payment failed',
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _goToOrderTracker() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => OrderTrackerScreen(lang: widget.lang),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bg,
        appBar: AppBar(
          backgroundColor: _bgAlt,
          elevation: 0,
          iconTheme: const IconThemeData(color: _text),
          title: Text(
            _step == CheckoutStep.inquire
                ? (isAr ? 'فحص مطابقة الشاصي' : 'Fitment Verification')
                : _step == CheckoutStep.checkout
                    ? (isAr ? 'إتمام الشراء والدفع' : 'Checkout & Payment')
                    : (isAr ? 'تم استلام الطلب' : 'Order Confirmed'),
            style: const TextStyle(
              color: _text,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: _step == CheckoutStep.checkout
            ? _buildCheckoutBody()
            : SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 580),
                    child: _step == CheckoutStep.inquire
                        ? _buildInquireStep()
                        : _buildSuccessStep(),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildCheckoutBody() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 580),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildDraftHeader(),
                    const SizedBox(height: 14),
                    _buildItemsBreakdown(),
                    const SizedBox(height: 14),
                    _buildPromoSection(),
                    const SizedBox(height: 14),
                    _buildDeliveryMethodRow(),
                    const SizedBox(height: 14),
                    _buildAddressCard(),
                    const SizedBox(height: 14),
                    _buildPaymentSelector(),
                    if (_paymentMethod == PaymentMethod.card) ...[
                      const SizedBox(height: 12),
                      _buildCardForm(),
                    ],
                    const SizedBox(height: 14),
                    _buildFinancialReceipt(),
                    const SizedBox(height: 88),
                  ],
                ),
              ),
            ),
          ),
        ),
        _buildStickyCta(),
      ],
    );
  }

  Widget _cardShell({required Widget child, EdgeInsets? padding}) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.28),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _sectionTitle(String title, {IconData? icon}) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 18, color: _copper),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: _text,
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDraftHeader() {
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _copper.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _copper.withValues(alpha: 0.45)),
                ),
                child: Text(
                  _draftRef,
                  style: const TextStyle(
                    color: _copper,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              const Spacer(),
              const Icon(Icons.schedule, size: 16, color: _amber),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            isAr
                ? 'التوصيل المتوقع: خلال 2 إلى 24 ساعة'
                : 'Estimated delivery: within 2 to 24 hours',
            style: const TextStyle(
              color: _text,
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.location_city_outlined, size: 15, color: _muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  isAr
                      ? 'البلدية: $_municipality · دولة قطر'
                      : 'Municipality: $_municipality · Qatar',
                  style: const TextStyle(
                    color: _muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemsBreakdown() {
    final items = _orderItems;
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle(
            isAr ? 'تفاصيل المشتريات' : 'Purchase Details',
            icon: Icons.inventory_2_outlined,
          ),
          const SizedBox(height: 12),
          ...List.generate(items.length, (i) {
            final p = items[i];
            final lineTotal = p.price * p.quantity;
            return Padding(
              padding: EdgeInsets.only(bottom: i == items.length - 1 ? 0 : 12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _surfaceElevated,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        width: 58,
                        height: 58,
                        color: _bg,
                        child: Image.network(
                          p.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const Icon(
                            Icons.build_outlined,
                            color: _muted,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AiTranslatedText(
                            text: p.name,
                            lang: widget.lang,
                            style: const TextStyle(
                              color: _text,
                              fontWeight: FontWeight.w800,
                              fontSize: 13.5,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${isAr ? 'رقم القطعة' : 'PN'}: ${p.partNumber?.trim().isNotEmpty == true ? p.partNumber : '—'}',
                            style: const TextStyle(
                              color: _muted,
                              fontSize: 11,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: _copper.withValues(alpha: 0.35),
                              ),
                            ),
                            child: Text(
                              isAr
                                  ? 'السيارة المتوافقة: ${p.make} / ${p.model} / ${p.year}'
                                  : 'Fitment: ${p.make} / ${p.model} / ${p.year}',
                              style: const TextStyle(
                                color: _amber,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                isAr
                                    ? 'الكمية: ${p.quantity}'
                                    : 'Qty: ${p.quantity}',
                                style: const TextStyle(
                                  color: _muted,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${lineTotal.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                                style: const TextStyle(
                                  color: _copper,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '${p.price.toStringAsFixed(0)} × ${p.quantity}',
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 10.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPromoSection() {
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle(
            isAr ? 'كود الخصم' : 'Promo Code',
            icon: Icons.local_offer_outlined,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promoController,
                  cursorColor: _text,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(
                    color: _text,
                    fontWeight: FontWeight.w600,
                    fontSize: 13.5,
                  ),
                  decoration: InputDecoration(
                    hintText: isAr ? 'أدخل كود الخصم' : 'Enter promo code',
                    hintStyle: const TextStyle(color: _muted, fontSize: 13),
                    prefixIcon: const Icon(
                      Icons.confirmation_number_outlined,
                      color: _muted,
                      size: 20,
                    ),
                    filled: true,
                    fillColor: _surfaceElevated,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _copper),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _applyPromo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _copper,
                    foregroundColor: _text,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: Text(
                    isAr ? 'تطبيق' : 'Apply',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          ),
          if (_promoFeedback != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: _promoValid
                    ? _success.withValues(alpha: 0.12)
                    : const Color(0xFF7F1D1D).withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _promoValid ? _success : AppTheme.danger,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _promoValid
                        ? Icons.check_circle_outline
                        : Icons.error_outline,
                    size: 16,
                    color: _promoValid ? _success : AppTheme.danger,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _promoFeedback!,
                      style: TextStyle(
                        color: _promoValid ? _success : const Color(0xFFFCA5A5),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDeliveryMethodRow() {
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle(
            isAr ? 'طريقة الاستلام' : 'Fulfillment',
            icon: Icons.local_shipping_outlined,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _selectTile(
                  selected: _deliveryType == DeliveryType.delivery,
                  label: isAr ? 'توصيل (35 ر.ق)' : 'Delivery (35 QAR)',
                  icon: Icons.delivery_dining_outlined,
                  onTap: () =>
                      setState(() => _deliveryType = DeliveryType.delivery),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _selectTile(
                  selected: _deliveryType == DeliveryType.pickup,
                  label: isAr ? 'استلام من المقر' : 'Store Pickup',
                  icon: Icons.storefront_outlined,
                  onTap: () =>
                      setState(() => _deliveryType = DeliveryType.pickup),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _selectTile({
    required bool selected,
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? _surfaceElevated : _bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? _copper : _border,
            width: selected ? 1.6 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: _copper.withValues(alpha: 0.18),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: selected ? _copper : _muted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: selected ? _text : _muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle, size: 16, color: _copper),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard() {
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: _sectionTitle(
                  isAr ? 'عنوان التوصيل والمستلم' : 'Delivery & Recipient',
                  icon: Icons.place_outlined,
                ),
              ),
              TextButton(
                onPressed: () =>
                    setState(() => _editingAddress = !_editingAddress),
                style: TextButton.styleFrom(
                  foregroundColor: _copper,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                child: Text(
                  _editingAddress
                      ? (isAr ? 'حفظ' : 'Save')
                      : (isAr ? 'تغيير' : 'Edit'),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (!_editingAddress) ...[
            _infoRow(Icons.person_outline, _recipientName),
            const SizedBox(height: 6),
            _infoRow(Icons.phone_outlined, _recipientPhoneDisplay),
            const SizedBox(height: 6),
            _infoRow(
              Icons.home_outlined,
              _deliveryType == DeliveryType.delivery
                  ? _addressController.text
                  : (isAr ? 'استلام من المقر' : 'Store Pickup'),
            ),
            const SizedBox(height: 6),
            _infoRow(Icons.map_outlined, _municipality),
          ] else ...[
            _darkField(
              controller: _recipientNameController,
              label: isAr ? 'اسم المستلم' : 'Recipient name',
            ),
            const SizedBox(height: 10),
            _darkField(
              controller: _recipientPhoneController,
              label: isAr ? 'رقم الجوال' : 'Phone',
              keyboardType: TextInputType.phone,
            ),
            if (_deliveryType == DeliveryType.delivery) ...[
              const SizedBox(height: 10),
              _darkField(
                controller: _addressController,
                label: isAr ? 'تفاصيل العنوان' : 'Address details',
                maxLines: 2,
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: _municipality,
                dropdownColor: _surfaceElevated,
                style: const TextStyle(color: _text, fontSize: 13),
                decoration: InputDecoration(
                  labelText: isAr ? 'البلدية' : 'Municipality',
                  labelStyle: const TextStyle(color: _muted),
                  filled: true,
                  fillColor: _surfaceElevated,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _border),
                  ),
                ),
                items: _qatarMunicipalities
                    .map(
                      (m) => DropdownMenuItem(value: m, child: Text(m)),
                    )
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _municipality = v);
                },
              ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _gettingLocation ? null : _handleGetGPSLocation,
                  icon: _gettingLocation
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: _copper,
                          ),
                        )
                      : const Icon(Icons.my_location, size: 16),
                  label: Text(
                    isAr ? 'موقعي بالخريطة' : 'Use my location',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  style: TextButton.styleFrom(foregroundColor: _copper),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: _muted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: _text,
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }

  Widget _darkField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      cursorColor: _text,
      style: const TextStyle(color: _text, fontSize: 13.5),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: _muted),
        filled: true,
        fillColor: _surfaceElevated,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _copper),
        ),
      ),
    );
  }

  Widget _buildPaymentSelector() {
    final tiles = <_PayTile>[
      if (_isApplePlatform)
        _PayTile(
          method: PaymentMethod.applePay,
          label: 'Apple Pay',
          icon: Icons.apple,
        ),
      if ((!kIsWeb && Platform.isAndroid) || kIsWeb)
        _PayTile(
          method: PaymentMethod.googlePay,
          label: 'Google Pay',
          icon: Icons.account_balance_wallet_outlined,
        ),
      _PayTile(
        method: PaymentMethod.card,
        label: isAr ? 'بطاقة بنكية / فيزا وماستركارد' : 'Credit & Debit Card',
        icon: Icons.credit_card,
      ),
      _PayTile(
        method: PaymentMethod.cod,
        label: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery',
        icon: Icons.payments_outlined,
      ),
      _PayTile(
        method: PaymentMethod.installments,
        label: isAr
            ? 'قسّمها على 4 دفعات'
            : 'Pay in 4 installments',
        icon: Icons.calendar_view_month_outlined,
        subtitle: isAr
            ? '${(totalPrice / 4).toStringAsFixed(2)} ر.ق / دفعة'
            : '${(totalPrice / 4).toStringAsFixed(2)} QAR / payment',
      ),
    ];

    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle(
            isAr ? 'طريقة الدفع' : 'Payment Method',
            icon: Icons.payment_outlined,
          ),
          const SizedBox(height: 12),
          ...tiles.map((t) {
            final selected = _paymentMethod == t.method;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => setState(() => _paymentMethod = t.method),
                borderRadius: BorderRadius.circular(14),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 13,
                  ),
                  decoration: BoxDecoration(
                    color: selected ? _surfaceElevated : _bg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: selected ? _copper : _border,
                      width: selected ? 1.8 : 1,
                    ),
                    boxShadow: selected
                        ? [
                            BoxShadow(
                              color: _copper.withValues(alpha: 0.22),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        t.icon,
                        color: selected ? _copper : _muted,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.label,
                              style: TextStyle(
                                color: selected ? _text : _muted,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                            if (t.subtitle != null)
                              Text(
                                t.subtitle!,
                                style: const TextStyle(
                                  color: _amber,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (selected)
                        const Icon(
                          Icons.check_circle,
                          color: _copper,
                          size: 20,
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCardForm() {
    return _cardShell(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          _darkField(
            controller: _cardNumberController,
            label: isAr ? 'رقم البطاقة' : 'Card number',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 10),
          _darkField(
            controller: _cardHolderController,
            label: isAr ? 'اسم حامل البطاقة' : 'Card holder',
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _darkField(
                  controller: _cardExpiryController,
                  label: isAr ? 'الانتهاء' : 'Expiry',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _darkField(
                  controller: _cardCvcController,
                  label: 'CVC',
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialReceipt() {
    final installment = (totalPrice / 4).toStringAsFixed(2);
    return _cardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle(
            isAr ? 'ملخص الفاتورة' : 'Order Receipt',
            icon: Icons.receipt_long_outlined,
          ),
          const SizedBox(height: 12),
          _receiptRow(
            isAr ? 'مجموع القطع' : 'Subtotal',
            '${_subtotal.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
          ),
          const SizedBox(height: 8),
          _receiptRow(
            isAr ? 'الخصم' : 'Discount',
            _discountAmount > 0
                ? '-${_discountAmount.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}'
                : (isAr ? 'لا يوجد' : 'None'),
            valueColor: _discountAmount > 0 ? _success : _muted,
          ),
          const SizedBox(height: 8),
          _receiptRow(
            isAr ? 'رسوم التوصيل' : 'Delivery Fee',
            deliveryFee <= 0
                ? (isAr ? 'مجاني' : 'Free')
                : '${deliveryFee.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
            valueColor: deliveryFee <= 0 ? _success : _text,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: _border, height: 1),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  _copper.withValues(alpha: 0.18),
                  _amber.withValues(alpha: 0.10),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _copper.withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isAr ? 'الإجمالي النهائي' : 'Grand Total',
                  style: const TextStyle(
                    color: _text,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
                Text(
                  '${totalPrice.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                  style: const TextStyle(
                    color: _copper,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
              ],
            ),
          ),
          if (_paymentMethod == PaymentMethod.installments) ...[
            const SizedBox(height: 10),
            Text(
              isAr
                  ? 'أو 4 دفعات بدون فوائد بقيمة $installment ر.ق'
                  : 'Or 4 interest-free payments of $installment QAR',
              style: const TextStyle(
                color: _muted,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _muted,
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? _text,
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  Widget _buildStickyCta() {
    final label = isAr
        ? 'تأكيد الطلب والدفع - ${totalPrice.toStringAsFixed(0)} ر.ق'
        : 'Confirm & Pay - ${totalPrice.toStringAsFixed(0)} QAR';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      decoration: BoxDecoration(
        color: _bgAlt,
        border: const Border(top: BorderSide(color: _border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 18,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleFinalCheckout,
            style: ElevatedButton.styleFrom(
              backgroundColor: _copper,
              disabledBackgroundColor: _copper.withValues(alpha: 0.45),
              foregroundColor: _text,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: _text,
                    ),
                  )
                : Text(
                    label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14.5,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildInquireStep() {
    return _cardShell(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildPartOverviewCard(),
          const SizedBox(height: 18),
          Text(
            isAr
                ? 'رقم الشاسي (VIN) لمطابقة القطعة 100%:'
                : '17-digit VIN for 100% Fitment Match:',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: _text,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _vinController,
            maxLength: 17,
            textCapitalization: TextCapitalization.characters,
            cursorColor: _text,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontWeight: FontWeight.bold,
              fontSize: 13.5,
              color: _text,
            ),
            decoration: InputDecoration(
              hintText: isAr
                  ? 'أدخل 17 حرفاً ورقم أو ارفع الاستمارة...'
                  : 'Enter 17-character VIN...',
              hintStyle: const TextStyle(color: _muted),
              counterText: '',
              filled: true,
              fillColor: _surfaceElevated,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _border),
              ),
            ),
          ),
          if (_scanningVin) ...[
            const SizedBox(height: 6),
            Text(
              isAr
                  ? 'جاري فحص وقراءة رقم الشاصي بالذكاء الاصطناعي...'
                  : 'AI is reading VIN from registration...',
              style: const TextStyle(
                fontSize: 11.5,
                color: _copper,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildUploadBox(
                  title: isAr ? 'صورة القطعة القديمة' : 'Old Part Photo',
                  statusText: _uploadingOldPart
                      ? (isAr ? 'جاري الرفع...' : 'Uploading...')
                      : _oldPartImgUrl != null
                          ? (isAr ? 'تم الرفع' : 'Uploaded')
                          : (isAr ? 'اختر صورة' : 'Pick Image'),
                  onTap: _handleOldPartImagePick,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildUploadBox(
                  title: isAr ? 'صورة الاستمارة' : 'Istemara Card',
                  statusText: _uploadingReg
                      ? (isAr ? 'جاري الفحص...' : 'Scanning...')
                      : _carRegistrationImgUrl != null
                          ? (isAr ? 'تم الفحص' : 'Scanned')
                          : (isAr ? 'اختر صورة' : 'Pick Image'),
                  onTap: _handleRegImagePick,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            isAr
                ? 'ملاحظات إضافية للكراج (اختياري):'
                : 'Notes for Garage (Optional):',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: _text,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _notesController,
            maxLines: 2,
            cursorColor: _text,
            style: const TextStyle(fontSize: 13, color: _text),
            decoration: InputDecoration(
              hintText: isAr
                  ? 'مثلاً: هل هي للجهة اليمنى أم اليسرى؟'
                  : 'E.g., Right or left side?',
              hintStyle: const TextStyle(color: _muted),
              filled: true,
              fillColor: _surfaceElevated,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: _border),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSendInquiry,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1F3A5F),
                    foregroundColor: _text,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: _text,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          isAr ? 'إرسال وإضافة للسلة' : 'Send & Add to Cart',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () =>
                      setState(() => _step = CheckoutStep.checkout),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _copper,
                    foregroundColor: _text,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    isAr ? 'الدفع فوراً' : 'Direct Pay',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessStep() {
    return _cardShell(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.check_circle, size: 64, color: _success),
          const SizedBox(height: 10),
          Text(
            isAr ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: _success,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isAr
                ? 'كود العملية: $_createdOrderCode'
                : 'Order Code: $_createdOrderCode',
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: _text,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _goToOrderTracker,
            icon: const Icon(Icons.local_shipping_outlined, size: 18),
            label: Text(
              isAr ? 'متابعة الطلب' : 'Track Order',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _copper,
              foregroundColor: _text,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              isAr ? 'العودة للمتجر' : 'Back to Shop',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: _muted,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartOverviewCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _surfaceElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _border),
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.network(
              widget.part.imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) =>
                  const Icon(Icons.build, size: 28, color: _muted),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AiTranslatedText(
                  text: widget.part.name,
                  lang: widget.lang,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _text,
                  ),
                ),
                Text(
                  '${widget.part.make} - ${widget.part.model} (${widget.part.year})',
                  style: const TextStyle(fontSize: 11.5, color: _muted),
                ),
                Text(
                  '${widget.part.price.toStringAsFixed(0)} QAR',
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: _copper,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadBox({
    required String title,
    required String statusText,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: _surfaceElevated,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _border),
        ),
        child: Column(
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: _text,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              statusText,
              style: const TextStyle(fontSize: 11, color: _muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _PayTile {
  final PaymentMethod method;
  final String label;
  final IconData icon;
  final String? subtitle;

  const _PayTile({
    required this.method,
    required this.label,
    required this.icon,
    this.subtitle,
  });
}
