import 'package:flutter/material.dart';

import '../services/ai_translator_service.dart';

class AiTranslatedText extends StatefulWidget {
  final String text;
  final String lang;
  final TextStyle? style;
  final TextOverflow? overflow;
  final int? maxLines;
  final TextAlign? textAlign;

  const AiTranslatedText({
    super.key,
    required this.text,
    this.lang = 'ar',
    this.style,
    this.overflow,
    this.maxLines,
    this.textAlign,
  });

  @override
  State<AiTranslatedText> createState() => _AiTranslatedTextState();
}

class _AiTranslatedTextState extends State<AiTranslatedText> {
  late String _displayText;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _displayText = widget.text;
    _translateIfNeeded();
  }

  @override
  void didUpdateWidget(covariant AiTranslatedText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text || oldWidget.lang != widget.lang) {
      _translateIfNeeded();
    }
  }

  Future<void> _translateIfNeeded() async {
    if (widget.lang == 'en' && AiTranslatorService.hasArabic(widget.text)) {
      if (mounted) setState(() => _isLoading = true);
      final translated = await AiTranslatorService.translateWithAi(
        widget.text,
        targetLang: 'en',
      );
      if (mounted) {
        setState(() {
          _displayText = translated;
          _isLoading = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          _displayText = widget.text;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Opacity(
        opacity: 0.6,
        child: Text(
          '...',
          style: (widget.style ?? const TextStyle()).copyWith(
            fontStyle: FontStyle.italic,
          ),
        ),
      );
    }

    return Text(
      _displayText,
      style: widget.style,
      overflow: widget.overflow,
      maxLines: widget.maxLines,
      textAlign: widget.textAlign,
    );
  }
}
