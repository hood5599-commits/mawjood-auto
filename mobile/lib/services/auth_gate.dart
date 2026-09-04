import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../screens/auth_screen.dart';
import 'auth_service.dart';

/// Central auth gate for cart / checkout gated actions.
class AuthGate {
  static Future<bool> requireLogin(
    BuildContext context, {
    required String lang,
    VoidCallback? onToggleLang,
    String? message,
  }) async {
    if (AuthService().isLoggedIn) return true;

    final isAr = lang == 'ar';
    final proceed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: const Color(0xFF121824),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return Directionality(
          textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(22, 16, 22, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF334155),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppTheme.copper.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppTheme.copper.withValues(alpha: 0.45),
                      ),
                    ),
                    child: const Icon(
                      Icons.lock_outline,
                      color: AppTheme.copper,
                      size: 30,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isAr ? 'يلزم تسجيل الدخول' : 'Sign in required',
                    style: const TextStyle(
                      color: Color(0xFFF8FAFC),
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    message ??
                        (isAr
                            ? 'يرجى تسجيل الدخول أولاً لإضافة القطع إلى سلة المشتريات ومتابعة الطلب'
                            : 'Please sign in first to add parts to your cart and continue checkout'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                      height: 1.45,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(ctx, true),
                      icon: const Icon(Icons.login, size: 18),
                      label: Text(
                        isAr
                            ? 'تسجيل الدخول / إنشاء حساب'
                            : 'Sign In / Sign Up',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.copper,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: Text(
                      isAr ? 'لاحقاً' : 'Not now',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (proceed != true || !context.mounted) return false;

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AuthScreen(
          lang: lang,
          onToggleLang: onToggleLang,
          onSuccess: (_) => Navigator.of(context).pop(),
        ),
      ),
    );

    return AuthService().isLoggedIn;
  }
}
