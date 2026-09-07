import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class SingleProgressCardScreen extends StatefulWidget {
  final String examId;
  final String classId;
  final String studentId;
  final Map<String, dynamic>? studentData;
  final String examName;
  final String className;
  final bool autoShare;

  const SingleProgressCardScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.studentId,
    this.studentData,
    required this.examName,
    required this.className,
    this.autoShare = false,
  });

  @override
  State<SingleProgressCardScreen> createState() => _SingleProgressCardScreenState();
}

class _SingleProgressCardScreenState extends State<SingleProgressCardScreen> {
  @override
  void initState() {
    super.initState();
    // Use post frame callback to ensure the context is fully loaded before showing snackbars if needed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _launchBrowser();
    });
  }

  Future<void> _launchBrowser() async {
    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('http://66.116.252.191:19999/app/progress-card/${widget.examId}/${widget.studentId}?token=$token&classId=${widget.classId}');
      
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open progress card in browser.')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Progress Card', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF2E2A66), Color(0xFF222854)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.open_in_browser, size: 80, color: const Color(0xFF6366F1).withOpacity(0.5)),
              const SizedBox(height: 24),
              Text(
                'Progress Card Opened in Browser',
                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'To ensure 100% identical design with the Web App and to download the exact PDF, the progress card has been opened securely in your phone\'s browser.',
                style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF64748B)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _launchBrowser,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A4A7A),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.refresh, color: Colors.white),
                label: Text('Open Again', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
