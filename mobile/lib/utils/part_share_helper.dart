import 'package:share_plus/share_plus.dart';

import '../models/part_model.dart';

class PartShareHelper {
  static Future<void> sharePart(PartModel part, {String lang = 'ar'}) async {
    final isAr = lang == 'ar';
    final currency = isAr ? 'ر.ق' : 'QAR';
    final fitment = [
      part.make,
      part.model,
      if (part.year.isNotEmpty) '(${part.year})',
    ].where((e) => e.toString().trim().isNotEmpty).join(' ');

    final title = part.name;
    final price = '${part.price} $currency';
    final pn = part.partNumber != null && part.partNumber!.isNotEmpty
        ? (isAr ? 'رقم القطعة: ${part.partNumber}' : 'Part #: ${part.partNumber}')
        : '';

    final link =
        'https://mawjood.auto/parts/${Uri.encodeComponent(part.id)}';

    final text = [
      title,
      if (fitment.isNotEmpty)
        isAr ? 'التوافق: $fitment' : 'Fitment: $fitment',
      isAr ? 'السعر: $price' : 'Price: $price',
      if (pn.isNotEmpty) pn,
      '',
      isAr ? 'شاهد القطعة على موجود أوتو:' : 'View on Mawjood Auto:',
      link,
    ].join('\n');

    await SharePlus.instance.share(
      ShareParams(text: text, subject: title),
    );
  }
}
