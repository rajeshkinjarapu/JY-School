import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';
import 'dart:math' as math;

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.8, curve: Curves.easeOut)),
    );

    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic)),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background UI
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          // Top Graphic elements
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF6366F1).withOpacity(0.05),
              ),
            ),
          ),
          Positioned(
            top: 200,
            left: -80,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF8B5CF6).withOpacity(0.05),
              ),
            ),
          ),
          
          SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const SizedBox(height: 24),
                            FadeTransition(
                              opacity: _fadeAnimation,
                              child: Column(
                                children: [
                                  // Logo Container
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF6366F1).withOpacity(0.15),
                                          blurRadius: 30,
                                          offset: const Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: Image.asset(
                                      'assets/images/logo.png',
                                      height: 90,
                                      width: 90,
                                      fit: BoxFit.contain,
                                      errorBuilder: (context, error, stackTrace) =>
                                          const Icon(Icons.school_rounded, size: 70, color: Color(0xFF6366F1)),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  // School Name
                                  Text(
                                    'SRI VENKATESWARA\nJY SCHOOL',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.outfit(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFF1E293B),
                                      letterSpacing: 1.2,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  // Tagline
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF6366F1).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      'Learn • Grow • Achieve',
                                      style: GoogleFonts.poppins(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF4F46E5),
                                        letterSpacing: 1.0,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            
                            const Spacer(),
                            const SizedBox(height: 16),
                            
                            SlideTransition(
                              position: _slideAnimation,
                              child: FadeTransition(
                                opacity: _fadeAnimation,
                                child: Column(
                                  children: [
                                    // Illustration placeholder
                                    Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Container(
                                          width: 190,
                                          height: 190,
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            shape: BoxShape.circle,
                                            boxShadow: [
                                              BoxShadow(
                                                color: const Color(0xFF8B5CF6).withOpacity(0.1),
                                                blurRadius: 40,
                                                offset: const Offset(0, 20),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Positioned(
                                          top: 35,
                                          left: 25,
                                          child: Transform.rotate(
                                            angle: -0.2,
                                            child: const Icon(Icons.menu_book_rounded, size: 40, color: Color(0xFFF59E0B)),
                                          ),
                                        ),
                                        Positioned(
                                          top: 25,
                                          right: 25,
                                          child: Transform.rotate(
                                            angle: 0.2,
                                            child: const Icon(Icons.science_rounded, size: 40, color: Color(0xFF10B981)),
                                          ),
                                        ),
                                        Positioned(
                                          bottom: 35,
                                          left: 35,
                                          child: Transform.rotate(
                                            angle: -0.1,
                                            child: const Icon(Icons.calculate_rounded, size: 40, color: Color(0xFFEF4444)),
                                          ),
                                        ),
                                        Positioned(
                                          bottom: 40,
                                          right: 30,
                                          child: Transform.rotate(
                                            angle: 0.15,
                                            child: const Icon(Icons.palette_rounded, size: 40, color: Color(0xFF8B5CF6)),
                                          ),
                                        ),
                                        const Icon(Icons.school_rounded, size: 80, color: Color(0xFF6366F1)),
                                      ],
                                    ),
                                    
                                    const SizedBox(height: 24),
                                    
                                    // Welcome Message
                                    Text(
                                      'Welcome to Our School! 👋',
                                      style: GoogleFonts.outfit(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Your complete digital school experience starts here.',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w400,
                                        color: const Color(0xFF64748B),
                                        height: 1.4,
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    
                                    // Main Action Button wrapped in SafeArea for bottom clearance
                                    SafeArea(
                                      top: false,
                                      bottom: true,
                                      child: Container(
                                        width: double.infinity,
                                        height: 58,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(20),
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                                            begin: Alignment.centerLeft,
                                            end: Alignment.centerRight,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF6366F1).withOpacity(0.3),
                                              blurRadius: 20,
                                              offset: const Offset(0, 8),
                                            ),
                                          ],
                                        ),
                                        child: Material(
                                          color: Colors.transparent,
                                          child: InkWell(
                                            borderRadius: BorderRadius.circular(20),
                                            onTap: () {
                                              Navigator.pushReplacement(
                                                context,
                                                PageRouteBuilder(
                                                  pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
                                                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                                    return FadeTransition(opacity: animation, child: child);
                                                  },
                                                ),
                                              );
                                            },
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Text(
                                                  'Get Started',
                                                  style: GoogleFonts.poppins(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                const Icon(Icons.arrow_forward_rounded, color: Colors.white),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Guarantee generous clearance above Android 3-button navigation
                                    SizedBox(height: math.max(bottomInset, 16.0) + 16),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
