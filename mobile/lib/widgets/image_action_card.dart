import 'package:flutter/material.dart';

import '../config/theme.dart';
import 'glass_chrome.dart';

/// Full-bleed action card with DecorationImage + navy contrast overlay.
class ImageActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final String? assetImage;
  final String? networkImage;
  final double height;
  final Widget? badge;
  final EdgeInsetsGeometry padding;

  const ImageActionCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.assetImage,
    this.networkImage,
    this.height = 148,
    this.badge,
    this.padding = const EdgeInsets.all(16),
  });

  DecorationImage? get _bg {
    if (assetImage != null && assetImage!.isNotEmpty) {
      return DecorationImage(
        image: AssetImage(assetImage!),
        fit: BoxFit.cover,
      );
    }
    if (networkImage != null && networkImage!.isNotEmpty) {
      return DecorationImage(
        image: NetworkImage(networkImage!),
        fit: BoxFit.cover,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return TactileScale(
      onTap: onTap,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: AppTheme.navy,
          image: _bg,
          boxShadow: AppTheme.cardShadow(Theme.of(context).brightness),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Contrast safety overlay (WCAG AA) — navy gradient over image.
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x990B192C),
                    Color(0xE60B192C),
                    Color(0xF20B192C),
                  ],
                ),
              ),
            ),
            Padding(
              padding: padding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.copper.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.copper.withValues(alpha: 0.55),
                          ),
                        ),
                        child: Icon(icon, color: AppTheme.copper, size: 22),
                      ),
                      const Spacer(),
                      ?badge,
                    ],
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 15.5,
                      height: 1.25,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.78),
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      height: 1.35,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
