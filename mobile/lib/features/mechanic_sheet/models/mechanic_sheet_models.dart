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

  const MechanicPartOption({
    required this.quality,
    required this.labelAr,
    required this.labelEn,
    required this.price,
    this.partNumber,
    this.warrantyAr,
    this.warrantyEn,
    this.savingsVsOem,
  });

  String label(bool isAr) => isAr ? labelAr : labelEn;
  String? warranty(bool isAr) => isAr ? warrantyAr : warrantyEn;

  bool get isOem => quality == MechanicPartQuality.oem;
}

class MechanicRecognizedItem {
  final String id;
  final String nameAr;
  final String nameEn;
  final String rawLine;
  final MechanicPartOption oem;
  final MechanicPartOption aftermarket;

  const MechanicRecognizedItem({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    required this.rawLine,
    required this.oem,
    required this.aftermarket,
  });

  String name(bool isAr) => isAr ? nameAr : nameEn;
}

class MechanicParseResult {
  final List<MechanicRecognizedItem> recognized;
  final List<String> unrecognizedLines;
  final String? notes;

  const MechanicParseResult({
    required this.recognized,
    this.unrecognizedLines = const [],
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
      id: 'mech_${item.id}_$qualityTag',
      name: item.nameAr,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: option.price,
      imageUrl: '',
      partNumber: option.partNumber,
      category: 'mechanic_sheet',
      warranty: option.warrantyAr,
      partType: option.isOem ? 'original' : 'aftermarket',
      partCondition: 'new',
      garageName: 'موجود أوتو',
      quantity: 1,
    );
  }
}
