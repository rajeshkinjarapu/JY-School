import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'package:intl/intl.dart';

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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Structure creation is managed via web portal.',
              style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      backgroundColor: const Color(0xFFF59E0B),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Standard gray background
      appBar: AppBar(
        title: Text(
          'Fee Structures',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: const Icon(Icons.add_circle_outline_rounded, size: 28),
              onPressed: _showAddStructureDialog,
              tooltip: 'Add Structure',
            ),
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _structures.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]),
                        child: const Icon(Icons.account_balance_wallet_rounded, size: 64, color: Color(0xFFCBD5E1)),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'No Fee Structures Found',
                        style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
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
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0).withOpacity(0.5)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 15, offset: const Offset(0, 5))
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header area
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6366F1).withOpacity(0.05),
                              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                              border: Border(bottom: BorderSide(color: const Color(0xFFE2E8F0).withOpacity(0.5))),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
                                      ),
                                      child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF6366F1), size: 18),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      feeName,
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: status.toString().toUpperCase() == 'ACTIVE' ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    status.toString().toUpperCase(),
                                    style: GoogleFonts.poppins(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      color: Colors.white,
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                          // Content area
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: _buildInfoChip(Icons.class_rounded, 'Class: $className')),
                                    const SizedBox(width: 12),
                                    Expanded(child: _buildInfoChip(Icons.stars_rounded, isMandatory ? 'Mandatory' : 'Optional')),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: const Color(0xFFF1F5F9)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Amount',
                                        style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                      Text(
                                        currencyFormat.format(amount),
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 22,
                                          color: const Color(0xFF6366F1),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: const Color(0xFF6366F1)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569), fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
