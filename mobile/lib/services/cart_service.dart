import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/part_model.dart';

class CartService extends ChangeNotifier {
  static final CartService _instance = CartService._internal();
  factory CartService() => _instance;
  CartService._internal() {
    loadCart();
  }

  final Map<String, PartModel> _items = {};

  List<PartModel> get items => _items.values.toList();
  int get totalCount =>
      _items.values.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => _items.values.fold(
    0.0,
    (sum, item) => sum + (item.price * item.quantity),
  );

  Future<void> loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedJson = prefs.getString('mawjood_mobile_cart');
      if (savedJson != null) {
        final List decoded = jsonDecode(savedJson);
        _items.clear();
        for (final item in decoded) {
          final part = PartModel.fromJson(item);
          _items[part.id] = part;
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = _items.values.map((p) => p.toJson()).toList();
      await prefs.setString('mawjood_mobile_cart', jsonEncode(list));
    } catch (_) {}
  }

  Future<void> addToCart({
    required String partId,
    required PartModel part,
    int quantity = 1,
  }) async {
    if (_items.containsKey(partId)) {
      _items[partId]!.quantity += quantity;
    } else {
      part.quantity = quantity;
      _items[partId] = part;
    }
    notifyListeners();
    await saveCart();
  }

  Future<void> updateQuantity(String partId, int newQuantity) async {
    if (!_items.containsKey(partId)) return;
    if (newQuantity <= 0) {
      _items.remove(partId);
    } else {
      _items[partId]!.quantity = newQuantity;
    }
    notifyListeners();
    await saveCart();
  }

  Future<void> removeFromCart(String partId) async {
    _items.remove(partId);
    notifyListeners();
    await saveCart();
  }

  Future<void> clearCart() async {
    _items.clear();
    notifyListeners();
    await saveCart();
  }
}
