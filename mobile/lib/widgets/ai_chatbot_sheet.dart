import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../services/ai_chat_service.dart';

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

  /// دالة لفتح المساعد كـ Modal Bottom Sheet مباشرة
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
        heightFactor: 0.85,
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

  bool _isTyping = false;

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

  @override
  void initState() {
    super.initState();
    _messages.add(AiChatService.getWelcomeMessage(isAr: isAr));
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSendMessage([String? predefinedText]) {
    final query = (predefinedText ?? _inputController.text).trim();
    if (query.isEmpty) return;

    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      isUser: true,
      text: query,
      timestamp: timeStr,
    );

    setState(() {
      _messages.add(userMsg);
      if (predefinedText == null) _inputController.clear();
      _isTyping = true;
    });
    _scrollToBottom();

    // محاكاة استجابة المستشار الذكي عبود
    Future.delayed(const Duration(milliseconds: 550), () {
      if (!mounted) return;
      final responseMsg = AiChatService.processQuery(query, isAr: isAr);

      setState(() {
        _messages.add(responseMsg);
        _isTyping = false;
      });

      if (responseMsg.appliedFilter != null) {
        widget.onApplyFilters?.call(responseMsg.appliedFilter!);
      }

      _scrollToBottom();
    });
  }

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add(
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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.65),
              blurRadius: 30,
              offset: const Offset(0, -10),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // 1️⃣ رأس المحادثة
            _buildHeader(),

            // 2️⃣ قائمة رسائل الدردشة
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

            // مؤشر جاري الكتابة
            if (_isTyping) _buildTypingIndicator(),

            // 3️⃣ شرائح الأسئلة المقترحة السريعة
            _buildQuickSuggestions(),

            // 4️⃣ شريط إدخال الرسالة والإرسال
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
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
              boxShadow: [
                BoxShadow(
                  color: AppTheme.copper.withValues(alpha: 0.45),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.smart_toy_outlined,
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
                  isAr ? 'عبود · المستشار الذكي' : 'Abboud · Smart Advisor',
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
                      decoration: const BoxDecoration(
                        color: Color(0xFF4ADE80),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isAr
                          ? 'قطع جديدة 100% · فحص فوري'
                          : '100% Brand-New · Online',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF4ADE80),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
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

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 26,
              height: 26,
              decoration: const BoxDecoration(
                color: Color(0xFFEA580C),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.smart_toy_outlined,
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
                    ? const Color(0xFFEA580C)
                    : const Color(0xFF1E293B).withValues(alpha: 0.85),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(
                    isUser ? (isAr ? 4 : 16) : (isAr ? 16 : 4),
                  ),
                  bottomRight: Radius.circular(
                    isUser ? (isAr ? 16 : 4) : (isAr ? 4 : 16),
                  ),
                ),
                border: isUser
                    ? null
                    : Border.all(color: Colors.white.withValues(alpha: 0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                        border: Border.all(
                          color: const Color(0xFF4ADE80).withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.filter_alt_outlined,
                            color: Color(0xFF86EFAC),
                            size: 13,
                          ),
                          const SizedBox(width: 5),
                          Flexible(
                            child: Text(
                              msg.appliedFilter!.summary,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF86EFAC),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Align(
                    alignment: isUser
                        ? Alignment.centerLeft
                        : Alignment.centerRight,
                    child: Text(
                      msg.timestamp,
                      style: TextStyle(
                        fontSize: 9.5,
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
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
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
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
        ],
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
    return Container(
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        top: 10,
        bottom: MediaQuery.of(context).viewInsets.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF090D16),
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
                hintText: isAr
                    ? 'اسألني عن قطعة، سيارة، أو عطل ميكانيكي...'
                    : 'Ask about a part, car, or mechanical issue...',
                hintStyle: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.4),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFEA580C), Color(0xFFF97316)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white, size: 18),
              onPressed: () => _handleSendMessage(),
            ),
          ),
        ],
      ),
    );
  }
}
