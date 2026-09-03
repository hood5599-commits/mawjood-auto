import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../config/theme.dart';
import '../data/car_data.dart';
import '../models/vehicle_model.dart';
import '../services/istemara_service.dart';
import 'custom_toast.dart';

class SmartVinScanner extends StatefulWidget {
  final String lang;
  final VehicleProfile? activeVehicle;
  final ValueChanged<VehicleProfile> onVehicleIdentified;
  final VoidCallback onReset;

  const SmartVinScanner({
    super.key,
    this.lang = 'ar',
    this.activeVehicle,
    required this.onVehicleIdentified,
    required this.onReset,
  });

  @override
  State<SmartVinScanner> createState() => _SmartVinScannerState();
}

class _SmartVinScannerState extends State<SmartVinScanner> {
  final TextEditingController _vinController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  final Dio _dio = Dio();

  bool _isProcessing = false;
  String _statusMsg = '';

  bool get isAr => widget.lang == 'ar';

  @override
  void dispose() {
    _vinController.dispose();
    super.dispose();
  }

  // 🧠 فك تشفير رقم الشاصي عبر قاعدة بيانات NHTSA الدولية
  Future<void> _decodeVinNumber(String vin) async {
    final cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length != 17) {
      CustomToast.error(
        context,
        isAr
            ? 'رقم الشاصي يجب أن يتكون من 17 حرفاً ورقماً تماماً'
            : 'VIN must be exactly 17 characters',
      );
      return;
    }

    setState(() {
      _isProcessing = true;
      _statusMsg = isAr
          ? 'جاري فك تشفير رقم الشاصي والتحقق من التوافق...'
          : 'Decoding VIN & verifying vehicle fitment...';
    });

