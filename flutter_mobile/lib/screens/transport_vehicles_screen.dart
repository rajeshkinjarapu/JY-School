import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class TransportVehiclesScreen extends StatefulWidget {
  const TransportVehiclesScreen({super.key});
  @override
  State<TransportVehiclesScreen> createState() => _TransportVehiclesScreenState();
}

class _TransportVehiclesScreenState extends State<TransportVehiclesScreen> {
  bool _isLoading = true;
  List<dynamic> _vehicles = [];

  @override
  void initState() {
    super.initState();
    _fetchVehicles();
  }

  Future<void> _fetchVehicles() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportVehicles();
      if (mounted) {
        if (res['success']) setState(() => _vehicles = res['data']);
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Vehicles', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF7C3AED),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : _vehicles.isEmpty
              ? const Center(child: Text('No vehicles found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _vehicles.length,
                  itemBuilder: (context, index) {
                    final v = _vehicles[index];
                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(backgroundColor: Color(0xFFEDE9FE), child: Icon(Icons.directions_bus, color: Color(0xFF7C3AED))),
                        title: Text(v['registrationNo'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                        subtitle: Text('${v['make']} - Capacity: ${v['capacity']}'),
                      ),
                    );
                  },
                ),
    );
  }
}
