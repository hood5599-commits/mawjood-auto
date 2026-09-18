import 'package:flutter/material.dart';

import '../../../config/theme.dart';
import '../../../models/vehicle_model.dart';
import '../../../widgets/glass_chrome.dart';
import '../models/mechanic_sheet_models.dart';
import 'mechanic_quotation_screen.dart';

class MechanicWizardScreen extends StatefulWidget {
  final String lang;
  final VehicleProfile vehicle;
  final List<MechanicRecognizedItem> items;
  final List<String> unrecognizedLines;

  const MechanicWizardScreen({
    super.key,
    required this.lang,
    required this.vehicle,
    required this.items,
    this.unrecognizedLines = const [],
  });

  @override
  State<MechanicWizardScreen> createState() => _MechanicWizardScreenState();
}

class _MechanicWizardScreenState extends State<MechanicWizardScreen> {
  bool get isAr => widget.lang == 'ar';

  int _index = 0;
  final Map<String, MechanicPartOption> _choices = {};

  MechanicRecognizedItem get _current => widget.items[_index];
  MechanicPartOption? get _selected => _choices[_current.id];
  bool get _isLast => _index >= widget.items.length - 1;

  void _select(MechanicPartOption option) {
    setState(() => _choices[_current.id] = option);
  }

  void _next() {
    if (_selected == null) return;
    if (_isLast) {
      final lines = widget.items
          .map(
            (item) => MechanicSelectedLine(
              item: item,
              option: _choices[item.id]!,
            ),
          )
          .toList();
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, _, _) => MechanicQuotationScreen(
            lang: widget.lang,
            vehicle: widget.vehicle,
            lines: lines,
            unrecognizedLines: widget.unrecognizedLines,
          ),
          transitionsBuilder: (_, anim, _, child) => SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1, 0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
            ),
            child: child,
          ),
        ),
      );
      return;
    }
    setState(() => _index += 1);
  }

  void _back() {
    if (_index == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    setState(() => _index -= 1);
  }

  @override
  Widget build(BuildContext context) {
    final item = _current;
    final progress = (_index + 1) / widget.items.length;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.scaffoldOf(context),
        appBar: AppBar(
          backgroundColor: AppTheme.navy,
          leading: IconButton(
            onPressed: _back,
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          ),
          title: Text(
            isAr
                ? 'القطعة ${_index + 1} من ${widget.items.length}: ${item.nameAr}'
                : 'Part ${_index + 1} of ${widget.items.length}: ${item.nameEn}',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
          ),
        ),
        body: Column(
          children: [
            LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              color: AppTheme.copper,
              backgroundColor: AppTheme.copper.withValues(alpha: 0.15),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, anim) => SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.12, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: FadeTransition(opacity: anim, child: child),
                ),
                child: ListView(
                  key: ValueKey(item.id),
                  physics: const BouncingScrollPhysics(
                    parent: AlwaysScrollableScrollPhysics(),
                  ),
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
                  children: [
                    Text(
                      isAr
                          ? 'اختر نوع القطعة المناسبة'
                          : 'Choose the right part quality',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 17,
                        color: AppTheme.textOf(context),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${widget.vehicle.make} · ${widget.vehicle.model} · ${widget.vehicle.year}',
                      style: TextStyle(color: AppTheme.mutedOf(context)),
                    ),
                    const SizedBox(height: 16),
                    _optionCard(item.oem),
                    const SizedBox(height: 12),
                    _optionCard(item.aftermarket),
                  ],
                ),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                child: TactileScale(
                  onTap: _selected == null ? null : _next,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    decoration: BoxDecoration(
                      color: _selected == null
                          ? Colors.grey.shade400
                          : AppTheme.copper,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: _selected == null
                          ? null
                          : [
                              BoxShadow(
                                color: AppTheme.copper.withValues(alpha: 0.35),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      _isLast
                          ? (isAr ? 'إنشاء عرض السعر' : 'Generate quotation')
                          : (isAr ? 'التالي' : 'Next'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _optionCard(MechanicPartOption option) {
    final selected = _selected?.quality == option.quality;
    final isOem = option.isOem;
    final accent = isOem ? const Color(0xFF0284C7) : AppTheme.copper;

    return TactileScale(
      onTap: () => _select(option),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? accent.withValues(alpha: 0.10)
              : AppTheme.cardOf(context),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? accent : AppTheme.borderOf(context),
            width: selected ? 1.8 : 1,
          ),
          boxShadow: AppTheme.cardShadow(Theme.of(context).brightness),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    option.label(isAr),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                if (selected)
                  Icon(Icons.check_circle, color: accent)
                else
                  Icon(Icons.circle_outlined,
                      color: AppTheme.mutedOf(context)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  option.price.toStringAsFixed(0),
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textOf(context),
                  ),
                ),
                const SizedBox(width: 6),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    isAr ? 'ر.ق' : 'QAR',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.mutedOf(context),
                    ),
                  ),
                ),
                if (option.savingsVsOem != null) ...[
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isAr
                          ? 'توفير ${option.savingsVsOem!.toStringAsFixed(0)} ر.ق'
                          : 'Save ${option.savingsVsOem!.toStringAsFixed(0)} QAR',
                      style: const TextStyle(
                        color: AppTheme.success,
                        fontWeight: FontWeight.w800,
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            if (option.warranty(isAr) != null) ...[
              const SizedBox(height: 8),
              Text(
                option.warranty(isAr)!,
                style: TextStyle(
                  color: AppTheme.mutedOf(context),
                  fontWeight: FontWeight.w600,
                  fontSize: 12.5,
                ),
              ),
            ],
            if (option.partNumber != null) ...[
              const SizedBox(height: 4),
              Text(
                'OEM: ${option.partNumber}',
                style: TextStyle(
                  fontFamily: 'monospace',
                  color: AppTheme.mutedOf(context),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Text(
                isAr ? 'اختيار' : 'Select',
                style: TextStyle(
                  color: accent,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
