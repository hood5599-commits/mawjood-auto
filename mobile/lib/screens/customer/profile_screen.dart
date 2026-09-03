import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    final session = AuthService().session;
    setState(() {
      _nameController.text = session?.fullName ??
          prefs.getString('customer_name') ??
          '';
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
            CustomToast.success(
              context,
              isAr ? 'تم تسجيل الدخول' : 'Signed in',
            );
          },
        ),
      ),
    );
  }

  Future<void> _confirmDeleteAccount() async {
    if (!isLoggedIn) {
      CustomToast.info(
        context,
        isAr ? 'سجّل الدخول أولاً' : 'Please sign in first',
      );
      return;
    }

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
        child: AlertDialog(
          title: Text(isAr ? 'حذف الحساب' : 'Delete Account'),
          content: Text(
            isAr
                ? 'سيتم حذف حسابك وبياناتك المرتبطة. هذا الإجراء لا يمكن التراجع عنه بسهولة. هل أنت متأكد؟'
                : 'Your account and related data will be deleted. This cannot be easily undone. Continue?',
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
      CustomToast.success(
        context,
        isAr ? 'تم حذف الحساب' : 'Account deleted',
      );
      widget.onLogout?.call();
    } catch (_) {
      if (!mounted) return;
      CustomToast.error(
        context,
        isAr ? 'تعذر حذف الحساب' : 'Could not delete account',
      );
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  void _openInfo(InfoPageType type) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InfoPageScreen(lang: widget.lang, type: type),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: const Color(0xFF090D16),
          elevation: 0,
          title: Text(
            isAr ? 'الملف الشخصي' : 'Customer Profile',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          actions: [
            IconButton(
              tooltip: isAr ? 'تتبع الطلبات' : 'Order Tracker',
              icon: const Icon(Icons.inventory_2_outlined, color: Colors.white70),
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
                      _buildIdentityCard(),
                      const SizedBox(height: 14),
                      if (!isLoggedIn)
                        SizedBox(
                          height: 48,
                          child: OutlinedButton.icon(
                            onPressed: _openAuth,
                            icon: const Icon(Icons.login),
                            label: Text(
                              isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register',
                            ),
                          ),
                        ),
                      if (!isLoggedIn) const SizedBox(height: 14),
                      _buildPersonalDetailsCard(),
                      const SizedBox(height: 18),
                      _buildSavedVehiclesSection(),
                      const SizedBox(height: 18),
                      _buildSupportSection(),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _saveProfileData,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.copper,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isSaving
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  isAr ? 'حفظ البيانات' : 'Save Changes',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (widget.onLogout != null && isLoggedIn)
                        TextButton.icon(
                          onPressed: widget.onLogout,
                          icon: const Icon(
                            Icons.logout,
                            color: AppTheme.danger,
                            size: 18,
                          ),
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
                          onPressed: _deleting ? null : _confirmDeleteAccount,
                          icon: _deleting
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(
                                  Icons.delete_forever,
                                  color: AppTheme.danger,
                                  size: 18,
                                ),
                          label: Text(
                            isAr ? 'حذف الحساب' : 'Delete Account',
                            style: const TextStyle(
                              color: AppTheme.danger,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildSupportSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          _linkTile(
            Icons.info_outline,
            isAr ? 'عن موجود أوتو' : 'About Mawjood Auto',
            () => _openInfo(InfoPageType.about),
          ),
          const Divider(height: 1),
          _linkTile(
            Icons.support_agent,
            isAr ? 'خدمة العملاء' : 'Customer Care',
            () => _openInfo(InfoPageType.care),
          ),
          const Divider(height: 1),
          _linkTile(
            Icons.contact_phone_outlined,
            isAr ? 'تواصل معنا' : 'Contact Us',
            () => _openInfo(InfoPageType.contact),
          ),
          const Divider(height: 1),
          _linkTile(
            Icons.help_outline,
            isAr ? 'الأسئلة الشائعة' : 'FAQ',
            () => _openInfo(InfoPageType.faq),
          ),
        ],
      ),
    );
  }

  Widget _linkTile(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppTheme.copper),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right),
      minVerticalPadding: 16,
      onTap: onTap,
    );
  }

  Widget _buildIdentityCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF090D16), Color(0xFF1F3A5F)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.copper,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white24, width: 2),
            ),
            child: const Center(
              child: Icon(Icons.person, color: Colors.white, size: 30),
            ),
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
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isLoggedIn
                      ? (isAr ? 'مسجّل الدخول' : 'Signed in')
                      : (isAr ? 'زائر' : 'Guest'),
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 4),
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

  Widget _buildPersonalDetailsCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAr ? 'بيانات الاتصال والتوصيل' : 'Contact & Delivery Details',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: isAr ? 'الاسم الكامل' : 'Full Name',
              prefixIcon: const Icon(Icons.badge_outlined, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: isAr ? 'رقم الهاتف' : 'Phone Number',
              prefixIcon: const Icon(Icons.phone_outlined, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _addressController,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: isAr
                  ? 'عنوان التوصيل الافتراضي'
                  : 'Default Delivery Address',
              prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedVehiclesSection() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isAr ? 'كراج سياراتي المحفوظة' : 'My Saved Vehicles',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const Icon(Icons.directions_car_outlined, color: AppTheme.copper),
            ],
          ),
          const SizedBox(height: 12),
          if (_savedVehicles.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Text(
                isAr
                    ? 'لم تقم بتسجيل سيارة بعد. ستُحفظ سيارتك تلقائياً عند مسح الاستمارة.'
                    : 'No vehicles saved yet. Vehicle is saved when scanning Istemara.',
                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
            )
          else
            ..._savedVehicles.map(
              (v) => Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: AppTheme.success, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${v.make} ${v.model} (${v.year})',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
