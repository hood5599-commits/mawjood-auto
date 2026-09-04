import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../data/car_data.dart';
import '../models/part_model.dart';
import '../models/vehicle_model.dart';
import '../services/api_client.dart';
import '../utils/category_helper.dart';
import '../utils/vin_matcher.dart';
import '../widgets/custom_toast.dart';
import '../widgets/part_card.dart';
import '../widgets/request_part_modal.dart';
import '../widgets/smart_vin_scanner.dart';
import '../widgets/visual_vehicle_selector.dart';
import '../utils/part_share_helper.dart';

enum SearchMode { visual, tree }

enum SortOption { def, priceAsc, priceDesc }

class SidebarFilters extends StatefulWidget {
  final String lang;
  final List<PartModel> inventory;
  final void Function(PartModel item, int quantity)? onAddToCart;
  final ValueChanged<PartModel>? onInquire;
  final ValueChanged<PartModel>? onDetailedView;

  const SidebarFilters({
    super.key,
    this.lang = 'ar',
    required this.inventory,
    this.onAddToCart,
    this.onInquire,
    this.onDetailedView,
  });

  @override
  State<SidebarFilters> createState() => _SidebarFiltersState();
}

class _SidebarFiltersState extends State<SidebarFilters> {
  bool get isAr => widget.lang == 'ar';

  SearchMode _searchMode = SearchMode.visual;
  SortOption _sortBy = SortOption.def;

  // فحص الشاصي والسيارة
  VehicleProfile? _decodedVehicle;

  // البحث المباشر برقم القطعة
  final TextEditingController _searchController = TextEditingController();
  String _activeSearchQuery = '';
  int _displayLimit = 20;

  // شجرة الكتالوج الهرمية
  final Map<String, bool> _expandedNodes = {};
  final Map<String, dynamic> _nodeDataCache = {};
  final Map<String, bool> _loadingNodes = {};

  // نافذة طلب قطعة غير متوفرة
  final TextEditingController _reqPhoneController = TextEditingController();
  final TextEditingController _reqNotesController = TextEditingController();
  bool _isSubmittingReq = false;

  @override
  void dispose() {
    _searchController.dispose();
    _reqPhoneController.dispose();
    _reqNotesController.dispose();
    super.dispose();
  }

  // 🎯 فحص مطابقة رقم القطعة فقط (تجاهل النصوص العامة)
  bool _matchesPartNumberOnly(PartModel part, String query) {
    if (query.isEmpty) return false;
    final cleanQuery = query.toLowerCase().replaceAll(RegExp(r'[\s\-_]'), '');
    if (cleanQuery.isEmpty) return false;

    final pn = (part.partNumber ?? '').toLowerCase().replaceAll(
      RegExp(r'[\s\-_]'),
      '',
    );
    final id = part.id.toLowerCase();

    return (pn.isNotEmpty && pn.contains(cleanQuery)) || (id == cleanQuery);
  }

  // 🎯 تحديد حالة التوافق مع سيارة العميل المفحوصة
  String _getPartFitmentStatus(PartModel part, VehicleProfile? vehicle) {
    if (vehicle == null) return 'uncertain';
    if (vehicle.make.isEmpty && (vehicle.vin == null || vehicle.vin!.isEmpty)) {
      return 'uncertain';
    }

    if (vehicle.make.isNotEmpty && part.make.isNotEmpty) {
      final pMake = part.make.toLowerCase();
      final vMake = vehicle.make.toLowerCase();
      if (!pMake.contains(vMake) && !vMake.contains(pMake)) {
        return 'incompatible';
      }
    }

    if (vehicle.model.isNotEmpty && part.model.isNotEmpty) {
      final pModel = part.model.toLowerCase();
      final vModel = vehicle.model.toLowerCase();
      if (!pModel.contains(vModel) && !vModel.contains(pModel)) {
        return 'incompatible';
      }
    }

    if (vehicle.year.isNotEmpty && part.year.isNotEmpty) {
      if (!VinMatcher.isYearMatched(part.year, vehicle.year)) {
        return 'incompatible';
      }
    }

    if (vehicle.make.isNotEmpty && part.make.isNotEmpty) {
      return 'compatible';
    }

    return 'uncertain';
  }

