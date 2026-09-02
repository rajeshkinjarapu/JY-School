import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'main_layout.dart';

// ═══════════════════════════════════════════════════════════════════
//  JY SCHOOL – ULTRA CLEAN & BRIGHT PREMIUM WELCOME SCREEN
// ═══════════════════════════════════════════════════════════════════

class WelcomeScreen extends StatelessWidget {
  final bool isAuthenticated;
  const WelcomeScreen({super.key, required this.isAuthenticated});

  void _startJourney(BuildContext context) {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) =>
            isAuthenticated ? const MainLayout() : const LoginScreen(),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _WelcomeBody(onStart: () => _startJourney(context)),
    );
  }
}

// ─────────────────────── Welcome Body ───────────────────────────
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
      duration: const Duration(milliseconds: 900),
    )..forward();

    _shimmerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();

    _bgAnim = CurvedAnimation(parent: _bgCtrl, curve: Curves.easeInOut);

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _contentCtrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOut),
      ),
    );

    _slideAnim =
        Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _contentCtrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    _shimmerAnim = Tween<double>(begin: -1.5, end: 2.5).animate(
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
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return AnimatedBuilder(
      animation: _bgAnim,
      builder: (_, __) => Stack(
        children: [
          // ── Layer 1: Clean Light Pearl & Sky Gradient ───────────────
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFFEFF6FF), // Soft Sky Blue
                    Color(0xFFF8FAFC), // Pure Pearl Slate
                    Color(0xFFF1F5F9), // Light Slate
                    Color(0xFFFFFFFF), // Crisp White Bottom
                  ],
                  stops: [0.0, 0.35, 0.70, 1.0],
                ),
              ),
            ),
          ),

          // ── Layer 2: Soft Radiant Pastel Aura Glows ─────────────────
          // Top-right soft amber sun aura
          Positioned(
            top: -size.height * 0.08,
            right: -size.width * 0.15,
            child: Container(
              width: size.width * 0.75,
              height: size.width * 0.75,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFFDE68A).withOpacity(0.40 + 0.10 * _bgAnim.value),
                    const Color(0xFFFEF3C7).withOpacity(0.20),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Top-left soft cyan sky aura
          Positioned(
            top: size.height * 0.04,
            left: -size.width * 0.20,
            child: Container(
              width: size.width * 0.70,
              height: size.width * 0.70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFBAE6FD).withOpacity(0.45 + 0.10 * _bgAnim.value),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Bottom soft lavender / pink aura
          Positioned(
            bottom: -size.height * 0.06,
            left: size.width * 0.10,
            child: Container(
              width: size.width * 0.80,
              height: size.width * 0.80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFDDD6FE).withOpacity(0.35 + 0.08 * _bgAnim.value),
                    const Color(0xFFFCE7F3).withOpacity(0.25),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Layer 3: Subtle Educational Accent Icons ────────────────
          ..._buildFloatingAccents(size),

          // ── Layer 4: Main Structured Content ─────────────────────────
          SafeArea(
            child: SlideTransition(
              position: _slideAnim,
              child: FadeTransition(
                opacity: _fadeAnim,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // 1. Top Mini Badge
                      const _TopBadge(),

                      const Spacer(flex: 2),

                      // 2. Animated Floating School Crest / Logo
                      const _SchoolLogoSection(),

                      const SizedBox(height: 18),

                      // 3. School Branding: SRI VENKATESWARA + JY SCHOOL (Single Line)
                      _SchoolTitle(shimmerAnim: _shimmerAnim),

                      const SizedBox(height: 10),

                      // 4. Tagline Pill Banner
                      const _TaglineBadge(),

                      const SizedBox(height: 20),

                      // 5. Clean, Sleek Welcome Card (Moved Upwards)
                      const _CleanWelcomeCard(),

                      const Spacer(flex: 3),

                      // 6. Action: "Start" CTA Button (Protected with strict SafeArea & Bottom Buffer)
                      SafeArea(
                        top: false,
                        bottom: true,
                        child: Padding(
                          padding: EdgeInsets.only(
                            bottom: math.max(bottomInset, 16.0) + 20.0,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _StartButton(onPressed: widget.onStart),
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

  List<Widget> _buildFloatingAccents(Size size) {
    const accents = [
      (Icons.send_rounded, 0.12, 0.10, 24.0, Color(0xFF0284C7), 0.25),
      (Icons.lightbulb_outline_rounded, 0.86, 0.12, 26.0, Color(0xFFD97706), 0.30),
      (Icons.school_outlined, 0.08, 0.38, 24.0, Color(0xFF4F46E5), 0.22),
      (Icons.emoji_events_outlined, 0.88, 0.40, 24.0, Color(0xFFD97706), 0.28),
      (Icons.menu_book_rounded, 0.10, 0.62, 22.0, Color(0xFFDB2777), 0.22),
      (Icons.stars_rounded, 0.86, 0.64, 22.0, Color(0xFF0284C7), 0.25),
    ];

    return accents.map((acc) {
      final floatY = math.sin(_bgAnim.value * math.pi * 2 + acc.$2 * 10) * 6;
      final floatX = math.cos(_bgAnim.value * math.pi * 2 + acc.$3 * 10) * 4;
      return Positioned(
        left: acc.$2 * size.width + floatX,
        top: acc.$3 * size.height + floatY,
        child: Icon(
          acc.$1,
          size: acc.$4,
          color: acc.$5.withOpacity(acc.$6),
        ),
      );
    }).toList();
  }
}

// ─────────────────────── Top Badge ───────────────────────────────
class _TopBadge extends StatelessWidget {
  const _TopBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
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
              color: Color(0xFF10B981), // Green Live Indicator
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Official School ERP Portal',
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF334155), // Slate 700
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── School Logo Section ─────────────────────
class _SchoolLogoSection extends StatefulWidget {
  const _SchoolLogoSection();

  @override
  State<_SchoolLogoSection> createState() => _SchoolLogoSectionState();
}

class _SchoolLogoSectionState extends State<_SchoolLogoSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _floatCtrl;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _floatAnim = Tween<double>(begin: -6.0, end: 6.0).animate(
      CurvedAnimation(parent: _floatCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _floatCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _floatAnim,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, _floatAnim.value),
        child: Container(
          width: 130,
          height: 130,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFF59E0B).withOpacity(0.25),
                blurRadius: 24,
                spreadRadius: 2,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/logo.png',
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(
              Icons.school_rounded,
              size: 75,
              color: Color(0xFF1E40AF),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────── School Title ────────────────────────────
class _SchoolTitle extends StatelessWidget {
  final Animation<double> shimmerAnim;
  const _SchoolTitle({required this.shimmerAnim});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Bold SRI VENKATESWARA with Golden Wings
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 24,
              height: 2.5,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.transparent, Color(0xFFD97706)],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'SRI VENKATESWARA',
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                letterSpacing: 4.0,
                color: const Color(0xFF1E293B), // Deep Slate 800
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
            ),
            const SizedBox(width: 8),
            Container(
              width: 24,
              height: 2.5,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFD97706), Colors.transparent],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),

        const SizedBox(height: 6),

        // Responsive Grand "JY SCHOOL" (Guaranteed 1 line)
        AnimatedBuilder(
          animation: shimmerAnim,
          builder: (_, __) {
            return ShaderMask(
              shaderCallback: (bounds) {
                return LinearGradient(
                  begin: Alignment(-1.5 + shimmerAnim.value * 0.5, 0),
                  end: Alignment(-0.3 + shimmerAnim.value * 0.5, 0),
                  colors: const [
                    Color(0xFF1D4ED8), // Royal Blue
                    Color(0xFF4F46E5), // Indigo
                    Color(0xFFDB2777), // Pink Rose
                    Color(0xFF1D4ED8), // Royal Blue
                  ],
                  stops: const [0.0, 0.45, 0.65, 1.0],
                ).createShader(bounds);
              },
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'JY SCHOOL',
                  style: GoogleFonts.outfit(
                    fontSize: 57,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2.0,
                    height: 1.05,
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

// ─────────────────────── Tagline Badge ───────────────────────────
class _TaglineBadge extends StatelessWidget {
  const _TaglineBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
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
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withOpacity(0.35),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, color: Color(0xFFFDE047), size: 15),
          const SizedBox(width: 6),
          Text(
            'EMPOWERING MINDS • SHAPING FUTURE',
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 1.1,
            ),
            maxLines: 1,
          ),
          const SizedBox(width: 6),
          const Icon(Icons.star_rounded, color: Color(0xFFFDE047), size: 15),
        ],
      ),
    );
  }
}

// ─────────────────────── Clean Welcome Card ───────────────────────
class _CleanWelcomeCard extends StatelessWidget {
  const _CleanWelcomeCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Welcome to Digital Campus',
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF1E3A8A), // Deep Navy
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Access live attendance, academic records, fee receipts & seamless communications in one secure portal.',
            style: GoogleFonts.poppins(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B), // Slate 500
              height: 1.4,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 14),
          // Feature Pill Badges
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              _MiniFeaturePill(
                icon: Icons.flash_on_rounded,
                text: 'Fast & Live',
                color: Color(0xFF0284C7),
              ),
              SizedBox(width: 8),
              _MiniFeaturePill(
                icon: Icons.shield_rounded,
                text: 'Secure',
                color: Color(0xFF10B981),
              ),
              SizedBox(width: 8),
              _MiniFeaturePill(
                icon: Icons.cloud_done_rounded,
                text: 'Real-time',
                color: Color(0xFF8B5CF6),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniFeaturePill extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  const _MiniFeaturePill({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 13),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Start CTA Button ────────────────────────
class _StartButton extends StatefulWidget {
  final VoidCallback onPressed;
  const _StartButton({required this.onPressed});

  @override
  State<_StartButton> createState() => _StartButtonState();
}

class _StartButtonState extends State<_StartButton>
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
          height: 58,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: const LinearGradient(
              colors: [
                Color(0xFF2563EB), // Vibrant Royal Blue
                Color(0xFF4F46E5), // Electric Indigo
                Color(0xFF7C3AED), // Violet
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB).withOpacity(0.35),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
              BoxShadow(
                color: const Color(0xFF4F46E5).withOpacity(0.25),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
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
                ),
              ),
              const SizedBox(width: 12),
              // White Circle with Arrow
              Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.arrow_forward_rounded,
                  color: Color(0xFF2563EB),
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────── Footer Text ─────────────────────────────
class _FooterText extends StatelessWidget {
  const _FooterText();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 14,
          height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFF94A3B8),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          'YOUR JOURNEY TOWARDS SUCCESS BEGINS HERE',
          style: GoogleFonts.outfit(
            fontSize: 9.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(width: 6),
        Container(
          width: 14,
          height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFF94A3B8),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }
}
