import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../../config/theme.dart';
import '../../../models/vehicle_model.dart';
import '../../../widgets/glass_chrome.dart';
import '../models/mechanic_sheet_models.dart';
import '../services/mechanic_sheet_parser.dart';
import 'mechanic_wizard_screen.dart';

class MechanicAnalysisScreen extends StatefulWidget {
  final String lang;
  final Uint8List imageBytes;
  final String mimeType;
  final VehicleProfile vehicle;

  const MechanicAnalysisScreen({
    super.key,
    required this.lang,
    required this.imageBytes,
    required this.vehicle,
    this.mimeType = 'image/jpeg',
  });

  @override
  State<MechanicAnalysisScreen> createState() => _MechanicAnalysisScreenState();
}

class _MechanicAnalysisScreenState extends State<MechanicAnalysisScreen> {
  bool get isAr => widget.lang == 'ar';

  bool _loading = true;
  String? _error;
  MechanicParseResult? _result;

  @override
  void initState() {
    super.initState();
    _run();
  }

  Future<void> _run() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await MechanicSheetParser.instance.parseSheet(
        imageBytes: widget.imageBytes,
        mimeType: widget.mimeType,
        vehicleMake: widget.vehicle.make,
        vehicleModel: widget.vehicle.model,
        vehicleYear: widget.vehicle.year,
      );
      if (!mounted) return;
      setState(() {
        _result = result;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _continue() {
    final result = _result;
    if (result == null || result.recognized.isEmpty) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, _, _) => MechanicWizardScreen(
          lang: widget.lang,
          vehicle: widget.vehicle,
          items: result.recognized,
          unrecognizedLines: result.unrecognizedLines,
        ),
        transitionsBuilder: (_, anim, _, child) =>
            SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
              child: child,
            ),
      ),
    );
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
            isAr ? 'تحليل ورقة الميكانيكي' : 'Mechanic Sheet Analysis',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
          ),
        ),
        body: _loading
            ? _loader()
            : _error != null
                ? _errorView()
                : _results(),
      ),
    );
  }

  Widget _loader() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppTheme.copper.withValues(alpha: 0.25),
                    AppTheme.navy.withValues(alpha: 0.8),
                  ],
                ),
                border: Border.all(color: AppTheme.copper.withValues(alpha: 0.5)),
              ),
              child: const Padding(
                padding: EdgeInsets.all(22),
                child: CircularProgressIndicator(
                  color: AppTheme.copper,
                  strokeWidth: 3,
                ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              isAr
                  ? 'جاري قراءة الورقة ومطابقة القطع المتوفرة في المخزون...'
                  : 'Reading sheet & matching live inventory...',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 15,
                color: AppTheme.textOf(context),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.vehicle.make} ${widget.vehicle.model} ${widget.vehicle.year}',
              style: TextStyle(
                color: AppTheme.mutedOf(context),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorView() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.danger, size: 42),
          const SizedBox(height: 12),
          Text(isAr ? 'تعذر تحليل الورقة' : 'Could not analyze sheet'),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Text(
              _error ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.mutedOf(context),
                fontSize: 11,
              ),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _run,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.copper),
            child: Text(isAr ? 'إعادة المحاولة' : 'Retry'),
          ),
        ],
      ),
    );
  }

  Widget _results() {
    final result = _result!;
    final availableCount =
        result.recognized.where((r) => r.hasAnyAvailable).length;
    return ListView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Text(
          isAr
              ? 'تم استخراج ${result.recognized.length} بند — متوفر: $availableCount'
              : '${result.recognized.length} lines extracted — available: $availableCount',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: AppTheme.textOf(context),
          ),
        ),
        const SizedBox(height: 12),
        ...result.recognized.map((item) {
          final ok = item.hasAnyAvailable;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: AppTheme.cardDecoration(context, radius: 14),
            child: Row(
              children: [
                Icon(
                  ok ? Icons.check_circle : Icons.cancel,
                  color: ok ? AppTheme.success : AppTheme.danger,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name(isAr),
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textOf(context),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        ok
                            ? (isAr ? 'متوفرة في المخزون' : 'In stock')
                            : (isAr ? 'غير متوفرة' : 'Unavailable'),
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: ok ? AppTheme.success : AppTheme.danger,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
        if (result.exclusions.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.navy.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.navy.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr ? 'مستثناة من الورقة (بدون):' : 'Excluded from sheet:',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textOf(context),
                  ),
                ),
                const SizedBox(height: 6),
                ...result.exclusions.map(
                  (e) => Text('• $e',
                      style: TextStyle(color: AppTheme.mutedOf(context))),
                ),
              ],
            ),
          ),
        ],
        if (result.unrecognizedLines.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.warning.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppTheme.warning.withValues(alpha: 0.45),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr
                      ? '⚠️ ملاحظات / بنود تحتاج مراجعة:'
                      : '⚠️ Notes / items needing review:',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.warning,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
                ...result.unrecognizedLines.map(
                  (line) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      '• $line',
                      style: TextStyle(
                        color: AppTheme.textOf(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
        TactileScale(
          onTap: result.recognized.isEmpty ? null : _continue,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 15),
            decoration: BoxDecoration(
              color: result.recognized.isEmpty ? Colors.grey : AppTheme.copper,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Text(
              isAr ? 'متابعة اختيار القطع' : 'Continue part selection',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 15,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
