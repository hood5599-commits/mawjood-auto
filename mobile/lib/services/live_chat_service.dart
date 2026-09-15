import 'package:supabase_flutter/supabase_flutter.dart';

import 'api_client.dart';
import 'auth_service.dart';

class ChatConversation {
  final String id;
  final String userId;
  final String status;
  final DateTime? requestedAgentAt;
  final String? assignedAgentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ChatConversation({
    required this.id,
    required this.userId,
    required this.status,
    this.requestedAgentAt,
    this.assignedAgentId,
    this.createdAt,
    this.updatedAt,
  });

  bool get isWaiting => status == 'waiting_agent';
  bool get isAgentActive => status == 'agent_active';
  bool get isClosed => status == 'closed';
  bool get isAiActive => status == 'ai_active' || status == 'closed';

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    return ChatConversation(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ai_active',
      requestedAgentAt: json['requested_agent_at'] != null
          ? DateTime.tryParse(json['requested_agent_at'].toString())
          : null,
      assignedAgentId: json['assigned_agent_id']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }
}

class LiveChatMessage {
  final String id;
  final String conversationId;
  final String senderType; // user | bot | agent
  final String message;
  final DateTime? createdAt;

  const LiveChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderType,
    required this.message,
    this.createdAt,
  });

  factory LiveChatMessage.fromJson(Map<String, dynamic> json) {
    return LiveChatMessage(
      id: json['id']?.toString() ?? '',
      conversationId: json['conversation_id']?.toString() ?? '',
      senderType: json['sender_type']?.toString() ?? 'bot',
      message: json['message']?.toString() ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }
}

/// Persistence + realtime for Abboud / live-agent handoff.
class LiveChatService {
  LiveChatService._();
  static final LiveChatService instance = LiveChatService._();

  RealtimeChannel? _convChannel;
  RealtimeChannel? _msgChannel;

  String? get _userId => AuthService().session?.userId;
  bool get canPersist =>
      AuthService().isLoggedIn && (_userId?.isNotEmpty ?? false);

  ChatConversation? _parseConvResponse(dynamic data) {
    if (data is List && data.isNotEmpty && data.first is Map) {
      return ChatConversation.fromJson(
        Map<String, dynamic>.from(data.first as Map),
      );
    }
    if (data is Map) {
      return ChatConversation.fromJson(Map<String, dynamic>.from(data));
    }
    return null;
  }

  Future<ChatConversation?> getOrCreateOpenConversation() async {
    if (!canPersist) return null;
    final uid = _userId!;

    final existing = await ApiClient().get(
      '/chat_conversations?user_id=eq.$uid&status=in.(ai_active,waiting_agent,agent_active)&order=updated_at.desc&limit=1',
    );
    if (existing.statusCode == 200) {
      final parsed = _parseConvResponse(existing.data);
      if (parsed != null) return parsed;
    }

    final created = await ApiClient().postReturning(
      '/chat_conversations',
      data: {
        'user_id': uid,
        'status': 'ai_active',
      },
    );
    return _parseConvResponse(created.data);
  }

  Future<void> persistMessage({
    required String conversationId,
    required String senderType,
    required String message,
  }) async {
    if (!canPersist) return;
    final text = message.trim();
    if (text.isEmpty) return;
    await ApiClient().post(
      '/chat_messages',
      data: {
        'conversation_id': conversationId,
        'sender_type': senderType,
        'message': text,
      },
    );
  }

  Future<List<LiveChatMessage>> fetchMessages(String conversationId) async {
    final res = await ApiClient().get(
      '/chat_messages?conversation_id=eq.$conversationId&order=created_at.asc&limit=200',
    );
    if (res.statusCode != 200 || res.data is! List) return [];
    return List<dynamic>.from(res.data as List)
        .whereType<Map>()
        .map((m) => LiveChatMessage.fromJson(Map<String, dynamic>.from(m)))
        .toList();
  }

  Future<ChatConversation?> requestHumanAgent(String conversationId) async {
    final res = await ApiClient().patchReturning(
      '/chat_conversations?id=eq.$conversationId',
      data: {
        'status': 'waiting_agent',
        'requested_agent_at': DateTime.now().toUtc().toIso8601String(),
        'assigned_agent_id': null,
      },
    );
    return _parseConvResponse(res.data) ?? fetchConversation(conversationId);
  }

  Future<ChatConversation?> fetchConversation(String id) async {
    final res = await ApiClient().get('/chat_conversations?id=eq.$id&limit=1');
    if (res.statusCode == 200) return _parseConvResponse(res.data);
    return null;
  }

  Future<int?> queuePosition(String conversationId) async {
    try {
      final res = await ApiClient().postReturning(
        '/rpc/chat_queue_position',
        data: {'p_conversation_id': conversationId},
      );
      final v = res.data;
      if (v is int) return v;
      if (v is num) return v.toInt();
      return int.tryParse(v?.toString() ?? '');
    } catch (_) {
      return null;
    }
  }

  void subscribeConversation({
    required String conversationId,
    required void Function(ChatConversation conv) onUpdate,
  }) {
    _convChannel?.unsubscribe();
    try {
      _convChannel = Supabase.instance.client
          .channel('chat_conv_$conversationId')
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'chat_conversations',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'id',
              value: conversationId,
            ),
            callback: (payload) {
              onUpdate(
                ChatConversation.fromJson(
                  Map<String, dynamic>.from(payload.newRecord),
                ),
              );
            },
          )
          .subscribe();
    } catch (_) {}
  }

  void subscribeMessages({
    required String conversationId,
    required void Function(LiveChatMessage msg) onInsert,
  }) {
    _msgChannel?.unsubscribe();
    try {
      _msgChannel = Supabase.instance.client
          .channel('chat_msg_$conversationId')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'chat_messages',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'conversation_id',
              value: conversationId,
            ),
            callback: (payload) {
              onInsert(
                LiveChatMessage.fromJson(
                  Map<String, dynamic>.from(payload.newRecord),
                ),
              );
            },
          )
          .subscribe();
    } catch (_) {}
  }

  void unsubscribeAll() {
    _convChannel?.unsubscribe();
    _msgChannel?.unsubscribe();
    _convChannel = null;
    _msgChannel = null;
  }
}
