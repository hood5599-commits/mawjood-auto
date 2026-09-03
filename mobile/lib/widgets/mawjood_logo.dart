import 'package:flutter/material.dart';

/// Official Mawjood Auto mark (hexagon + M) matching web Logo.tsx
class MawjoodLogo extends StatelessWidget {
  final double size;

  const MawjoodLogo({super.key, this.size = 48});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _MawjoodLogoPainter()),
    );
  }
}

class _MawjoodLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.07
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFFDD6B20);

    final path = Path();
    final w = size.width;
    final h = size.height;
    path.moveTo(w * 0.50, h * 0.05);
    path.lineTo(w * 0.90, h * 0.27);
    path.lineTo(w * 0.90, h * 0.73);
    path.lineTo(w * 0.50, h * 0.95);
    path.lineTo(w * 0.10, h * 0.73);
    path.lineTo(w * 0.10, h * 0.27);
    path.close();
    canvas.drawPath(path, stroke);

    final m = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.08
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round
      ..color = Colors.white;

    final mPath = Path();
    mPath.moveTo(w * 0.28, h * 0.70);
    mPath.lineTo(w * 0.28, h * 0.40);
    mPath.lineTo(w * 0.50, h * 0.58);
    mPath.lineTo(w * 0.72, h * 0.40);
    mPath.lineTo(w * 0.72, h * 0.70);
    canvas.drawPath(mPath, m);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
