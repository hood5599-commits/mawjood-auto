import 'dart:io';

import 'package:flutter/material.dart';

import '../../../config/theme.dart';
import '../../../models/vehicle_model.dart';
import '../../../widgets/glass_chrome.dart';
import '../models/mechanic_sheet_models.dart';
import '../services/mechanic_sheet_parser.dart';
import 'mechanic_wizard_screen.dart';

class MechanicAnalysisScreen extends StatefulWidget {
  final String lang;
  final String imagePath;
  final VehicleProfile vehicle;

  const MechanicAnalysisScreen({
    super.key,
    required this.lang,
    required this.imagePath,
    required this.vehicle,
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
        imageFile: File(widget.imagePath),
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
                  ? 'جاري قراءة خط يد الميكانيكي وفحص القطع المتوافقة...'
                  : 'Reading mechanic handwriting & matching compatible parts...',
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
    return ListView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Text(
          isAr
              ? 'تم التعرف على ${result.recognized.length} قطع متوافقة'
              : '${result.recognized.length} compatible parts recognized',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: AppTheme.textOf(context),
          ),
        ),
        const SizedBox(height: 12),
        ...result.recognized.map(
          (item) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: AppTheme.cardDecoration(context, radius: 14),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: AppTheme.success),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.name(isAr),
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textOf(context),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
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
                      ? '⚠️ لم نتمكن من قراءة هذه الكلمات بدقة، يرجى مراجعة الميكانيكي لتأكيدها:'
                      : '⚠️ We could not read these lines accurately — please confirm with your mechanic:',
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
              color: result.recognized.isEmpty
                  ? Colors.grey
                  : AppTheme.copper,
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
