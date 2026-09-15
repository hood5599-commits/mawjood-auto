class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final String? userId;
  final Map<String, dynamic> data;
  final bool isRead;
  final DateTime? createdAt;
  final String? target;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'system_alert',
    this.userId,
    this.data = const {},
    this.isRead = false,
    this.createdAt,
    this.target,
  });

  String? get orderId =>
      data['order_id']?.toString() ?? data['orderId']?.toString();

  String? get partId =>
      data['part_id']?.toString() ?? data['partId']?.toString();

  bool get isBroadcast => userId == null || userId!.isEmpty;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> data = {};
    final rawData = json['data'] ?? json['metadata'];
    if (rawData is Map) {
      data = Map<String, dynamic>.from(rawData);
    } else if (rawData is String && rawData.isNotEmpty) {
      try {
        final decoded = rawData;
        // leave empty if not a map JSON — handled elsewhere
        if (decoded.startsWith('{')) {
          // ignore — ApiClient already parses JSON objects
        }
      } catch (_) {}
    }

    return AppNotification(
      id: json['id']?.toString() ?? '',
      title: (json['title'] ?? '').toString(),
      body: (json['body'] ?? json['message'] ?? '').toString(),
      type: (json['type'] ?? 'system_alert').toString(),
      userId: json['user_id']?.toString(),
      data: data,
      isRead: json['is_read'] == true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      target: (json['target'] ?? json['target_user'])?.toString(),
    );
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      userId: userId,
      data: data,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      target: target,
    );
  }
}
