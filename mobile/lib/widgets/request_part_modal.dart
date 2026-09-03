import 'dart:io';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../config/supabase_config.dart';
import '../config/theme.dart';
import '../data/car_data.dart';
import '../services/api_client.dart';
import '../services/istemara_service.dart';
import 'custom_toast.dart';

class RequestPartModal extends StatefulWidget {
  final String customerPhone;
  final String initialPartName;
  final VoidCallback? onSuccess;

  const RequestPartModal({
    super.key,
    this.customerPhone = '',
    this.initialPartName = '',
    this.onSuccess,
  });

  /// فتح النافذة المنبثقة مباشرة من أي مكان بالتطبيق
  static Future<void> show(
    BuildContext context, {
    String customerPhone = '',
    String initialPartName = '',
    VoidCallback? onSuccess,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => RequestPartModal(
        customerPhone: customerPhone,
        initialPartName: initialPartName,
        onSuccess: onSuccess,
      ),
    );
  }

  @override
  State<RequestPartModal> createState() => _RequestPartModalState();
}

class _RequestPartModalState extends State<RequestPartModal> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();
  final Dio _dio = Dio();

  String _make = '';
  String _model = '';
  String _year = '';
  final TextEditingController _engineSizeController = TextEditingController();
  final TextEditingController _vinController = TextEditingController();
  final TextEditingController _partNumberController = TextEditingController();
  late final TextEditingController _notesController;

  String? _oldPartImgUrl;
  String? _vinImgUrl;
  bool _uploadingOldPart = false;
  bool _uploadingVinImg = false;
  bool _scanningVin = false;
  bool _isSubmitting = false;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(text: widget.initialPartName);
  }

  @override
  void dispose() {
    _engineSizeController.dispose();
    _vinController.dispose();
    _partNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  /// رفع الصور مباشرة إلى Supabase Storage
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
    } catch (err) {
      debugPrint('🚨 [Storage Upload Error]: $err');
    }
    return null;
  }

  /// فحص الاستمارة بالذكاء الاصطناعي واستخراج رقم الشاصي
  Future<void> _handleVinImagePick() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    final file = File(picked.path);
    setState(() {
      _uploadingVinImg = true;
      _scanningVin = true;
    });

    try {
      final uploadedUrl = await _uploadImageToStorage(file);
      if (uploadedUrl != null) {
        setState(() => _vinImgUrl = uploadedUrl);
      }

      final scanRes = await IstemaraService.scanIstemara(imageFile: file);
      if (scanRes.success && scanRes.vin != null && scanRes.vin!.isNotEmpty) {
        _vinController.text = scanRes.vin!;
        if (_make.isEmpty && scanRes.make != null) _make = scanRes.make!;
        if (_model.isEmpty && scanRes.model != null) _model = scanRes.model!;
        if (_year.isEmpty && scanRes.year != null) _year = scanRes.year!;
        if (mounted) {
          CustomToast.success(
            context,
            'تم استخراج رقم الشاصي ومواصفات السيارة بنجاح!',
          );
        }
      }
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          'تعذر قراءة رقم الشاصي تلقائياً، يمكنك إدخاله يدوياً',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _uploadingVinImg = false;
          _scanningVin = false;
        });
      }
    }
  }

  /// اختيار صورة القطعة القديمة
  Future<void> _handleOldPartImagePick() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    final file = File(picked.path);
    setState(() => _uploadingOldPart = true);

    try {
      final uploadedUrl = await _uploadImageToStorage(file);
      if (uploadedUrl != null) {
        setState(() => _oldPartImgUrl = uploadedUrl);
        if (mounted) {
          CustomToast.success(context, 'تم رفع صورة القطعة القديمة بنجاح');
        }
      }
    } finally {
      if (mounted) setState(() => _uploadingOldPart = false);
    }
  }

  /// حساب كود العميل المتوافق مع التطبيق والويب
  String _resolveCustomerCode(String phone) {
    if (phone.isNotEmpty && phone != 'زائر') {
      int hash = 0;
      for (int i = 0; i < phone.length; i++) {
        hash = ((hash << 5) - hash) + phone.codeUnitAt(i);
        hash = hash & 0xFFFFFFFF;
      }
      return 'CUST-${(hash.abs() % 89999) + 10000}';
    }
    return 'CUST-GUEST';
  }

  /// إرسال طلب القطعة الخاصة
  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final customerCode = _resolveCustomerCode(widget.customerPhone);

    try {
      final payload = {
        'customer_phone': customerCode,
        'make': _make,
        'model': _model,
        'year': _year,
        'engine_size': _engineSizeController.text.trim().isEmpty
            ? null
            : _engineSizeController.text.trim(),
        'vin_number': _vinController.text.trim().isEmpty
            ? null
            : _vinController.text.trim().toUpperCase(),
        'part_number': _partNumberController.text.trim().isEmpty
            ? null
            : _partNumberController.text.trim(),
        'notes': _notesController.text.trim(),
        'part_image_url': _oldPartImgUrl,
        'vin_image_url': _vinImgUrl,
        'status': 'pending',
      };

      final res = await ApiClient().post(
        '/custom_part_requests',
        data: payload,
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() => _isSuccess = true);
        widget.onSuccess?.call();
        await Future.delayed(const Duration(milliseconds: 1800));
        if (mounted) Navigator.of(context).pop();
      } else {
        throw Exception();
      }
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية',
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Dialog(
        backgroundColor: AppTheme.cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500, maxHeight: 720),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: _isSuccess ? _buildSuccessView() : _buildFormView(),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.check_circle_outline, color: AppTheme.success, size: 64),
        SizedBox(height: 14),
        Text(
          'تم إرسال طلبك بنجاح!',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textWhite,
          ),
        ),
        SizedBox(height: 6),
        Text(
          'ستصلك عروض أسعار الكراجات والتشاليح فور توفرها.',
          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildFormView() {
    final makes = CarData.brands.keys.toList();
    final models = _make.isNotEmpty
        ? (CarData.brands[_make]?.models ?? <String>[])
        : <String>[];

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'طلب تسعير قطعة غير متوفرة 🛠️',
                style: TextStyle(
                  fontSize: 16.5,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppTheme.textMuted),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const Divider(color: AppTheme.borderSlate),
          const SizedBox(height: 10),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildDropdownField(
                          label: 'الشركة المصنعة *',
                          value: _make.isEmpty ? null : _make,
                          hint: 'اختر الشركة',
                          items: makes
                              .map(
                                (m) =>
                                    DropdownMenuItem(value: m, child: Text(m)),
                              )
                              .toList(),
                          onChanged: (val) => setState(() {
                            _make = val ?? '';
                            _model = '';
                          }),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildDropdownField(
                          label: 'الموديل *',
                          value: _model.isEmpty ? null : _model,
                          hint: 'اختر الموديل',
                          items: models
                              .map(
                                (m) =>
                                    DropdownMenuItem(value: m, child: Text(m)),
                              )
                              .toList(),
                          onChanged: _make.isEmpty
                              ? null
                              : (val) => setState(() => _model = val ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _buildDropdownField(
                          label: 'سنة الصنع *',
                          value: _year.isEmpty ? null : _year,
                          hint: 'اختر السنة',
                          items: CarData.carYears
                              .map(
                                (y) =>
                                    DropdownMenuItem(value: y, child: Text(y)),
                              )
                              .toList(),
                          onChanged: (val) => setState(() => _year = val ?? ''),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          controller: _engineSizeController,
                          label: 'حجم المحرك (اختياري)',
                          hint: 'مثال: 4.0L أو V6',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  _buildUploadBox(
                    title: 'صورة الاستمارة (لقراءة رقم الشاصي تلقائياً)',
                    isLoading: _uploadingVinImg || _scanningVin,
                    isUploaded: _vinImgUrl != null,
                    loadingText: 'جاري قراءة رقم الشاصي بالذكاء الاصطناعي...',
                    onTap: _handleVinImagePick,
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _vinController,
                          label: 'رقم الشاصي (VIN)',
                          hint: '17 حرفاً ورقمياً',
                          maxLength: 17,
                          isMonospace: true,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildTextField(
                          controller: _partNumberController,
                          label: 'رقم القطعة (Part Number)',
                          hint: 'اختياري',
                          isMonospace: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  _buildUploadBox(
                    title: 'صورة القطعة القديمة (اختياري)',
                    isLoading: _uploadingOldPart,
                    isUploaded: _oldPartImgUrl != null,
                    loadingText: 'جاري رفع صورة القطعة...',
                    onTap: _handleOldPartImagePick,
                  ),
                  const SizedBox(height: 12),

                  const Text(
                    'تفاصيل وملاحظات القطعة المطلوبة *',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 3,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textWhite,
                    ),
                    validator: (val) => (val == null || val.trim().isEmpty)
                        ? 'يرجى كتابة تفاصيل القطعة'
                        : null,
                    decoration: const InputDecoration(
                      hintText: 'اكتب اسم القطعة ومواصفاتها بالتفصيل (مثال: مروحة رديتر جهة السائق)...',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.copper),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'إرسال الطلب 🚀',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required String hint,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
          decoration: const InputDecoration(
            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          ),
          dropdownColor: AppTheme.cardBg,
          hint: Text(
            hint,
            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textWhite,
            fontFamily: 'Cairo',
          ),
          items: items,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int? maxLength,
    bool isMonospace = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLength: maxLength,
          style: TextStyle(
            fontSize: 13,
            color: AppTheme.textWhite,
            fontFamily: isMonospace ? 'monospace' : 'Cairo',
          ),
          decoration: InputDecoration(
            hintText: hint,
            counterText: '',
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 10,
              vertical: 10,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadBox({
    required String title,
    required bool isLoading,
    required bool isUploaded,
    required String loadingText,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceSlate,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isUploaded ? AppTheme.success : AppTheme.borderSlate,
            style: BorderStyle.solid,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isUploaded ? Icons.check_circle : Icons.camera_alt_outlined,
              color: isUploaded ? AppTheme.success : AppTheme.copperLight,
              size: 22,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textWhite,
                    ),
                  ),
                  if (isLoading)
                    Text(
                      loadingText,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.copperLight,
                      ),
                    )
                  else if (isUploaded)
                    const Text(
                      'تم حفظ الصورة بنجاح ✅',
                      style: TextStyle(fontSize: 11, color: AppTheme.success),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
