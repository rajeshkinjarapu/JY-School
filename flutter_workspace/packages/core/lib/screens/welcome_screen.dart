import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'login_screen.dart';
import 'main_layout.dart';

class WelcomeScreen extends StatelessWidget {
  final bool isAuthenticated;
  const WelcomeScreen({super.key, required this.isAuthenticated});

  void _startJourney(BuildContext context) {
    if (isAuthenticated) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainLayout()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background Image (the user provided design)
          Positioned.fill(
            child: Image.asset(
              'assets/images/welcome_bg.jpg',
              package: 'core',
              fit: BoxFit.cover,
            ),
          ),
          
          // Our custom animated START button that covers the image's button
          Positioned(
            bottom: MediaQuery.of(context).padding.bottom + 15, // Lowered to exactly cover the image button
            left: 35, // Made wider to cover edges
            right: 35,
            height: 70, // Made taller to fully eclipse the image button
            child: _AnimatedStartButton(
              onPressed: () => _startJourney(context),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnimatedStartButton extends StatefulWidget {
  final VoidCallback onPressed;
  const _AnimatedStartButton({required this.onPressed});

  @override
  State<_AnimatedStartButton> createState() => _AnimatedStartButtonState();
}

class _AnimatedStartButtonState extends State<_AnimatedStartButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.92).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _onTapUp(TapUpDetails details) {
    _controller.reverse();
    widget.onPressed();
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: const LinearGradient(
              colors: [Color(0xFFFFD700), Color(0xFFFDB931)], // Gold gradient to match image
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'START',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF001540), // Dark blue text
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.arrow_forward_rounded,
                color: Color(0xFF001540),
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
