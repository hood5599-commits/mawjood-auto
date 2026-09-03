import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../config/theme.dart';
import '../main.dart';
import '../widgets/mawjood_logo.dart';
import 'auth_screen.dart';
import 'delivery/orders_to_deliver.dart';

class WelcomeScreen extends StatefulWidget {
  final String lang;
  final VoidCallback? onToggleLang;

  const WelcomeScreen({super.key, this.lang = 'ar', this.onToggleLang});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  VideoPlayerController? _video;
  bool _videoReady = false;
  int _logoTaps = 0;

  bool get isAr => widget.lang == 'ar';

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    try {
      final c = VideoPlayerController.asset('assets/videos/amgvid.mp4');
      await c.initialize();
      await c.setLooping(true);
      await c.setVolume(0);
      await c.play();
      if (!mounted) return;
      setState(() {
        _video = c;
        _videoReady = true;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _video?.dispose();
    super.dispose();
  }

  void _enterShop() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => MainNavigationWrapper(
          lang: widget.lang,
          onToggleLang: widget.onToggleLang ?? () {},
        ),
      ),
    );
  }

  void _openAuth({bool driverMode = false}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AuthScreen(
          lang: widget.lang,
          driverMode: driverMode,
          onToggleLang: widget.onToggleLang,
          onSuccess: (session) {
            Navigator.pop(context);
            if (session.isDriver) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => OrdersToDeliverScreen(
                    lang: widget.lang,
                    session: session,
                  ),
                ),
              );
            } else {
              _enterShop();
            }
          },
        ),
      ),
    );
  }

  void _onLogoTap() {
    _logoTaps++;
    if (_logoTaps >= 7) {
      _logoTaps = 0;
      _openAuth(driverMode: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppTheme.obsidian,
        body: Stack(
          fit: StackFit.expand,
          children: [
            if (_videoReady && _video != null)
              FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _video!.value.size.width,
                  height: _video!.value.size.height,
                  child: VideoPlayer(_video!),
                ),
              )
            else
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF0F172A), Color(0xFF090D16)],
                  ),
                ),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.45),
                    Colors.black.withValues(alpha: 0.82),
                  ],
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: isAr ? Alignment.topLeft : Alignment.topRight,
                      child: TextButton.icon(
                        onPressed: widget.onToggleLang,
                        icon: const Icon(
                          Icons.language,
                          color: Colors.white70,
                          size: 18,
                        ),
                        label: Text(
                          isAr ? 'English' : 'عربي',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: _onLogoTap,
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.35),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.copper.withValues(alpha: 0.5),
                              ),
                            ),
                            child: const MawjoodLogo(size: 72),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            isAr ? 'موجود أوتو' : 'Mawjood Auto',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isAr
                                ? 'قطع غيار أصلية بالتوافق الدقيق والتوصيل السريع في قطر'
                                : 'Genuine parts with precise fitment & fast delivery in Qatar',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13.5,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _enterShop,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.copper,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          isAr ? 'تصفح القطع' : 'Browse Parts',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 54,
                      child: OutlinedButton(
                        onPressed: () => _openAuth(),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white54),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          isAr ? 'تسجيل الدخول' : 'Sign In',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
