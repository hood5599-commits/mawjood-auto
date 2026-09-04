import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../data/car_data.dart';
import '../data/category_images.dart';
import '../models/part_model.dart';
import '../services/api_client.dart';
import '../utils/vin_matcher.dart';
import 'part_card.dart';

enum SelectorStep { idle, engine, mainCat, subCat, parts }

class CategoryMeta {
  final String ar;
  final String en;
  final IconData iconData;
  final Color bg;
  final String? imageAsset;

  const CategoryMeta({
    required this.ar,
    required this.en,
    required this.iconData,
    required this.bg,
    this.imageAsset,
  });
}

class VisualVehicleSelector extends StatefulWidget {
  final String lang;
  final ValueChanged<PartModel>? onAddToCart;
  final ValueChanged<PartModel>? onInquire;
  final ValueChanged<PartModel>? onShare;
  final Widget Function(BuildContext context, PartModel part)? partCardBuilder;

  const VisualVehicleSelector({
    super.key,
    this.lang = 'ar',
    this.onAddToCart,
    this.onInquire,
    this.onShare,
    this.partCardBuilder,
  });

  @override
  State<VisualVehicleSelector> createState() => _VisualVehicleSelectorState();
}

class _VisualVehicleSelectorState extends State<VisualVehicleSelector> {
  bool get isAr => widget.lang == 'ar';

  String _selectedMake = '';
  String _selectedModel = '';
  String _selectedYear = '';
  String _selectedEngine = '';

  SelectorStep _currentStep = SelectorStep.idle;

  List<PartModel> _carFilteredParts = [];
  List<String> _availableEngines = [];
  List<String> _availableMainCats = [];
  List<String> _availableSubCats = [];
  List<PartModel> _matchingParts = [];

  String _chosenEngine = '';
  String _chosenMainCat = '';
  String _chosenSubCat = '';

  bool _isLoading = false;

