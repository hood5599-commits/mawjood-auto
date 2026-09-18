import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:gal/gal.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../config/theme.dart';
import '../../../models/vehicle_model.dart';
import '../../../screens/customer/cart_screen.dart';
import '../../../services/cart_service.dart';
import '../../../services/platform_settings_service.dart';
import '../../../widgets/custom_toast.dart';
import '../../../widgets/glass_chrome.dart';
import '../models/mechanic_sheet_models.dart';

class MechanicQuotationScreen extends StatefulWidget {
  final String lang;
  final VehicleProfile vehicle;
  final List<MechanicSelectedLine> lines;
  final List<String> unrecognizedLines;

  const MechanicQuotationScreen({
    super.key,
    required this.lang,
    required this.vehicle,
    required this.lines,
    this.unrecognizedLines = const [],
  });

  @override
  State<MechanicQuotationScreen> createState() =>
      _MechanicQuotationScreenState();
}

class _MechanicQuotationScreenState extends State<MechanicQuotationScreen> {
  final _quoteKey = GlobalKey();
  bool _busy = false;

  bool get isAr => widget.lang == 'ar';

  double get _total =>
      widget.lines.fold(0.0, (sum, line) => sum + line.option.price);

  String get _quoteText {
    final v = widget.vehicle;
    final buf = StringBuffer();
    buf.writeln(isAr
        ? 'موجود أوتو - عرض تسعير قطع غيار'
        : 'Mawjood Auto - Parts Quotation');
    buf.writeln(
      '${v.make} ${v.model} ${v.year}${v.vin != null ? ' | VIN: ${v.vin}' : ''}',
    );
    buf.writeln('---------------------------');
    for (final line in widget.lines) {
      buf.writeln(
        '${line.item.name(isAr)} | ${line.option.label(isAr)} | '
        '${line.option.partNumber ?? '-'} | '
        '${line.option.price.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
      );
    }
    buf.writeln('---------------------------');
    buf.writeln(
      '${isAr ? 'الإجمالي' : 'Total'}: ${_total.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
    );
    return buf.toString();
  }

  Future<void> _sendWhatsApp() async {
    final digits = PlatformSettingsService.instance.settings.whatsappDigits;
    final uri = Uri.parse(
      'https://wa.me/$digits?text=${Uri.encodeComponent(_quoteText)}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<ui.Image?> _captureQuote() async {
    final boundary =
        _quoteKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    return boundary.toImage(pixelRatio: 3);
  }

  Future<void> _saveToGallery() async {
    setState(() => _busy = true);
    try {
      final image = await _captureQuote();
      if (image == null) throw Exception('capture_failed');
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) throw Exception('encode_failed');
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/mawjood_quote_${DateTime.now().millisecondsSinceEpoch}.png',
      );
      await file.writeAsBytes(bytes.buffer.asUint8List());
      await Gal.putImage(file.path);
      if (!mounted) return;
      CustomToast.success(
        context,
        isAr ? 'تم حفظ عرض السعر في الاستوديو' : 'Quotation saved to gallery',
      );
    } catch (_) {
      if (!mounted) return;
      // Fallback: system share sheet.
      try {
        await SharePlus.instance.share(
          ShareParams(text: _quoteText, subject: isAr ? 'عرض سعر' : 'Quote'),
        );
      } catch (_) {}
      CustomToast.info(
        context,
        isAr
            ? 'تعذر الحفظ المباشر — استخدم المشاركة'
            : 'Direct save failed — use share sheet',
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addAllToCart() async {
    setState(() => _busy = true);
    try {
      final cart = CartService();
      for (final line in widget.lines) {
        final part = line.toPartModel(widget.vehicle);
        await cart.addToCart(partId: part.id, part: part, quantity: 1);
      }
      if (!mounted) return;
      CustomToast.success(
        context,
        isAr
            ? 'تمت إضافة القطع المعتمدة إلى السلة'
            : 'Approved parts added to cart',
      );
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => CartScreen(lang: widget.lang),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _shareQuoteImage() async {
    try {
      final image = await _captureQuote();
      if (image == null) return;
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) return;
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/mawjood_quote_share.png');
      await file.writeAsBytes(bytes.buffer.asUint8List());
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: _quoteText,
          subject: isAr ? 'عرض سعر موجود أوتو' : 'Mawjood Auto Quotation',
        ),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          leading: const Padding(
            padding: EdgeInsetsDirectional.only(start: 8),
            child: Center(child: GlassBackButton(iconColor: Colors.white)),
          ),
          title: Text(
            isAr ? 'عرض سعر رسمي' : 'Official Quotation',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          actions: [
            IconButton(
              tooltip: isAr ? 'مشاركة' : 'Share',
              onPressed: _shareQuoteImage,
              icon: const Icon(Icons.share_outlined),
            ),
          ],
        ),
        body: ListView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            RepaintBoundary(
              key: _quoteKey,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: AppTheme.softShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      isAr
                          ? 'موجود أوتو - عرض تسعير قطع غيار'
                          : 'Mawjood Auto - Parts Quotation',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppTheme.navy,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '${widget.vehicle.make} ${widget.vehicle.model} (${widget.vehicle.year})',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (widget.vehicle.vin != null &&
                        widget.vehicle.vin!.isNotEmpty)
                      Text(
                        'VIN: ${widget.vehicle.vin}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          color: Color(0xFF64748B),
                          fontSize: 12,
                        ),
                      ),
                    const Divider(height: 24),
                    ...widget.lines.map((line) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    line.item.name(isAr),
                                    style: const TextStyle(
                                      color: AppTheme.navy,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  Text(
                                    '${line.option.label(isAr)} · ${line.option.partNumber ?? '-'}',
                                    style: const TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 11.5,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Text(
                                '${line.option.price.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                                textAlign: TextAlign.end,
                                style: const TextStyle(
                                  color: AppTheme.copper,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const Divider(height: 18),
                    Row(
                      children: [
                        Text(
                          isAr ? 'الإجمالي' : 'Total',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppTheme.navy,
                            fontSize: 15,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${_total.toStringAsFixed(0)} ${isAr ? 'ر.ق' : 'QAR'}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppTheme.navy,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            _actionBtn(
              icon: Icons.chat,
              label: isAr
                  ? 'إرسال للميكانيكي عبر واتساب'
                  : 'Send to mechanic via WhatsApp',
              color: const Color(0xFF16A34A),
              onTap: _busy ? null : _sendWhatsApp,
            ),
            const SizedBox(height: 10),
            _actionBtn(
              icon: Icons.download_outlined,
              label: isAr ? 'حفظ في الاستوديو' : 'Save to gallery',
              color: AppTheme.navy,
              onTap: _busy ? null : _saveToGallery,
            ),
            const SizedBox(height: 10),
            _actionBtn(
              icon: Icons.shopping_cart_outlined,
              label: isAr
                  ? 'إضافة جميع القطع المعتمدة إلى السلة'
                  : 'Add all approved parts to cart',
              color: AppTheme.copper,
              onTap: _busy ? null : _addAllToCart,
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionBtn({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback? onTap,
  }) {
    return TactileScale(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 13.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
