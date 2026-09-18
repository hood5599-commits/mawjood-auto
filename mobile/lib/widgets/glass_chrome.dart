import 'dart:ui';

import 'package:flutter/material.dart';

import '../config/theme.dart';

/// Floating frosted dock for main customer tabs.
class FloatingGlassNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<FloatingGlassNavItem> items;

  const FloatingGlassNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + (bottom > 0 ? 0 : 4)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            height: 68,
            decoration: BoxDecoration(
              color: dark
                  ? const Color(0xCC0E1B2E)
                  : Colors.white.withValues(alpha: 0.82),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: dark
                    ? Colors.white.withValues(alpha: 0.10)
                    : Colors.white.withValues(alpha: 0.55),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: dark ? 0.45 : 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                for (var i = 0; i < items.length; i++)
                  Expanded(
                    child: _NavTile(
                      item: items[i],
                      selected: currentIndex == i,
                      onTap: () => onTap(i),
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

class FloatingGlassNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const FloatingGlassNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _NavTile extends StatelessWidget {
  final FloatingGlassNavItem item;
  final bool selected;
  final VoidCallback onTap;

  const _NavTile({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final color = selected
        ? AppTheme.copper
        : (dark ? Colors.white54 : const Color(0xFF94A3B8));

    return TactileScale(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: selected ? AppTheme.papayaGlow : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              selected ? item.activeIcon : item.icon,
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            item.label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              color: color,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}

/// Circular frosted-glass back control.
class GlassBackButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Color? iconColor;

  const GlassBackButton({super.key, this.onPressed, this.iconColor});

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return TactileScale(
      onTap: onPressed ?? () => Navigator.of(context).maybePop(),
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dark
                  ? Colors.white.withValues(alpha: 0.10)
                  : Colors.white.withValues(alpha: 0.72),
              border: Border.all(
                color: dark
                    ? Colors.white.withValues(alpha: 0.14)
                    : Colors.black.withValues(alpha: 0.06),
              ),
            ),
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              size: 16,
              color: iconColor ??
                  (dark ? AppTheme.textWhite : AppTheme.navy),
            ),
          ),
        ),
      ),
    );
  }
}

/// Spring scale-to-0.97 tactile press feedback.
class TactileScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedScale;

  const TactileScale({
    super.key,
    required this.child,
    this.onTap,
    this.pressedScale = 0.97,
  });

  @override
  State<TactileScale> createState() => _TactileScaleState();
}

class _TactileScaleState extends State<TactileScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

/// Theme-aware surface card with premium automotive geometry.
class PremiumSurfaceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double radius;
  final VoidCallback? onTap;

  const PremiumSurfaceCard({
    super.key,
    required this.child,
    this.padding,
    this.radius = 18,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final body = Container(
      padding: padding,
      decoration: AppTheme.cardDecoration(context, radius: radius),
      child: child,
    );
    if (onTap == null) return body;
    return TactileScale(onTap: onTap, child: body);
  }
}