  // 🗂️ القاموس الشامل للأقسام الـ 22 الرئيسية
  static const Map<String, CategoryMeta> categoryMeta = {
    'Brake & Wheel Hub': CategoryMeta(
      ar: 'الفرامل والسفايف والدرامات',
      en: 'Brake & Wheel Hub',
      iconData: Icons.car_crash_outlined,
      bg: Color(0xFFFEF2F2),
      imageAsset: 'assets/images/brakes.png.jpg',
    ),
    'Suspension': CategoryMeta(
      ar: 'المساعدات والجامبينات والشيالات',
      en: 'Suspension',
      iconData: Icons.linear_scale,
      bg: Color(0xFFFAF5FF),
      imageAsset: 'assets/images/Suspension.jpg',
    ),
    'Engine': CategoryMeta(
      ar: 'المحرك ومكونات المكينة',
      en: 'Engine & Components',
      iconData: Icons.settings,
      bg: Color(0xFFEFF6FF),
      imageAsset: 'assets/images/Engine.jpg',
    ),
    'Cooling System': CategoryMeta(
      ar: 'نظام التبريد والرديتر',
      en: 'Cooling System',
      iconData: Icons.ac_unit,
      bg: Color(0xFFF0FDF4),
      imageAsset: 'assets/images/Cooling System.jpg',
    ),
    'Heat & Air Conditioning': CategoryMeta(
      ar: 'التكييف والكمبريسر والتدفئة',
      en: 'Heat & Air Conditioning',
      iconData: Icons.air,
      bg: Color(0xFFFFFBEB),
      imageAsset: 'assets/images/Heat & Air Conditioning.jpg',
    ),
    'Ignition': CategoryMeta(
      ar: 'نظام الاشتعال (البلاكات والكويلات)',
      en: 'Ignition System',
      iconData: Icons.local_fire_department_outlined,
      bg: Color(0xFFFFF7ED),
      imageAsset: 'assets/images/Ignition.jpg',
    ),
    'Fuel & Air': CategoryMeta(
      ar: 'الوقود وبترول وهواء المكينة',
      en: 'Fuel & Air',
      iconData: Icons.local_gas_station_outlined,
      bg: Color(0xFFF0FDFA),
      imageAsset: 'assets/images/Fuel & Air.jpg',
    ),
    'Electrical': CategoryMeta(
      ar: 'الكهرباء والدينمة والسلف',
      en: 'Electrical System',
      iconData: Icons.bolt,
      bg: Color(0xFFFEFCE8),
      imageAsset: 'assets/images/Electrical.jpg',
    ),
    'Body & Lamp Assembly': CategoryMeta(
      ar: 'الهيكل والإضاءة (بدي وليتات)',
      en: 'Body & Lighting',
      iconData: Icons.lightbulb_outline,
      bg: Color(0xFFF8FAFC),
      imageAsset: 'assets/images/Body & Lamp Assembly.jpg',
    ),
    'Steering': CategoryMeta(
      ar: 'نظام التوجيه والاستيرنج راك',
      en: 'Steering System',
      iconData: Icons.drive_eta_outlined,
      bg: Color(0xFFF5F3FF),
      imageAsset: 'assets/images/Steering.jpg',
    ),
    'Drivetrain': CategoryMeta(
      ar: 'الدفع والمحاور (الأكسلات والشفت)',
      en: 'Drivetrain & Axles',
      iconData: Icons.sync,
      bg: Color(0xFFFDF2F8),
      imageAsset: 'assets/images/Drivetrain.jpg',
    ),
    'Transmission-Automatic': CategoryMeta(
      ar: 'القير الأوتوماتيك (الجير)',
      en: 'Automatic Transmission',
      iconData: Icons.settings_input_component,
      bg: Color(0xFFF1F5F9),
      imageAsset: 'assets/images/Transmission-Automatic.jpg',
    ),
    'Transmission-Manual': CategoryMeta(
      ar: 'القير العادي (الكلتش)',
      en: 'Manual Transmission',
      iconData: Icons.settings_suggest,
      bg: Color(0xFFF1F5F9),
      imageAsset: 'assets/images/Transmission-Automatic.jpg',
    ),
    'Wheel': CategoryMeta(
      ar: 'الإطارات والرنجات والتواير',
      en: 'Wheels & Tires',
      iconData: Icons.tire_repair,
      bg: Color(0xFFF8FAFC),
      imageAsset: 'assets/images/wheels.jpg',
    ),
    'Wiper & Washer': CategoryMeta(
      ar: 'المساحات وبخاخات ماي الجام',
      en: 'Wipers & Washers',
      iconData: Icons.water_drop_outlined,
      bg: Color(0xFFEFF6FF),
      imageAsset: 'assets/images/Wiper & Washer.jpg',
    ),
    'Belt Drive': CategoryMeta(
      ar: 'نظام السيور والقوايش',
      en: 'Belt Drive',
      iconData: Icons.link,
      bg: Color(0xFFFFF7ED),
      imageAsset: 'assets/images/Belt Drive.jpg',
    ),
    'Exhaust & Emission': CategoryMeta(
      ar: 'العادم والقزوز ودبة البيئة',
      en: 'Exhaust & Emission',
      iconData: Icons.cloud_outlined,
      bg: Color(0xFFF1F5F9),
      imageAsset: 'assets/images/Exhaust & Emission.jpg',
    ),
    'Electrical-Bulb & Socket': CategoryMeta(
      ar: 'اللمبات والفيش',
      en: 'Electrical-Bulb & Socket',
      iconData: Icons.lightbulb_outline,
      bg: Color(0xFFFEFCE8),
    ),
    'Electrical-Connector': CategoryMeta(
      ar: 'الفيش والتوصيلات',
      en: 'Electrical-Connector',
      iconData: Icons.cable,
      bg: Color(0xFFF8FAFC),
    ),
    'Electrical-Switch & Relay': CategoryMeta(
      ar: 'المفاتيح والكتاوت',
      en: 'Electrical-Switch & Relay',
      iconData: Icons.toggle_on_outlined,
      bg: Color(0xFFF1F5F9),
    ),
    'Interior': CategoryMeta(
      ar: 'المقصورة والديكور الداخلي',
      en: 'Interior',
      iconData: Icons.airline_seat_recline_normal,
      bg: Color(0xFFF8FAFC),
    ),
    'Literature': CategoryMeta(
      ar: 'الكتالوجات والكتيبات',
      en: 'Literature',
      iconData: Icons.menu_book_outlined,
      bg: Color(0xFFFAF5FF),
    ),
  };

