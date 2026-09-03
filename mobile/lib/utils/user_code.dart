import 'dart:math';

enum UserRole { customer, garage, delivery }

class UserCodeHelper {
  /// توليد أو جلب كود فريد للحساب
  static String getOrGenerateUserCode({
    String? existingUserCode,
    UserRole role = UserRole.customer,
  }) {
    if (existingUserCode != null && existingUserCode.trim().isNotEmpty) {
      return existingUserCode.trim();
    }

    final prefix = switch (role) {
      UserRole.garage => 'GAR',
      UserRole.delivery => 'DEL',
      UserRole.customer => 'CUST',
    };

    final random = Random();
    final randomNumber =
        10000 + random.nextInt(90000); // رقم من 5 خانات بين 10000 و 99999
    return '$prefix-$randomNumber';
  }

  /// دالة مساعدة تقرأ مباشرة من بيانات الجلسة (Session Map)
  static String fromSession(
    Map<String, dynamic>? session, {
    String role = 'customer',
  }) {
    if (session != null && session['user_code'] != null) {
      final code = session['user_code'].toString();
      if (code.isNotEmpty) return code;
    }

    final cleanRole = role.toLowerCase();
    final prefix = (cleanRole == 'garage')
        ? 'GAR'
        : (cleanRole == 'delivery')
        ? 'DEL'
        : 'CUST';

    final random = Random();
    final randomNumber = 10000 + random.nextInt(90000);
    return '$prefix-$randomNumber';
  }
}
