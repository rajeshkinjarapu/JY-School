import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class SalaryScreen extends StatefulWidget {
  const SalaryScreen({super.key});

  @override
  State<SalaryScreen> createState() => _SalaryScreenState();
}

class _SalaryScreenState extends State<SalaryScreen> {
  bool _isLoading = true;
  List<dynamic> _salaries = [];

  @override
  void initState() {
    super.initState();
    _fetchSalaries();
  }

  Future<void> _fetchSalaries() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getSalary();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _salaries = res['data'] ?? [];
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load salaries')),
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'salary'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'My Salary',
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
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchSalaries,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _salaries.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.account_balance_wallet_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Salary Records Found',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF64748B),
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _salaries.length,
                  itemBuilder: (context, index) {
                    final salary = _salaries[index];
                    return _buildSalaryCard(salary);
                  },
                ),
    );
  }

  Widget _buildSalaryCard(Map<String, dynamic> salary) {
    final status = salary['status'] ?? 'PENDING';
    final amount = double.tryParse(salary['amount']?.toString() ?? '0') ?? 0.0;
    final month = salary['month'] ?? 'N/A';

    Color statusColor;
    Color statusBgColor;

    if (status == 'PAID') {
      statusColor = const Color(0xFF10B981);
      statusBgColor = const Color(0xFF10B981).withOpacity(0.15);
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusBgColor = const Color(0xFFF59E0B).withOpacity(0.15);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            padding: const EdgeInsets.symmetric(vertical: 30),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withOpacity(0.1),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
              border: Border(right: BorderSide(color: const Color(0xFFE2E8F0))),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.currency_rupee_rounded, color: Color(0xFF818CF8), size: 28),
                const SizedBox(height: 8),
                Text(
                  month.toString().substring(0, 3).toUpperCase(),
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF1E293B),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '?${amount.toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF1E293B),
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusBgColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: statusColor.withOpacity(0.3)),
                        ),
                        child: Text(
                          status,
                          style: GoogleFonts.poppins(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (status == 'PAID' && salary['paymentDate'] != null)
                    Text(
                      'Paid on: ${salary['paymentDate'].toString().split('T')[0]}',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    )
                  else
                    Text(
                      'Payment is currently pending',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF64748B),
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


