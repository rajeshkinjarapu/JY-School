import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'main_layout.dart';

// ═══════════════════════════════════════════════════════════════════
//  JY SCHOOL – WELCOME SCREEN (Bright & Colorful – No Dark)
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
      backgroundColor: Colors.white,
      body: _WelcomeBody(onStart: () => _startJourney(context)),
    );
  }
}

// ─────────────────────── Animated Body ───────────────────────────
class _WelcomeBody extends StatefulWidget {
  final VoidCallback onStart;
  const _WelcomeBody({required this.onStart});

  @override
  State<_WelcomeBody> createState() => _WelcomeBodyState();
}

class _WelcomeBodyState extends State<_WelcomeBody>
    with TickerProviderStateMixin {
  late AnimationController _bgCtrl;
  late AnimationController _entryCtrl;
  late AnimationController _shimmerCtrl;
  late Animation<double> _bgAnim;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  late Animation<double> _shimmerAnim;

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 6))
      ..repeat(reverse: true);
    _entryCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000))
      ..forward();
    _shimmerCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 3))
      ..repeat();

    _bgAnim = CurvedAnimation(parent: _bgCtrl, curve: Curves.easeInOut);
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _entryCtrl, curve: const Interval(0.0, 0.75, curve: Curves.easeOut)),
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(parent: _entryCtrl, curve: const Interval(0.0, 0.75, curve: Curves.easeOutCubic)),
    );
    _shimmerAnim = Tween<double>(begin: -1.5, end: 2.5).animate(
      CurvedAnimation(parent: _shimmerCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _entryCtrl.dispose();
    _shimmerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return AnimatedBuilder(
      animation: _bgAnim,
      builder: (_, __) {
        return Stack(
          children: [
            // ══ Background: Soft white with bright blue sky top section ══
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color.lerp(const Color(0xFF1565C0), const Color(0xFF1E88E5), _bgAnim.value)!,
                      Color.lerp(const Color(0xFF1E88E5), const Color(0xFF1565C0), _bgAnim.value)!,
                      const Color(0xFFF0F7FF),
                      Colors.white,
                    ],
                    stops: const [0.0, 0.38, 0.62, 1.0],
                  ),
                ),
              ),
            ),

            // ══ Bright Wavy SVG-style shape – top right yellow curve ══
            Positioned(
              top: -size.height * 0.06,
              right: -size.width * 0.22,
              child: Container(
                width: size.width * 0.72,
                height: size.width * 0.72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFDD835).withOpacity(0.55 + 0.15 * _bgAnim.value),
                      const Color(0xFFFBC02D).withOpacity(0.25),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ══ Top left cyan/teal accent ══
            Positioned(
              top: -size.height * 0.04,
              left: -size.width * 0.22,
              child: Container(
                width: size.width * 0.65,
                height: size.width * 0.65,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF26C6DA).withOpacity(0.50 + 0.10 * _bgAnim.value),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ══ Bottom purple wave blob ══
            Positioned(
              bottom: -size.height * 0.04,
              left: -size.width * 0.1,
              child: Container(
                width: size.width * 0.55,
                height: size.width * 0.55,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFAB47BC).withOpacity(0.38),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ══ Bottom right orange accent ══
            Positioned(
              bottom: -size.height * 0.03,
              right: -size.width * 0.12,
              child: Container(
                width: size.width * 0.55,
                height: size.width * 0.55,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFFF7043).withOpacity(0.40),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // ══ Floating education doodles ══
            ..._buildDoodles(size),

            // ══ White wave divider at transition point ══
            Positioned(
              top: size.height * 0.47,
              left: 0,
              right: 0,
              child: CustomPaint(
                size: Size(size.width, 60),
                painter: _WavePainter(),
              ),
            ),

            // ══ Main Content ══
            SafeArea(
              child: SlideTransition(
                position: _slideAnim,
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 16),

                        // Yellow dot pill badge
                        _TopBadge(),

                        const Spacer(flex: 2),

                        // Animated Logo
                        _AnimatedLogo(),

                        const SizedBox(height: 22),

                        // SRI VENKATESWARA + JY SCHOOL
                        _SchoolTitleSection(shimmerAnim: _shimmerAnim),

                        const SizedBox(height: 14),

                        // Tagline Banner
                        const _TaglineBanner(),

                        const Spacer(flex: 3),

                        // Stats Strip (3 colourful pills)
                        const _StatsStrip(),

                        const SizedBox(height: 20),

                        // Start Button
                        SafeArea(
                          top: false,
                          bottom: true,
                          child: Padding(
                            padding: EdgeInsets.only(
                              bottom: MediaQuery.of(context).padding.bottom > 0 ? 4 : 12,
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _StartButton(onPressed: widget.onStart),
                                const SizedBox(height: 10),
                                _FooterLine(),
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
        );
      },
    );
  }

  List<Widget> _buildDoodles(Size size) {
    const doodles = [
      _DoodleSpec(Icons.send_rounded, 0.10, 0.08, 28, Color(0xFFFFFFFF), 0.55),
      _DoodleSpec(Icons.lightbulb_outline_rounded, 0.84, 0.09, 30, Color(0xFFFDD835), 0.70),
      _DoodleSpec(Icons.menu_book_rounded, 0.88, 0.18, 26, Color(0xFFFFFFFF), 0.50),
      _DoodleSpec(Icons.science_outlined, 0.08, 0.20, 24, Color(0xFFFFFFFF), 0.55),
      _DoodleSpec(Icons.calculate_outlined, 0.86, 0.30, 22, Color(0xFFFFFFFF), 0.45),
      _DoodleSpec(Icons.emoji_events_outlined, 0.08, 0.32, 24, Color(0xFFFDD835), 0.65),
    ];

    return doodles.asMap().entries.map((entry) {
      final d = entry.value;
      final floatY = math.sin(_bgAnim.value * math.pi * 2 + entry.key * 1.3) * 7;
      final floatX = math.cos(_bgAnim.value * math.pi * 2 + entry.key * 1.1) * 4;
      return Positioned(
        left: d.xPct * size.width + floatX,
        top: d.yPct * size.height + floatY,
        child: Icon(d.icon, size: d.size, color: d.color.withOpacity(d.opacity)),
      );
    }).toList();
  }
}

class _DoodleSpec {
  final IconData icon;
  final double xPct, yPct, size;
  final Color color;
  final double opacity;
  const _DoodleSpec(this.icon, this.xPct, this.yPct, this.size, this.color, this.opacity);
}

// ─────────────────────── Wave Divider Painter ─────────────────────
class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, 40)
      ..quadraticBezierTo(size.width * 0.25, 0, size.width * 0.5, 30)
      ..quadraticBezierTo(size.width * 0.75, 60, size.width, 20)
      ..lineTo(size.width, 60)
      ..lineTo(0, 60)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ─────────────────────── Top Badge ───────────────────────────────
class _TopBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.22),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(0.50)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Color(0xFFFDD835),
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
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Animated Logo ───────────────────────────
class _AnimatedLogo extends StatefulWidget {
  @override
  State<_AnimatedLogo> createState() => _AnimatedLogoState();
}

class _AnimatedLogoState extends State<_AnimatedLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _float;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 3))
      ..repeat(reverse: true);
    _float = Tween<double>(begin: -7.0, end: 7.0).animate(
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
      animation: _float,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, _float.value),
        child: child,
      ),
      child: Container(
        width: 125,
        height: 125,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1565C0).withOpacity(0.35),
              blurRadius: 30,
              spreadRadius: 4,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: const Color(0xFFFDD835).withOpacity(0.45),
              blurRadius: 24,
              spreadRadius: 2,
              offset: const Offset(0, -2),
            ),
          ],
          border: Border.all(
            color: const Color(0xFFFDD835),
            width: 3.5,
          ),
        ),
        padding: const EdgeInsets.all(6),
        child: ClipOval(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Image.asset(
              'assets/images/logo.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.school_rounded,
                size: 58,
                color: Color(0xFF1565C0),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────── School Title Section ─────────────────────
class _SchoolTitleSection extends StatelessWidget {
  final Animation<double> shimmerAnim;
  const _SchoolTitleSection({required this.shimmerAnim});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // SRI VENKATESWARA – Bold White with Yellow Drop Shadow
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // left wing line
            Container(
              width: 22, height: 3,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.transparent, Color(0xFFFDD835)],
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
                letterSpacing: 3.5,
                color: Colors.white,
                shadows: [
                  Shadow(
                    color: const Color(0xFFFBC02D).withOpacity(0.9),
                    offset: const Offset(0, 2),
                    blurRadius: 6,
                  ),
                  const Shadow(
                    color: Color(0xFF0D47A1),
                    offset: Offset(0, 3),
                    blurRadius: 8,
                  ),
                ],
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(width: 8),
            // right wing line
            Container(
              width: 22, height: 3,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFDD835), Colors.transparent],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),

        const SizedBox(height: 8),

        // JY SCHOOL – Responsive, Shimmer
        AnimatedBuilder(
          animation: shimmerAnim,
          builder: (_, __) {
            return ShaderMask(
              shaderCallback: (bounds) => LinearGradient(
                begin: Alignment(-1.5 + shimmerAnim.value * 0.5, 0),
                end: Alignment(-0.3 + shimmerAnim.value * 0.5, 0),
                colors: const [
                  Color(0xFFFDD835),
                  Color(0xFFFFFFFF),
                  Color(0xFFFBC02D),
                  Color(0xFFFDD835),
                ],
                stops: const [0.0, 0.45, 0.65, 1.0],
              ).createShader(bounds),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  'JY SCHOOL',
                  style: GoogleFonts.outfit(
                    fontSize: 60,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 2.5,
                    height: 1.05,
                    shadows: [
                      Shadow(
                        color: const Color(0xFF0D47A1).withOpacity(0.9),
                        offset: const Offset(0, 5),
                        blurRadius: 14,
                      ),
                      Shadow(
                        color: const Color(0xFF0D47A1).withOpacity(0.5),
                        offset: const Offset(0, 10),
                        blurRadius: 24,
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE53935), Color(0xFFAD1457), Color(0xFF6A1B9A)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: const Color(0xFFFDD835), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE53935).withOpacity(0.4),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, color: Color(0xFFFDD835), size: 15),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              'EMPOWERING MINDS • SHAPING FUTURE',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 1.0,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 6),
          const Icon(Icons.star_rounded, color: Color(0xFFFDD835), size: 15),
        ],
      ),
    );
  }
}

