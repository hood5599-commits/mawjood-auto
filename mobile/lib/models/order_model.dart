/// 1. نموذج طلب الشراء والتتبع
class OrderModel {
  final String id;
  final String? orderCode;
  final String customerPhone;
  final String partName;
  final double price;
  final String status;
  final String? deliveryCode;
  final bool isReviewed;
  final int? rating;
  final String? garageId;
  final DateTime? createdAt;

  const OrderModel({
    required this.id,
    this.orderCode,
    required this.customerPhone,
    required this.partName,
    required this.price,
    required this.status,
    this.deliveryCode,
    this.isReviewed = false,
    this.rating,
    this.garageId,
    this.createdAt,
  });

  bool get isDelivered => status == 'delivered' || status == 'completed';
  bool get isCancelled => status == 'cancelled';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id']?.toString() ?? '',
      orderCode: json['order_code']?.toString() ?? '#ORD-${json['id']}',
      customerPhone: json['customer_phone']?.toString() ?? '',
      partName: json['part_name']?.toString() ?? '',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? 'pending',
      deliveryCode: json['delivery_code']?.toString(),
      isReviewed: json['is_reviewed'] == true,
      rating: json['rating'] is int
          ? json['rating'] as int
          : int.tryParse(json['rating']?.toString() ?? ''),
      garageId: json['garage_id']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_code': orderCode,
      'customer_phone': customerPhone,
      'part_name': partName,
      'price': price,
      'status': status,
      if (deliveryCode != null) 'delivery_code': deliveryCode,
      'is_reviewed': isReviewed,
      if (rating != null) 'rating': rating,
      if (garageId != null) 'garage_id': garageId,
    };
  }
}

/// 2. نموذج استفسار التوافق (Fitment Inquiry)
class FitmentInquiryModel {
  final String id;
  final String inquiryCode;
  final String customerPhone;
  final String partName;
  final double partPrice;
  final String status;

  const FitmentInquiryModel({
    required this.id,
    required this.inquiryCode,
    required this.customerPhone,
    required this.partName,
    required this.partPrice,
    required this.status,
  });

  bool get isCompatible => status == 'confirmed_compatible';

  factory FitmentInquiryModel.fromJson(Map<String, dynamic> json) {
    return FitmentInquiryModel(
      id: json['id']?.toString() ?? '',
      inquiryCode: json['inquiry_code']?.toString() ?? 'INQ-${json['id']}',
      customerPhone: json['customer_phone']?.toString() ?? '',
      partName: json['part_name']?.toString() ?? '',
      partPrice: (json['part_price'] is num)
          ? (json['part_price'] as num).toDouble()
          : double.tryParse(json['part_price']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? 'pending',
    );
  }
}

/// 3. نموذج طلب قطعة مخصصة (Custom Part Request)
class CustomPartRequestModel {
  final String id;
  final String make;
  final String model;
  final String year;
  final String notes;
  final String customerPhone;

  const CustomPartRequestModel({
    required this.id,
    required this.make,
    required this.model,
    required this.year,
    required this.notes,
    required this.customerPhone,
  });

  factory CustomPartRequestModel.fromJson(Map<String, dynamic> json) {
    return CustomPartRequestModel(
      id: json['id']?.toString() ?? '',
      make: json['make']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      year: json['year']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
      customerPhone: json['customer_phone']?.toString() ?? '',
    );
  }
}

/// 4. نموذج عرض سعر الكراج (Garage Quote)
class GarageQuoteModel {
  final String id;
  final String requestId;
  final String garageId;
  final String garageName;
  final double price;
  final String partType;

  const GarageQuoteModel({
    required this.id,
    required this.requestId,
    required this.garageId,
    required this.garageName,
    required this.price,
    required this.partType,
  });

  factory GarageQuoteModel.fromJson(Map<String, dynamic> json) {
    return GarageQuoteModel(
      id: json['id']?.toString() ?? '',
      requestId: json['request_id']?.toString() ?? '',
      garageId: json['garage_id']?.toString() ?? '',
      garageName: json['garage_name']?.toString() ?? 'كراج معتمد',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      partType: json['part_type']?.toString() ?? 'قطعة مخصصة',
    );
  }
}
