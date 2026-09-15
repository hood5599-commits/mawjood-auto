import 'package:flutter/material.dart';

import '../main.dart';
import '../screens/delivery/orders_to_deliver.dart';
import '../screens/garage/garage_portal_screen.dart';
import 'auth_service.dart';

/// Backstage role routing after a successful unified login.
class RoleRouter {
  /// Replaces the entire stack with the destination for [session]'s role.
  static void goHome(
    BuildContext context, {
    required AuthSession session,
    required String lang,
    VoidCallback? onToggleLang,
  }) {
    final Widget dest;
    if (session.isDriver) {
      dest = OrdersToDeliverScreen(lang: lang, session: session);
    } else if (session.isGarage) {
      dest = GaragePortalScreen(lang: lang, session: session);
    } else {
      dest = MainNavigationWrapper(
        lang: lang,
        onToggleLang: onToggleLang ?? () {},
      );
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => dest),
      (_) => false,
    );
  }

  /// Used when login happens from a nested route (AuthGate / Profile).
  /// Returns `true` if the user was redirected away from the customer app.
  static bool redirectIfStaff(
    BuildContext context, {
    required String lang,
    VoidCallback? onToggleLang,
  }) {
    final session = AuthService().session;
    if (session == null || !session.isLoggedIn) return false;
    if (!session.isDriver && !session.isGarage) return false;

    goHome(
      context,
      session: session,
      lang: lang,
      onToggleLang: onToggleLang,
    );
    return true;
  }

  /// Cold-start restore widget if session is driver/garage; otherwise null.
  static Widget? homeForSession({
    required AuthSession? session,
    required String lang,
    VoidCallback? onToggleLang,
  }) {
    if (session == null || !session.isLoggedIn) return null;
    if (session.isDriver) {
      return OrdersToDeliverScreen(lang: lang, session: session);
    }
    if (session.isGarage) {
      return GaragePortalScreen(lang: lang, session: session);
    }
    return null;
  }
}
