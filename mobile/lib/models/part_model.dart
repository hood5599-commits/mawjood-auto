class PartModel {
  final String id;
  final String name;
  final String make;
  final String model;
  final String year;
  final double price;
  final String imageUrl;
  final String? partNumber;
  final String? category;
  final String? engine;
  final int stock;
  final String? warranty;
  final String? description;
  final String? garageId;
  final String? garageName;
  final double garageRating;
  final double? positivePct;
  final int reviewCount;
  final String? partType;
  final String? partCondition;
  int quantity;

  PartModel({
    required this.id,
    required this.name,
    required this.make,
    required this.model,
    required this.year,
    required this.price,
    required this.imageUrl,
    this.partNumber,
    this.category,
    this.engine,
    this.stock = 5,
    this.warranty,
    this.description,
    this.garageId,
    this.garageName,
    this.garageRating = 0,
    this.positivePct,
    this.reviewCount = 0,
    this.partType,
    this.partCondition,
    this.quantity = 1,
  });

  PartModel copyWith({
    String? id,
    String? name,
    String? make,
    String? model,
    String? year,
    double? price,
    String? imageUrl,
    String? partNumber,
    String? category,
    String? engine,
    int? stock,
    String? warranty,
    String? description,
    String? garageId,
    String? garageName,
    double? garageRating,
    double? positivePct,
    int? reviewCount,
    String? partType,
    String? partCondition,
    int? quantity,
  }) {
    return PartModel(
      id: id ?? this.id,
      name: name ?? this.name,
      make: make ?? this.make,
      model: model ?? this.model,
      year: year ?? this.year,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      partNumber: partNumber ?? this.partNumber,
      category: category ?? this.category,
      engine: engine ?? this.engine,
      stock: stock ?? this.stock,
      warranty: warranty ?? this.warranty,
      description: description ?? this.description,
      garageId: garageId ?? this.garageId,
      garageName: garageName ?? this.garageName,
      garageRating: garageRating ?? this.garageRating,
      positivePct: positivePct ?? this.positivePct,
      reviewCount: reviewCount ?? this.reviewCount,
      partType: partType ?? this.partType,
      partCondition: partCondition ?? this.partCondition,
      quantity: quantity ?? this.quantity,
    );
  }

  static double _toDouble(dynamic v, [double fallback = 0]) {
    if (v == null) return fallback;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? fallback;
  }

  factory PartModel.fromJson(Map<String, dynamic> json) {
    return PartModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? json['part_name'] ?? 'قطعة غيار').toString(),
      make: (json['make'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      year: (json['year'] ?? '').toString(),
      price: _toDouble(json['price'] ?? json['part_price']),
      imageUrl: (json['image_url'] ?? json['image'] ?? json['part_image'] ?? '')
          .toString(),
      partNumber:
          json['part_number']?.toString() ??
          json['code']?.toString() ??
          json['sku']?.toString(),
      category: json['category']?.toString(),
      engine: json['engine']?.toString(),
      stock: int.tryParse(json['stock']?.toString() ?? '5') ?? 5,
      warranty: json['warranty']?.toString(),
      description: json['description']?.toString(),
      garageId: json['garage_id']?.toString() ?? json['user_id']?.toString(),
      garageName: json['garage_name']?.toString(),
      garageRating: _toDouble(json['garage_rating'], 0),
      positivePct: json['positive_pct'] == null
          ? null
          : _toDouble(json['positive_pct']),
      reviewCount: int.tryParse(json['review_count']?.toString() ?? '0') ?? 0,
      partType: json['part_type']?.toString(),
      partCondition: json['part_condition']?.toString(),
      quantity: json['quantity'] != null
          ? (json['quantity'] is num
              ? (json['quantity'] as num).toInt()
              : int.tryParse(json['quantity'].toString()) ?? 1)
          : 1,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'make': make,
    'model': model,
    'year': year,
    'price': price,
    'image_url': imageUrl,
    'part_number': partNumber,
    'category': category,
    'engine': engine,
    'stock': stock,
    'warranty': warranty,
    'description': description,
    'garage_id': garageId,
    'garage_name': garageName,
    'garage_rating': garageRating,
    'positive_pct': positivePct,
    'review_count': reviewCount,
    'part_type': partType,
    'part_condition': partCondition,
    'quantity': quantity,
  };
}
