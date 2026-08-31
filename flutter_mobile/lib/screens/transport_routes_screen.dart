import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class TransportRoutesScreen extends StatefulWidget {
  const TransportRoutesScreen({super.key});
  @override
  State<TransportRoutesScreen> createState() => _TransportRoutesScreenState();
}

class _TransportRoutesScreenState extends State<TransportRoutesScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _routes = [];
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fetchRoutes();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchRoutes() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportRoutes();
      if (mounted) {
        if (res['success']) {
          setState(() => _routes = res['data']);
          _animationController.forward(from: 0.0);
        }
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slate 50
      appBar: AppBar(
        title: Text('Bus Routes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 22)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF2563EB), Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
            child: IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              onPressed: _fetchRoutes,
            ),
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : _routes.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.only(top: 16, left: 20, right: 20, bottom: 40),
                  itemCount: _routes.length,
                  itemBuilder: (context, index) {
                    final route = _routes[index];
                    
                    return AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        final slideAnimation = Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
                          CurvedAnimation(parent: _animationController, curve: Interval(index * 0.1, 1.0, curve: Curves.easeOutCubic))
                        );
                        final fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
                          CurvedAnimation(parent: _animationController, curve: Interval(index * 0.1, 1.0, curve: Curves.easeOut))
                        );

                        return FadeTransition(
                          opacity: fadeAnimation,
                          child: SlideTransition(
                            position: slideAnimation,
                            child: child,
                          ),
                        );
                      },
                      child: _buildRouteCard(route),
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]),
            child: const Icon(Icons.map_rounded, size: 80, color: Color(0xFFCBD5E1)),
          ),
          const SizedBox(height: 24),
          Text("No Routes Found", style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
          const SizedBox(height: 8),
          Text("Bus routes will appear here.", style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildRouteCard(Map<String, dynamic> route) {
    final String name = route['name'] ?? 'Unknown Route';
    final String start = route['startPoint'] ?? 'N/A';
    final String end = route['endPoint'] ?? 'N/A';
    final stops = route['stops'] as List? ?? [];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))
        ],
        border: Border.all(color: const Color(0xFFEFF6FF), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Gradient
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFEFF6FF), Color(0xFFDBEAFE)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 4))],
                  ),
                  child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                        child: Text('${stops.length} Stops Connected', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB))),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Path Details
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildPathPoint(start, true),
                Container(
                  height: 30,
                  alignment: Alignment.centerLeft,
                  margin: const EdgeInsets.only(left: 11),
                  child: Container(width: 2, height: 30, color: const Color(0xFFCBD5E1)),
                ),
                _buildPathPoint(end, false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPathPoint(String label, bool isStart) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: isStart ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            shape: BoxShape.circle,
            border: Border.all(color: isStart ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2), width: 4),
          ),
          child: Center(
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(isStart ? 'Starts At' : 'Ends At', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w600)),
              Text(label, style: GoogleFonts.outfit(color: const Color(0xFF334155), fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }
}
