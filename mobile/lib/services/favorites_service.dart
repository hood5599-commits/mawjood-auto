import 'package:flutter/foundation.dart';

import '../models/part_model.dart';
import 'api_client.dart';
import 'auth_service.dart';
import 'garage_reputation_service.dart';

/// Optimistic favorites state synced to `public.favorites`.
class FavoritesService extends ChangeNotifier {
  FavoritesService._();
  static final FavoritesService instance = FavoritesService._();

  final Set<String> _favoritePartIds = {};
  bool _loaded = false;
  bool _loading = false;
  String? _loadedForUserId;

  bool get isLoaded => _loaded;
  bool get isLoading => _loading;
  int get count => _favoritePartIds.length;
  Set<String> get favoritePartIds => Set.unmodifiable(_favoritePartIds);

  bool isFavorite(String partId) => _favoritePartIds.contains(partId);

  String? get _userId => AuthService().session?.userId;
  bool get _canSync =>
      AuthService().isLoggedIn && (_userId?.isNotEmpty ?? false);

  Future<void> loadFavorites({bool force = false}) async {
    if (!_canSync) {
      _favoritePartIds.clear();
      _loaded = true;
      _loadedForUserId = null;
      notifyListeners();
      return;
    }
    if (_loading) return;
    final uid = _userId!;
    if (_loaded && !force && _loadedForUserId == uid) return;

    _loading = true;
    try {
      final res = await ApiClient().get(
        '/favorites?select=part_id&user_id=eq.$uid',
      );
      _favoritePartIds.clear();
      if (res.statusCode == 200 && res.data is List) {
        for (final row in List<dynamic>.from(res.data as List)) {
          if (row is! Map) continue;
          final id = row['part_id']?.toString();
          if (id != null && id.isNotEmpty) _favoritePartIds.add(id);
        }
      }
      _loaded = true;
      _loadedForUserId = uid;
    } catch (_) {
      // Keep prior optimistic set on network failure.
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Instant UI toggle; persists to Supabase in the background.
  Future<bool> toggle(String partId) async {
    if (!_canSync) return false;

    final wasFavorite = _favoritePartIds.contains(partId);
    if (wasFavorite) {
      _favoritePartIds.remove(partId);
    } else {
      _favoritePartIds.add(partId);
    }
    notifyListeners();

    try {
      if (wasFavorite) {
        await _deleteRemote(partId);
      } else {
        await _insertRemote(partId);
      }
      return true;
    } catch (_) {
      if (wasFavorite) {
        _favoritePartIds.add(partId);
      } else {
        _favoritePartIds.remove(partId);
      }
      notifyListeners();
      return false;
    }
  }

  Future<bool> remove(String partId) async {
    if (!_canSync) return false;
    if (!_favoritePartIds.contains(partId)) return true;

    _favoritePartIds.remove(partId);
    notifyListeners();

    try {
      await _deleteRemote(partId);
      return true;
    } catch (_) {
      _favoritePartIds.add(partId);
      notifyListeners();
      return false;
    }
  }

  Future<void> _insertRemote(String partId) async {
    final uid = _userId!;
    final partIdNum = int.tryParse(partId);
    final res = await ApiClient().post(
      '/favorites',
      data: {
        'user_id': uid,
        'part_id': partIdNum ?? partId,
      },
    );
    if (res.statusCode != null &&
        res.statusCode! >= 200 &&
        res.statusCode! < 300) {
      return;
    }
    if (res.statusCode == 409) return;
    throw Exception('favorites_insert_failed:${res.statusCode}');
  }

  Future<void> _deleteRemote(String partId) async {
    final uid = _userId!;
    final res = await ApiClient().delete(
      '/favorites?user_id=eq.$uid&part_id=eq.$partId',
    );
    if (res.statusCode != null &&
        (res.statusCode! == 200 ||
            res.statusCode! == 204 ||
            res.statusCode! == 404)) {
      return;
    }
    if (res.statusCode != null &&
        res.statusCode! >= 200 &&
        res.statusCode! < 300) {
      return;
    }
    throw Exception('favorites_delete_failed:${res.statusCode}');
  }

  /// Fetches favorited parts joined with `parts` + reputation badges.
  Future<List<PartModel>> fetchFavoriteParts() async {
    if (!_canSync) return [];
    final uid = _userId!;
    final res = await ApiClient().get(
      '/favorites?select=part_id,created_at,parts(*)&user_id=eq.$uid&order=created_at.desc',
    );
    if (res.statusCode != 200 || res.data is! List) return [];

    final parts = <PartModel>[];
    for (final row in List<dynamic>.from(res.data as List)) {
      if (row is! Map) continue;
      final partJson = row['parts'];
      if (partJson is! Map) continue;
      parts.add(PartModel.fromJson(Map<String, dynamic>.from(partJson)));
    }
    return GarageReputationService.instance.enrichParts(parts);
  }

  void clearLocal() {
    _favoritePartIds.clear();
    _loaded = false;
    _loadedForUserId = null;
    notifyListeners();
  }
}
