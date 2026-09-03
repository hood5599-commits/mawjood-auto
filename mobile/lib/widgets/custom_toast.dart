import 'package:flutter/material.dart';

import '../config/theme.dart';

enum ToastType { success, info, error }

class CustomToast {
  /// عرض التنبيه العائم في أي شاشة عبر سياق البناء BuildContext
  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.success,
    Duration duration = const Duration(seconds: 4),
  }) {
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    // إخفاء أي تنبيه نشط سابقاً لمنع التراكم
    scaffoldMessenger.hideCurrentSnackBar();

    final (bgColor, iconData, iconColor) = switch (type) {
      ToastType.success => (
        const Color(0xFF1E3A2F),
        Icons.check_circle_outline,
        AppTheme.success,
      ),
      ToastType.info => (
        AppTheme.surfaceSlate,
        Icons.info_outline,
        const Color(0xFF38BDF8),
      ),
      ToastType.error => (
        const Color(0xFF3B1D24),
        Icons.error_outline,
        AppTheme.danger,
      ),
    };

    scaffoldMessenger.showSnackBar(
      SnackBar(
        duration: duration,
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        margin: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
        padding: EdgeInsets.zero,
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: iconColor.withValues(alpha: 0.4),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(iconData, color: iconColor, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: AppTheme.textWhite,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              InkWell(
                onTap: () => scaffoldMessenger.hideCurrentSnackBar(),
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(4.0),
                  child: Icon(
                    Icons.close,
                    size: 18,
                    color: AppTheme.textWhite.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // دوال سريعة ومباشرة
  static void success(BuildContext context, String message) =>
      show(context, message: message, type: ToastType.success);

  static void info(BuildContext context, String message) =>
      show(context, message: message, type: ToastType.info);

  static void error(BuildContext context, String message) =>
      show(context, message: message, type: ToastType.error);
}
