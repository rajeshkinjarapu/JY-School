import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'dashboard_screen.dart';

// ═══════════════════════════════════════════════════════
//  JY SCHOOL – LOGIN SCREEN  (Complete Redesign)
// ═══════════════════════════════════════════════════════

class _RoleItem {
  final String label;
  final IconData icon;
  final Color color;
  const _RoleItem(this.label, this.icon, this.color);
}

class _Particle {
  late double x, y, radius, opacity, dx, dy;
  _Particle({required Random rand}) {
    x = rand.nextDouble(); y = rand.nextDouble();
    radius = rand.nextDouble() * 4 + 2;
    opacity = rand.nextDouble() * 0.28 + 0.05;
    dx = (rand.nextDouble() - 0.5) * 0.0005;
    dy = (rand.nextDouble() - 0.5) * 0.0005;
  }
}

class _AnimatedParticle extends StatefulWidget {
  final _Particle particle;
  const _AnimatedParticle({required this.particle});
  @override
  State<_AnimatedParticle> createState() => _AnimatedParticleState();
}

class _AnimatedParticleState extends State<_AnimatedParticle>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 5000 + Random().nextInt(5000)),
    )..repeat(reverse: true);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final p = widget.particle;
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final t = _ctrl.value;
        final cx = (p.x + p.dx * t * 1000).clamp(0.0, 1.0);
        final cy = (p.y + p.dy * t * 1000).clamp(0.0, 1.0);
        return Positioned(
          left: cx * size.width - p.radius,
          top: cy * size.height - p.radius,
          child: Container(
            width: p.radius * 2, height: p.radius * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(p.opacity),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────── LoginScreen Widget ───────────────────────────────

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _showPass = false;
  bool _loading  = false;
  String? _error;
  int _roleIdx = 0;

  final _roles = [
    _RoleItem('Student', Icons.school_rounded,                 Color(0xFF6366F1)),
    _RoleItem('Teacher', Icons.person_rounded,                 Color(0xFF0EA5E9)),
    _RoleItem('Parent',  Icons.family_restroom_rounded,        Color(0xFF10B981)),
    _RoleItem('Admin',   Icons.admin_panel_settings_rounded,   Color(0xFFF59E0B)),
  ];

  final _gradients = [
    [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFFDB2777)],
    [Color(0xFF0369A1), Color(0xFF0EA5E9), Color(0xFF06B6D4)],
    [Color(0xFF065F46), Color(0xFF059669), Color(0xFF34D399)],
    [Color(0xFF92400E), Color(0xFFD97706), Color(0xFFFBBF24)],
  ];

  late AnimationController _bgCtrl, _cardCtrl, _pulseCtrl;
  late Animation<double>   _bgAnim, _slideAnim, _fadeAnim, _pulseAnim;
  final _particles = <_Particle>[];
  final _rand = Random();

  @override
  void initState() {
    super.initState();
    _bgCtrl   = AnimationController(vsync: this, duration: const Duration(seconds: 8))..repeat(reverse: true);
    _bgAnim   = Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _bgCtrl,   curve: Curves.easeInOut));
    _cardCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
    _slideAnim = Tween(begin: 60.0, end: 0.0).animate(CurvedAnimation(parent: _cardCtrl, curve: Curves.easeOutCubic));
    _fadeAnim  = Tween(begin: 0.0,  end: 1.0).animate(CurvedAnimation(parent: _cardCtrl, curve: Curves.easeOut));
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _pulseAnim = Tween(begin: 1.0, end: 1.1).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    for (int i = 0; i < 16; i++) _particles.add(_Particle(rand: _rand));
  }

  @override
  void dispose() {
    _emailCtrl.dispose(); _passCtrl.dispose();
    _bgCtrl.dispose(); _cardCtrl.dispose(); _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    final res = await ApiService.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Welcome back!', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600)),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ));
      Navigator.of(context).pushReplacement(PageRouteBuilder(
        pageBuilder: (_, __, ___) => const DashboardScreen(),
        transitionsBuilder: (_, a, __, c) => FadeTransition(opacity: a, child: c),
        transitionDuration: const Duration(milliseconds: 500),
      ));
    } else {
      setState(() => _error = res['message'] ?? 'Login failed. Please try again.');
    }
  }

  void _pickRole(int i) {
    setState(() => _roleIdx = i);
    _cardCtrl.reset(); _cardCtrl.forward();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    // Unified Theme (Green gradient)
    final grad = [const Color(0xFF065F46), const Color(0xFF059669), const Color(0xFF34D399)];
    final roleColor = const Color(0xFF10B981);

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: AnimatedBuilder(
        animation: _bgAnim,
        builder: (_, __) => Container(
          width: double.infinity, height: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color.lerp(grad[0], grad[2], _bgAnim.value)!,
                Color.lerp(grad[1], grad[0], _bgAnim.value)!,
                Color.lerp(grad[2], grad[1], _bgAnim.value)!,
              ],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
          ),
          child: Stack(children: [
            ..._particles.map((p) => _AnimatedParticle(particle: p)),
            Positioned(
              top: -size.height * 0.12, right: -size.width * 0.2,
              child: Container(width: size.width * 0.7, height: size.width * 0.7,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.07))),
            ),
            Positioned(
              bottom: -size.height * 0.1, left: -size.width * 0.15,
              child: Container(width: size.width * 0.65, height: size.width * 0.65,
                decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withOpacity(0.06))),
            ),
            SafeArea(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: size.height - MediaQuery.of(context).padding.top),
                  child: IntrinsicHeight(child: Column(children: [
                    _buildHero(grad),
                    const SizedBox(height: 38),
                    _buildCard(roleColor),
                    const Spacer(),
                    _buildFooter(),
                  ])),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  // ── Hero Section ──────────────────────────────────────────────────────────
  Widget _buildHero(List<Color> grad) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 0),
      child: Column(children: [
        AnimatedBuilder(
          animation: _pulseAnim,
          builder: (_, child) => Transform.scale(scale: _pulseAnim.value, child: child),
          child: Image.asset('assets/images/logo.png', width: 110, height: 110, fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.school_rounded, size: 80, color: Colors.white),
          ),
        ),
        const SizedBox(height: 18),
        Text('JY SCHOOL', style: GoogleFonts.outfit(
          fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 4,
          shadows: [Shadow(color: Colors.black.withOpacity(0.3), offset: const Offset(0, 3), blurRadius: 10)],
        )),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.18),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
          ),
          child: Text('EXCELLENCE IN EDUCATION', style: GoogleFonts.poppins(
            fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 2,
          )),
        ),
      ]),
    );
  }

  // ── Login Card ────────────────────────────────────────────────────────────
  Widget _buildCard(Color roleColor) {
    return AnimatedBuilder(
      animation: _cardCtrl,
      builder: (_, child) => Transform.translate(
        offset: Offset(0, _slideAnim.value),
        child: Opacity(opacity: _fadeAnim.value, child: child),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.96),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white.withOpacity(0.7), width: 1.5),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.17), blurRadius: 40, offset: const Offset(0, 16))],
              ),
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Form(key: _formKey, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  // Header
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: roleColor.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
                      child: Icon(Icons.login_rounded, color: roleColor, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Welcome Back',
                        style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                      Text('Access your JY School portal',
                        style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                    ]),
                  ]),
                  const SizedBox(height: 18),
                  // Accent divider
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 400), height: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [roleColor.withOpacity(0.8), roleColor.withOpacity(0.08)]),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 22),
                  // Error Banner
                  AnimatedSize(
                    duration: const Duration(milliseconds: 300), curve: Curves.easeOut,
                    child: _error != null
                        ? Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFFCA5A5)),
                            ),
                            child: Row(children: [
                              const Icon(Icons.error_rounded, color: Color(0xFFEF4444), size: 20),
                              const SizedBox(width: 10),
                              Expanded(child: Text(_error!, style: GoogleFonts.poppins(color: const Color(0xFF991B1B), fontSize: 13, fontWeight: FontWeight.w500))),
                              GestureDetector(
                                onTap: () => setState(() => _error = null),
                                child: const Icon(Icons.close_rounded, color: Color(0xFFEF4444), size: 18),
                              ),
                            ]),
                          )
                        : const SizedBox.shrink(),
                  ),
                  // Email
                  _field(ctrl: _emailCtrl, label: 'Username or Email', icon: Icons.person_outline_rounded,
                    accent: roleColor, kbType: TextInputType.emailAddress,
                    validate: (v) => (v == null || v.trim().isEmpty) ? 'Please enter username or email' : null),
                  const SizedBox(height: 16),
                  // Password
                  _field(ctrl: _passCtrl, label: 'Password', icon: Icons.lock_outline_rounded,
                    accent: roleColor, obscure: !_showPass,
                    suffix: IconButton(
                      icon: Icon(_showPass ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                        color: const Color(0xFF94A3B8), size: 22),
                      onPressed: () => setState(() => _showPass = !_showPass),
                    ),
                    validate: (v) => (v == null || v.isEmpty) ? 'Please enter password' : null),
                  const SizedBox(height: 26),
                  // Button
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    height: 54,
                    decoration: BoxDecoration(
                      color: roleColor,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: roleColor.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
                    ),
                    child: ElevatedButton(
                      onPressed: _loading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _loading
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                          : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Text('SIGN IN', style: GoogleFonts.poppins(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                              const SizedBox(width: 10),
                              const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                            ]),
                    ),
                  ),
                  const SizedBox(height: 18),
                  // SSL note
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.lock_rounded, size: 13, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 5),
                    Text('Secure SSL Encrypted Connection',
                      style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
                  ]),
                ])),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(children: [
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 30),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.13),
            borderRadius: BorderRadius.circular(50),
            border: Border.all(color: Colors.white.withOpacity(0.22)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.help_outline_rounded, color: Colors.white, size: 15),
            const SizedBox(width: 7),
            Text('Need help? Contact School Admin',
              style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 10),
        Text('© ${DateTime.now().year} JY School · All Rights Reserved',
          style: GoogleFonts.poppins(fontSize: 11, color: Colors.white.withOpacity(0.6))),
      ]),
    );
  }

  // ── Reusable Field ────────────────────────────────────────────────────────
  Widget _field({
    required TextEditingController ctrl,
    required String label,
    required IconData icon,
    required Color accent,
    TextInputType kbType = TextInputType.text,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validate,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: kbType,
      obscureText: obscure,
      style: GoogleFonts.poppins(color: const Color(0xFF0F172A), fontWeight: FontWeight.w600, fontSize: 14.5),
      validator: validate,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w500),
        prefixIcon: Container(
          margin: const EdgeInsets.only(left: 14, right: 8),
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: accent.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: accent, size: 20),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: suffix,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        border:            OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        enabledBorder:     OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        focusedBorder:     OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: accent, width: 2)),
        errorBorder:       OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5)),
        focusedErrorBorder:OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 2)),
        errorStyle: GoogleFonts.poppins(color: const Color(0xFFEF4444), fontSize: 11, fontWeight: FontWeight.w500),
      ),
    );
  }
}
