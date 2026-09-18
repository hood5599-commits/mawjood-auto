import 'dart:io';

import '../models/mechanic_sheet_models.dart';

/// Structured parser for mechanic workshop sheets.
/// Ready to swap mock logic with a Gemini Vision / Edge Function call.
class MechanicSheetParser {
  MechanicSheetParser._();
  static final MechanicSheetParser instance = MechanicSheetParser._();

  Future<MechanicParseResult> parseSheet({
    required File imageFile,
    required String vehicleMake,
    required String vehicleModel,
    required String vehicleYear,
  }) async {
    // Simulate Vision OCR latency.
    await Future<void>.delayed(const Duration(milliseconds: 2200));

    // Mock Gemini-style extraction tuned for Qatari workshop handwriting.
    final recognized = <MechanicRecognizedItem>[
      MechanicRecognizedItem(
        id: 'pads_front',
        nameAr: 'فحمات / سفايف أمامية',
        nameEn: 'Front brake pads',
        rawLine: 'سفايف امامي',
        oem: MechanicPartOption(
          quality: MechanicPartQuality.oem,
          labelAr: 'أصلي وكالة',
          labelEn: 'OEM Genuine',
          price: 380,
          partNumber: '04465-${vehicleYear}OEM',
          warrantyAr: 'ضمان وكالة 12 شهر',
          warrantyEn: '12-month OEM warranty',
        ),
        aftermarket: const MechanicPartOption(
          quality: MechanicPartQuality.aftermarket,
          labelAr: 'تجاري معتمد / بديل أصلي',
          labelEn: 'Certified aftermarket',
          price: 185,
          partNumber: 'BP-FR-CERT-185',
          warrantyAr: 'ضمان معتمد 6 أشهر',
          warrantyEn: '6-month certified warranty',
          savingsVsOem: 195,
        ),
      ),
      MechanicRecognizedItem(
        id: 'oil_filter',
        nameAr: 'فلتر زيت',
        nameEn: 'Oil filter',
        rawLine: 'فلتر زيت',
        oem: MechanicPartOption(
          quality: MechanicPartQuality.oem,
          labelAr: 'أصلي وكالة',
          labelEn: 'OEM Genuine',
          price: 95,
          partNumber: '90915-${vehicleMake.hashCode.abs() % 9000 + 1000}',
          warrantyAr: 'ضمان وكالة',
          warrantyEn: 'OEM warranty',
        ),
        aftermarket: const MechanicPartOption(
          quality: MechanicPartQuality.aftermarket,
          labelAr: 'تجاري معتمد / بديل أصلي',
          labelEn: 'Certified aftermarket',
          price: 42,
          partNumber: 'OF-CERT-042',
          warrantyAr: 'ضمان 3 أشهر',
          warrantyEn: '3-month warranty',
          savingsVsOem: 53,
        ),
      ),
      MechanicRecognizedItem(
        id: 'serpentine',
        nameAr: 'سير مكينة',
        nameEn: 'Serpentine belt',
        rawLine: 'سير ماكينه',
        oem: MechanicPartOption(
          quality: MechanicPartQuality.oem,
          labelAr: 'أصلي وكالة',
          labelEn: 'OEM Genuine',
          price: 210,
          partNumber: '90916-A${vehicleModel.hashCode.abs() % 900 + 100}',
          warrantyAr: 'ضمان وكالة 12 شهر',
          warrantyEn: '12-month OEM warranty',
        ),
        aftermarket: const MechanicPartOption(
          quality: MechanicPartQuality.aftermarket,
          labelAr: 'تجاري معتمد / بديل أصلي',
          labelEn: 'Certified aftermarket',
          price: 95,
          partNumber: 'SB-CERT-095',
          warrantyAr: 'ضمان معتمد 6 أشهر',
          warrantyEn: '6-month certified warranty',
          savingsVsOem: 115,
        ),
      ),
    ];

    final unrecognized = <String>[
      'مسمار؟؟ (غير واضح)',
      'شي غريب بخط اليد قرب أسفل الورقة',
    ];

    if (!await imageFile.exists()) {
      throw Exception('image_missing');
    }

    return MechanicParseResult(
      recognized: recognized,
      unrecognizedLines: unrecognized,
      notes: 'Matched against $vehicleMake $vehicleModel $vehicleYear',
    );
  }
}
