import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class FeeStructureManagementScreen extends StatefulWidget {
  const FeeStructureManagementScreen({super.key});

  @override
  State<FeeStructureManagementScreen> createState() => _FeeStructureManagementScreenState();
}

class _FeeStructureManagementScreenState extends State<FeeStructureManagementScreen> {
  bool _isLoading = true;
  List<dynamic> _structures = [];
  List<dynamic> _classes = [];
  
  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.getFeeStructures(),
        ApiService.getClasses(),
      ]);
      if (mounted) {
        setState(() {
          _structures = results[0]['success'] ? results[0]['data'] ?? [] : [];
          _classes = results[1]['success'] ? results[1]['data'] ?? [] : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showAddStructureDialog() {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('Structure creation is an advanced web feature. Please use the web portal for now.'),
      backgroundColor: Color(0xFFF59E0B),
    ));
    // Implementation for creating structure would go here
    // typically requires Head, Group, Class, Amount, etc.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'Fee Structures',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF222854)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            onPressed: _showAddStructureDialog,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _structures.isEmpty
              ? Center(
                  child: Text(
                    'No Fee Structures Found',
                    style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 18),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _structures.length,
                  itemBuilder: (context, index) {
                    final struct = _structures[index];
                    final classObj = struct['class'] ?? {};
                    final className = '${classObj['name'] ?? classObj['className'] ?? ''} ${classObj['section'] ?? ''}'.trim();
                    final feeName = struct['head'] != null ? struct['head']['name'] : (struct['name'] ?? 'Fee Name');
                    final amount = double.tryParse(struct['amount']?.toString() ?? '0') ?? 0.0;
                    final status = struct['status'] ?? 'Active';
                    final isMandatory = struct['isMandatory'] ?? true;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                feeName,
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: status.toString().toUpperCase() == 'ACTIVE' ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  status.toString().toUpperCase(),
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: status.toString().toUpperCase() == 'ACTIVE' ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                  ),
                                ),
                              )
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              _buildInfoChip(Icons.class_rounded, 'Class: $className'),
                              const SizedBox(width: 8),
                              _buildInfoChip(Icons.stars_rounded, isMandatory ? 'Mandatory' : 'Optional'),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Divider(height: 1, color: Color(0xFFE2E8F0)),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Amount',
                                style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                              ),
                              Text(
                                '₹ ${amount.toStringAsFixed(0)}',
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                  color: const Color(0xFF6366F1),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF64748B)),
          const SizedBox(width: 6),
          Text(
            text,
            style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF475569), fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
