import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import 'upload_question_paper_screen.dart';

class QuestionPapersScreen extends StatefulWidget {
  const QuestionPapersScreen({super.key});

  @override
  State<QuestionPapersScreen> createState() => _QuestionPapersScreenState();
}

class _QuestionPapersScreenState extends State<QuestionPapersScreen> {
  List<dynamic> _papers = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _userRole = '';

  @override
  void initState() {
    super.initState();
    _initRole();
    _fetchPapers();
  }

  Future<void> _initRole() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() {
        _userRole = jsonDecode(userStr)['role'] ?? '';
      });
    }
  }

  Future<void> _fetchPapers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await ApiService.getQuestionPapers();
      if (res['success']) {
        setState(() {
          _papers = res['data'] ?? [];
        });
      } else {
        setState(() {
          _errorMessage = res['message'] ?? 'Failed to load question papers';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open the file link.')),
        );
      }
    }
  }

  void _showAnswerKeyDialog(String title, String answerKeyText) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      backgroundColor: Colors.white,
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.key, color: Color(0xFF10B981)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Answer Key',
                              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                            ),
                            Text(
                              title,
                              style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.grey),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 10),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: SelectableText(
                          answerKeyText,
                          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF334155), height: 1.6),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(
          'Question Papers',
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
      ),
      body: SafeArea(
        bottom: true,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          style: GoogleFonts.poppins(color: Colors.blueGrey),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchPapers,
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _fetchPapers,
                    child: _papers.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(
                                height: MediaQuery.of(context).size.height * 0.7,
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(28),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF6366F1).withOpacity(0.08),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.file_copy_rounded, 
                                          size: 72, 
                                          color: Color(0xFF6366F1)
                                        ),
                                      ),
                                      const SizedBox(height: 24),
                                      Text(
                                        'No Question Papers',
                                        style: GoogleFonts.outfit(
                                          fontSize: 22, 
                                          fontWeight: FontWeight.bold, 
                                          color: const Color(0xFF1E293B)
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 40),
                                        child: Text(
                                          'There are currently no question papers uploaded for your classes.',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.poppins(
                                            fontSize: 14, 
                                            color: const Color(0xFF64748B),
                                            height: 1.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _papers.length,
                            itemBuilder: (context, index) {
                              final paper = _papers[index];
                              final title = paper['title'] ?? 'Untitled Paper';
                              final examName = paper['exam']?['name'];
                              final subject = paper['subject']?['name'] ?? 'All Subjects';
                              final className = paper['class'] != null 
                                  ? '${paper['class']['name']}-${paper['class']['section']}' 
                                  : 'All Classes';
                              final fileUrl = paper['fileUrl'];
                              final answerKeyUrl = paper['answerKeyUrl'];
                              final answerKey = paper['answerKey'];

                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                                  ],
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(14),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFEEF2FF),
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                          child: const Icon(Icons.picture_as_pdf, color: Color(0xFF6366F1), size: 28),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                title,
                                                style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 4),
                                              if (examName != null)
                                                Text(
                                                  examName,
                                                  style: GoogleFonts.poppins(color: const Color(0xFF6366F1), fontSize: 12, fontWeight: FontWeight.w600),
                                                ),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  const Icon(Icons.class_outlined, size: 12, color: Color(0xFF64748B)),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      '$className • $subject',
                                                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () {
                                              if (fileUrl != null && fileUrl.isNotEmpty) {
                                                _launchUrl(fileUrl);
                                              } else {
                                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paper link is missing.')));
                                              }
                                            },
                                            icon: const Icon(Icons.download_rounded, size: 16, color: Colors.white),
                                            label: const Text('View Paper', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF6366F1),
                                              foregroundColor: Colors.white,
                                              elevation: 0,
                                              padding: const EdgeInsets.symmetric(vertical: 12),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            ),
                                          ),
                                        ),
                                        if (answerKeyUrl != null && answerKeyUrl.isNotEmpty) ...[
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _launchUrl(answerKeyUrl),
                                              icon: const Icon(Icons.key, size: 16, color: Color(0xFF10B981)),
                                              label: const Text('Key PDF', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF10B981).withOpacity(0.1),
                                                elevation: 0,
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                            ),
                                          ),
                                        ] else if (answerKey != null && answerKey.isNotEmpty) ...[
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _showAnswerKeyDialog(title, answerKey),
                                              icon: const Icon(Icons.key, size: 16, color: Color(0xFF10B981)),
                                              label: const Text('View Key', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 13)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF10B981).withOpacity(0.1),
                                                elevation: 0,
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
      ),
      floatingActionButton: (_userRole == 'ADMIN' || _userRole == 'SUPER_ADMIN' || _userRole == 'TEACHER')
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const UploadQuestionPaperScreen()),
                );
                if (result == true) {
                  _fetchPapers(); // refresh on successful upload
                }
              },
              backgroundColor: const Color(0xFF6366F1),
              icon: const Icon(Icons.upload_file_rounded, color: Colors.white),
              label: Text('Upload Paper', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
            )
          : null,
    );
  }
}
