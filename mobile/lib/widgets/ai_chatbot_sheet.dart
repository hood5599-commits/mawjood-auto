import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../services/ai_chat_service.dart';
import '../services/auth_gate.dart';
import '../services/auth_service.dart';
import '../services/live_chat_service.dart';

class AiChatbotSheet extends StatefulWidget {
  final String lang;
  final ValueChanged<ChatFilterData>? onApplyFilters;
  final VoidCallback? onCloseFilters;

  const AiChatbotSheet({
    super.key,
    this.lang = 'ar',
    this.onApplyFilters,
    this.onCloseFilters,
  });

  static Future<void> showModal(
    BuildContext context, {
    String lang = 'ar',
    ValueChanged<ChatFilterData>? onApplyFilters,
    VoidCallback? onCloseFilters,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.88,
        child: AiChatbotSheet(
          lang: lang,
          onApplyFilters: onApplyFilters,
          onCloseFilters: onCloseFilters,
        ),
      ),
    );
  }

  @override
  State<AiChatbotSheet> createState() => _AiChatbotSheetState();
}

class _AiChatbotSheetState extends State<AiChatbotSheet> {
  bool get isAr => widget.lang == 'ar';

  final List<ChatMessage> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  final _live = LiveChatService.instance;

  bool _isTyping = false;
  bool _booting = true;
  String? _conversationId;
  String _status = 'ai_active';
  int? _queuePosition;
  Timer? _queueTimer;
  bool _agentJoinedAnnounced = false;

  List<String> get _quickSuggestions => isAr
      ? [
          'سفايف لكزس',
          'حرارة الموتر',
          'تقطيع بالمكينة',
          'مدة التوصيل',
          'ضمان القطع',
        ]
      : [
          'Lexus Brake Pads',
          'Engine Overheating',
          'Engine Misfire',
          'Delivery Time',
          'Warranty',
        ];

  bool get _isWaiting => _status == 'waiting_agent';
  bool get _isAgent => _status == 'agent_active';
  bool get _canTypeAiOrAgent =>
      _status == 'ai_active' || _status == 'agent_active' || _status == 'closed';

  @override
  void initState() {
    super.initState();
    _messages.add(AiChatService.getWelcomeMessage(isAr: isAr));
    _bootstrap();
  }

