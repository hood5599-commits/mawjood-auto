import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../models/part_model.dart';
import '../services/auth_gate.dart';
import 'ai_translated_text.dart';

class PartMoreInfo extends StatefulWidget {
  final PartModel part;
  final String lang;
  final bool enableBnpl;
  final void Function(PartModel part, int quantity)? onAddToCart;
  final VoidCallback onBack;

  const PartMoreInfo({
    super.key,
    required this.part,
    this.lang = 'ar',
    this.enableBnpl = true,
    this.onAddToCart,
    required this.onBack,
  });

  @override
  State<PartMoreInfo> createState() => _PartMoreInfoState();
}

class _PartMoreInfoState extends State<PartMoreInfo> {
  int _activeImgIdx = 0;

  bool get isAr => widget.lang == 'ar';

  List<String> get _images {
    if (widget.part.imageUrl.isNotEmpty) {
      return [widget.part.imageUrl];
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final partNo =
        widget.part.partNumber != null && widget.part.partNumber!.isNotEmpty
        ? widget.part.partNumber!
        : widget.part.id;

    final installmentValue = (widget.part.price / 4).toStringAsFixed(2);
    final hasRealDescription =
        widget.part.description != null &&
        widget.part.description!.trim().isNotEmpty;

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppTheme.cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderSlate),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ↩️ شريط العودة والشراء المباشر العلوي
                  _buildTopBar(partNo),
                  const SizedBox(height: 20),

                  // 📸 المعرض والتفاصيل الأساسية
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 650;
                      if (isWide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 5, child: _buildImageGallery()),
                            const SizedBox(width: 24),
                            Expanded(
                              flex: 6,
                              child: _buildDetailsColumn(
                                partNo: partNo,
                                installmentValue: installmentValue,
                                hasRealDescription: hasRealDescription,
                              ),
                            ),
                          ],
                        );
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildImageGallery(),
                          const SizedBox(height: 20),
                          _buildDetailsColumn(
                            partNo: partNo,
                            installmentValue: installmentValue,
                            hasRealDescription: hasRealDescription,
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // 📊 ⚙️ جدول المواصفات الفنية الموحد
                  _buildTechnicalSpecsTable(partNo),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // شريط التحكم العلوي
  Widget _buildTopBar(String partNo) {
    return Container(
      padding: const EdgeInsets.only(bottom: 16),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppTheme.borderSlate, width: 1.5),
        ),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        runSpacing: 10,
        children: [
          ElevatedButton.icon(
            onPressed: widget.onBack,
            icon: const Icon(Icons.arrow_back, size: 16),
            label: Text(
              isAr ? 'العودة لنتائج البحث' : 'Back to Search',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.surfaceSlate,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.surfaceSlate,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderSlate),
            ),
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              children: [
                Text(
                  'PN: $partNo',
                  style: const TextStyle(
                    color: AppTheme.textWhite,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    fontSize: 12.5,
                  ),
                ),
                Text(
                  '${widget.part.price.toStringAsFixed(0)} ${isAr ? "ر.ق" : "QAR"}',
                  style: const TextStyle(
                    color: AppTheme.copperLight,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    final ok = await AuthGate.requireLogin(
                      context,
                      lang: widget.lang,
                    );
                    if (!ok) return;
                    widget.onAddToCart?.call(widget.part, 1);
                  },
                  icon: const Icon(Icons.shopping_cart_outlined, size: 15),
                  label: Text(
                    isAr ? 'أضف للسلة' : 'Add to Cart',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // معرض الصور المدمج والمكبر
  Widget _buildImageGallery() {
    final images = _images;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          height: 280,
          decoration: BoxDecoration(
            color: AppTheme.surfaceSlate,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderSlate),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (images.isEmpty)
                const Center(
                  child: Icon(
                    Icons.build_circle_outlined,
                    size: 64,
                    color: AppTheme.textMuted,
                  ),
                )
              else
                Image.network(
                  images[_activeImgIdx.clamp(0, images.length - 1)],
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Center(
                    child: Icon(
                      Icons.build_circle_outlined,
                      size: 64,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ),
              if (images.length > 1) ...[
                Positioned(
                  left: 10,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withValues(alpha: 0.55),
                      radius: 18,
                      child: IconButton(
                        icon: const Icon(
                          Icons.chevron_left,
                          color: Colors.white,
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _activeImgIdx =
                                (_activeImgIdx - 1 + images.length) %
                                images.length;
                          });
                        },
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 10,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withValues(alpha: 0.55),
                      radius: 18,
                      child: IconButton(
                        icon: const Icon(
                          Icons.chevron_right,
                          color: Colors.white,
                          size: 20,
                        ),
                        onPressed: () {
                          setState(() {
                            _activeImgIdx = (_activeImgIdx + 1) % images.length;
                          });
                        },
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 10,
                  right: isAr ? null : 10,
                  left: isAr ? 10 : null,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${_activeImgIdx + 1} / ${images.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: images.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final isSelected = idx == _activeImgIdx;
                return InkWell(
                  onTap: () => setState(() => _activeImgIdx = idx),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 60,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.copper
                            : AppTheme.borderSlate,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.network(images[idx], fit: BoxFit.cover),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  // العمود الجانبي للمعلومات والضمان والتقسيط
  Widget _buildDetailsColumn({
    required String partNo,
    required String installmentValue,
    required bool hasRealDescription,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AiTranslatedText(
          text: widget.part.name,
          lang: widget.lang,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppTheme.textWhite,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '${widget.part.make} - ${widget.part.model} (${widget.part.year})',
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMuted,
          ),
        ),
        const SizedBox(height: 14),

        // صندوق الوصف الحقيقي
        if (hasRealDescription) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surfaceSlate,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderSlate),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAr ? '📝 الوصف الفني:' : '📝 Description:',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textWhite,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.part.description!,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppTheme.textMuted,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // صندوق الضمان
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF064E3B).withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.success.withValues(alpha: 0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isAr
                    ? '🛡️ معلومات الضمان والتجربة:'
                    : '🛡️ Warranty Information:',
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF86EFAC),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isAr
                    ? 'ضمان تجربة واختبار لمدة 14 يوماً مع إمكانية الإرجاع والاستبدال.'
                    : '14 Days Limited Operational Warranty with return & exchange.',
                style: const TextStyle(fontSize: 12, color: Color(0xFFA7F3D0)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // صندوق التقسيط
        if (widget.enableBnpl) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF78350F).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFFFDE68A).withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.account_balance_wallet_outlined,
                  size: 16,
                  color: Color(0xFFFBBF24),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isAr
                        ? 'أو قسمها على 4 دفعات بقيمة $installmentValue ر.ق (بدون فوائد)'
                        : 'Or 4 interest-free payments of $installmentValue QAR',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFDE68A),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],

        // رقم الـ OEM والتباديل
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.surfaceSlate,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.borderSlate),
          ),
          child: Text(
            'OEM / Interchange: $partNo',
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.copperLight,
            ),
          ),
        ),
      ],
    );
  }

  // 📊 جدول المواصفات الفنية
  Widget _buildTechnicalSpecsTable(String partNo) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceSlate,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSlate),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            color: const Color(0xFF16283F),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Text(
              isAr
                  ? '⚙️ المواصفات الفنية للقطعة ($partNo)'
                  : '⚙️ Technical Specifications ($partNo)',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: AppTheme.textWhite,
              ),
            ),
          ),
          _buildSpecRow(
            label: isAr ? 'رقم القطعة OEM' : 'OEM Part Number',
            value: partNo,
            isMonospace: true,
            isAlternate: true,
          ),
          _buildSpecRow(
            label: isAr ? 'السيارة المخصصة' : 'Compatible Vehicle',
            value:
                '${widget.part.make} - ${widget.part.model} (${widget.part.year})',
          ),
          _buildSpecRow(
            label: isAr ? 'القسم والفرع' : 'Category',
            value:
                widget.part.category ??
                (isAr ? 'قطع غيار عامة' : 'General Parts'),
            isAlternate: true,
          ),
          _buildSpecRow(
            label: isAr ? 'نوع وتصنيف القطعة' : 'Part Tier',
            value: isAr
                ? 'أصلي معتمد (100% Factory-New)'
                : 'Genuine OEM / Certified Tier-1',
          ),
          _buildSpecRow(
            label: isAr ? 'حالة المنتج' : 'Condition',
            value: isAr ? 'جديد بالكرتون 100%' : '100% Brand New',
            isAlternate: true,
          ),
          _buildSpecRow(
            label: isAr ? 'التوصيل المتوقع' : 'Estimated Delivery',
            value: isAr
                ? 'خلال 24 - 48 ساعة مباشرة لموقعك'
                : 'Within 24 - 48 Hours to your door',
            valueColor: AppTheme.success,
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow({
    required String label,
    required String value,
    bool isMonospace = false,
    bool isAlternate = false,
    Color? valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      color: isAlternate
          ? AppTheme.cardBg.withValues(alpha: 0.4)
          : Colors.transparent,
      child: Row(
        children: [
          SizedBox(
            width: 170,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: isMonospace ? 'monospace' : 'Cairo',
                color: valueColor ?? AppTheme.textWhite,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
