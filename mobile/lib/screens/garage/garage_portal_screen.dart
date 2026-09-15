import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../services/auth_service.dart';
import '../welcome_screen.dart';

/// Lightweight garage backstage portal (full garage ops remain on the web dashboard).
class GaragePortalScreen extends StatelessWidget {
  final String lang;
  final AuthSession? session;

  const GaragePortalScreen({
    super.key,
    this.lang = 'ar',
    this.session,
  });

  bool get isAr => lang == 'ar';

  Future<void> _logout(BuildContext context) async {
    await AuthService().clearSession();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => WelcomeScreen(lang: lang)),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = session ?? AuthService().session;
    final name = s?.fullName?.trim().isNotEmpty == true
        ? s!.fullName!
        : (s?.displayPhone.isNotEmpty == true
            ? s!.displayPhone
            : (isAr ? 'كراج معتمد' : 'Verified Garage'));

    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.obsidian,
        appBar: AppBar(
          backgroundColor: AppTheme.obsidian,
          title: Text(
            isAr ? 'بوابة الكراج' : 'Garage Portal',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          actions: [
            IconButton(
              tooltip: isAr ? 'تسجيل الخروج' : 'Sign out',
              onPressed: () => _logout(context),
              icon: const Icon(Icons.logout, color: Colors.white70),
            ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderSlate),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAr ? 'مرحباً، $name' : 'Welcome, $name',
                        style: const TextStyle(
                          color: AppTheme.textWhite,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isAr
                            ? 'إدارة المخزون والطلبات تتم عبر لوحة تحكم الكراج على الويب.'
                            : 'Inventory and order management runs through the garage web dashboard.',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          height: 1.45,
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () async {
                    final uri = Uri.parse('https://mawjood.auto');
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  },
                  icon: const Icon(Icons.open_in_browser),
                  label: Text(
                    isAr ? 'فتح لوحة تحكم الكراج' : 'Open Garage Dashboard',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.copper,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => _logout(context),
                  child: Text(
                    isAr ? 'تسجيل الخروج' : 'Sign out',
                    style: const TextStyle(color: AppTheme.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
