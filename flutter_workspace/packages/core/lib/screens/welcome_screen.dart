import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'main_layout.dart';

class WelcomeScreen extends StatelessWidget {
  final bool isAuthenticated;
  const WelcomeScreen({super.key, required this.isAuthenticated});

  void _startJourney(BuildContext context) {
    if (isAuthenticated) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const MainLayout(),
          transitionsBuilder: (_, anim, __, child) =>
              FadeTransition(opacity: anim, child: child),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const LoginScreen(),
          transitionsBuilder: (_, anim, __, child) =>
              FadeTransition(opacity: anim, child: child),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D47A1),
      body: _WelcomeBody(onStart: () => _startJourney(context)),
    );
  }
}

// ─────────────────────── Welcome Body ───────────────────────
class _WelcomeBody extends StatefulWidget {
  final VoidCallback onStart;
  const _WelcomeBody({required this.onStart});

  @override
  State<_WelcomeBody> createState() => _WelcomeBodyState();
}

class _WelcomeBodyState extends State<_WelcomeBody>
    with TickerProviderStateMixin {
  late AnimationController _bgCtrl;
  late AnimationController _contentCtrl;
  late AnimationController _shimmerCtrl;
  late Animation<double> _bgAnim;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _shimmerAnim;

  @override
  void initState() {
    super.initState();

    _bgCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);

    _contentCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..forward();

    _shimmerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    _bgAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _bgCtrl, curve: Curves.easeInOut),
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _contentCtrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOut),
      ),
    );

    _slideAnim =
        Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _contentCtrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    _shimmerAnim = Tween<double>(begin: -1.2, end: 2.2).animate(
      CurvedAnimation(parent: _shimmerCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _contentCtrl.dispose();
    _shimmerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return AnimatedBuilder(
      animation: _bgAnim,
      builder: (_, __) => Stack(
        children: [
          // ── Vibrant Colorful Gradient Canvas ────────────────────────
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFF0284C7), // Sky blue top
                    Color(0xFF0369A1), // Deep cyan
                    Color(0xFF1D4ED8), // Vibrant Royal blue
                    Color(0xFF1E1B4B), // Deep night blue bottom
                  ],
                  stops: [0.0, 0.25, 0.65, 1.0],
                ),
              ),
            ),
          ),

          // ── Colorful Organic Wave Blobs (Top & Bottom accents) ───────
          // Top Yellow/Gold accent blob
          Positioned(
            top: -size.height * 0.08,
            right: -size.width * 0.18,
            child: Transform.rotate(
              angle: 0.4 + _bgAnim.value * 0.1,
              child: Container(
                width: size.width * 0.65,
                height: size.width * 0.65,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFBBF24).withOpacity(0.45),
                      const Color(0xFFF59E0B).withOpacity(0.25),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Top Left Cyan accent blob
          Positioned(
            top: -size.height * 0.05,
            left: -size.width * 0.2,
            child: Container(
              width: size.width * 0.6,
              height: size.width * 0.6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF38BDF8).withOpacity(0.4),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Bottom Magenta & Purple Vibrant Wave Blobs
          Positioned(
            bottom: -size.height * 0.08,
            left: -size.width * 0.2,
            child: Container(
              width: size.width * 0.75,
              height: size.width * 0.75,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFEC4899).withOpacity(0.35),
                    const Color(0xFF8B5CF6).withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Positioned(
            bottom: -size.height * 0.06,
            right: -size.width * 0.15,
            child: Container(
              width: size.width * 0.7,
              height: size.width * 0.7,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFF59E0B).withOpacity(0.3),
                    const Color(0xFFEF4444).withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Playful Education Doodles Background ─────────────────────
          ...List.generate(
            _doodles.length,
            (index) => _FloatingDoodle(
              doodle: _doodles[index],
              screenSize: size,
              animationValue: _bgAnim.value,
            ),
          ),

          // ── Foreground Content ──────────────────────────────────────
          SafeArea(
            child: SlideTransition(
              position: _slideAnim,
              child: FadeTransition(
                opacity: _fadeAnim,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      const SizedBox(height: 16),

                      // Top Small Pill Badge
                      _TopWelcomePill(),

                      const Spacer(flex: 2),

                      // Animated Logo with Vibrant Glowing Solar Ring
                      const _VibrantLogoSection(),

                      const SizedBox(height: 28),

                      // Bold School Name with Golden Accent Wings
                      _VibrantSchoolTitle(shimmerAnim: _shimmerAnim),

                      const SizedBox(height: 18),

                      // Empowering Minds Tagline Banner
                      const _TaglineBanner(),

                      const Spacer(flex: 3),

                      // Inspiring Quote Card (Modern Glass)
                      const _InspirationCard(),

                      const Spacer(flex: 2),

                      // Bottom "Start" CTA Button with Safe Area
                      SafeArea(
                        top: false,
                        bottom: true,
                        child: Padding(
                          padding: EdgeInsets.only(
                            bottom: MediaQuery.of(context).padding.bottom > 0 ? 4 : 14,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _VibrantStartButton(onPressed: widget.onStart),
                              const SizedBox(height: 12),
                              // Footer Subtitle with accents
                              _BottomFooterLine(),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Top Welcome Pill ────────────────────────
class _TopWelcomePill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.16),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Color(0xFFFDE047), // Gold dot
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Smart School Portal',
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Vibrant Logo Section ────────────────────
class _VibrantLogoSection extends StatefulWidget {
  const _VibrantLogoSection();

  @override
  State<_VibrantLogoSection> createState() => _VibrantLogoSectionState();
}

class _VibrantLogoSectionState extends State<_VibrantLogoSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _float;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _float = Tween<double>(begin: -8.0, end: 8.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );

    _pulse = Tween<double>(begin: 0.96, end: 1.05).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, _float.value),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer Glowing Sunburst Ring
            Transform.scale(
              scale: _pulse.value,
              child: Container(
                width: 155,
                height: 155,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFBBF24).withOpacity(0.55),
                      const Color(0xFF38BDF8).withOpacity(0.25),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // Mid Colorful Ring
            Container(
              width: 135,
              height: 135,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFFF59E0B),
                    Color(0xFF38BDF8),
                    Color(0xFF8B5CF6),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0284C7).withOpacity(0.5),
                    blurRadius: 25,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(3.5),
              child: Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF0F172A),
                ),
                child: ClipOval(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.school_rounded,
                        size: 60,
                        color: Color(0xFFFBBF24),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────── Vibrant School Title ────────────────────
class _VibrantSchoolTitle extends StatelessWidget {
  final Animation<double> shimmerAnim;
  const _VibrantSchoolTitle({required this.shimmerAnim});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Bold SRI VENKATESWARA with Stylish Wing Accents
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Left Accent Wing
            Container(
              width: 24,
              height: 3,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.transparent, Color(0xFFFDE047)],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            // Text
            Text(
              'SRI VENKATESWARA',
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                letterSpacing: 4.0,
                color: const Color(0xFFFDE047), // Bright Gold
                shadows: [
                  Shadow(
                    color: Colors.black.withOpacity(0.4),
                    offset: const Offset(0, 2),
                    blurRadius: 4,
                  ),
                ],
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(width: 8),
            // Right Accent Wing
            Container(
              width: 24,
              height: 3,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFDE047), Colors.transparent],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // Responsive Big JY SCHOOL with Dual-tone 3D pop
        AnimatedBuilder(
          animation: shimmerAnim,
          builder: (_, __) {
            return ShaderMask(
              shaderCallback: (bounds) {
                return LinearGradient(
                  begin: Alignment(-1.5 + shimmerAnim.value * 0.5, 0),
                  end: Alignment(-0.3 + shimmerAnim.value * 0.5, 0),
                  colors: const [
                    Color(0xFFFBBF24), // Golden Amber
                    Color(0xFFFFFBEB), // Sparkling Pure White
                    Color(0xFFF59E0B), // Warm Gold
                    Color(0xFFFBBF24), // Golden Amber
                  ],
                  stops: const [0.0, 0.45, 0.65, 1.0],
                ).createShader(bounds);
              },
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'JY SCHOOL',
                  style: GoogleFonts.outfit(
                    fontSize: 58,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2.5,
                    height: 1.05,
                    shadows: [
                      Shadow(
                        color: const Color(0xFF0F172A).withOpacity(0.8),
                        offset: const Offset(0, 4),
                        blurRadius: 12,
                      ),
                      Shadow(
                        color: const Color(0xFF1E3A8A).withOpacity(0.9),
                        offset: const Offset(0, 8),
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  maxLines: 1,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

// ─────────────────────── Tagline Banner ──────────────────────────
class _TaglineBanner extends StatelessWidget {
  const _TaglineBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFFE11D48), // Rose Crimson
            Color(0xFFBE123C), // Deep Ruby
            Color(0xFF9333EA), // Purple Violet
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: const Color(0xFFFDE047).withOpacity(0.8),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withOpacity(0.45),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, color: Color(0xFFFDE047), size: 16),
          const SizedBox(width: 8),
          Text(
            'EMPOWERING MINDS • SHAPING FUTURE',
            style: GoogleFonts.outfit(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 1.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(width: 8),
          const Icon(Icons.star_rounded, color: Color(0xFFFDE047), size: 16),
        ],
      ),
    );
  }
}

// ─────────────────────── Inspiration Glass Card ───────────────────
class _InspirationCard extends StatelessWidget {
  const _InspirationCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: Colors.white.withOpacity(0.25),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Row(
            children: [
              // Vibrant Icon Badge
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFEA580C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFEA580C).withOpacity(0.4),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              // Motivational Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Excellence & Values',
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFFDE047),
                        letterSpacing: 0.4,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Empowering students with knowledge, discipline & limitless potential.',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.9),
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
      ),
    );
  }
}

// ─────────────────────── Vibrant Start Button ────────────────────
class _VibrantStartButton extends StatefulWidget {
  final VoidCallback onPressed;
  const _VibrantStartButton({required this.onPressed});

  @override
  State<_VibrantStartButton> createState() => _VibrantStartButtonState();
}

class _VibrantStartButtonState extends State<_VibrantStartButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scale = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onTapDown(_) => _ctrl.forward();
  void _onTapUp(_) {
    _ctrl.reverse();
    widget.onPressed();
  }
  void _onTapCancel() => _ctrl.reverse();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: double.infinity,
          height: 60,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: const LinearGradient(
              colors: [
                Color(0xFFFF7A00), // Vibrant Orange
                Color(0xFFE11D48), // Rose Berry
                Color(0xFF9333EA), // Royal Violet
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF7A00).withOpacity(0.4),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
              BoxShadow(
                color: const Color(0xFFE11D48).withOpacity(0.35),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
            border: Border.all(
              color: Colors.white.withOpacity(0.35),
              width: 1.5,
            ),
          ),
          child: Stack(
            children: [
              // Top Specular Shine
              Positioned(
                top: 0,
                left: 20,
                right: 20,
                child: Container(
                  height: 1.5,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.white.withOpacity(0.0),
                        Colors.white.withOpacity(0.7),
                        Colors.white.withOpacity(0.0),
                      ],
                    ),
                  ),
                ),
              ),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Start',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 2.0,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.35),
                            offset: const Offset(0, 2),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Circular Glowing Arrow Container
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.arrow_forward_rounded,
                        color: Color(0xFFE11D48),
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────── Bottom Footer Line ──────────────────────
class _BottomFooterLine extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 16,
          height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFFFDE047).withOpacity(0.7),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          'YOUR JOURNEY TOWARDS SUCCESS BEGINS HERE',
          style: GoogleFonts.outfit(
            fontSize: 9.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
            color: Colors.white.withOpacity(0.85),
          ),
        ),
        const SizedBox(width: 6),
        Container(
          width: 16,
          height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFFFDE047).withOpacity(0.7),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────── Floating Education Doodles ──────────────
class _DoodleData {
  final IconData icon;
  final double xPercent;
  final double yPercent;
  final double size;
  final double baseOpacity;
  final Color color;

  const _DoodleData({
    required this.icon,
    required this.xPercent,
    required this.yPercent,
    required this.size,
    required this.baseOpacity,
    required this.color,
  });
}

final List<_DoodleData> _doodles = [
  const _DoodleData(
    icon: Icons.send_rounded, // Paper plane
    xPercent: 0.12,
    yPercent: 0.09,
    size: 32,
    baseOpacity: 0.22,
    color: Color(0xFF38BDF8),
  ),
  const _DoodleData(
    icon: Icons.lightbulb_outline_rounded,
    xPercent: 0.85,
    yPercent: 0.10,
    size: 34,
    baseOpacity: 0.25,
    color: Color(0xFFFDE047),
  ),
  const _DoodleData(
    icon: Icons.menu_book_rounded,
    xPercent: 0.88,
    yPercent: 0.21,
    size: 30,
    baseOpacity: 0.20,
    color: Color(0xFF38BDF8),
  ),
  const _DoodleData(
    icon: Icons.science_outlined,
    xPercent: 0.08,
    yPercent: 0.22,
    size: 28,
    baseOpacity: 0.20,
    color: Color(0xFF4ADE80),
  ),
  const _DoodleData(
    icon: Icons.emoji_events_outlined,
    xPercent: 0.14,
    yPercent: 0.52,
    size: 26,
    baseOpacity: 0.18,
    color: Color(0xFFFDE047),
  ),
  const _DoodleData(
    icon: Icons.school_outlined,
    xPercent: 0.86,
    yPercent: 0.54,
    size: 28,
    baseOpacity: 0.18,
    color: Color(0xFFF472B6),
  ),
  const _DoodleData(
    icon: Icons.calculate_outlined,
    xPercent: 0.09,
    yPercent: 0.68,
    size: 26,
    baseOpacity: 0.16,
    color: Color(0xFF38BDF8),
  ),
  const _DoodleData(
    icon: Icons.edit_note_rounded,
    xPercent: 0.87,
    yPercent: 0.69,
    size: 28,
    baseOpacity: 0.18,
    color: Color(0xFFFDE047),
  ),
];

class _FloatingDoodle extends StatelessWidget {
  final _DoodleData doodle;
  final Size screenSize;
  final double animationValue;

  const _FloatingDoodle({
    required this.doodle,
    required this.screenSize,
    required this.animationValue,
  });

  @override
  Widget build(BuildContext context) {
    final floatY = math.sin(animationValue * math.pi * 2 + doodle.xPercent * 10) * 8;
    final floatX = math.cos(animationValue * math.pi * 2 + doodle.yPercent * 10) * 5;

    return Positioned(
      left: doodle.xPercent * screenSize.width + floatX,
      top: doodle.yPercent * screenSize.height + floatY,
      child: Icon(
        doodle.icon,
        size: doodle.size,
        color: doodle.color.withOpacity(doodle.baseOpacity),
      ),
    );
  }
}
