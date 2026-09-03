class VehicleModel {
  final String? vin;
  final String make;
  final String model;
  final String year;
  final String? engine;

  const VehicleModel({
    this.vin,
    required this.make,
    required this.model,
    required this.year,
    this.engine,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      vin: json['vin']?.toString(),
      make: (json['make'] ?? '').toString(),
      model: (json['model'] ?? '').toString(),
      year: (json['year'] ?? '').toString(),
      engine: json['engine']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'vin': vin,
    'make': make,
    'model': model,
    'year': year,
    'engine': engine,
  };
}

// لدعم التوافق مع ملفات الفحص والـ VIN
typedef VehicleProfile = VehicleModel;
