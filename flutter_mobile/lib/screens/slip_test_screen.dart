import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class SlipTestScreen extends StatefulWidget {
  const SlipTestScreen({super.key});

  @override
  State<SlipTestScreen> createState() => _SlipTestScreenState();
}

class _SlipTestScreenState extends State<SlipTestScreen> {
  bool _isLoading = true;
  List<dynamic> _slipTests = [];

  @override
  void initState() {
    super.initState();
    _fetchSlipTests();
  }

  Future<void> _fetchSlipTests() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getSlipTests();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _slipTests = res['data'] ?? [];
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load slip tests')),
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'sliptest'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Slip Tests',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchSlipTests,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _slipTests.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Slip Tests Available',
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
                  itemCount: _slipTests.length,
                  itemBuilder: (context, index) {
                    final test = _slipTests[index];
                    return _buildSlipTestCard(test);
                  },
                ),
    );
  }

  Widget _buildSlipTestCard(Map<String, dynamic> test) {
    final title = test['title'] ?? 'Untitled Test';
    final maxMarks = test['maxMarks'] ?? 0;
    final date = test['date']?.toString().split('T')[0] ?? 'N/A';
    
    // Safety check for relations
    final subjectName = (test['subject'] != null && test['subject'] is Map) 
        ? test['subject']['name'] ?? 'Unknown Subject' 
        : 'Unknown Subject';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3)),
                ),
                child: Text(
                  subjectName.toString().toUpperCase(),
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF818CF8),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.stars_rounded, color: Color(0xFFF59E0B), size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '$maxMarks Marks',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFFF59E0B),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.outfit(
              color: const Color(0xFF1E293B),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_month_rounded, color: const Color(0xFF94A3B8), size: 16),
              const SizedBox(width: 8),
              Text(
                'Test Date: $date',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF64748B),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
