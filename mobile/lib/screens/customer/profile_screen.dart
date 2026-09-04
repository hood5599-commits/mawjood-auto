import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../models/vehicle_model.dart';
import '../../services/auth_service.dart';
import '../../widgets/custom_toast.dart';
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

  Future<void> _editUsername() async {
    final ctrl = TextEditingController(text: _nameController.text);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
        child: AlertDialog(
          backgroundColor: _surfaceAlt,
          title: Text(
            isAr ? 'تعديل اسم المستخدم' : 'Edit Username',
            style: const TextStyle(color: _text),
          ),
          content: TextField(
            controller: ctrl,
            style: const TextStyle(color: _text),
            decoration: _fieldDecoration(
              label: isAr ? 'الاسم الكامل' : 'Full Name',
              icon: Icons.badge_outlined,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(isAr ? 'إلغاء' : 'Cancel',
                  style: const TextStyle(color: _muted)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(isAr ? 'حفظ' : 'Save'),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;
    _nameController.text = ctrl.text.trim();
    await _saveProfileData();
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
          onSuccess: (_) {
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
                        _identityCard(),
                        const SizedBox(height: 14),
                        if (!isLoggedIn)
                          SizedBox(
                            height: 48,
                            child: OutlinedButton.icon(
                              onPressed: _openAuth,
                              icon: const Icon(Icons.login, color: _text),
                              label: Text(
                                isAr
                                    ? 'تسجيل الدخول / إنشاء حساب'
                                    : 'Sign In / Register',
                                style: const TextStyle(color: _text),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: _border),
                              ),
                            ),
                          ),
                        if (!isLoggedIn) const SizedBox(height: 14),
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
                                  label: isAr ? 'رقم الهاتف' : 'Phone Number',
                                  icon: Icons.phone_outlined,
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _addressController,
                                maxLines: 2,
                                style: const TextStyle(color: _text),
                                decoration: _fieldDecoration(
                                  label: isAr
                                      ? 'عنوان التوصيل الافتراضي'
                                      : 'Default Delivery Address',
                                  icon: Icons.location_on_outlined,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        _card(
                          child: Column(
                            children: [
                              _actionTile(
                                Icons.edit_outlined,
                                isAr
                                    ? 'تعديل اسم المستخدم'
                                    : 'Edit Username',
                                _editUsername,
                              ),
                              const Divider(color: _border, height: 1),
                              _actionTile(
                                Icons.lock_outline,
                                isAr
                                    ? 'تغيير كلمة المرور'
                                    : 'Change Password',
                                _changePassword,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        _vehiclesCard(),
                        const SizedBox(height: 12),
                        _supportCard(),
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveProfileData,
                            child: _isSaving
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    isAr ? 'حفظ البيانات' : 'Save Changes',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                        if (isLoggedIn && widget.onLogout != null)
                          TextButton.icon(
                            onPressed: widget.onLogout,
                            icon: const Icon(Icons.logout,
                                color: AppTheme.danger, size: 18),
                            label: Text(
                              isAr ? 'تسجيل الخروج' : 'Log Out',
                              style: const TextStyle(
                                color: AppTheme.danger,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        if (isLoggedIn)
                          TextButton.icon(
                            onPressed:
                                _deleting ? null : _confirmDeleteAccount,
                            icon: const Icon(Icons.delete_forever,
                                color: AppTheme.danger, size: 18),
                            label: Text(
                              isAr ? 'حذف الحساب' : 'Delete Account',
                              style: const TextStyle(
                                color: AppTheme.danger,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
        ),
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

  Widget _supportCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr ? 'التواصل والدعم' : 'Contact & Support',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: _text,
            ),
          ),
          const SizedBox(height: 8),
          _actionTile(
            Icons.chat,
            'WhatsApp',
            () => _launch(Uri.parse('https://wa.me/97455000000')),
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.phone,
            isAr ? 'اتصال هاتفي' : 'Call Us',
            () => _launch(Uri.parse('tel:+97455000000')),
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.email_outlined,
            'support@mawjood.com',
            () => _launch(Uri.parse('mailto:support@mawjood.com')),
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.info_outline,
            isAr ? 'عن موجود أوتو' : 'About',
            () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InfoPageScreen(
                  lang: widget.lang,
                  type: InfoPageType.about,
                ),
              ),
            ),
          ),
          const Divider(color: _border, height: 1),
          _actionTile(
            Icons.support_agent,
            isAr ? 'خدمة العملاء' : 'Customer Care',
            () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InfoPageScreen(
                  lang: widget.lang,
                  type: InfoPageType.care,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppTheme.copper),
      title: Text(
        title,
        style: const TextStyle(color: _text, fontWeight: FontWeight.w600),
      ),
      trailing: const Icon(Icons.chevron_right, color: _muted),
      minVerticalPadding: 14,
      onTap: onTap,
    );
  }
}
