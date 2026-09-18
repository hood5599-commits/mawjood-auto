import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../config/theme.dart';
import '../../../data/car_data.dart';
import '../../../models/vehicle_model.dart';
import '../../../screens/customer/catalog_destinations.dart';
import '../../../services/active_vehicle_service.dart';
import '../../../widgets/glass_chrome.dart';
import 'screens/mechanic_analysis_screen.dart';

/// Entry point for "ورقة الميكانيكي" from Home.
class MechanicSheetFlow {
  MechanicSheetFlow._();

  static Future<void> start(BuildContext context, {required String lang}) async {
    final vehicleSvc = ActiveVehicleService.instance;
    if (!vehicleSvc.isLoaded) {
      await vehicleSvc.load();
    }

    if (!context.mounted) return;

    if (!vehicleSvc.hasActiveVehicle) {
      final selected = await showVehicleGate(context, lang: lang);
      if (selected == null || !context.mounted) return;
    }

    if (!context.mounted) return;
    final file = await showCaptureSheet(context, lang: lang);
    if (file == null || !context.mounted) return;

    final vehicle = ActiveVehicleService.instance.vehicle!;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MechanicAnalysisScreen(
          lang: lang,
          imagePath: file.path,
          vehicle: vehicle,
        ),
      ),
    );
  }

  static Future<VehicleProfile?> showVehicleGate(
    BuildContext context, {
    required String lang,
  }) {
    final isAr = lang == 'ar';
    return showCupertinoModalPopup<VehicleProfile>(
      context: context,
      builder: (ctx) {
        return Material(
          color: Colors.transparent,
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(ctx).brightness == Brightness.dark
                  ? AppTheme.cardBg
                  : Colors.white,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(22)),
            ),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Icon(Icons.directions_car_filled,
                      color: AppTheme.copper, size: 36),
                  const SizedBox(height: 12),
                  Text(
                    isAr
                        ? 'فضلاً حدد سيارتك أولاً لضمان مطابقة القطع بنسبة 100%'
                        : 'Please select your vehicle first for 100% fitment',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 15.5,
                      color: AppTheme.textOf(ctx),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        await Navigator.of(ctx).push(
                          MaterialPageRoute(
                            builder: (_) => EstimaraScanScreen(lang: lang),
                          ),
                        );
                        if (!ctx.mounted) return;
                        final v = ActiveVehicleService.instance.vehicle;
                        if (ActiveVehicleService.instance.hasActiveVehicle) {
                          Navigator.of(ctx).pop(v);
                        }
                      },
                      icon: const Icon(Icons.document_scanner_outlined),
                      label: Text(
                        isAr ? 'مسح الاستمارة الآن' : 'Scan registration now',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.copper,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final manual = await showManualVehiclePicker(
                          ctx,
                          lang: lang,
                        );
                        if (manual != null && ctx.mounted) {
                          await ActiveVehicleService.instance
                              .setVehicle(manual);
                          if (ctx.mounted) Navigator.of(ctx).pop(manual);
                        }
                      },
                      icon: const Icon(Icons.tune),
                      label: Text(
                        isAr
                            ? 'اختيار الموديل يدوياً'
                            : 'Choose model manually',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.navy,
                        side: const BorderSide(color: AppTheme.copper),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  static Future<VehicleProfile?> showManualVehiclePicker(
    BuildContext context, {
    required String lang,
  }) {
    final isAr = lang == 'ar';
    String? make;
    String? model;
    String? year = CarData.carYears.first;

    return showModalBottomSheet<VehicleProfile>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardOf(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            final models = make == null
                ? <String>[]
                : (CarData.brands[make!]?.models ?? <String>[]);
            return Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                18,
                18,
                MediaQuery.of(ctx).viewInsets.bottom + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    isAr ? 'اختيار الموديل يدوياً' : 'Manual vehicle select',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      color: AppTheme.textOf(ctx),
                    ),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: make,
                    decoration: InputDecoration(
                      labelText: isAr ? 'الشركة' : 'Make',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: CarData.brands.keys
                        .map(
                          (k) => DropdownMenuItem(value: k, child: Text(k)),
                        )
                        .toList(),
                    onChanged: (v) => setModal(() {
                      make = v;
                      model = null;
                    }),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: model,
                    decoration: InputDecoration(
                      labelText: isAr ? 'الموديل' : 'Model',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: models
                        .map(
                          (m) => DropdownMenuItem(value: m, child: Text(m)),
                        )
                        .toList(),
                    onChanged: (v) => setModal(() => model = v),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: year,
                    decoration: InputDecoration(
                      labelText: isAr ? 'السنة' : 'Year',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    items: CarData.carYears
                        .take(30)
                        .map(
                          (y) => DropdownMenuItem(value: y, child: Text(y)),
                        )
                        .toList(),
                    onChanged: (v) => setModal(() => year = v),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: make == null ||
                            model == null ||
                            (year ?? '').isEmpty
                        ? null
                        : () {
                            Navigator.pop(
                              ctx,
                              VehicleProfile(
                                make: make!,
                                model: model!,
                                year: year!,
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.copper,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      isAr ? 'تأكيد السيارة' : 'Confirm vehicle',
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  static Future<XFile?> showCaptureSheet(
    BuildContext context, {
    required String lang,
  }) {
    final isAr = lang == 'ar';
    final picker = ImagePicker();

    return showModalBottomSheet<XFile>(
      context: context,
      backgroundColor: AppTheme.cardOf(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  isAr ? 'ورقة الميكانيكي' : 'Mechanic Sheet',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: AppTheme.textOf(ctx),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isAr
                      ? 'التقط صورة واضحة لورقة الورشة أو اخترها من الألبوم'
                      : 'Capture a clear workshop sheet or pick from gallery',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.mutedOf(ctx),
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 16),
                TactileScale(
                  onTap: () async {
                    final file = await picker.pickImage(
                      source: ImageSource.camera,
                      imageQuality: 88,
                    );
                    if (ctx.mounted) Navigator.pop(ctx, file);
                  },
                  child: _captureTile(
                    ctx,
                    icon: Icons.photo_camera_outlined,
                    title: isAr
                        ? 'التقاط صورة لورقة الورشة'
                        : 'Capture workshop sheet',
                    accent: AppTheme.copper,
                  ),
                ),
                const SizedBox(height: 10),
                TactileScale(
                  onTap: () async {
                    final file = await picker.pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 88,
                    );
                    if (ctx.mounted) Navigator.pop(ctx, file);
                  },
                  child: _captureTile(
                    ctx,
                    icon: Icons.photo_library_outlined,
                    title: isAr
                        ? 'اختيار من ألبوم الصور (واتساب)'
                        : 'Choose from gallery (WhatsApp)',
                    accent: AppTheme.navy,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  static Widget _captureTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color accent,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: AppTheme.textOf(context),
              ),
            ),
          ),
          Icon(Icons.chevron_left, color: AppTheme.mutedOf(context)),
        ],
      ),
    );
  }
}