  // جلب السنوات المتوفرة لماركة معينة (AR + EN make like web visual search fallback)
  Future<List<String>> _fetchYearsForMake(String make) async {
    final cacheKey = 'years_$make';
    if (_nodeDataCache.containsKey(cacheKey)) {
      return List<String>.from(_nodeDataCache[cacheKey]);
    }

    setState(() => _loadingNodes[cacheKey] = true);
    try {
      final enMake = CarData.brands[make]?.en ?? make;
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$enMake*)&select=year',
      );
      if (res.statusCode == 200 && res.data is List) {
        final yearsSet = <String>{};
        for (final item in res.data) {
          final yStr = (item['year'] ?? '').toString().trim();
          if (yStr.contains('-')) {
            final parts = yStr
                .split('-')
                .map((e) => int.tryParse(e.trim()))
                .toList();
            if (parts.length == 2 && parts[0] != null && parts[1] != null) {
              final a = parts[0]!;
              final b = parts[1]!;
              for (int y = (a < b ? a : b); y <= (a > b ? a : b); y++) {
                yearsSet.add(y.toString());
              }
            }
          } else if (yStr.isNotEmpty) {
            yearsSet.add(yStr);
          }
        }
        final sorted = yearsSet.toList()
          ..sort(
            (a, b) => (int.tryParse(b) ?? 0).compareTo(int.tryParse(a) ?? 0),
          );
        _nodeDataCache[cacheKey] = sorted;
        return sorted;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingNodes[cacheKey] = false);
    }
    return [];
  }

  // جلب الموديلات المتوفرة
  Future<List<String>> _fetchModelsForYear(String make, String year) async {
    final cacheKey = 'models_${make}_$year';
    if (_nodeDataCache.containsKey(cacheKey)) {
      return List<String>.from(_nodeDataCache[cacheKey]);
    }

    setState(() => _loadingNodes[cacheKey] = true);
    try {
      final enMake = CarData.brands[make]?.en ?? make;
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$enMake*)&select=model,year',
      );
      if (res.statusCode == 200 && res.data is List) {
        final modelsSet = <String>{};
        for (final item in res.data) {
          final y = (item['year'] ?? '').toString();
          if (VinMatcher.isYearMatched(y, year)) {
            final m = (item['model'] ?? '').toString().trim();
            if (m.isNotEmpty) modelsSet.add(m);
          }
        }
        final list = modelsSet.toList()..sort();
        _nodeDataCache[cacheKey] = list;
        return list;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingNodes[cacheKey] = false);
    }
    return [];
  }

  // جلب الأقسام الرئيسية للموديل
  Future<List<String>> _fetchMainCategories(
    String make,
    String year,
    String model,
  ) async {
    final cacheKey = 'maincats_${make}_${year}_$model';
    if (_nodeDataCache.containsKey(cacheKey)) {
      return List<String>.from(_nodeDataCache[cacheKey]);
    }

    setState(() => _loadingNodes[cacheKey] = true);
    try {
      final enMake = CarData.brands[make]?.en ?? make;
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$enMake*)&select=name,category,model,year',
      );
      if (res.statusCode == 200 && res.data is List) {
        final catsSet = <String>{};
        for (final p in res.data) {
          final y = (p['year'] ?? '').toString();
          final m = (p['model'] ?? '').toString();
          if (!VinMatcher.isYearMatched(y, year)) continue;
          if (!VinMatcher.isModelMatched(m, model)) continue;
          final cat =
              (p['category'] ??
                      CategoryHelper.getPartCategory(p['name'] ?? ''))
                  .toString();
          final main = cat.contains('>')
              ? cat.split('>')[0].trim()
              : cat.trim();
          if (main.isNotEmpty) catsSet.add(main);
        }
        final list = catsSet.toList()..sort();
        _nodeDataCache[cacheKey] = list;
        return list;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingNodes[cacheKey] = false);
    }
    return [];
  }

  // جلب قطع القسم
  Future<List<PartModel>> _fetchPartsForCategory(
    String make,
    String year,
    String model,
    String mainCat,
  ) async {
    final cacheKey = 'parts_${make}_${year}_${model}_$mainCat';
    if (_nodeDataCache.containsKey(cacheKey)) {
      return List<PartModel>.from(_nodeDataCache[cacheKey]);
    }

    setState(() => _loadingNodes[cacheKey] = true);
    try {
      final enMake = CarData.brands[make]?.en ?? make;
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$enMake*)&select=*',
      );
      if (res.statusCode == 200 && res.data is List) {
        final parts = (res.data as List)
            .whereType<Map>()
            .map((j) => PartModel.fromJson(Map<String, dynamic>.from(j)))
            .where((p) {
              if (!VinMatcher.isModelMatched(p.model, model)) return false;
              final cat = p.category ?? CategoryHelper.getPartCategory(p.name);
              final matchCat = cat.contains(mainCat);
              final matchYear = VinMatcher.isYearMatched(p.year, year);
              return matchCat && matchYear;
            })
            .toList();

        _nodeDataCache[cacheKey] = parts;
        return parts;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingNodes[cacheKey] = false);
    }
    return [];
  }

  void _toggleNode(
    String nodeKey,
    Future<dynamic> Function()? fetchAction,
  ) async {
    final isOpen = _expandedNodes[nodeKey] == true;
    if (isOpen) {
      setState(() {
        _expandedNodes.removeWhere(
          (k, _) => k == nodeKey || k.startsWith(nodeKey),
        );
      });
    } else {
      setState(() => _expandedNodes[nodeKey] = true);
      if (fetchAction != null) await fetchAction();
    }
  }

  // فرز القطع وترتيبها
  List<PartModel> _getSortedSearchResults() {
    var list = widget.inventory.where((p) {
      if (_activeSearchQuery.isNotEmpty) {
        return _matchesPartNumberOnly(p, _activeSearchQuery);
      }
      return false;
    }).toList();

    if (_sortBy == SortOption.priceAsc) {
      list.sort((a, b) => a.price.compareTo(b.price));
    } else if (_sortBy == SortOption.priceDesc) {
      list.sort((a, b) => b.price.compareTo(a.price));
    }

    if (_decodedVehicle != null) {
      list.sort((a, b) {
        final rankMap = {'compatible': 3, 'uncertain': 2, 'incompatible': 1};
        final rA = rankMap[_getPartFitmentStatus(a, _decodedVehicle)] ?? 0;
        final rB = rankMap[_getPartFitmentStatus(b, _decodedVehicle)] ?? 0;
        return rB.compareTo(rA);
      });
    }

    return list;
  }

  // نافذة طلب قطعة خاصة غير متوفرة
  void _showRequestDialog() {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppTheme.cardBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              const Icon(Icons.mail_outline, color: AppTheme.copper),
              const SizedBox(width: 8),
              Text(
                isAr ? 'طلب قطعة غير متوفرة' : 'Request Unavailable Part',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textWhite,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _reqPhoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: isAr ? 'رقم الهاتف للتواصل' : 'Phone Number',
                  hintText: '55000000',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reqNotesController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: isAr ? 'ملاحظات ورقم القطعة' : 'Part Notes & SKU',
                  hintText: isAr
                      ? 'أدخل رقم القطعة ومواصفات سيارتك...'
                      : 'Enter details...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                isAr ? 'إلغاء' : 'Cancel',
                style: const TextStyle(color: AppTheme.textMuted),
              ),
            ),
            ElevatedButton(
              onPressed: _isSubmittingReq
                  ? null
                  : () async {
                      if (_reqPhoneController.text.trim().isEmpty) {
                        CustomToast.error(
                          context,
                          isAr ? 'يرجى إدخال رقم الهاتف' : 'Please enter phone',
                        );
                        return;
                      }
                      setModalState(() => _isSubmittingReq = true);
                      try {
                        await ApiClient().post(
                          '/orders',
                          data: [
                            {
                              'part_name':
                                  'طلب خاص: ${_activeSearchQuery.isNotEmpty ? _activeSearchQuery : "قطعة مخصصة"}',
                              'price': 0,
                              'customer_phone': _reqPhoneController.text.trim(),
                              'status': 'pending',
                              'notes': _reqNotesController.text.trim(),
                            },
                          ],
                        );
                        if (mounted) {
                          Navigator.pop(ctx);
                          CustomToast.success(
                            context,
                            isAr
                                ? 'تم إرسال طلبك بنجاح وسنتواصل معك فوراً!'
                                : 'Request submitted successfully!',
                          );
                          _reqPhoneController.clear();
                          _reqNotesController.clear();
                        }
                      } catch (_) {
                        if (mounted) {
                          CustomToast.error(
                            context,
                            isAr
                                ? 'حدث خطأ أثناء الإرسال'
                                : 'Error submitting request',
                          );
                        }
                      } finally {
                        setModalState(() => _isSubmittingReq = false);
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.success,
              ),
              child: _isSubmittingReq
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(isAr ? 'إرسال الطلب' : 'Submit'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _buildFeatureCard(
                title: isAr ? 'الفحص الذكي برقم الشاصي' : 'Smart VIN Scan',
                subtitle: isAr
                    ? 'امسح الاستمارة أو أدخل VIN'
                    : 'Scan Istemara or enter VIN',
                icon: Icons.document_scanner_outlined,
                accent: AppTheme.copper,
                onTap: _openVinScannerSheet,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildFeatureCard(
                title: isAr
                    ? 'طلب تسعيرة قطعة غير متوفرة'
                    : 'Unavailable Part Quote',
                subtitle: isAr
                    ? 'أرسل طلب تسعير مخصص'
                    : 'Request a custom quote',
                icon: Icons.request_quote_outlined,
                accent: AppTheme.success,
                onTap: () => RequestPartModal.show(
                  context,
                  onSuccess: () => CustomToast.success(
                    context,
                    isAr
                        ? 'تم استلام طلبك بنجاح'
                        : 'Request received successfully',
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_decodedVehicle != null) ...[
          const SizedBox(height: 10),
          _buildActiveVehicleChip(),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildModeCard(
                mode: SearchMode.visual,
                title: isAr ? 'البحث البصري' : 'Visual Selector',
                subtitle: isAr
                    ? 'اختر سيارتك بالبطاقات خطوة بخطوة'
                    : 'Browse parts visually',
                icon: Icons.dashboard_customize_outlined,
                activeColor: AppTheme.success,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildModeCard(
                mode: SearchMode.tree,
                title: isAr ? 'كتالوج شجرة التصفية' : 'Full Catalog Tree',
                subtitle: isAr
                    ? 'تصفح الماركات والموديلات هرمياً'
                    : 'Hierarchical drilldown',
                icon: Icons.account_tree_outlined,
                activeColor: AppTheme.copper,
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        if (_searchMode == SearchMode.visual && _activeSearchQuery.isEmpty)
          VisualVehicleSelector(
            lang: widget.lang,
            onAddToCart: widget.onAddToCart != null
                ? (p) => widget.onAddToCart!(p, 1)
                : null,
            onInquire: widget.onInquire,
            onShare: (p) => PartShareHelper.sharePart(p, lang: widget.lang),
          )
        else
          _buildSearchAndTreeSection(),
      ],
    );
  }

  void _openVinScannerSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: SmartVinScanner(
              lang: widget.lang,
              activeVehicle: _decodedVehicle,
              onVehicleIdentified: (vehicle) {
                setState(() => _decodedVehicle = vehicle);
                Navigator.pop(ctx);
              },
              onReset: () {
                setState(() {
                  _decodedVehicle = null;
                  _activeSearchQuery = '';
                  _searchController.clear();
                });
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActiveVehicleChip() {
    final v = _decodedVehicle!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.success.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.verified, color: AppTheme.success, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${v.make} ${v.model} ${v.year}'.trim(),
              style: const TextStyle(
                color: AppTheme.textWhite,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          IconButton(
            onPressed: () => setState(() => _decodedVehicle = null),
            icon: const Icon(Icons.close, color: AppTheme.textMuted, size: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accent,
    required VoidCallback onTap,
    String? backgroundAsset,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        constraints: const BoxConstraints(minHeight: 120),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderSlate),
          image: backgroundAsset != null
              ? DecorationImage(
                  image: AssetImage(backgroundAsset),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(
                    Colors.black.withValues(alpha: 0.55),
                    BlendMode.darken,
                  ),
                )
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: accent, size: 26),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                color: AppTheme.textWhite,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeCard({
    required SearchMode mode,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color activeColor,
    String? backgroundAsset,
  }) {
    final isSelected = _searchMode == mode;
    return InkWell(
      onTap: () => setState(() => _searchMode = mode),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? activeColor.withValues(alpha: 0.12)
              : AppTheme.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? activeColor : AppTheme.borderSlate,
            width: isSelected ? 1.8 : 1,
          ),
          image: backgroundAsset != null
              ? DecorationImage(
                  image: AssetImage(backgroundAsset),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(
                    Colors.black.withValues(alpha: 0.5),
                    BlendMode.darken,
                  ),
                )
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(
                  icon,
                  color: isSelected ? activeColor : AppTheme.textMuted,
                  size: 22,
                ),
                if (isSelected)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: activeColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isAr ? 'محدد' : 'Active',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.bold,
                color: isSelected ? AppTheme.textWhite : AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // قسم البحث بالرقم + شجرة التصفية
  Widget _buildSearchAndTreeSection() {
    final searchResults = _getSortedSearchResults();
    final displayedResults = searchResults.take(_displayLimit).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // شريط البحث وخيارات الفرز
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (val) =>
                      setState(() => _activeSearchQuery = val.trim()),
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: AppTheme.textWhite,
                  ),
                  decoration: InputDecoration(
                    hintText: isAr
                        ? 'ابحث برقم القطعة أو الكود (مثال: 04465-33470)...'
                        : 'Search by Part No / Code...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: AppTheme.textMuted,
                    ),
                    suffixIcon: _activeSearchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              setState(() {
                                _searchController.clear();
                                _activeSearchQuery = '';
                              });
                            },
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSlate,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderSlate),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<SortOption>(
                    value: _sortBy,
                    dropdownColor: AppTheme.cardBg,
                    style: const TextStyle(
                      color: AppTheme.textWhite,
                      fontSize: 12,
                      fontFamily: 'Cairo',
                    ),
                    items: [
                      DropdownMenuItem(
                        value: SortOption.def,
                        child: Text(isAr ? 'الافتراضي' : 'Default'),
                      ),
                      DropdownMenuItem(
                        value: SortOption.priceAsc,
                        child: Text(isAr ? 'السعر: الأقل' : 'Price: Low'),
                      ),
                      DropdownMenuItem(
                        value: SortOption.priceDesc,
                        child: Text(isAr ? 'السعر: الأعلى' : 'Price: High'),
                      ),
                    ],
                    onChanged: (val) =>
                        setState(() => _sortBy = val ?? SortOption.def),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // عرض نتائج البحث الحصري برقم القطعة
          if (_activeSearchQuery.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isAr
                      ? 'نتائج البحث عن: "$_activeSearchQuery"'
                      : 'Results for: "$_activeSearchQuery"',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppTheme.copperLight,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _activeSearchQuery = '';
                      _searchController.clear();
                    });
                  },
                  child: Text(isAr ? 'إلغاء البحث' : 'Clear'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (searchResults.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSlate,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSlate),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.search_off,
                      size: 42,
                      color: AppTheme.textMuted,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      isAr
                          ? 'عفواً، لا توجد قطعة مطابقة لهذا الرقم تماماً.'
                          : 'No matching part number found.',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: _showRequestDialog,
                      icon: const Icon(Icons.mail_outline, size: 16),
                      label: Text(
                        isAr
                            ? 'إرسال طلب توفير قطعة بهذا الرقم'
                            : 'Request this part number',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.copper,
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 360,
                  mainAxisExtent: 380,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                ),
                itemCount: displayedResults.length,
                itemBuilder: (context, idx) => PartCard(
                  item: displayedResults[idx],
                  lang: widget.lang,
                  onAddToCart: (p) => widget.onAddToCart?.call(p, 1),
                  onInquire: widget.onInquire,
                ),
              ),
              if (_displayLimit < searchResults.length) ...[
                const SizedBox(height: 16),
                Center(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _displayLimit += 20),
                    icon: const Icon(Icons.expand_more),
                    label: Text(isAr ? 'عرض المزيد' : 'Load More'),
                  ),
                ),
              ],
            ],
          ] else ...[
            // شجرة الكتالوج الهرمية
            _buildTreeCatalogList(),
          ],
        ],
      ),
    );
  }

  // قائمة شجرة الماركات والموديلات المتفرعة
  Widget _buildTreeCatalogList() {
    final makes = CarData.brands.keys.toList();

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: makes.length,
      itemBuilder: (context, idx) {
        final make = makes[idx];
        final makeKey = 'make_$make';
        final isMakeOpen = _expandedNodes[makeKey] == true;
        final yearsKey = 'years_$make';
        final isYearsLoading = _loadingNodes[yearsKey] == true;
        final availableYears = List<String>.from(
          _nodeDataCache[yearsKey] ?? [],
        );

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: isMakeOpen ? AppTheme.surfaceSlate : AppTheme.cardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isMakeOpen
                  ? AppTheme.copper.withValues(alpha: 0.4)
                  : AppTheme.borderSlate,
            ),
          ),
          child: Column(
            children: [
              ListTile(
                dense: true,
                leading: const Icon(
                  Icons.directions_car,
                  color: AppTheme.copperLight,
                  size: 20,
                ),
                title: Text(
                  '$make (${CarData.brands[make]?.en})',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                    color: AppTheme.textWhite,
                  ),
                ),
                trailing: isYearsLoading
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.copperLight,
                        ),
                      )
                    : Icon(
                        isMakeOpen
                            ? Icons.keyboard_arrow_down
                            : Icons.chevron_right,
                        size: 18,
                      ),
                onTap: () =>
                    _toggleNode(makeKey, () => _fetchYearsForMake(make)),
              ),
              if (isMakeOpen)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Column(
                    children: availableYears.map((year) {
                      final yearKey = 'year_${make}_$year';
                      final isYearOpen = _expandedNodes[yearKey] == true;
                      final modelsKey = 'models_${make}_$year';
                      final isModelsLoading = _loadingNodes[modelsKey] == true;
                      final availableModels = List<String>.from(
                        _nodeDataCache[modelsKey] ?? [],
                      );

                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        child: Column(
                          children: [
                            ListTile(
                              dense: true,
                              leading: const Icon(
                                Icons.calendar_today,
                                size: 16,
                                color: AppTheme.textMuted,
                              ),
                              title: Text(
                                year,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textWhite,
                                ),
                              ),
                              trailing: isModelsLoading
                                  ? const SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 1.5,
                                      ),
                                    )
                                  : Icon(
                                      isYearOpen
                                          ? Icons.keyboard_arrow_down
                                          : Icons.chevron_right,
                                      size: 16,
                                    ),
                              onTap: () => _toggleNode(
                                yearKey,
                                () => _fetchModelsForYear(make, year),
                              ),
                            ),
                            if (isYearOpen)
                              Padding(
                                padding: const EdgeInsets.only(right: 18),
                                child: Column(
                                  children: availableModels.map((model) {
                                    final modelKey =
                                        'model_${make}_${year}_$model';
                                    final isModelOpen =
                                        _expandedNodes[modelKey] == true;
                                    final mainCatsKey =
                                        'maincats_${make}_${year}_$model';
                                    final isCatsLoading =
                                        _loadingNodes[mainCatsKey] == true;
                                    final availableCats = List<String>.from(
                                      _nodeDataCache[mainCatsKey] ?? [],
                                    );

                                    return Column(
                                      children: [
                                        ListTile(
                                          dense: true,
                                          title: Text(
                                            '🚘 $model',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppTheme.textWhite,
                                            ),
                                          ),
                                          trailing: isCatsLoading
                                              ? const SizedBox(
                                                  width: 12,
                                                  height: 12,
                                                  child:
                                                      CircularProgressIndicator(
                                                        strokeWidth: 1.5,
                                                      ),
                                                )
                                              : Icon(
                                                  isModelOpen
                                                      ? Icons
                                                            .keyboard_arrow_down
                                                      : Icons.chevron_right,
                                                  size: 16,
                                                ),
                                          onTap: () => _toggleNode(
                                            modelKey,
                                            () => _fetchMainCategories(
                                              make,
                                              year,
                                              model,
                                            ),
                                          ),
                                        ),
                                        if (isModelOpen)
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              right: 18,
                                            ),
                                            child: Column(
                                              children: availableCats.map((
                                                mainCat,
                                              ) {
                                                final catKey =
                                                    'cat_${make}_${year}_${model}_$mainCat';
                                                final isCatOpen =
                                                    _expandedNodes[catKey] ==
                                                    true;
                                                final partsKey =
                                                    'parts_${make}_${year}_${model}_$mainCat';
                                                final partsList =
                                                    List<PartModel>.from(
                                                      _nodeDataCache[partsKey] ??
                                                          [],
                                                    );

                                                return Column(
                                                  children: [
                                                    ListTile(
                                                      dense: true,
                                                      title: Text(
                                                        '🗂️ $mainCat',
                                                        style: const TextStyle(
                                                          fontSize: 11.5,
                                                          color: AppTheme
                                                              .copperLight,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                        ),
                                                      ),
                                                      onTap: () => _toggleNode(
                                                        catKey,
                                                        () =>
                                                            _fetchPartsForCategory(
                                                              make,
                                                              year,
                                                              model,
                                                              mainCat,
                                                            ),
                                                      ),
                                                    ),
                                                    if (isCatOpen &&
                                                        partsList.isNotEmpty)
                                                      Padding(
                                                        padding:
                                                            const EdgeInsets.symmetric(
                                                              vertical: 8,
                                                            ),
                                                        child: GridView.builder(
                                                          shrinkWrap: true,
                                                          physics:
                                                              const NeverScrollableScrollPhysics(),
                                                          gridDelegate:
                                                              const SliverGridDelegateWithMaxCrossAxisExtent(
                                                                maxCrossAxisExtent:
                                                                    340,
                                                                mainAxisExtent:
                                                                    360,
                                                                crossAxisSpacing:
                                                                    10,
                                                                mainAxisSpacing:
                                                                    10,
                                                              ),
                                                          itemCount:
                                                              partsList.length,
                                                          itemBuilder:
                                                              (
                                                                context,
                                                                pIdx,
                                                              ) => PartCard(
                                                                item:
                                                                    partsList[pIdx],
                                                                lang:
                                                                    widget.lang,
                                                                onAddToCart:
                                                                    (
                                                                      p,
                                                                    ) => widget
                                                                        .onAddToCart
                                                                        ?.call(
                                                                          p,
                                                                          1,
                                                                        ),
                                                                onInquire: widget
                                                                    .onInquire,
                                                              ),
                                                        ),
                                                      ),
                                                  ],
                                                );
                                              }).toList(),
                                            ),
                                          ),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