    try {
      final response = await _dio.get(
        'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${Uri.encodeComponent(cleanVin)}?format=json',
      );

      if (response.statusCode == 200 && response.data != null) {
        final results = response.data['Results'];
        if (results is List && results.isNotEmpty) {
          final result = results[0];
          final rawMake = (result['Make'] ?? '').toString().trim();
          final detectedModel = (result['Model'] ?? '').toString().trim();
          final detectedYear = (result['ModelYear'] ?? '').toString().trim();
          final displacement = (result['DisplacementL'] ?? '')
              .toString()
              .trim();
          final engineConfig = (result['EngineConfiguration'] ?? '')
              .toString()
              .trim();
          final detectedEngine = displacement.isNotEmpty
              ? '${displacement}L'
              : engineConfig;

          if (rawMake.isNotEmpty) {
            String matchedMakeKey = rawMake;
            for (final brandKey in CarData.brands.keys) {
              final brand = CarData.brands[brandKey]!;
              if (brandKey.toLowerCase() == rawMake.toLowerCase() ||
                  brand.en.toLowerCase() == rawMake.toLowerCase()) {
                matchedMakeKey = brandKey;
                break;
              }
            }

            widget.onVehicleIdentified(
              VehicleProfile(
                vin: cleanVin,
                make: matchedMakeKey,
                model: detectedModel,
                year: detectedYear,
                engine: detectedEngine.isNotEmpty ? detectedEngine : null,
              ),
            );
            _vinController.clear();
            setState(() => _statusMsg = '');
            return;
          }
        }
      }
      throw Exception('Could not decode VIN directly');
    } catch (_) {
      // مطابقة مبدئية برقم الشاصي فقط عند انقطاع الاتصال
      widget.onVehicleIdentified(
        VehicleProfile(vin: cleanVin, make: '', model: '', year: ''),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _statusMsg = '';
        });
      }
    }
  }

  // 📷 التقاط صورة الاستمارة وفحصها بالذكاء الاصطناعي
  void _showImageSourcePicker() {
    if (_isProcessing) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                isAr ? 'مسح استمارة السيارة 📄' : 'Scan Vehicle Registration',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(
                  Icons.camera_alt,
                  color: AppTheme.copperLight,
                ),
                title: Text(
                  isAr
                      ? 'التقاط صورة عبر الكاميرا'
                      : 'Take a photo with Camera',
                  style: const TextStyle(color: AppTheme.textWhite),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndScanIstemara(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(
                  Icons.photo_library,
                  color: AppTheme.copperLight,
                ),
                title: Text(
                  isAr ? 'اختيار من ألبوم الصور' : 'Choose from Gallery',
                  style: const TextStyle(color: AppTheme.textWhite),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndScanIstemara(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndScanIstemara(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(source: source);
      if (pickedFile == null) return;

      setState(() {
        _isProcessing = true;
        _statusMsg = isAr
            ? 'جاري قراءة استمارة السيارة بالذكاء الاصطناعي...'
            : 'AI is scanning vehicle registration card...';
      });

      final result = await IstemaraService.scanIstemara(
        imageFile: File(pickedFile.path),
      );

      if (result.success && result.vin != null && result.vin!.length == 17) {
        await _decodeVinNumber(result.vin!);
      } else if (result.success &&
          (result.make != null || result.model != null)) {
        widget.onVehicleIdentified(
          VehicleProfile(
            vin: result.vin,
            make: result.make ?? '',
            model: result.model ?? '',
            year: result.year ?? '',
          ),
        );
      } else {
        if (mounted) {
          CustomToast.error(
            context,
            result.error ??
                (isAr
                    ? 'تعذر استخراج رقم الشاصي تلقائياً'
                    : 'Could not detect VIN'),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          isAr ? 'حدث خطأ أثناء فحص الصورة' : 'Error scanning image',
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _statusMsg = '';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('📸', style: TextStyle(fontSize: 18)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            isAr
                                ? 'الفحص الذكي برقم الشاصي والاستمارة (100% تطابق)'
                                : 'Smart VIN & Registration Scanner (100% Match)',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textWhite,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isAr
                          ? 'صوّر استمارة سيارتك أو أدخل رقم الشاصي (17 حرف) لعرض القطع المتوافقة فقط.'
                          : 'Upload vehicle Istemara or enter 17-digit VIN to filter 100% compatible parts.',
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (widget.activeVehicle != null)
                TextButton.icon(
                  onPressed: widget.onReset,
                  icon: const Icon(
                    Icons.refresh,
                    size: 16,
                    color: AppTheme.danger,
                  ),
                  label: Text(
                    isAr ? 'إلغاء التحديد' : 'Clear',
                    style: const TextStyle(
                      color: AppTheme.danger,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    backgroundColor: AppTheme.danger.withValues(alpha: 0.1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          if (widget.activeVehicle != null)
            _buildActiveVehicleCard()
          else
            _buildScannerInputOptions(),

          if (_isProcessing) ...[
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppTheme.copperLight,
                  ),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    _statusMsg,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.copperLight,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActiveVehicleCard() {
    final v = widget.activeVehicle!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF064E3B).withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppTheme.success.withValues(alpha: 0.5),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified, color: AppTheme.success, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${v.make} ${v.model} ${v.year}'.trim(),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF86EFAC),
                  ),
                ),
              ),
              if (v.engine != null && v.engine!.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '⚡ ${v.engine}',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF86EFAC),
                    ),
                  ),
                ),
            ],
          ),
          if (v.vin != null && v.vin!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'VIN: ${v.vin}',
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: AppTheme.textWhite,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScannerInputOptions() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 580;
        final uploadBox = _buildIstemaraUploadButton();
        final manualForm = _buildManualVinForm();

        if (isWide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: uploadBox),
              const SizedBox(width: 14),
              Expanded(child: manualForm),
            ],
          );
        }

        return Column(
          children: [uploadBox, const SizedBox(height: 12), manualForm],
        );
      },
    );
  }

  Widget _buildIstemaraUploadButton() {
    return InkWell(
      onTap: _isProcessing ? null : _showImageSourcePicker,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceSlate.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: AppTheme.copper.withValues(alpha: 0.4),
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            const Text('📷', style: TextStyle(fontSize: 28)),
            const SizedBox(height: 6),
            Text(
              isAr
                  ? 'اضغط لتصوير أو رفع الاستمارة'
                  : 'Capture / Upload Istemara',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppTheme.copperLight,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              isAr
                  ? 'استخراج تلقائي فوري للمواصفات'
                  : 'Instant AI OCR Extraction',
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManualVinForm() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSlate.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr
                ? 'أو أدخل رقم الشاصي يدوياً (17 حرف ورقم):'
                : 'Or enter 17-character VIN manually:',
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.bold,
              color: AppTheme.textWhite,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _vinController,
                  maxLength: 17,
                  textCapitalization: TextCapitalization.characters,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 1.2,
                    color: AppTheme.textWhite,
                  ),
                  decoration: InputDecoration(
                    hintText: 'JTEBU5JR8K5...',
                    hintStyle: TextStyle(
                      color: AppTheme.textMuted.withValues(alpha: 0.6),
                    ),
                    counterText: '',
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
                    ),
                    filled: true,
                    fillColor: AppTheme.cardBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppTheme.borderSlate),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isProcessing
                    ? null
                    : () => _decodeVinNumber(_vinController.text),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.copper,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  isAr ? 'فحص 🚀' : 'Match 🚀',
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