  @override
  void dispose() {
    _queueTimer?.cancel();
    _live.unsubscribeAll();
    _inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      if (AuthService().isLoggedIn) {
        final conv = await _live.getOrCreateOpenConversation();
        if (conv != null && mounted) {
          _conversationId = conv.id;
          _status = conv.status;
          await _hydrateFromServer(conv);
          _attachRealtime(conv.id);
          if (conv.isWaiting) {
            await _refreshQueuePosition();
            _startQueuePolling();
          }
        }
      }
    } catch (_) {
      // Local AI still works offline / without session.
    } finally {
      if (mounted) setState(() => _booting = false);
    }
  }

  Future<void> _hydrateFromServer(ChatConversation conv) async {
    final rows = await _live.fetchMessages(conv.id);
    if (!mounted || rows.isEmpty) return;
    final mapped = rows.map(_fromLive).toList();
    setState(() {
      _messages
        ..clear()
        ..addAll(mapped);
      if (_messages.isEmpty) {
        _messages.add(AiChatService.getWelcomeMessage(isAr: isAr));
      }
    });
    _scrollToBottom();
  }

  ChatMessage _fromLive(LiveChatMessage m) {
    final dt = m.createdAt?.toLocal() ?? DateTime.now();
    final time =
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    return ChatMessage(
      id: m.id,
      isUser: m.senderType == 'user',
      text: m.message,
      timestamp: time,
      senderType: m.senderType,
    );
  }

  void _attachRealtime(String conversationId) {
    _live.subscribeConversation(
      conversationId: conversationId,
      onUpdate: (conv) {
        if (!mounted) return;
        final prev = _status;
        setState(() => _status = conv.status);
        if (conv.isWaiting) {
          _refreshQueuePosition();
          _startQueuePolling();
        } else {
          _queueTimer?.cancel();
          _queuePosition = null;
        }
        if (conv.isAgentActive && prev != 'agent_active' && !_agentJoinedAnnounced) {
          _agentJoinedAnnounced = true;
          _appendSystem(
            isAr
                ? 'انضم الموظف للمحادثة. يمكنك الكتابة الآن.'
                : 'Agent joined the chat. You can write now.',
          );
        }
        if (conv.isClosed && prev != 'closed') {
          _queueTimer?.cancel();
          _live.unsubscribeAll();
          _appendSystem(
            isAr
                ? 'تم إنهاء المحادثة مع الموظف. يمكنك متابعة السؤال مع عبود.'
                : 'Live chat closed. You can continue with Abboud.',
          );
          setState(() {
            _status = 'ai_active';
            _conversationId = null;
            _queuePosition = null;
            _agentJoinedAnnounced = false;
          });
        }
      },
    );
    _live.subscribeMessages(
      conversationId: conversationId,
      onInsert: (msg) {
        if (!mounted) return;
        if (_messages.any((m) => m.id == msg.id)) return;
        // Skip echo of our own optimistic user messages if same text just added
        setState(() => _messages.add(_fromLive(msg)));
        _scrollToBottom();
      },
    );
  }

  void _startQueuePolling() {
    _queueTimer?.cancel();
    _queueTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _refreshQueuePosition();
    });
  }

  Future<void> _refreshQueuePosition() async {
    final id = _conversationId;
    if (id == null) return;
    final pos = await _live.queuePosition(id);
    if (!mounted) return;
    setState(() => _queuePosition = pos);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _appendSystem(String text) {
    final now = DateTime.now();
    setState(() {
      _messages.add(
        ChatMessage(
          id: 'sys_${now.millisecondsSinceEpoch}',
          isUser: false,
          text: text,
          timestamp:
              '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
          senderType: 'system',
        ),
      );
    });
    _scrollToBottom();
  }

  Future<void> _ensureConversation() async {
    if (_conversationId != null) return;
    if (!AuthService().isLoggedIn) return;
    final conv = await _live.getOrCreateOpenConversation();
    if (conv == null) return;
    _conversationId = conv.id;
    _status = conv.status;
    _attachRealtime(conv.id);
  }

  Future<void> _handleSendMessage([String? predefinedText]) async {
    final query = (predefinedText ?? _inputController.text).trim();
    if (query.isEmpty) return;
    if (_isWaiting) return;

    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    final localId = 'local_${now.millisecondsSinceEpoch}';

    final userMsg = ChatMessage(
      id: localId,
      isUser: true,
      text: query,
      timestamp: timeStr,
      senderType: 'user',
    );

    setState(() {
      _messages.add(userMsg);
      if (predefinedText == null) _inputController.clear();
      if (!_isAgent) _isTyping = true;
    });
    _scrollToBottom();

    await _ensureConversation();
    final cid = _conversationId;
    if (cid != null) {
      await _live.persistMessage(
        conversationId: cid,
        senderType: 'user',
        message: query,
      );
    }

    if (_isAgent) {
      setState(() => _isTyping = false);
      return;
    }

    // Abboud AI reply
    await Future.delayed(const Duration(milliseconds: 550));
    if (!mounted) return;
    final responseMsg = AiChatService.processQuery(query, isAr: isAr);
    setState(() {
      _messages.add(responseMsg);
      _isTyping = false;
    });
    if (cid != null) {
      await _live.persistMessage(
        conversationId: cid,
        senderType: 'bot',
        message: responseMsg.text,
      );
    }
    if (responseMsg.appliedFilter != null) {
      widget.onApplyFilters?.call(responseMsg.appliedFilter!);
    }
    _scrollToBottom();
  }

  Future<void> _requestHumanAgent() async {
    final ok = await AuthGate.requireLogin(
      context,
      lang: widget.lang,
      message: isAr
          ? 'يلزم تسجيل الدخول لطلب التحدث مع موظف الدعم'
          : 'Please sign in to talk to a live support agent',
    );
    if (!ok) return;

    setState(() => _booting = true);
    try {
      await _ensureConversation();
      var cid = _conversationId;
      if (cid == null) {
        final conv = await _live.getOrCreateOpenConversation();
        cid = conv?.id;
        _conversationId = cid;
        if (cid != null) _attachRealtime(cid);
      }
      if (cid == null) throw Exception('no_conversation');

      await _live.persistMessage(
        conversationId: cid,
        senderType: 'bot',
        message: isAr
            ? 'تم تحويل طلبك لموظف الدعم. يرجى الانتظار...'
            : 'Connecting you to a support agent. Please wait...',
      );

      final updated = await _live.requestHumanAgent(cid);
      if (!mounted) return;
      setState(() {
        _status = updated?.status ?? 'waiting_agent';
        _agentJoinedAnnounced = false;
      });
      _appendSystem(
        isAr
            ? 'طلبك في قائمة الانتظار. سنوصلك بأول موظف متاح.'
            : 'You are in the waiting queue. Connecting you to the next agent.',
      );
      await _refreshQueuePosition();
      _startQueuePolling();
    } catch (_) {
      if (!mounted) return;
      _appendSystem(
        isAr
            ? 'تعذر طلب موظف حالياً. حاول مرة أخرى.'
            : 'Could not request an agent. Please try again.',
      );
    } finally {
      if (mounted) setState(() => _booting = false);
    }
  }

  void _clearChat() {
    if (_isWaiting || _isAgent) return;
    setState(() {
      _messages
        ..clear()
        ..add(
          ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            isUser: false,
            text: isAr
                ? 'تم مسح المحادثة. كيف أقدر أساعدك الآن في سيارتك؟'
                : 'Chat cleared. How can I assist you with your car today?',
            timestamp:
                '${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
          ),
        );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF090D16).withValues(alpha: 0.96),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.12),
            width: 1.5,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            _buildHeader(),
            if (_booting)
              const LinearProgressIndicator(
                minHeight: 2,
                color: AppTheme.copper,
                backgroundColor: Color(0xFF1E293B),
              ),
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                itemCount: _messages.length,
                itemBuilder: (context, idx) =>
                    _buildMessageBubble(_messages[idx]),
              ),
            ),
            if (_isTyping) _buildTypingIndicator(),
            if (_canTypeAiOrAgent && !_isAgent) _buildQuickSuggestions(),
            if (!_isWaiting) _buildTalkToAgentButton(),
            if (_isWaiting) _buildQueueCard() else _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final statusLabel = _isWaiting
        ? (isAr ? 'بانتظار موظف' : 'Waiting for agent')
        : _isAgent
            ? (isAr ? 'محادثة مباشرة' : 'Live agent')
            : (isAr ? 'قطع جديدة 100% · فحص فوري' : '100% Brand-New · Online');
    final statusColor = _isWaiting
        ? const Color(0xFFFBBF24)
        : _isAgent
            ? const Color(0xFF38BDF8)
            : const Color(0xFF4ADE80);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.8),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEA580C), Color(0xFFF97316)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(
                _isAgent ? Icons.support_agent : Icons.smart_toy_outlined,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isAgent
                      ? (isAr ? 'دعم موجود أوتو' : 'Mawjood Live Support')
                      : (isAr ? 'عبود · المستشار الذكي' : 'Abboud · Smart Advisor'),
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFF8FAFC),
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          fontSize: 11,
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (!_isWaiting && !_isAgent)
            IconButton(
              icon: const Icon(
                Icons.delete_outline,
                size: 18,
                color: Colors.white60,
              ),
              tooltip: isAr ? 'مسح المحادثة' : 'Clear Chat',
              onPressed: _clearChat,
            ),
          IconButton(
            icon: const Icon(Icons.close, size: 20, color: Colors.white70),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildTalkToAgentButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: _booting ? null : _requestHumanAgent,
          icon: const Icon(Icons.support_agent, size: 18),
          label: Text(
            isAr ? 'طلب التحدث مع موظف' : 'Talk to Human Agent',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          ),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF38BDF8),
            side: const BorderSide(color: Color(0xFF38BDF8)),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQueueCard() {
    final pos = _queuePosition;
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(
        left: 14,
        right: 14,
        top: 4,
        bottom: MediaQuery.of(context).viewInsets.bottom + 14,
      ),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.navySoft,
            AppTheme.navy.withValues(alpha: 0.95),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFFFBBF24).withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFBBF24).withValues(alpha: 0.18),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFFBBF24).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.hourglass_top_rounded,
              color: Color(0xFFFBBF24),
              size: 26,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            isAr
                ? 'أنت في قائمة الانتظار'
                : 'You are in the waiting queue',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            pos == null
                ? (isAr ? 'جاري حساب دورك...' : 'Calculating your position...')
                : (isAr
                    ? 'دورك رقم #$pos حالياً'
                    : 'Your queue position: #$pos'),
            style: const TextStyle(
              color: Color(0xFFFBBF24),
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            isAr
                ? 'سيتم فتح المحادثة تلقائياً عند انضمام الموظف'
                : 'Chat unlocks automatically when an agent joins',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    final isAgent = msg.senderType == 'agent';
    final isSystem = msg.senderType == 'system';

    if (isSystem) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Text(
              msg.text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11.5,
                color: Color(0xFF94A3B8),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: isAgent
                    ? const Color(0xFF0284C7)
                    : const Color(0xFFEA580C),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  isAgent ? Icons.support_agent : Icons.smart_toy_outlined,
                  color: Colors.white,
                  size: 14,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isUser
                    ? AppTheme.copper
                    : isAgent
                        ? const Color(0xFF0C4A6E)
                        : AppTheme.navySoft.withValues(alpha: 0.92),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(
                    isUser ? (isAr ? 4 : 18) : (isAr ? 18 : 4),
                  ),
                  bottomRight: Radius.circular(
                    isUser ? (isAr ? 18 : 4) : (isAr ? 4 : 18),
                  ),
                ),
                border: isUser
                    ? null
                    : Border.all(
                        color: isAgent
                            ? const Color(0xFF38BDF8).withValues(alpha: 0.35)
                            : Colors.white.withValues(alpha: 0.10),
                      ),
                boxShadow: isUser
                    ? [
                        BoxShadow(
                          color: AppTheme.copper.withValues(alpha: 0.28),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isAgent)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        isAr ? 'الموظف' : 'Agent',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF7DD3FC),
                        ),
                      ),
                    ),
                  Text(
                    msg.text,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFFF8FAFC),
                      height: 1.5,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  if (msg.appliedFilter != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        msg.appliedFilter!.summary,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF86EFAC),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    msg.timestamp,
                    style: TextStyle(
                      fontSize: 9.5,
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B).withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            3,
            (index) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 5,
              height: 5,
              decoration: const BoxDecoration(
                color: Color(0xFFEA580C),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickSuggestions() {
    return Container(
      height: 40,
      margin: const EdgeInsets.only(bottom: 6),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: _quickSuggestions.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, idx) {
          final tag = _quickSuggestions[idx];
          return InkWell(
            onTap: () => _handleSendMessage(tag),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
              ),
              child: Center(
                child: Text(
                  tag,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFCBD5E1),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputBar() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: EdgeInsets.only(
            left: 14,
            right: 14,
            top: 10,
            bottom: MediaQuery.of(context).viewInsets.bottom + 12,
          ),
          decoration: BoxDecoration(
            color: const Color(0xCC050C16),
            border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _inputController,
                  focusNode: _focusNode,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _handleSendMessage(),
                  style: const TextStyle(fontSize: 13, color: Colors.white),
                  decoration: InputDecoration(
                    hintText: _isAgent
                        ? (isAr
                            ? 'اكتب رسالتك للموظف...'
                            : 'Message the agent...')
                        : (isAr
                            ? 'اسألني عن قطعة، سيارة، أو عطل ميكانيكي...'
                            : 'Ask about a part, car, or mechanical issue...'),
                    hintStyle: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.07),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: AppTheme.copper),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.copperDeep, AppTheme.copperLight],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.copper.withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: IconButton(
                  icon: const Icon(Icons.send, color: Colors.white, size: 18),
                  onPressed: () => _handleSendMessage(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
