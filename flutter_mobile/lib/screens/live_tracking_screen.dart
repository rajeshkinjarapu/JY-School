import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LiveTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> routeData;

  const LiveTrackingScreen({super.key, required this.routeData});

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String routeName = widget.routeData['name'] ?? 'School Bus Tracking';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Live Tracking', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
        backgroundColor: const Color(0xFF2563EB),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          // Simulated Map Background
          Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: AssetImage('assets/images/map_placeholder.png'), // Placeholder image (needs to be added to assets)
                fit: BoxFit.cover,
              ),
            ),
            child: Container(
              color: const Color(0xFFE2E8F0).withOpacity(0.8), // Gray overlay to simulate map if image fails
              child: Stack(
                children: [
                  // Simulated route path
                  Center(
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3), width: 4),
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  // Animated Bus Marker
                  Center(
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withOpacity(0.4 * _pulseController.value),
                                blurRadius: 20 * _pulseController.value,
                                spreadRadius: 10 * _pulseController.value,
                              )
                            ],
                            border: Border.all(color: Colors.white, width: 3),
                          ),
                          child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 28),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Info Sheet
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, -5))],
              ),
              child: SafeArea(
                bottom: true,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2))),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.route_rounded, color: Color(0xFF3B82F6), size: 30),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(routeName, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                              Text('ETA: 15 Mins to Stop', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF10B981), fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundImage: AssetImage('assets/images/driver_placeholder.png'),
                          backgroundColor: Color(0xFFCBD5E1),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Driver: Ramesh K', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                              Text('+91 9876543210', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12)),
                            ],
                          ),
                        ),
                        IconButton(
                          style: IconButton.styleFrom(backgroundColor: const Color(0xFF10B981).withOpacity(0.1)),
                          icon: const Icon(Icons.call, color: Color(0xFF10B981)),
                          onPressed: () {
                            // Call driver logic
                          },
                        )
                      ],
                    ),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
