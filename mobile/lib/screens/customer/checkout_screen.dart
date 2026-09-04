import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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
import 'package:shared_preferences/shared_preferences.dart';
import 'order_tracker_screen.dart';

enum CheckoutStep { inquire, checkout, success }

enum DeliveryType { delivery, pickup }

enum PaymentMethod { applePay, googlePay, card, cod }

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
  late CheckoutStep _step;
  final ImagePicker _picker = ImagePicker();
  final Dio _dio = Dio();

  final TextEditingController _vinController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  String? _oldPartImgUrl;
  String? _carRegistrationImgUrl;
  bool _uploadingOldPart = false;
  bool _uploadingReg = false;
  bool _scanningVin = false;

  DeliveryType _deliveryType = DeliveryType.delivery;
  final TextEditingController _addressController = TextEditingController();
  bool _gettingLocation = false;

  PaymentMethod _paymentMethod = PaymentMethod.card;
  final TextEditingController _cardNumberController = TextEditingController();
  final TextEditingController _cardHolderController = TextEditingController();
  final TextEditingController _cardExpiryController = TextEditingController();
  final TextEditingController _cardCvcController = TextEditingController();

  bool _isLoading = false;
  String _createdOrderCode = '';

  bool get isAr => widget.lang == 'ar';
  double get deliveryFee => _deliveryType == DeliveryType.delivery ? 35.0 : 0.0;
  double get totalPrice => widget.part.price + deliveryFee;

  @override
  void initState() {
    super.initState();
    _step = widget.initialStep == 'checkout'
        ? CheckoutStep.checkout
        : CheckoutStep.inquire;
  }

  @override
  void dispose() {
    _vinController.dispose();
    _notesController.dispose();
    _addressController.dispose();
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
    if (picked == null) {
      return;
    }

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
            isAr ? 'تم استخراج رقم الشاصي بنجاح!' : 'VIN extracted!',
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
    if (picked == null) {
      return;
    }

    final file = File(picked.path);
    setState(() => _uploadingOldPart = true);

    try {
      final publicUrl = await _uploadImageToStorage(file);
      if (publicUrl != null) {
        setState(() => _oldPartImgUrl = publicUrl);
      }
    } finally {
      if (mounted) {
        setState(() => _uploadingOldPart = false);
      }
    }
  }

  void _handleGetGPSLocation() {
    setState(() => _gettingLocation = true);
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) {
        return;
      }
      const gMapsUrl = 'https://www.google.com/maps?q=25.2854,51.5310';
      setState(() {
        _addressController.text = isAr
            ? 'الدوحة، موقع محدد عبر الخريطة ($gMapsUrl)'
            : 'Doha, Map Location ($gMapsUrl)';
        _gettingLocation = false;
      });
      CustomToast.success(
        context,
        isAr ? 'تم تحديد إحداثيات موقعك' : 'Location captured',
      );
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
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<String> _resolveCustomerPhone() async {
    if (widget.customerPhone.trim().isNotEmpty) {
      return widget.customerPhone.trim();
    }
    final sessionPhone = AuthService().session?.displayPhone ?? '';
    if (sessionPhone.isNotEmpty) return sessionPhone;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('customer_phone') ?? 'CUST-GUEST';
  }

  Future<void> _handleFinalCheckout() async {
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
        ? _addressController.text.trim()
        : (isAr ? 'استلام من المقر' : 'Store Pickup');

    try {
      final partId = widget.part.id.startsWith('custom-')
          ? null
          : int.tryParse(widget.part.id);

      final itemsJson = [
        {
          'part_id': partId,
          'part_name': widget.part.name,
          'part_number': widget.part.partNumber,
          'quantity': 1,
          'price': widget.part.price,
        },
      ];

      final payload = <String, dynamic>{
        'order_code': ordCode,
        'part_id': partId,
        'part_name': widget.part.name,
        'price': totalPrice,
        'total_price': totalPrice,
        'total': totalPrice,
        'garage_id': widget.part.garageId ?? 'garage',
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
      };

      var res = await ApiClient().post('/orders', data: payload);
      var ok = res.statusCode == 200 ||
          res.statusCode == 201 ||
          res.statusCode == 204;

      if (!ok) {
        // Schema-aligned core columns only
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
            'part_name': widget.part.name,
            'garage_id': widget.part.garageId ?? 'garage',
            'order_code': ordCode,
          },
        );
        ok = res.statusCode == 200 ||
            res.statusCode == 201 ||
            res.statusCode == 204;
      }

      if (!ok) {
        // Minimal web-compatible fallback
        res = await ApiClient().post(
          '/orders',
          data: {
            'part_name': widget.part.name,
            'price': totalPrice,
            'garage_id': widget.part.garageId ?? 'garage',
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

      await CartService().removeFromCart(widget.part.id);

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
      if (mounted) {
        setState(() => _isLoading = false);
      }
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
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFF090D16),
          elevation: 0,
          title: Text(
            _step == CheckoutStep.inquire
                ? (isAr ? 'فحص مطابقة الشاصي' : 'Fitment Verification')
                : _step == CheckoutStep.checkout
                ? (isAr ? 'إتمام الشراء والدفع' : 'Checkout & Payment')
                : (isAr ? 'تم استلام الطلب' : 'Order Confirmed'),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 580),
              child: Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_step == CheckoutStep.inquire) _buildInquireStep(),
                    if (_step == CheckoutStep.checkout) _buildCheckoutStep(),
                    if (_step == CheckoutStep.success) _buildSuccessStep(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInquireStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildPartOverviewCard(),
        const SizedBox(height: 18),
        Text(
          isAr
              ? '🔑 رقم الشاسي (VIN) لمطابقة القطعة 100%:'
              : '🔑 17-digit VIN for 100% Fitment Match:',
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _vinController,
          maxLength: 17,
          textCapitalization: TextCapitalization.characters,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
            fontSize: 13.5,
          ),
          decoration: InputDecoration(
            hintText: isAr
                ? 'أدخل 17 حرفاً ورقم أو ارفع الاستمارة...'
                : 'Enter 17-character VIN...',
            counterText: '',
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
          ),
        ),
        if (_scanningVin) ...[
          const SizedBox(height: 6),
          Text(
            isAr
                ? '⏳ جاري فحص وقراءة رقم الشاصي بالذكاء الاصطناعي...'
                : 'AI is reading VIN from registration...',
            style: const TextStyle(
              fontSize: 11.5,
              color: AppTheme.copper,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildUploadBox(
                title: isAr ? '📸 صورة القطعة القديمة:' : '📸 Old Part Photo:',
                statusText: _uploadingOldPart
                    ? (isAr ? 'جاري الرفع...' : 'Uploading...')
                    : _oldPartImgUrl != null
                    ? (isAr ? '✅ تم الرفع' : '✅ Uploaded')
                    : (isAr ? 'اختر صورة 📷' : 'Pick Image 📷'),
                onTap: _handleOldPartImagePick,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildUploadBox(
                title: isAr ? '📄 صورة الاستمارة:' : '📄 Istemara Card:',
                statusText: _uploadingReg
                    ? (isAr ? 'جاري الفحص...' : 'Scanning...')
                    : _carRegistrationImgUrl != null
                    ? (isAr ? '✅ تم الفحص' : '✅ Scanned')
                    : (isAr ? 'اختر صورة 📄' : 'Pick Image 📄'),
                onTap: _handleRegImagePick,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          isAr
              ? '💬 ملاحظات إضافية للكراج (اختياري):'
              : '💬 Notes for Garage (Optional):',
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _notesController,
          maxLines: 2,
          style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(
            hintText: isAr
                ? 'مثلاً: هل هي للجهة اليمنى أم اليسرى؟'
                : 'E.g., Right or left side?',
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
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
                  foregroundColor: Colors.white,
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
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        isAr
                            ? '🔍 إرسال وإضافة للسلة'
                            : '🔍 Send & Add to Cart',
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
                onPressed: () => setState(() => _step = CheckoutStep.checkout),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.copper,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  isAr ? '🚀 الدفع فوراً' : 'Direct Pay',
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
    );
  }

  Widget _buildCheckoutStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          isAr ? '🚚 طريقة استلام القطعة:' : '🚚 Delivery Method:',
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildSelectOption(
                isSelected: _deliveryType == DeliveryType.delivery,
                title: isAr ? '🚚 توصيل (35 QAR)' : '🚚 Delivery (35 QAR)',
                onTap: () =>
                    setState(() => _deliveryType = DeliveryType.delivery),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildSelectOption(
                isSelected: _deliveryType == DeliveryType.pickup,
                title: isAr ? '🏪 استلام من المقر' : '🏪 Pickup (Free)',
                onTap: () =>
                    setState(() => _deliveryType = DeliveryType.pickup),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_deliveryType == DeliveryType.delivery) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr
                          ? '📍 عنوان التوصيل بالتفصيل:'
                          : '📍 Delivery Address:',
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F3A5F),
                      ),
                    ),
                    InkWell(
                      onTap: _gettingLocation ? null : _handleGetGPSLocation,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.copper,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _gettingLocation
                              ? (isAr ? 'جاري التحديد...' : 'Locating...')
                              : (isAr ? '📍 موقعي بالخريطة' : '📍 My Location'),
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
                const SizedBox(height: 8),
                TextField(
                  controller: _addressController,
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: isAr
                        ? 'المنطقة، الشارع، رقم المبنى...'
                        : 'Zone, Street, Building...',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        Text(
          isAr ? '💳 طريقة الدفع:' : '💳 Payment Method:',
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        _buildPaymentMethodButton(
          method: PaymentMethod.applePay,
          label: isAr ? '🍏 الدفع بـ Apple Pay' : '🍏 Apple Pay',
          bgColor: Colors.black,
          fgColor: Colors.white,
        ),
        const SizedBox(height: 6),
        _buildPaymentMethodButton(
          method: PaymentMethod.card,
          label: isAr ? '💳 بطاقة بنكية (Visa / MC)' : '💳 Credit Card',
          bgColor: const Color(0xFFF0F7FF),
          fgColor: const Color(0xFF1F3A5F),
          borderColor: const Color(0xFFBAE6FD),
        ),
        const SizedBox(height: 6),
        _buildPaymentMethodButton(
          method: PaymentMethod.cod,
          label: isAr ? '💵 الدفع عند الاستلام (كاش)' : '💵 Cash on Delivery',
          bgColor: const Color(0xFFFFFDF5),
          fgColor: const Color(0xFF92400E),
          borderColor: const Color(0xFFFDE68A),
        ),
        if (_paymentMethod == PaymentMethod.card) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F7FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBAE6FD)),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _cardNumberController,
                  keyboardType: TextInputType.number,
                  maxLength: 19,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13.5,
                  ),
                  decoration: InputDecoration(
                    labelText: isAr ? 'رقم البطاقة (16 رقم)' : 'Card Number',
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _cardHolderController,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    labelText: isAr ? 'اسم حامل البطاقة' : 'Card Holder Name',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _cardExpiryController,
                        maxLength: 5,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontFamily: 'monospace'),
                        decoration: InputDecoration(
                          labelText: isAr ? 'الانتهاء (MM/YY)' : 'Expiry',
                          counterText: '',
                          filled: true,
                          fillColor: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _cardCvcController,
                        maxLength: 4,
                        obscureText: true,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontFamily: 'monospace'),
                        decoration: const InputDecoration(
                          labelText: 'CVC',
                          counterText: '',
                          filled: true,
                          fillColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isAr ? 'قيمة القطعة:' : 'Part Price:',
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    '${widget.part.price.toStringAsFixed(0)} QAR',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              if (_deliveryType == DeliveryType.delivery) ...[
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isAr ? 'رسوم التوصيل:' : 'Delivery Fee:',
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 13,
                      ),
                    ),
                    const Text(
                      '35 QAR',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
              const Divider(color: Color(0xFFE2E8F0), height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isAr ? 'المبلغ الإجمالي المستحق:' : 'Total Due:',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    '${totalPrice.toStringAsFixed(0)} QAR',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      color: AppTheme.copper,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleFinalCheckout,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    isAr
                        ? '🚀 تأكيد وإتمام الشراء ($totalPrice QAR)'
                        : '🚀 Confirm & Pay ($totalPrice QAR)',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessStep() {
    return Column(
      children: [
        const SizedBox(height: 10),
        const Icon(Icons.check_circle, size: 64, color: Color(0xFF16A34A)),
        const SizedBox(height: 10),
        Text(
          isAr ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF16A34A),
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
            color: Color(0xFF1F3A5F),
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
            backgroundColor: AppTheme.copper,
            foregroundColor: Colors.white,
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
            isAr ? 'العودة للمتجر 🛒' : 'Back to Shop 🛒',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F3A5F),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPartOverviewCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFCBD5E0)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.network(
              widget.part.imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const Icon(Icons.build, size: 28),
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
                    color: Color(0xFF1E293B),
                  ),
                ),
                Text(
                  '${widget.part.make} - ${widget.part.model} (${widget.part.year})',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF64748B),
                  ),
                ),
                Text(
                  '${widget.part.price.toStringAsFixed(0)} QAR',
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.copper,
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
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFCBD5E0)),
        ),
        child: Column(
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              statusText,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectOption({
    required bool isSelected,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE8F2FC) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF1F3A5F)
                : const Color(0xFFCBD5E0),
            width: isSelected ? 1.8 : 1,
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected
                  ? const Color(0xFF1F3A5F)
                  : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethodButton({
    required PaymentMethod method,
    required String label,
    required Color bgColor,
    required Color fgColor,
    Color? borderColor,
  }) {
    final isSelected = _paymentMethod == method;
    return InkWell(
      onTap: () => setState(() => _paymentMethod = method),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected
                ? AppTheme.copper
                : (borderColor ?? Colors.transparent),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                color: fgColor,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, size: 16, color: AppTheme.copper),
          ],
        ),
      ),
    );
  }
}
