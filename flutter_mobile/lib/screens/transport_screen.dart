import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'transport_routes_screen.dart';
import 'transport_vehicles_screen.dart';
import 'transport_fuel_screen.dart';
import 'transport_maintenance_screen.dart';
import 'transport_students_screen.dart';

class TransportScreen extends StatefulWidget {
  const TransportScreen({super.key});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _fetchDashboardStats();
  }

  Future<void> _fetchDashboardStats() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportDashboard();
      if (mounted) {
        if (res['success']) {
          setState(() {
            _stats = res['data'];
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateTo(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'transport'),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 120.0,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: const Color(0xFF1E1B4B),
              iconTheme: const IconThemeData(color: Colors.white),
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 60, bottom: 16),
                title: Text(
                  'Transport',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF312E81), Color(0xFF1E1B4B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -30,
                        top: -20,
                        child: Icon(Icons.directions_bus_rounded, size: 150, color: Colors.white.withOpacity(0.05)),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                  onPressed: _fetchDashboardStats,
                )
              ],
            ),
          ];
        },
        body: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
            : RefreshIndicator(
                onRefresh: _fetchDashboardStats,
                color: const Color(0xFF4F46E5),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildStatsRow(),
                      const SizedBox(height: 24),
                      Text(
                        'Management Modules',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildGridOptions(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildStatsRow() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildStatCard('Vehicles', _stats['totalVehicles']?.toString() ?? '0', Icons.directions_bus_rounded, const Color(0xFF4F46E5))),
            const SizedBox(width: 16),
            Expanded(child: _buildStatCard('Routes', _stats['totalRoutes']?.toString() ?? '0', Icons.map_rounded, const Color(0xFF059669))),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildStatCard('Fuel (Month)', '₹${_stats['monthlyFuelCost']?.toStringAsFixed(0) ?? '0'}', Icons.local_gas_station_rounded, const Color(0xFFE11D48))),
            const SizedBox(width: 16),
            Expanded(child: _buildStatCard('Maintenance', '₹${_stats['monthlyMaintenanceCost']?.toStringAsFixed(0) ?? '0'}', Icons.build_rounded, const Color(0xFFD97706))),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: color.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Text(title, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildGridOptions() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 0.9,
      children: [
        _buildGridItem('Bus Routes', 'Manage routes & stops', LucideIcons.map, const [Color(0xFF3B82F6), Color(0xFF2563EB)], const TransportRoutesScreen()),
        _buildGridItem('Vehicles', 'Track fleet details', LucideIcons.bus, const [Color(0xFF8B5CF6), Color(0xFF7C3AED)], const TransportVehiclesScreen()),
        _buildGridItem('Students', 'Allocation & Fees', LucideIcons.users, const [Color(0xFFEC4899), Color(0xFFDB2777)], const TransportStudentsScreen()),
        _buildGridItem('Fuel Logs', 'Track diesel expenses', LucideIcons.fuel, const [Color(0xFFF43F5E), Color(0xFFE11D48)], const TransportFuelScreen()),
        _buildGridItem('Maintenance', 'Repairs & Service', LucideIcons.wrench, const [Color(0xFF10B981), Color(0xFF059669)], const TransportMaintenanceScreen()),
      ],
    );
  }

  Widget _buildGridItem(String title, String subtitle, IconData icon, List<Color> gradient, Widget screen) {
    return GestureDetector(
      onTap: () => _navigateTo(screen),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: gradient[1].withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -15,
              bottom: -15,
              child: Icon(icon, size: 80, color: Colors.white.withOpacity(0.15)),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                    child: Icon(icon, color: Colors.white, size: 28),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(subtitle, style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.8), fontSize: 11), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
