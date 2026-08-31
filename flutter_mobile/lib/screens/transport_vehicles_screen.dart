import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class TransportVehiclesScreen extends StatefulWidget {
  const TransportVehiclesScreen({super.key});
  @override
  State<TransportVehiclesScreen> createState() => _TransportVehiclesScreenState();
}

class _TransportVehiclesScreenState extends State<TransportVehiclesScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _vehicles = [];
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fetchVehicles();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchVehicles() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportVehicles();
      if (mounted) {
        if (res['success']) {
          setState(() => _vehicles = res['data']);
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
        title: Text('Fleet & Vehicles', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 22)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED), Color(0xFF5B21B6)],
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
              onPressed: _fetchVehicles,
            ),
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : _vehicles.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.only(top: 16, left: 20, right: 20, bottom: 40),
                  itemCount: _vehicles.length,
                  itemBuilder: (context, index) {
                    final vehicle = _vehicles[index];
                    
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
                      child: _buildVehicleCard(vehicle),
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
            child: const Icon(Icons.directions_bus_rounded, size: 80, color: Color(0xFFCBD5E1)),
          ),
          const SizedBox(height: 24),
          Text("No Vehicles Found", style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
          const SizedBox(height: 8),
          Text("Fleet details will appear here.", style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(Map<String, dynamic> vehicle) {
    final String registration = vehicle['registrationNo'] ?? 'UNKNOWN';
    final String make = vehicle['make'] ?? 'Unknown Make';
    final String modelStr = vehicle['model'] ?? '';
    final String status = vehicle['status'] ?? 'ACTIVE';
    final int capacity = vehicle['capacity'] ?? 0;
    
    final bool isActive = status == 'ACTIVE';
    final Color statusColor = isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFF7C3AED).withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 10))
        ],
        border: Border.all(color: const Color(0xFFF5F3FF), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Gradient
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFF5F3FF), Color(0xFFEDE9FE)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: const Color(0xFF7C3AED).withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 4))],
                  ),
                  child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(registration, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Text('$make $modelStr', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withOpacity(0.2)),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
              ],
            ),
          ),
          
          // Stats Row
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildVehicleStat(Icons.people_rounded, 'Capacity', '$capacity Seats', const Color(0xFF3B82F6)),
                Container(width: 1, height: 40, color: const Color(0xFFE2E8F0)),
                _buildVehicleStat(Icons.workspace_premium_rounded, 'Condition', isActive ? 'Good' : 'Needs Repair', statusColor),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleStat(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w500)),
            Text(value, style: GoogleFonts.outfit(color: const Color(0xFF334155), fontSize: 15, fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }
}
