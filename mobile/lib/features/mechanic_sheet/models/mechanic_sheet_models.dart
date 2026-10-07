import '../../../models/part_model.dart';
import '../../../models/vehicle_model.dart';

enum MechanicPartQuality { oem, aftermarket }

class MechanicPartOption {
  final MechanicPartQuality quality;
  final String labelAr;
  final String labelEn;
  final double price;
  final String? partNumber;
  final String? warrantyAr;
  final String? warrantyEn;
  final double? savingsVsOem;
  final bool isAvailable;
  final int stock;
  final String? catalogPartId;
  final String? catalogName;
  final String? imageUrl;

  const MechanicPartOption({
    required this.quality,
    required this.labelAr,
    required this.labelEn,
    required this.price,
    this.partNumber,
    this.warrantyAr,
    this.warrantyEn,
    this.savingsVsOem,
    this.isAvailable = true,
    this.stock = 0,
    this.catalogPartId,
    this.catalogName,
    this.imageUrl,
  });

  String label(bool isAr) => isAr ? labelAr : labelEn;
  String? warranty(bool isAr) => isAr ? warrantyAr : warrantyEn;

  bool get isOem => quality == MechanicPartQuality.oem;

  static MechanicPartOption unavailable(MechanicPartQuality quality) {
    final oem = quality == MechanicPartQuality.oem;
    return MechanicPartOption(
      quality: quality,
      labelAr: oem ? 'أصلي وكالة' : 'تجاري معتمد',
      labelEn: oem ? 'OEM Genuine' : 'Certified aftermarket',
      price: 0,
      isAvailable: false,
      stock: 0,
      warrantyAr: 'غير متوفرة',
      warrantyEn: 'Unavailable',
    );
  }
}

class MechanicRecognizedItem {
  final String id;
  final String nameAr;
  final String nameEn;
  final String rawLine;
  final MechanicPartOption oem;
  final MechanicPartOption aftermarket;
  final int qty;

  const MechanicRecognizedItem({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    required this.rawLine,
    required this.oem,
    required this.aftermarket,
    this.qty = 1,
  });

  String name(bool isAr) => isAr ? nameAr : nameEn;

  bool get hasAnyAvailable => oem.isAvailable || aftermarket.isAvailable;
}

class MechanicParseResult {
  final List<MechanicRecognizedItem> recognized;
  final List<String> unrecognizedLines;
  final List<String> exclusions;
  final String? notes;

  const MechanicParseResult({
    required this.recognized,
    this.unrecognizedLines = const [],
    this.exclusions = const [],
    this.notes,
  });
}

class MechanicSelectedLine {
  final MechanicRecognizedItem item;
  final MechanicPartOption option;

  const MechanicSelectedLine({required this.item, required this.option});

  PartModel toPartModel(VehicleProfile vehicle) {
    final qualityTag = option.isOem ? 'oem' : 'aftermarket';
    return PartModel(
      id: option.catalogPartId ?? 'mech_${item.id}_$qualityTag',
      name: option.catalogName ?? item.nameAr,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: option.price,
      imageUrl: option.imageUrl ?? '',
      partNumber: option.partNumber,
      category: 'mechanic_sheet',
      warranty: option.warrantyAr,
      partType: option.isOem ? 'original' : 'aftermarket',
      partCondition: 'new',
      garageName: 'موجود أوتو',
      quantity: item.qty,
      stock: option.stock,
    );
  }
}
