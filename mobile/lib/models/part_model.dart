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
    this.garageRating = 4.9,
    this.partType,
    this.partCondition,
    this.quantity = 1,
  });

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
      garageRating: _toDouble(json['garage_rating'], 4.9),
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
    'part_type': partType,
    'part_condition': partCondition,
    'quantity': quantity,
  };
}
