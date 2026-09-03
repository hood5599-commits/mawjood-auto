import 'package:flutter/material.dart';

import '../config/theme.dart';
import '../services/auth_service.dart';
import '../widgets/mawjood_logo.dart';

enum _AuthTab { login, register }

class AuthScreen extends StatefulWidget {
  final String lang;
  final bool driverMode;
  final VoidCallback? onToggleLang;
  final void Function(AuthSession session) onSuccess;

  const AuthScreen({
    super.key,
    this.lang = 'ar',
    this.driverMode = false,
    this.onToggleLang,
    required this.onSuccess,
  });

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  _AuthTab _tab = _AuthTab.login;
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _obscure = true;

  bool get isAr => widget.lang == 'ar';

  @override
  void dispose() {
    _idCtrl.dispose();
    _passCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final AuthSession session;
      if (_tab == _AuthTab.login) {
        session = await AuthService().login(
          identifier: _idCtrl.text,
          password: _passCtrl.text,
        );
      } else {
        session = await AuthService().registerCustomer(
          identifier: _idCtrl.text,
          password: _passCtrl.text,
          fullName: _nameCtrl.text.trim(),
        );
      }

      if (widget.driverMode && !session.isDriver) {
        await AuthService().clearSession();
        throw Exception('not_driver');
      }
      if (!widget.driverMode && session.isDriver) {
        // Allow driver credentials only via driver backstage entry
        await AuthService().clearSession();
        throw Exception('use_driver_portal');
      }

      if (!mounted) return;
      widget.onSuccess(session);
    } catch (e) {
      final msg = e.toString();
      setState(() {
        if (msg.contains('not_driver')) {
          _error = isAr
              ? 'هذه البيانات ليست لحساب مندوب'
              : 'Not a driver account';
        } else if (msg.contains('use_driver_portal')) {
          _error = isAr
              ? 'استخدم بوابة المندوب للدخول بهذا الحساب'
              : 'Use the driver portal for this account';
        } else if (msg.contains('invalid_credentials')) {
          _error = isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials';
        } else {
          _error = isAr ? 'تعذر إكمال العملية' : 'Operation failed';
        }
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: AppTheme.obsidian,
          title: Text(
            widget.driverMode
                ? (isAr ? 'دخول المندوب' : 'Driver Login')
                : (isAr ? 'تسجيل الدخول' : 'Sign In'),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          actions: [
            if (widget.onToggleLang != null)
              TextButton(
                onPressed: widget.onToggleLang,
                child: Text(
                  isAr ? 'EN' : 'عربي',
                  style: const TextStyle(color: Colors.white70),
                ),
              ),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: AppTheme.obsidian,
                        shape: BoxShape.circle,
                      ),
                      child: const MawjoodLogo(size: 56),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isAr
                          ? 'أهلاً بك في بوابة موجود أوتو'
                          : 'Welcome to Mawjood Auto',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (!widget.driverMode) _buildTabs(),
                    const SizedBox(height: 18),
                    if (_tab == _AuthTab.register && !widget.driverMode) ...[
                      TextField(
                        controller: _nameCtrl,
                        decoration: InputDecoration(
                          labelText: isAr ? 'الاسم الكامل' : 'Full Name',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    TextField(
                      controller: _idCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: isAr
                            ? 'البريد أو رقم الجوال'
                            : 'Email or Phone',
                        hintText: isAr ? 'مثال: 55000000' : 'e.g. 55000000',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: isAr ? 'كلمة المرور' : 'Password',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        suffixIcon: IconButton(
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: AppTheme.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: widget.driverMode
                              ? const Color(0xFF1F3A5F)
                              : AppTheme.copper,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                _tab == _AuthTab.login
                                    ? (isAr ? 'تسجيل الدخول' : 'Sign In')
                                    : (isAr
                                        ? 'إنشاء حساب'
                                        : 'Create Account'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          _tabBtn(_AuthTab.login, isAr ? 'دخول' : 'Sign In'),
          _tabBtn(_AuthTab.register, isAr ? 'تسجيل' : 'Register'),
        ],
      ),
    );
  }

  Widget _tabBtn(_AuthTab tab, String label) {
    final selected = _tab == tab;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() {
          _tab = tab;
          _error = null;
        }),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF1F3A5F) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : const Color(0xFF64748B),
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