  // 📂 قاموس ترجمة الأقسام الفرعية باللهجة القطرية
  static const Map<String, Map<String, String>> subCategoryNames = {
    "Brake Pad": {"ar": "فحمات وقماشات الفرامل (سفايف)", "en": "Brake Pads"},
    "Rotor": {"ar": "هوبات وأقراص الفرامل (درام ويل)", "en": "Brake Rotors"},
    "Caliper": {"ar": "كليبر وملاقط الفرامل", "en": "Brake Calipers"},
    "ABS Control Module": {
      "ar": "منظم مانع الانزلاق (ABS)",
      "en": "ABS Control Module",
    },
    "Brake Fluid": {"ar": "زيت الفرامل (آيل بريك)", "en": "Brake Fluid"},
    "Wheel Bearing & Hub": {
      "ar": "رمان وفلنجة العجل (بيرنج)",
      "en": "Wheel Bearings & Hub",
    },
    "Parking Brake Shoe": {
      "ar": "أقمشة فرامل اليد (سفايف هاند بريك)",
      "en": "Parking Brake Shoes",
    },
    "Shock / Strut": {
      "ar": "المساعدات وممتص الصدمات (جامبينات)",
      "en": "Shocks & Struts",
    },
    "Control Arm": {
      "ar": "المقصات وأذرعة التحكم (شيالات)",
      "en": "Control Arms",
    },
    "Coil Spring": {"ar": "اليايات والزنبركات (سبرنغات)", "en": "Coil Springs"},
    "Sway Bar Link": {
      "ar": "مسامير وأعمدة التوازن (رودات توازن)",
      "en": "Sway Bar Links",
    },
    "Control Arm Bushing": {
      "ar": "جلب وربلات المقصات (بوشات)",
      "en": "Control Arm Bushings",
    },
    "Rack and Pinion": {
      "ar": "دودة الدركسون (استيرنج راك)",
      "en": "Rack & Pinion Steering",
    },
    "Tie Rod End": {
      "ar": "أذرعة وركب الدركسون (رودات سكان)",
      "en": "Tie Rod Ends",
    },
    "Water Pump": {"ar": "طرمبة ومضخة الماء (واتر بمب)", "en": "Water Pump"},
    "Radiator": {
      "ar": "رديتر تبريد المحرك (رديتر ماي)",
      "en": "Engine Radiator",
    },
    "Thermostat": {
      "ar": "ثرموستات وكوع الحرارة (بلف حرارة)",
      "en": "Thermostat",
    },
    "Radiator Fan Assembly": {
      "ar": "مروحة تبريد الرديتر",
      "en": "Radiator Fan Assembly",
    },
    "A/C Compressor": {
      "ar": "كمبروسر وضاغط المكيف (كمبريسر)",
      "en": "A/C Compressor",
    },
    "A/C Condenser": {
      "ar": "مكثف ورديتر المكيف (كوندنسر)",
      "en": "A/C Condenser",
    },
    "Cabin Air Filter": {
      "ar": "فلتر هواء المكيف والمقصورة",
      "en": "Cabin Air Filter",
    },
    "Spark Plug": {"ar": "بواجي وشمعات الاحتراق (بلاكات)", "en": "Spark Plugs"},
    "Ignition Coil": {"ar": "كويلات وملفات الإشعال", "en": "Ignition Coils"},
    "Air Filter": {
      "ar": "فلتر هواء المحرك (فلتر مكينة)",
      "en": "Engine Air Filter",
    },
    "Fuel Pump & Housing Assembly": {
      "ar": "طرمبة ومضخة الوقود (فيول بمب)",
      "en": "Fuel Pump Assembly",
    },
    "Fuel Injector": {
      "ar": "بخاخات وحاقن الوقود (نوزلات)",
      "en": "Fuel Injectors",
    },
    "Throttle Body": {
      "ar": "بوابة وهواء الثروتل (ثروتل بدي)",
      "en": "Throttle Body",
    },
    "Alternator / Generator": {
      "ar": "دينمو وشاحن البطارية (دينمة)",
      "en": "Alternator / Generator",
    },
    "Starter Motor": {
      "ar": "سلف ومارش التشغيل (ستارتر)",
      "en": "Starter Motor",
    },
    "Battery": {"ar": "بطارية السيارة (بتري)", "en": "Battery"},
    "Motor Mount": {
      "ar": "كراسي وقواعد المحرك (كراسي مكينة)",
      "en": "Motor Mounts",
    },
    "Oil Filter": {"ar": "فلتر وزيت المحرك (فلتر آيل)", "en": "Oil Filter"},
    "Belt": {"ar": "سيور المحرك الخارجية (قايش)", "en": "Drive Belts"},
    "Wiper Blade": {"ar": "مساحات وشفرات الزجاج", "en": "Wiper Blades"},
  };