// ─────────────────────── Stats Strip ─────────────────────────────
class _StatsStrip extends StatelessWidget {
  const _StatsStrip();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _StatPill(
          icon: Icons.people_rounded,
          label: '5000+\nStudents',
          gradientColors: const [Color(0xFF1E88E5), Color(0xFF0D47A1)],
          iconColor: Colors.white,
        )),
        const SizedBox(width: 10),
        Expanded(child: _StatPill(
          icon: Icons.emoji_events_rounded,
          label: '100+\nFaculty',
          gradientColors: const [Color(0xFFF57C00), Color(0xFFE65100)],
          iconColor: const Color(0xFFFDD835),
        )),
        const SizedBox(width: 10),
        Expanded(child: _StatPill(
          icon: Icons.school_rounded,
          label: 'Smart\nCampus',
          gradientColors: const [Color(0xFF43A047), Color(0xFF1B5E20)],
          iconColor: Colors.white,
        )),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final List<Color> gradientColors;
  final Color iconColor;

  const _StatPill({
    required this.icon,
    required this.label,
    required this.gradientColors,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: gradientColors.last.withOpacity(0.35),
            blurRadius: 12,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              height: 1.25,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────── Start Button ────────────────────────────
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
        vsync: this, duration: const Duration(milliseconds: 120));
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
                Color(0xFFFF6F00), // Deep Orange
                Color(0xFFE53935), // Red
                Color(0xFF8E24AA), // Purple
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF6F00).withOpacity(0.45),
                blurRadius: 20,
                offset: const Offset(0, 7),
              ),
              BoxShadow(
                color: const Color(0xFF8E24AA).withOpacity(0.30),
                blurRadius: 26,
                offset: const Offset(0, 12),
              ),
            ],
            border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.5),
          ),
          child: Stack(
            children: [
              // Top shine line
              Positioned(
                top: 0, left: 30, right: 30,
                child: Container(
                  height: 1.5,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.white.withOpacity(0),
                        Colors.white.withOpacity(0.7),
                        Colors.white.withOpacity(0),
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
                      'START JOURNEY',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 1.8,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.3),
                            offset: const Offset(0, 2),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_forward_rounded,
                        color: Color(0xFFE53935),
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

// ─────────────────────── Footer Line ─────────────────────────────
class _FooterLine extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 14, height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFF1565C0).withOpacity(0.5),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          'YOUR JOURNEY TOWARDS SUCCESS BEGINS HERE',
          style: GoogleFonts.outfit(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
            color: const Color(0xFF1565C0).withOpacity(0.7),
          ),
        ),
        const SizedBox(width: 6),
        Container(
          width: 14, height: 2,
          decoration: BoxDecoration(
            color: const Color(0xFF1565C0).withOpacity(0.5),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }
}
