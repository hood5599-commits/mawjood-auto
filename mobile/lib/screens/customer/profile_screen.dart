import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../models/vehicle_model.dart';
import '../../services/auth_service.dart';
import '../../services/platform_settings_service.dart';
import '../../services/role_router.dart';
import '../../services/theme_notifier.dart';
import '../../widgets/ai_chatbot_sheet.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/glass_chrome.dart';
import '../auth_screen.dart';
import '../info_page_screen.dart';
import 'order_tracker_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String lang;
  final VoidCallback? onLogout;
  final VoidCallback? onToggleLang;

  const ProfileScreen({
    super.key,
    this.lang = 'ar',
    this.onLogout,
    this.onToggleLang,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  static const _surface = Color(0xFF121824);
  static const _surfaceAlt = Color(0xFF1A2232);
  static const _text = Color(0xFFF9FAFB);
  static const _muted = Color(0xFF9CA3AF);
  static const _border = Color(0xFF2A3448);

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  String _customerCode = 'CUST-GUEST';
  bool _isLoading = true;
  bool _isSaving = false;
  bool _deleting = false;
  List<VehicleModel> _savedVehicles = [];

  bool get isAr => widget.lang == 'ar';
  bool get isLoggedIn => AuthService().isLoggedIn;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  InputDecoration _fieldDecoration({
    required String label,
    IconData? icon,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: _muted),
      hintStyle: const TextStyle(color: _muted),
      prefixIcon: icon != null ? Icon(icon, size: 20, color: _muted) : null,
      filled: true,
      fillColor: _surfaceAlt,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.copper),
      ),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    final session = AuthService().session;
    setState(() {
      _nameController.text =
          session?.fullName ?? prefs.getString('customer_name') ?? '';
      _phoneController.text = session?.displayPhone.isNotEmpty == true
          ? session!.displayPhone
          : (prefs.getString('customer_phone') ?? '');
      _addressController.text = prefs.getString('customer_address') ??
          session?.user?['user_metadata']?['address']?.toString() ??
          '';
      final phone = _phoneController.text;
      _customerCode = prefs.getString('customer_code') ??
          'CUST-${phone.isEmpty ? "GUEST" : phone.hashCode.abs().toString().padLeft(5, '0').substring(0, 5)}';

      final savedMake = prefs.getString('saved_car_make');
      if (savedMake != null && savedMake.isNotEmpty) {
        _savedVehicles = [
          VehicleModel(
            vin: prefs.getString('saved_car_vin'),
            make: savedMake,
            model: prefs.getString('saved_car_model') ?? '',
            year: prefs.getString('saved_car_year') ?? '',
          ),
        ];
      }
      _isLoading = false;
    });
  }

  Future<void> _saveProfileData() async {
    setState(() => _isSaving = true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('customer_name', _nameController.text.trim());
    await prefs.setString('customer_phone', _phoneController.text.trim());
    await prefs.setString('customer_address', _addressController.text.trim());

    if (isLoggedIn) {
      try {
        await AuthService().updateProfile({
          'full_name': _nameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
        });
      } catch (_) {}
    }

    if (!mounted) return;
    setState(() => _isSaving = false);
    CustomToast.success(
      context,
      isAr ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully',
    );
  }

  Future<void> _changePassword() async {
    if (!isLoggedIn) {
      CustomToast.info(
        context,
        isAr ? 'سجّل الدخول أولاً' : 'Please sign in first',
      );
      return;
    }
    final passCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
        child: AlertDialog(
          backgroundColor: _surfaceAlt,
          title: Text(
            isAr ? 'تغيير كلمة المرور' : 'Change Password',
            style: const TextStyle(color: _text),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: passCtrl,
                obscureText: true,
                style: const TextStyle(color: _text),
                decoration: _fieldDecoration(
                  label: isAr ? 'كلمة المرور الجديدة' : 'New Password',
                  icon: Icons.lock_outline,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirmCtrl,
                obscureText: true,
                style: const TextStyle(color: _text),
                decoration: _fieldDecoration(
                  label: isAr ? 'تأكيد كلمة المرور' : 'Confirm Password',
                  icon: Icons.lock_outline,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(isAr ? 'إلغاء' : 'Cancel',
                  style: const TextStyle(color: _muted)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(isAr ? 'تحديث' : 'Update'),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;
    if (passCtrl.text.length < 6) {
      CustomToast.error(
        context,
        isAr
            ? 'كلمة المرور يجب ألا تقل عن 6 أحرف'
            : 'Password must be at least 6 characters',
      );
      return;
    }
    if (passCtrl.text != confirmCtrl.text) {
      CustomToast.error(
        context,
        isAr ? 'كلمة المرور غير متطابقة' : 'Passwords do not match',
      );
      return;
    }
    try {
      await AuthService().changePassword(passCtrl.text);
      if (!mounted) return;
      CustomToast.success(
        context,
        isAr ? 'تم تغيير كلمة المرور' : 'Password updated',
      );
    } catch (_) {
      if (!mounted) return;
      CustomToast.error(
        context,
        isAr ? 'تعذر تغيير كلمة المرور' : 'Could not update password',
      );
    }
  }

  Future<void> _launch(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  void _openOrderTracker() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderTrackerScreen(
          lang: widget.lang,
          customerPhone: _phoneController.text.trim(),
        ),
      ),
    );
  }

  void _openAuth() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AuthScreen(
          lang: widget.lang,
          onToggleLang: widget.onToggleLang,
          onSuccess: (session) {
            if (session.isDriver || session.isGarage) {
              RoleRouter.goHome(
                context,
                session: session,
                lang: widget.lang,
                onToggleLang: widget.onToggleLang,
              );
              return;
            }
            Navigator.pop(context);
            _loadProfileData();
          },
        ),
      ),
    );
  }

  Future<void> _confirmDeleteAccount() async {
    if (!isLoggedIn) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
        child: AlertDialog(
          backgroundColor: _surfaceAlt,
          title: Text(
            isAr ? 'حذف الحساب' : 'Delete Account',
            style: const TextStyle(color: _text),
          ),
          content: Text(
            isAr
                ? 'سيتم حذف حسابك وبياناتك المرتبطة. هل أنت متأكد؟'
                : 'Your account and related data will be deleted. Continue?',
            style: const TextStyle(color: _muted),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(isAr ? 'إلغاء' : 'Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(isAr ? 'حذف الحساب' : 'Delete'),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;
    setState(() => _deleting = true);
    try {
      await AuthService().deleteAccount();
      if (!mounted) return;
      widget.onLogout?.call();
    } catch (_) {
      if (mounted) {
        CustomToast.error(
          context,
          isAr ? 'تعذر حذف الحساب' : 'Could not delete account',
        );
      }
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Theme(
        data: Theme.of(context).copyWith(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: AppTheme.obsidian,
          textTheme: Theme.of(context).textTheme.apply(
                bodyColor: _text,
                displayColor: _text,
              ),
          inputDecorationTheme: const InputDecorationTheme(
            labelStyle: TextStyle(color: _muted),
            hintStyle: TextStyle(color: _muted),
          ),
        ),
        child: Scaffold(
          backgroundColor: AppTheme.obsidian,
          appBar: AppBar(
            backgroundColor: AppTheme.obsidian,
            title: Text(
              isAr ? 'الملف الشخصي' : 'Customer Profile',
              style: const TextStyle(
                color: _text,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              if (isLoggedIn)
                IconButton(
                  icon: const Icon(Icons.inventory_2_outlined, color: _muted),
                  onPressed: _openOrderTracker,
                ),
            ],
          ),
          body: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: AppTheme.copper),
                )
              : SafeArea(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (!isLoggedIn) ...[
                          _guestWelcomeCard(),
                          const SizedBox(height: 14),
                          _helpSupportSection(),
                          const SizedBox(height: 14),
                          _systemAppSection(),
                          const SizedBox(height: 24),
                        ] else ...[
                          _identityCard(),
                          const SizedBox(height: 14),
                          _card(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isAr
                                      ? 'بيانات الاتصال والتوصيل'
                                      : 'Contact & Delivery Details',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: _text,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextField(
                                  controller: _nameController,
                                  style: const TextStyle(color: _text),
                                  decoration: _fieldDecoration(
                                    label: isAr ? 'الاسم الكامل' : 'Full Name',
                                    icon: Icons.badge_outlined,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  style: const TextStyle(color: _text),
                                  decoration: _fieldDecoration(
                                    label: isAr ? 'رقم الجوال' : 'Phone',
                                    icon: Icons.phone_outlined,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: _addressController,
                                  style: const TextStyle(color: _text),
                                  decoration: _fieldDecoration(
                                    label: isAr
                                        ? 'عنوان التوصيل'
                                        : 'Delivery address',
                                    icon: Icons.location_on_outlined,
                                  ),
                                  maxLines: 2,
                                ),
                                const SizedBox(height: 14),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed:
                                        _isSaving ? null : _saveProfileData,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.copper,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 14,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    child: _isSaving
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : Text(
                                            isAr
                                                ? 'حفظ البيانات'
                                                : 'Save profile',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          _helpSupportSection(),
                          const SizedBox(height: 14),
                          _systemAppSection(),
                          const SizedBox(height: 14),
                          _vehiclesCard(),
                          const SizedBox(height: 24),
                        ],
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _guestWelcomeCard() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF090D16), Color(0xFF1A2232)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppTheme.copper.withValues(alpha: 0.18),
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.copper.withValues(alpha: 0.5),
              ),
            ),
            child: const Icon(
              Icons.person_outline,
              color: AppTheme.copper,
              size: 36,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF1A2232),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _border),
            ),
            child: Text(
              isAr ? 'زائر' : 'Guest',
              style: const TextStyle(
                color: Color(0xFFF8FAFC),
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isAr
                ? 'مرحباً بك في موجود أوتو'
                : 'Welcome to Mawjood Auto',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _text,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isAr
                ? 'سجّل الدخول لعرض بياناتك الشخصية، طلباتك السابقة، وعناوين التوصيل المحفوظة.'
                : 'Sign in to view personal details, past orders, and saved delivery addresses.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _muted,
              fontSize: 13,
              height: 1.45,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 22),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _openAuth,
              icon: const Icon(Icons.login, size: 18),
              label: Text(
                isAr
                    ? 'تسجيل الدخول / إنشاء حساب'
                    : 'Sign In / Create Account',
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
        ],
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: child,
    );
  }

  Widget _identityCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF090D16), Color(0xFF1F3A5F)],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              color: AppTheme.copper,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _nameController.text.trim().isNotEmpty
                      ? _nameController.text.trim()
                      : (isAr ? 'عميل موجود أوتو' : 'Mawjood Customer'),
                  style: const TextStyle(
                    color: _text,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isLoggedIn
                      ? (isAr ? 'مسجّل الدخول' : 'Signed in')
                      : (isAr ? 'زائر' : 'Guest'),
                  style: const TextStyle(color: _muted, fontSize: 12),
                ),
                Text(
                  'ID: $_customerCode',
                  style: const TextStyle(
                    color: Color(0xFF86EFAC),
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _vehiclesCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  isAr ? 'سياراتي المحفوظة' : 'My Saved Vehicles',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _text,
                  ),
                ),
              ),
              const Icon(Icons.directions_car_outlined, color: AppTheme.copper),
            ],
          ),
          const SizedBox(height: 12),
          if (_savedVehicles.isEmpty)
            Text(
              isAr
                  ? 'لم تقم بتسجيل سيارة بعد.'
                  : 'No vehicles saved yet.',
              style: const TextStyle(fontSize: 12, color: _muted),
            )
          else
            ..._savedVehicles.map(
              (v) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _surfaceAlt,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _border),
                ),
                child: Text(
                  '${v.make} ${v.model} (${v.year})',
                  style: const TextStyle(
                    color: _text,
                    fontWeight: FontWeight.bold,
                    fontSize: 13.5,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _themeChip({
    required String label,
    required IconData icon,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return TactileScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.copper.withValues(alpha: 0.18)
              : _surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppTheme.copper : _border,
            width: selected ? 1.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppTheme.copper.withValues(alpha: 0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? AppTheme.copper : _muted,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: selected ? AppTheme.copperLight : _text,
                fontWeight: FontWeight.w800,
                fontSize: 12.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _helpSupportSection() {
    return AnimatedBuilder(
      animation: PlatformSettingsService.instance,
      builder: (context, _) {
        final s = PlatformSettingsService.instance.settings;
        return _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isAr ? 'المساعدة والدعم' : 'Help & Support',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: _text,
                ),
              ),
              const SizedBox(height: 8),
              _actionTile(
                Icons.chat,
                isAr ? 'واتساب خدمة العملاء' : 'WhatsApp Support',
                () => _launch(Uri.parse('https://wa.me/${s.whatsappDigits}')),
              ),
              const Divider(color: _border, height: 1),
              _actionTile(
                Icons.phone,
                isAr ? 'تواصل معنا' : 'Contact Us',
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => InfoPageScreen(
                      lang: widget.lang,
                      type: InfoPageType.contact,
                    ),
                  ),
                ),
              ),
              const Divider(color: _border, height: 1),
              _actionTile(
                Icons.smart_toy_outlined,
                isAr ? 'عبود المساعد الذكي والمحادثة المباشرة' : 'Abboud AI & Live Chat',
                () => AiChatbotSheet.showModal(context, lang: widget.lang),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _systemAppSection() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr ? 'النظام والتطبيق' : 'System & App',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: _text,
            ),
          ),
          const SizedBox(height: 8),
          _actionTile(
            Icons.share_outlined,
            isAr ? 'مشاركة التطبيق' : 'Share App',
            () {
              SharePlus.instance.share(
                ShareParams(
                  text: isAr
                      ? 'جرّب موجود أوتو لقطع الغيار المعتمدة في قطر: https://mawjood.auto'
                      : 'Try Mawjood Auto for certified spare parts in Qatar: https://mawjood.auto',
                  subject: isAr ? 'موجود أوتو' : 'Mawjood Auto',
                ),
              );
            },
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.feedback_outlined,
            isAr ? 'الشكاوى والاقتراحات' : 'Complaints & Suggestions',
            _showComplaintsSheet,
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.menu_book_outlined,
            isAr ? 'تعليمات الاستخدام والشروط' : 'Usage Terms & Guidelines',
            () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InfoPageScreen(
                  lang: widget.lang,
                  type: InfoPageType.terms,
                ),
              ),
            ),
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.privacy_tip_outlined,
            isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
            () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InfoPageScreen(
                  lang: widget.lang,
                  type: InfoPageType.privacy,
                ),
              ),
            ),
          ),
          const Divider(color: _border, height: 1),
          const SizedBox(height: 8),
          _themeCardInline(),
          if (isLoggedIn) ...[
            const Divider(color: _border, height: 1),
            _actionTile(
              Icons.lock_outline,
              isAr ? 'تغيير كلمة المرور' : 'Change Password',
              _changePassword,
            ),
            const Divider(color: _border, height: 1),
            if (widget.onLogout != null)
              _actionTile(
                Icons.logout,
                isAr ? 'تسجيل الخروج' : 'Log Out',
                widget.onLogout!,
              ),
            const Divider(color: _border, height: 1),
            _actionTile(
              Icons.delete_forever,
              isAr ? 'حذف الحساب' : 'Delete Account',
              _deleting ? () {} : _confirmDeleteAccount,
            ),
          ],
        ],
      ),
    );
  }

  Widget _themeCardInline() {
    return AnimatedBuilder(
      animation: ThemeNotifier.instance,
      builder: (context, _) {
        final current = ThemeNotifier.instance.preference;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isAr ? 'مظهر التطبيق' : 'App Appearance',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: _text,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _themeChip(
                    label: isAr ? 'تلقائي' : 'System',
                    icon: Icons.brightness_auto,
                    selected: current == AppThemePreference.system,
                    onTap: () => ThemeNotifier.instance
                        .setPreference(AppThemePreference.system),
                  ),
                  _themeChip(
                    label: isAr ? 'فاتح' : 'Light',
                    icon: Icons.light_mode_outlined,
                    selected: current == AppThemePreference.light,
                    onTap: () => ThemeNotifier.instance
                        .setPreference(AppThemePreference.light),
                  ),
                  _themeChip(
                    label: isAr ? 'داكن' : 'Dark',
                    icon: Icons.dark_mode_outlined,
                    selected: current == AppThemePreference.dark,
                    onTap: () => ThemeNotifier.instance
                        .setPreference(AppThemePreference.dark),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showComplaintsSheet() async {
    final ctrl = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: _surfaceAlt,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Directionality(
          textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              18,
              18,
              18,
              MediaQuery.of(ctx).viewInsets.bottom + 18,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  isAr ? 'الشكاوى والاقتراحات' : 'Complaints & Suggestions',
                  style: const TextStyle(
                    color: _text,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: ctrl,
                  maxLines: 4,
                  style: const TextStyle(color: _text),
                  decoration: _fieldDecoration(
                    label: isAr ? 'اكتب رسالتك' : 'Write your message',
                    icon: Icons.feedback_outlined,
                  ),
                ),
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.copper,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(isAr ? 'إرسال' : 'Submit'),
                ),
              ],
            ),
          ),
        );
      },
    );
    if (ok == true && ctrl.text.trim().isNotEmpty) {
      final s = PlatformSettingsService.instance.settings;
      final msg = Uri.encodeComponent(ctrl.text.trim());
      await _launch(
        Uri.parse('https://wa.me/${s.whatsappDigits}?text=$msg'),
      );
    }
  }

  Widget _actionTile(IconData icon, String title, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(icon, color: AppTheme.copper),
        title: Text(
          title,
          style: const TextStyle(color: _text, fontWeight: FontWeight.w600),
        ),
        trailing: const Icon(Icons.chevron_right, color: _muted),
        minVerticalPadding: 14,
        onTap: onTap,
      ),
    );
  }
}
