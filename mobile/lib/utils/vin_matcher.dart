import '../models/vehicle_model.dart';

typedef SelectedVehicle = VehicleProfile;

class VinMatcher {
  static String normalizeVehicleText(String str) {
    return (str)
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^\w\u0621-\u064A0-9]'), '');
  }

  static const Map<String, List<String>> modelAliases = {
    'landcruiser': [
      'landcruiser',
      'land cruiser',
      'لاندكروزر',
      'لاند كروزر',
      'lc',
      'lc200',
      'lc300',
      'v8',
      'gxr',
      'vxr',
    ],
    'patrol': ['patrol', 'باترول', 'فتك', 'safari', 'nismo', 'y61', 'y62'],
    'camry': ['camry', 'كامري', 'كامري هايبرد'],
    'corolla': ['corolla', 'كورولا', 'كرولا'],
    'hilux': ['hilux', 'هايلوكس', 'هايلكس'],
    'elantra': ['elantra', 'النترا', 'إلنترا', 'avante'],
    'sonata': ['sonata', 'سوناتا'],
    'tahoe': ['tahoe', 'تاهو'],
    'yukon': ['yukon', 'يوكن', 'يوكون'],
    'prado': ['prado', 'برادو', 'لاندكروزر برادو'],
    'optima': ['optima', 'k5', 'أوبتيما', 'اوبتيما', 'اوبتيما / k5'],
    'taurus': ['taurus', 'تورس', 'توروس'],
    'altima': ['altima', 'التيما', 'ألتيما'],
    'accord': ['accord', 'اكورد', 'أكورد'],
    'eclass': ['e-class', 'e class', 'e300', 'e200', 'e350', 'e class'],
  };

  /// Matches DB model against selected/target model (web: isModelMatched(dbModel, targetModel)).
  static bool isModelMatched(String dbModel, String targetModel) {
    if (dbModel.isEmpty || targetModel.isEmpty) return true;
    final d = normalizeVehicleText(dbModel);
    final t = normalizeVehicleText(targetModel);

    if (d == t || d.contains(t) || t.contains(d)) return true;

    for (final aliases in modelAliases.values) {
      final list = aliases.map(normalizeVehicleText).toList();
      if (list.any((a) => t.contains(a)) && list.any((a) => d.contains(a))) {
        return true;
      }
    }
    return false;
  }

  /// Matches DB year (single or range "2018-2023") against selected year.
  static bool isYearMatched(dynamic dbYear, dynamic targetYear) {
    if (dbYear == null || targetYear == null) return true;
    final dbStr = dbYear.toString().trim();
    final targetStr = targetYear.toString().trim();
    if (dbStr.isEmpty || targetStr.isEmpty) return true;

    final target = int.tryParse(targetStr);
    if (target == null) return true;

    if (dbStr.contains('-')) {
      final parts = dbStr.split('-').map((y) => int.tryParse(y.trim())).toList();
      if (parts.length == 2 && parts[0] != null && parts[1] != null) {
        final start = parts[0]!;
        final end = parts[1]!;
        return target >= (start < end ? start : end) &&
            target <= (start > end ? start : end);
      }
    }
    return dbStr == targetStr || dbStr.contains(targetStr);
  }

  static bool isMakeMatched(String dbMake, String targetMake) {
    if (dbMake.isEmpty || targetMake.isEmpty) return true;
    final d = normalizeVehicleText(dbMake);
    final t = normalizeVehicleText(targetMake);
    return d.contains(t) || t.contains(d);
  }

  static bool isPartExactFit(Map<String, dynamic> part, VehicleProfile vehicle) {
    if (vehicle.make.isEmpty && (vehicle.vin == null || vehicle.vin!.isEmpty)) {
      return true;
    }

    final excelVins = part['compatible_vins'] ??
        part['vin_numbers'] ??
        part['vins'] ??
        part['chassis_code'];
    if (excelVins != null && vehicle.vin != null && vehicle.vin!.isNotEmpty) {
      final cleanVin = vehicle.vin!.toUpperCase().trim();
      final vinList = excelVins
          .toString()
          .toUpperCase()
          .split(RegExp(r'[,;\s\n/]+'))
          .map((v) => v.trim())
          .where((v) => v.isNotEmpty);
      final hasVinMatch = vinList.any(
        (v) =>
            cleanVin == v ||
            cleanVin.startsWith(v) ||
            v.startsWith(cleanVin.substring(0, cleanVin.length.clamp(0, 8))),
      );
      if (hasVinMatch) return true;
    }

    final partMake = (part['make'] ?? '').toString();
    if (!isMakeMatched(partMake, vehicle.make)) return false;
    if (!isModelMatched((part['model'] ?? '').toString(), vehicle.model)) {
      return false;
    }
    if (!isYearMatched(part['year'], vehicle.year)) return false;

    if (vehicle.engine != null &&
        vehicle.engine!.isNotEmpty &&
        part['engine'] != null) {
      final pEng = part['engine'].toString();
      if (!pEng.contains('All') && !pEng.contains('جميع')) {
        final pe = normalizeVehicleText(pEng);
        final ve = normalizeVehicleText(vehicle.engine!);
        if (!pe.contains(ve) && !ve.contains(pe)) return false;
      }
    }
    return true;
  }

  static VehicleProfile? matchVin(String vin) {
    final cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length != 17) return null;
    if (cleanVin.startsWith('J')) {
      return VehicleProfile(
        vin: cleanVin,
        make: 'تويوتا',
        model: 'لاندكروزر',
        year: '2023',
      );
    }
    return null;
  }
}