  // 1️⃣ بدء البحث البصري عند اختيار السيارة
  Future<void> _handleStartSearch() async {
    if (_selectedMake.isEmpty ||
        _selectedModel.isEmpty ||
        _selectedYear.isEmpty) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final enMake = CarData.brands[_selectedMake]?.en ?? _selectedMake;
      // Match web VisualVehicleSelector: ilike both AR + EN make, then client filter.
      // Do NOT pre-encode — ApiClient/Uri.parse encodes once.
      final response = await ApiClient().get(
        '/parts?or=(make.ilike.*$_selectedMake*,make.ilike.*$enMake*)&select=*',
      );

      if (response.statusCode == 200 && response.data is List) {
        final List rawList = response.data;
        final parts = rawList
            .whereType<Map>()
            .map((j) => PartModel.fromJson(Map<String, dynamic>.from(j)))
            .toList();

        final matchedVehicles = parts.where((p) {
          // Web: isModelMatching(dbModel, selected) / isYearMatching(dbYear, selected)
          final matchModel =
              VinMatcher.isModelMatched(p.model, _selectedModel);
          final matchYear = VinMatcher.isYearMatched(p.year, _selectedYear);
          return matchModel && matchYear;
        }).toList();

        _carFilteredParts = matchedVehicles;

        final rawEngines = matchedVehicles
            .map(
              (p) => (p.engine != null && p.engine!.trim().isNotEmpty)
                  ? p.engine!
                  : (isAr ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'),
            )
            .toSet()
            .toList();

        _availableEngines = rawEngines.isNotEmpty
            ? rawEngines
            : [isAr ? 'جميع المحركات (بنزين / ديزل)' : 'All Engines'];

        if (_selectedEngine.isNotEmpty) {
          _chosenEngine = _selectedEngine;
          _loadMainCategories(matchedVehicles, _selectedEngine);
        } else if (_availableEngines.length <= 1) {
          final defaultEng = _availableEngines.first;
          _chosenEngine = defaultEng;
          _loadMainCategories(matchedVehicles, defaultEng);
        } else {
          setState(() => _currentStep = SelectorStep.engine);
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 2️⃣ استخراج الأقسام الرئيسية المتاحة للسيارة
  void _loadMainCategories(List<PartModel> partsList, String? engine) {
    final filtered =
        (engine != null &&
            !engine.contains('جميع المحركات') &&
            !engine.contains('All Engines'))
        ? partsList
              .where(
                (p) =>
                    p.engine == null ||
                    p.engine!.contains('جميع') ||
                    p.engine!.contains('All') ||
                    p.engine == engine,
              )
              .toList()
        : partsList;

    final mainCats = <String>{};
    for (final p in filtered) {
      final pCat = p.category ?? '';
      final main = pCat.contains('>') ? pCat.split('>')[0].trim() : pCat;
      if (main.isNotEmpty && main != 'عام') {
        mainCats.add(main);
      }
    }

    setState(() {
      _availableMainCats = mainCats.toList();
      _currentStep = SelectorStep.mainCat;
    });
  }

  // 3️⃣ اختيار المحرك
  void _handleSelectEngine(String eng) {
    _chosenEngine = eng;
    _loadMainCategories(_carFilteredParts, eng);
  }

  // 4️⃣ اختيار القسم الرئيسي
  void _handleSelectMainCat(String cat) {
    _chosenMainCat = cat;

    final subCats = <String>{};
    for (final p in _carFilteredParts) {
      final pCat = p.category ?? '';
      final main = pCat.contains('>') ? pCat.split('>')[0].trim() : pCat;
      final sub = pCat.contains('>') ? pCat.split('>')[1].trim() : '';
      if (main == cat && sub.isNotEmpty) {
        subCats.add(sub);
      }
    }

    if (subCats.isEmpty) {
      final parts = _carFilteredParts
          .where((p) => (p.category ?? '').contains(cat))
          .toList();
      setState(() {
        _matchingParts = parts;
        _currentStep = SelectorStep.parts;
      });
    } else {
      setState(() {
        _availableSubCats = subCats.toList();
        _currentStep = SelectorStep.subCat;
      });
    }
  }

  // 5️⃣ اختيار القسم الفرعي
  void _handleSelectSubCat(String subCat) {
    _chosenSubCat = subCat;

    final finalParts = _carFilteredParts.where((p) {
      final pCat = p.category ?? '';
      final main = pCat.contains('>') ? pCat.split('>')[0].trim() : pCat;
      final sub = pCat.contains('>') ? pCat.split('>')[1].trim() : '';
      return main == _chosenMainCat && (sub == subCat || sub.isEmpty);
    }).toList();

    setState(() {
      _matchingParts = finalParts;
      _currentStep = SelectorStep.parts;
    });
  }

  void _resetSelection() {
    setState(() {
      _currentStep = SelectorStep.idle;
      _chosenEngine = '';
      _chosenMainCat = '';
      _chosenSubCat = '';
      _matchingParts = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 🚘 صندوق اختيار وتحديد مواصفات السيارة
          _buildCarSelectorCard(),
          const SizedBox(height: 18),

          // 🧭 شريط مسار التنقل (Breadcrumbs)
          if (_currentStep != SelectorStep.idle) ...[
            _buildBreadcrumbsBar(),
            const SizedBox(height: 18),
          ],

          // الخطوات التفاعلية
          if (_currentStep == SelectorStep.engine) _buildEngineSelectorGrid(),
          if (_currentStep == SelectorStep.mainCat) _buildMainCategoriesGrid(),
          if (_currentStep == SelectorStep.subCat) _buildSubCategoriesGrid(),
          if (_currentStep == SelectorStep.parts) _buildMatchingPartsGrid(),
        ],
      ),
    );
  }

  // 🚘 1. بطاقة فلاتر اختيار السيارة
  Widget _buildCarSelectorCard() {
    final makes = CarData.brands.keys.toList();
    final models = _selectedMake.isNotEmpty
        ? (CarData.brands[_selectedMake]?.models ?? [])
        : <String>[];
    final engines = _selectedMake.isNotEmpty
        ? (CarData.brands[_selectedMake]?.engines ?? [])
        : <String>[];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppTheme.copper.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppTheme.copper.withValues(alpha: 0.3),
                  ),
                ),
                child: const Center(
                  child: Text('🚘', style: TextStyle(fontSize: 20)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isAr
                          ? 'حدد سيارتك لعرض الأقسام والقطع المتوافقة 100%'
                          : 'Select Vehicle for 100% Fitment Match',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                    Text(
                      isAr
                          ? 'تصفح الكتالوج المخصص لسيارتك بدقة متناهية'
                          : 'Browse catalog tailored exclusively to your model',
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // شبكة حقول الاختيار المنسدلة
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 640;
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  // الماركة
                  SizedBox(
                    width: isWide
                        ? (constraints.maxWidth - 36) / 4
                        : constraints.maxWidth,
                    child: _buildDropdown(
                      label: isAr ? '1. الماركة *' : '1. Make *',
                      value: _selectedMake.isEmpty ? null : _selectedMake,
                      hint: isAr ? '-- اختر الشركة --' : '-- Select Make --',
                      items: makes
                          .map(
                            (m) => DropdownMenuItem(
                              value: m,
                              child: Text('$m (${CarData.brands[m]?.en})'),
                            ),
                          )
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedMake = val ?? '';
                          _selectedModel = '';
                          _selectedEngine = '';
                        });
                      },
                    ),
                  ),

                  // الموديل
                  SizedBox(
                    width: isWide
                        ? (constraints.maxWidth - 36) / 4
                        : constraints.maxWidth,
                    child: _buildDropdown(
                      label: isAr ? '2. الموديل *' : '2. Model *',
                      value: _selectedModel.isEmpty ? null : _selectedModel,
                      hint: isAr ? '-- اختر الموديل --' : '-- Select Model --',
                      items: models
                          .map(
                            (m) => DropdownMenuItem(value: m, child: Text(m)),
                          )
                          .toList(),
                      onChanged: _selectedMake.isEmpty
                          ? null
                          : (val) => setState(() => _selectedModel = val ?? ''),
                    ),
                  ),

                  // سنة الصنع
                  SizedBox(
                    width: isWide
                        ? (constraints.maxWidth - 36) / 4
                        : constraints.maxWidth,
                    child: _buildDropdown(
                      label: isAr ? '3. سنة الصنع *' : '3. Year *',
                      value: _selectedYear.isEmpty ? null : _selectedYear,
                      hint: isAr ? '-- اختر السنة --' : '-- Select Year --',
                      items: CarData.carYears
                          .map(
                            (y) => DropdownMenuItem(value: y, child: Text(y)),
                          )
                          .toList(),
                      onChanged: (val) =>
                          setState(() => _selectedYear = val ?? ''),
                    ),
                  ),

                  // المحرك
                  SizedBox(
                    width: isWide
                        ? (constraints.maxWidth - 36) / 4
                        : constraints.maxWidth,
                    child: _buildDropdown(
                      label: isAr
                          ? '4. المحرك (اختياري)'
                          : '4. Engine (Optional)',
                      value: _selectedEngine.isEmpty ? null : _selectedEngine,
                      hint: isAr ? '-- كل المحركات --' : '-- All Engines --',
                      items: [
                        DropdownMenuItem(
                          value: '',
                          child: Text(
                            isAr ? '-- كل المحركات --' : '-- All Engines --',
                          ),
                        ),
                        ...engines.map(
                          (e) => DropdownMenuItem(value: e, child: Text(e)),
                        ),
                      ],
                      onChanged: _selectedMake.isEmpty
                          ? null
                          : (val) =>
                                setState(() => _selectedEngine = val ?? ''),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 16),

          // زر فحص واستعراض الأقسام
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed:
                  (_isLoading ||
                      _selectedMake.isEmpty ||
                      _selectedModel.isEmpty ||
                      _selectedYear.isEmpty)
                  ? null
                  : _handleStartSearch,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.search, size: 20),
              label: Text(
                _isLoading
                    ? (isAr ? 'جاري الفحص...' : 'Checking...')
                    : (isAr ? 'استعراض الأقسام والقطع' : 'Explore Parts'),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.copper,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
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
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppTheme.surfaceSlate,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.borderSlate),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              hint: Text(
                hint,
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              dropdownColor: AppTheme.cardBg,
              style: const TextStyle(
                color: AppTheme.textWhite,
                fontSize: 13,
                fontFamily: 'Cairo',
              ),
              items: items,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  // 🧭 2. شريط مسار التنقل
  Widget _buildBreadcrumbsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Row(
        children: [
          Expanded(
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 6,
              runSpacing: 4,
              children: [
                Text(
                  '🚘 $_selectedMake $_selectedModel ($_selectedYear)',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textWhite,
                    fontSize: 13,
                  ),
                ),
                if (_chosenEngine.isNotEmpty)
                  Text(
                    '› ⚡ $_chosenEngine',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
                if (_chosenMainCat.isNotEmpty)
                  Text(
                    '› 🗂️ ${isAr ? (categoryMeta[_chosenMainCat]?.ar ?? _chosenMainCat) : (categoryMeta[_chosenMainCat]?.en ?? _chosenMainCat)}',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
                if (_chosenSubCat.isNotEmpty)
                  Text(
                    '› 📂 ${isAr ? (subCategoryNames[_chosenSubCat]?['ar'] ?? _chosenSubCat) : (subCategoryNames[_chosenSubCat]?['en'] ?? _chosenSubCat)}',
                    style: const TextStyle(
                      color: AppTheme.copperLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: _resetSelection,
            icon: const Icon(Icons.refresh, size: 14, color: AppTheme.danger),
            label: Text(
              isAr ? 'إعادة ضبط' : 'Reset',
              style: const TextStyle(
                color: AppTheme.danger,
                fontSize: 11.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ⚡ 3. شبكة اختيار المحرك
  Widget _buildEngineSelectorGrid() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr ? '⚡ اختر نوع المحرك لسيارتك:' : '⚡ Select Vehicle Engine:',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppTheme.textWhite,
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: _availableEngines.length,
            itemBuilder: (context, index) {
              final eng = _availableEngines[index];
              return InkWell(
                onTap: () => _handleSelectEngine(eng),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceSlate,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.borderSlate),
                  ),
                  child: Row(
                    children: [
                      const Text('⚡', style: TextStyle(fontSize: 22)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          eng,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12.5,
                            color: AppTheme.textWhite,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 🗂️ 4. شبكة الأقسام الرئيسية الـ 22
  Widget _buildMainCategoriesGrid() {
    if (_availableMainCats.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(36),
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.borderSlate),
        ),
        child: Center(
          child: Column(
            children: [
              Text(
                isAr
                    ? 'لا توجد قطع معروضة حالياً لسيارة ($_selectedMake $_selectedModel $_selectedYear)'
                    : 'No parts available for ($_selectedMake $_selectedModel $_selectedYear)',
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _resetSelection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.surfaceSlate,
                ),
                child: Text(isAr ? 'اختيار سيارة أخرى' : 'Select Another Car'),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr
                ? '🗂️ اختر القسم الرئيسي لقطعة الغيار:'
                : '🗂️ Select Main Category:',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppTheme.textWhite,
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 220,
              childAspectRatio: 1.1,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
            ),
            itemCount: _availableMainCats.length,
            itemBuilder: (context, index) {
              final cat = _availableMainCats[index];
              final meta =
                  categoryMeta[cat] ??
                  CategoryMeta(
                    ar: cat,
                    en: cat,
                    iconData: Icons.category_outlined,
                    bg: const Color(0xFFF8FAFC),
                    imageAsset: CategoryImages.assetFor(cat),
                  );
              final asset = meta.imageAsset ?? CategoryImages.assetFor(cat);

              return InkWell(
                onTap: () => _handleSelectMainCat(cat),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceSlate,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderSlate),
                    image: asset != null
                        ? DecorationImage(
                            image: AssetImage(asset),
                            fit: BoxFit.cover,
                            colorFilter: ColorFilter.mode(
                              Colors.black.withValues(alpha: 0.55),
                              BlendMode.darken,
                            ),
                          )
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: AppTheme.cardBg.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.borderSlate),
                        ),
                        child: Icon(
                          meta.iconData,
                          color: AppTheme.copperLight,
                          size: 26,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        isAr ? meta.ar : meta.en,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textWhite,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 📂 5. شبكة الأقسام الفرعية
  Widget _buildSubCategoriesGrid() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isAr
                    ? '📂 الأقسام الفرعية المتوفرة في (${categoryMeta[_chosenMainCat]?.ar ?? _chosenMainCat}):'
                    : '📂 Subcategories in ($_chosenMainCat):',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                ),
              ),
              TextButton.icon(
                onPressed: () =>
                    setState(() => _currentStep = SelectorStep.mainCat),
                icon: const Icon(
                  Icons.arrow_back,
                  size: 14,
                  color: AppTheme.copperLight,
                ),
                label: Text(
                  isAr ? 'الأقسام الرئيسية' : 'Back',
                  style: const TextStyle(
                    color: AppTheme.copperLight,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _availableSubCats.map((sub) {
              final subInfo = subCategoryNames[sub];
              final displayName = subInfo != null
                  ? (isAr ? subInfo['ar']! : subInfo['en']!)
                  : sub;

              return InkWell(
                onTap: () => _handleSelectSubCat(sub),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceSlate,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderSlate),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🔸', style: TextStyle(fontSize: 14)),
                      const SizedBox(width: 8),
                      Text(
                        displayName,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textWhite,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 🛒 6. عرض القطع المتوافقة
  Widget _buildMatchingPartsGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isAr
                  ? '🛒 القطع المتوافقة المتوفرة (${_matchingParts.length}):'
                  : '🛒 Compatible Parts (${_matchingParts.length}):',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textWhite,
              ),
            ),
            TextButton.icon(
              onPressed: () => setState(
                () => _currentStep = _availableSubCats.isNotEmpty
                    ? SelectorStep.subCat
                    : SelectorStep.mainCat,
              ),
              icon: const Icon(
                Icons.swap_horiz,
                size: 16,
                color: AppTheme.copperLight,
              ),
              label: Text(
                isAr ? 'تغيير القسم' : 'Change Category',
                style: const TextStyle(
                  color: AppTheme.copperLight,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (_matchingParts.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.borderSlate),
            ),
            child: Center(
              child: Text(
                isAr
                    ? 'عفواً، لا توجد قطع متوفرة لهذا القسم حالياً.'
                    : 'No parts available for this section.',
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 360,
              mainAxisExtent: 380,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: _matchingParts.length,
            itemBuilder: (context, index) {
              final part = _matchingParts[index];
              if (widget.partCardBuilder != null) {
                return widget.partCardBuilder!(context, part);
              }
              return PartCard(
                item: part,
                lang: widget.lang,
                onAddToCart: widget.onAddToCart,
                onInquire: widget.onInquire,
                onShare: widget.onShare,
              );
            },
          ),
      ],
    );
  }
}
