import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';
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
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF1F5F9))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _isLoading = false;
            });
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to load: ${error.description}'))
              );
            }
          },
        ),
      );
      
    _loadUrl();
  }

  Future<void> _loadUrl() async {
    try {
      final token = await ApiService.getToken();
      final url = 'http://66.116.252.191:19999/app/progress-card/${widget.examId}/${widget.studentId}?token=$token&classId=${widget.classId}';
      _controller.loadRequest(Uri.parse(url));
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              setState(() { _isLoading = true; });
              _controller.reload();
            },
          )
        ],
      ),
      body: SafeArea(
        bottom: true,
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}
