import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/glass_chrome.dart';
import '../../widgets/request_part_modal.dart';

/// Full-page quote request destination.
class QuoteRequestScreen extends StatelessWidget {
  final String lang;

  const QuoteRequestScreen({super.key, this.lang = 'ar'});

  bool get isAr => lang == 'ar';

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
            isAr ? 'طلب تسعيرة قطعة غير متوفرة' : 'Unavailable Part Quote',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
          ),
        ),
        body: SafeArea(
          child: RequestPartModal(
            asPage: true,
            onSuccess: () {
              CustomToast.success(
                context,
                isAr
                    ? 'تم استلام طلبك بنجاح'
                    : 'Request received successfully',
              );
              Navigator.of(context).maybePop();
            },
          ),
        ),
      ),
    );
  }
}
