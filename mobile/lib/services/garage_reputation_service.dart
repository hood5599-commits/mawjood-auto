import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/part_model.dart';

class GarageReputation {
  final String garageId;
  final double avgRating;
  final double positivePct;
  final int reviewCount;
  final double? avgDeliveryRating;
  final double? avgPlatformRating;

  const GarageReputation({
    required this.garageId,
    required this.avgRating,
    required this.positivePct,
    required this.reviewCount,
    this.avgDeliveryRating,
    this.avgPlatformRating,
  });

  factory GarageReputation.fromJson(Map<String, dynamic> json) {
    double toD(dynamic v, [double fallback = 0]) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? fallback;
    }

    return GarageReputation(
      garageId: (json['garage_id'] ?? '').toString(),
      avgRating: toD(json['avg_rating']),
      positivePct: toD(json['positive_pct']),
      reviewCount: json['review_count'] is int
          ? json['review_count'] as int
          : int.tryParse(json['review_count']?.toString() ?? '0') ?? 0,
      avgDeliveryRating: json['avg_delivery_rating'] == null
          ? null
          : toD(json['avg_delivery_rating']),
      avgPlatformRating: json['avg_platform_rating'] == null
          ? null
          : toD(json['avg_platform_rating']),
    );
  }
}

/// Reads from the existing `garage_reputation` view (aggregates `order_reviews`).
class GarageReputationService {
  GarageReputationService._();
  static final GarageReputationService instance = GarageReputationService._();

  final Map<String, GarageReputation> _cache = {};
  DateTime? _lastFullFetch;
  static const _cacheTtl = Duration(minutes: 5);

  Future<Map<String, GarageReputation>> fetchAll({bool force = false}) async {
    final now = DateTime.now();
    if (!force &&
        _lastFullFetch != null &&
        now.difference(_lastFullFetch!) < _cacheTtl &&
        _cache.isNotEmpty) {
      return Map.unmodifiable(_cache);
    }

    try {
      final rows = await Supabase.instance.client
          .from('garage_reputation')
          .select();

      _cache.clear();
      for (final row in List<dynamic>.from(rows)) {
        if (row is! Map) continue;
        final rep = GarageReputation.fromJson(Map<String, dynamic>.from(row));
        if (rep.garageId.isEmpty) continue;
        _cache[rep.garageId] = rep;
      }
      _lastFullFetch = now;
    } on PostgrestException catch (e) {
      // Keep stale cache on failure.
      assert(() {
        // ignore: avoid_print
        print('[GarageReputation] ${e.message}');
        return true;
      }());
    }

    return Map.unmodifiable(_cache);
  }

  Future<GarageReputation?> getForGarage(String? garageId) async {
    if (garageId == null || garageId.isEmpty) return null;
    final all = await fetchAll();
    return all[garageId];
  }

  /// Applies live avg stars + positive % onto part cards from `garage_reputation`.
  Future<List<PartModel>> enrichParts(List<PartModel> parts) async {
    if (parts.isEmpty) return parts;
    final all = await fetchAll();
    return parts.map((p) {
      final id = p.garageId;
      if (id == null || id.isEmpty) return p;
      final rep = all[id];
      if (rep == null) return p;
      return p.copyWith(
        garageRating: rep.avgRating,
        positivePct: rep.positivePct,
        reviewCount: rep.reviewCount,
      );
    }).toList();
  }
}
