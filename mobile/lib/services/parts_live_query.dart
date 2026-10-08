import '../data/car_data.dart';
import '../models/part_model.dart';
import 'api_client.dart';

/// Live on-demand parts catalog (RPC `search_parts_catalog`, page size 20).
class PartsSearchResult {
  final List<PartModel> items;
  final int total;
  final int offset;
  final int limit;
  final bool hasMore;

  const PartsSearchResult({
    required this.items,
    required this.total,
    required this.offset,
    required this.limit,
    required this.hasMore,
  });

  static const empty = PartsSearchResult(
    items: [],
    total: 0,
    offset: 0,
    limit: PartsLiveQuery.pageSize,
    hasMore: false,
  );
}

class PartsLiveQuery {
  static const int pageSize = 20;

  static String resolveMakeEn(String make) =>
      CarData.brands[make]?.en ?? make;

  static Future<PartsSearchResult> searchPartsCatalog({
    required String make,
    String? makeEn,
    String? model,
    String? year,
    String? mainCategory,
    String? subCategory,
    int offset = 0,
    int limit = pageSize,
  }) async {
    final capped = limit.clamp(1, 50);
    final off = offset < 0 ? 0 : offset;
    final en = makeEn ?? resolveMakeEn(make);

    try {
      final res = await ApiClient().postRpc(
        '/rpc/search_parts_catalog',
        data: {
          'p_make': make,
          'p_make_en': en,
          'p_model': (model == null || model.isEmpty) ? null : model,
          'p_year': (year == null || year.isEmpty) ? null : year,
          'p_main_category':
              (mainCategory == null || mainCategory.isEmpty) ? null : mainCategory,
          'p_sub_category':
              (subCategory == null || subCategory.isEmpty) ? null : subCategory,
          'p_offset': off,
          'p_limit': capped,
        },
      );

      if (res.statusCode == 200 && res.data is Map) {
        final data = Map<String, dynamic>.from(res.data as Map);
        final rawItems = data['items'];
        final items = <PartModel>[];
        if (rawItems is List) {
          for (final row in rawItems) {
            if (row is Map) {
              items.add(
                PartModel.fromJson(Map<String, dynamic>.from(row)),
              );
            }
          }
        }
        return PartsSearchResult(
          items: items,
          total: (data['total'] as num?)?.toInt() ?? items.length,
          offset: (data['offset'] as num?)?.toInt() ?? off,
          limit: (data['limit'] as num?)?.toInt() ?? capped,
          hasMore: data['hasMore'] == true,
        );
      }
    } catch (_) {}

    return _fallbackSearch(
      make: make,
      makeEn: en,
      model: model,
      year: year,
      mainCategory: mainCategory,
      subCategory: subCategory,
      offset: off,
      limit: capped,
    );
  }

  /// Lightweight facet rows (category/engine/year/model) for visual browse.
  static Future<List<Map<String, dynamic>>> fetchVehicleFacetIndex({
    required String make,
    required String model,
    required String year,
  }) async {
    final en = resolveMakeEn(make);
    try {
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$en*)&is_active=eq.true&select=id,category,engine,year,model&order=id.desc&limit=600',
      );
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List)
            .whereType<Map>()
            .map((j) => Map<String, dynamic>.from(j))
            .where((p) {
              final y = (p['year'] ?? '').toString();
              final m = (p['model'] ?? '').toString();
              return _yearMatches(y, year) && _modelLoose(m, model);
            })
            .toList();
      }
    } catch (_) {}
    return const [];
  }

  static Future<List<String>> fetchYearsForMakeLive(String make) async {
    final en = resolveMakeEn(make);
    try {
      final res = await ApiClient().postRpc(
        '/rpc/parts_facet_years',
        data: {'p_make': make, 'p_make_en': en},
      );
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((e) => e.toString()).toList();
      }
    } catch (_) {}

    try {
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$en*)&is_active=eq.true&select=year&limit=600',
      );
      if (res.statusCode == 200 && res.data is List) {
        final years = <String>{};
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
                years.add(y.toString());
              }
            }
          } else if (yStr.isNotEmpty) {
            years.add(yStr);
          }
        }
        final sorted = years.toList()
          ..sort(
            (a, b) => (int.tryParse(b) ?? 0).compareTo(int.tryParse(a) ?? 0),
          );
        return sorted;
      }
    } catch (_) {}
    return const [];
  }

  static Future<PartsSearchResult> _fallbackSearch({
    required String make,
    required String makeEn,
    String? model,
    String? year,
    String? mainCategory,
    String? subCategory,
    required int offset,
    required int limit,
  }) async {
    try {
      final res = await ApiClient().get(
        '/parts?or=(make.ilike.*$make*,make.ilike.*$makeEn*)&is_active=eq.true&select=*&order=id.desc&limit=400',
      );
      if (res.statusCode != 200 || res.data is! List) {
        return PartsSearchResult.empty;
      }
      var rows = (res.data as List)
          .whereType<Map>()
          .map((j) => PartModel.fromJson(Map<String, dynamic>.from(j)))
          .toList();

      final main = (mainCategory ?? '').trim().toLowerCase();
      final sub = (subCategory ?? '').trim().toLowerCase();

      rows = rows.where((p) {
        if (year != null &&
            year.isNotEmpty &&
            !_yearMatches(p.year, year)) {
          return false;
        }
        if (model != null &&
            model.isNotEmpty &&
            !_modelLoose(p.model, model)) {
          return false;
        }
        final cat = p.category ?? '';
        final pMain = (cat.contains('>') ? cat.split('>')[0] : cat)
            .trim()
            .toLowerCase();
        final pSub = (cat.contains('>') ? cat.split('>')[1] : '')
            .trim()
            .toLowerCase();
        if (main.isNotEmpty &&
            !pMain.contains(main) &&
            !cat.toLowerCase().contains(main)) {
          return false;
        }
        if (sub.isNotEmpty &&
            !pSub.contains(sub) &&
            !cat.toLowerCase().contains(sub)) {
          return false;
        }
        return true;
      }).toList();

      final slice = rows.skip(offset).take(limit).toList();
      return PartsSearchResult(
        items: slice,
        total: rows.length,
        offset: offset,
        limit: limit,
        hasMore: offset + limit < rows.length,
      );
    } catch (_) {
      return PartsSearchResult.empty;
    }
  }

  static bool _yearMatches(String partYear, String targetYear) {
    if (partYear.isEmpty || targetYear.isEmpty) return true;
    final yStr = partYear.trim();
    final target = int.tryParse(targetYear);
    if (yStr.contains('-')) {
      final parts = yStr.split('-').map((e) => int.tryParse(e.trim())).toList();
      if (parts.length == 2 &&
          parts[0] != null &&
          parts[1] != null &&
          target != null) {
        final a = parts[0]!;
        final b = parts[1]!;
        return target >= (a < b ? a : b) && target <= (a > b ? a : b);
      }
    }
    return yStr == targetYear.trim() || yStr.contains(targetYear.trim());
  }

  static bool _modelLoose(String partModel, String targetModel) {
    if (partModel.isEmpty || targetModel.isEmpty) return true;
    final a = partModel.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\u0600-\u06ff]+'), '');
    final b = targetModel.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\u0600-\u06ff]+'), '');
    return a.contains(b) ||
        b.contains(a) ||
        partModel.toLowerCase().contains(targetModel.toLowerCase());
  }
}
