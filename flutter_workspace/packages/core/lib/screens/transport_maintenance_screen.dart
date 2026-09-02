import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class TransportMaintenanceScreen extends StatefulWidget {
  const TransportMaintenanceScreen({super.key});

  @override
  State<TransportMaintenanceScreen> createState() => _TransportMaintenanceScreenState();
}

class _TransportMaintenanceScreenState extends State<TransportMaintenanceScreen> {
  bool _isLoading = true;
  List<dynamic> _logs = [];

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getMaintenanceLogs();
      if (mounted) {
        if (res['success']) {
          setState(() => _logs = res['data']);
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Maintenance Logs', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF059669),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF059669)))
          : _logs.isEmpty
              ? const Center(child: Text('No maintenance logs found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _logs.length,
                  itemBuilder: (context, index) {
                    final log = _logs[index];
                    final date = DateTime.parse(log['date']);
                    final vehicle = log['vehicle']?['registrationNo'] ?? 'Unknown';
                    return Card(
                      elevation: 4,
                      shadowColor: const Color(0xFF059669).withOpacity(0.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: const Color(0xFF059669).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                              child: const Icon(Icons.build_rounded, color: Color(0xFF059669)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(vehicle, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                                  Text(log['description'] ?? 'Repairs', style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[700])),
                                  const SizedBox(height: 4),
                                  Text(DateFormat('dd MMM yyyy').format(date), style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[500])),
                                ],
                              ),
                            ),
                            Text('₹${log['cost']}', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF059669))),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
