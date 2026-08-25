import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class TransportRoutesScreen extends StatefulWidget {
  const TransportRoutesScreen({super.key});
  @override
  State<TransportRoutesScreen> createState() => _TransportRoutesScreenState();
}

class _TransportRoutesScreenState extends State<TransportRoutesScreen> {
  bool _isLoading = true;
  List<dynamic> _routes = [];

  @override
  void initState() {
    super.initState();
    _fetchRoutes();
  }

  Future<void> _fetchRoutes() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportRoutes();
      if (mounted) {
        if (res['success']) setState(() => _routes = res['data']);
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
        title: Text('Bus Routes', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF2563EB),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : _routes.isEmpty
              ? const Center(child: Text('No routes found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _routes.length,
                  itemBuilder: (context, index) {
                    final route = _routes[index];
                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(backgroundColor: Color(0xFFDBEAFE), child: Icon(Icons.map, color: Color(0xFF2563EB))),
                        title: Text(route['name'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                        subtitle: Text('${route['startPoint']} ➔ ${route['endPoint']}'),
                      ),
                    );
                  },
                ),
    );
  }
}
