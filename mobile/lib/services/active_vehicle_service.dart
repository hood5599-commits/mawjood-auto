import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/vehicle_model.dart';

/// Persisted active vehicle for fitment-sensitive flows (mechanic sheet, etc.).
class ActiveVehicleService extends ChangeNotifier {
  ActiveVehicleService._();
  static final ActiveVehicleService instance = ActiveVehicleService._();

  static const _prefsKey = 'mawjood_active_vehicle';

  VehicleProfile? _vehicle;
  bool _loaded = false;

  VehicleProfile? get vehicle => _vehicle;
  bool get hasActiveVehicle =>
      _vehicle != null &&
      _vehicle!.make.trim().isNotEmpty &&
      _vehicle!.model.trim().isNotEmpty;

  bool get isLoaded => _loaded;

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw != null && raw.isNotEmpty) {
        _vehicle = VehicleProfile.fromJson(
          Map<String, dynamic>.from(jsonDecode(raw) as Map),
        );
      } else {
        // Backward-compatible keys used by ProfileScreen.
        final make = prefs.getString('saved_car_make');
        if (make != null && make.isNotEmpty) {
          _vehicle = VehicleProfile(
            vin: prefs.getString('saved_car_vin'),
            make: make,
            model: prefs.getString('saved_car_model') ?? '',
            year: prefs.getString('saved_car_year') ?? '',
          );
        }
      }
    } catch (_) {
      _vehicle = null;
    } finally {
      _loaded = true;
      notifyListeners();
    }
  }

  Future<void> setVehicle(VehicleProfile vehicle) async {
    _vehicle = vehicle;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, jsonEncode(vehicle.toJson()));
      await prefs.setString('saved_car_make', vehicle.make);
      await prefs.setString('saved_car_model', vehicle.model);
      await prefs.setString('saved_car_year', vehicle.year);
      if (vehicle.vin != null) {
        await prefs.setString('saved_car_vin', vehicle.vin!);
      }
    } catch (_) {}
  }

  Future<void> clear() async {
    _vehicle = null;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsKey);
    } catch (_) {}
  }
}
