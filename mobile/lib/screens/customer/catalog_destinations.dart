import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../models/part_model.dart';
import '../../models/vehicle_model.dart';
import '../../services/active_vehicle_service.dart';
import '../../services/api_client.dart';
import '../../services/auth_gate.dart';
import '../../services/cart_service.dart';
import '../../services/garage_reputation_service.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/glass_chrome.dart';
import '../../widgets/sidebar_filters.dart';
import '../../widgets/smart_vin_scanner.dart';
import 'checkout_screen.dart';

/// Dedicated Istemara / VIN scanner destination.
class EstimaraScanScreen extends StatefulWidget {
  final String lang;

  const EstimaraScanScreen({super.key, this.lang = 'ar'});

  @override
  State<EstimaraScanScreen> createState() => _EstimaraScanScreenState();
}

class _EstimaraScanScreenState extends State<EstimaraScanScreen> {
  VehicleProfile? _vehicle;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    _vehicle = ActiveVehicleService.instance.vehicle;
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: GlassBackButton(iconColor: Colors.white)),
          ),
          title: Text(
            isAr ? 'مسح استمارة السيارة' : 'Scan Vehicle Registration',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(
              parent: AlwaysScrollableScrollPhysics(),
            ),
            padding: const EdgeInsets.all(16),
            child: SmartVinScanner(
              lang: widget.lang,
              activeVehicle: _vehicle,
              onVehicleIdentified: (v) async {
                setState(() => _vehicle = v);
                await ActiveVehicleService.instance.setVehicle(v);
                if (!mounted) return;
                CustomToast.success(
                  context,
                  isAr
                      ? 'تم التعرف على المركبة بنجاح'
                      : 'Vehicle identified successfully',
                );
              },
              onReset: () async {
                setState(() => _vehicle = null);
                await ActiveVehicleService.instance.clear();
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// Visual vehicle search (standalone).
class VisualSearchScreen extends StatefulWidget {
  final String lang;

  const VisualSearchScreen({super.key, this.lang = 'ar'});

  @override
  State<VisualSearchScreen> createState() => _VisualSearchScreenState();
}

class _VisualSearchScreenState extends State<VisualSearchScreen> {
  List<PartModel> _inventory = [];
  bool _loading = true;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient().get('/parts?select=*');
      if (response.statusCode == 200 && response.data is List) {
        var parts = (response.data as List)
            .map((j) => PartModel.fromJson(Map<String, dynamic>.from(j as Map)))
            .toList();
        parts = await GarageReputationService.instance.enrichParts(parts);
        if (mounted) setState(() => _inventory = parts);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToCart(PartModel part, int qty) async {
    final ok = await AuthGate.requireLogin(context, lang: widget.lang);
    if (!ok || !mounted) return;
    await CartService().addToCart(partId: part.id, part: part, quantity: qty);
    if (!mounted) return;
    CustomToast.success(
      context,
      isAr ? 'تمت الإضافة إلى السلة' : 'Added to cart',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: GlassBackButton(iconColor: Colors.white)),
          ),
          title: Text(
            isAr ? 'البحث البصري' : 'Visual Search',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.copper),
              )
            : SingleChildScrollView(
                physics: const BouncingScrollPhysics(
                  parent: AlwaysScrollableScrollPhysics(),
                ),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                child: SidebarFilters(
                  lang: widget.lang,
                  inventory: _inventory,
                  forceMode: SearchMode.visual,
                  hideLandingCards: true,
                  onAddToCart: _addToCart,
                  onInquire: (part) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CheckoutScreen(
                          lang: widget.lang,
                          part: part,
                          initialStep: 'inquire',
                        ),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}

/// Category tree catalog (standalone).
class CategoryTreeScreen extends StatefulWidget {
  final String lang;
  final String? initialOemQuery;

  const CategoryTreeScreen({
    super.key,
    this.lang = 'ar',
    this.initialOemQuery,
  });

  @override
  State<CategoryTreeScreen> createState() => _CategoryTreeScreenState();
}

class _CategoryTreeScreenState extends State<CategoryTreeScreen> {
  List<PartModel> _inventory = [];
  bool _loading = true;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ApiClient().get('/parts?select=*');
      if (response.statusCode == 200 && response.data is List) {
        var parts = (response.data as List)
            .map((j) => PartModel.fromJson(Map<String, dynamic>.from(j as Map)))
            .toList();
        parts = await GarageReputationService.instance.enrichParts(parts);
        if (mounted) setState(() => _inventory = parts);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addToCart(PartModel part, int qty) async {
    final ok = await AuthGate.requireLogin(context, lang: widget.lang);
    if (!ok || !mounted) return;
    await CartService().addToCart(partId: part.id, part: part, quantity: qty);
    if (!mounted) return;
    CustomToast.success(
      context,
      isAr ? 'تمت الإضافة إلى السلة' : 'Added to cart',
    );
  }

  @override
  Widget build(BuildContext context) {
    final oem = widget.initialOemQuery?.trim();
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: GlassBackButton(iconColor: Colors.white)),
          ),
          title: Text(
            oem != null && oem.isNotEmpty
                ? (isAr ? 'نتائج رقم القطعة' : 'OEM Search Results')
                : (isAr ? 'كتالوج شجرة التصفية' : 'Category Tree'),
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
        ),
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.copper),
              )
            : SingleChildScrollView(
                physics: const BouncingScrollPhysics(
                  parent: AlwaysScrollableScrollPhysics(),
                ),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                child: SidebarFilters(
                  lang: widget.lang,
                  inventory: _inventory,
                  forceMode: SearchMode.tree,
                  hideLandingCards: true,
                  initialSearchQuery: oem,
                  onAddToCart: _addToCart,
                  onInquire: (part) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CheckoutScreen(
                          lang: widget.lang,
                          part: part,
                          initialStep: 'inquire',
                        ),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}
