import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class QuestionPapersScreen extends StatefulWidget {
  const QuestionPapersScreen({super.key});

  @override
  State<QuestionPapersScreen> createState() => _QuestionPapersScreenState();
}

class _QuestionPapersScreenState extends State<QuestionPapersScreen> {
  List<dynamic> _papers = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchPapers();
  }

  Future<void> _fetchPapers() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getQuestionPapers();
      if (mounted) {
        if (res['success']) {
          setState(() {
            _papers = res['data'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() {
            _errorMessage = res['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        leading: const BackButton(),
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
      body: _isLoading
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
                              height: MediaQuery.of(context).size.height * 0.6,
                              child: Center(
                                child: Text(
                                  'No question papers uploaded yet.',
                                  style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 16),
                                ),
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(20),
                          itemCount: _papers.length,
                          itemBuilder: (context, index) {
                            final paper = _papers[index];
                            final title = paper['title'] ?? 'Untitled Paper';
                            final subject = paper['subject']?['name'] ?? 'Subject';
                            final className = paper['class'] != null 
                                ? '${paper['class']['name']}-${paper['class']['section']}' 
                                : 'All Classes';
                            final uploadedAt = paper['uploadedAt'] != null 
                                ? paper['uploadedAt'].toString().split('T')[0] 
                                : 'Unknown Date';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.04),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Icon(
                                      Icons.picture_as_pdf,
                                      color: Color(0xFF6366F1),
                                      size: 32,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: GoogleFonts.outfit(
                                            color: const Color(0xFF1E293B),
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            const Icon(Icons.class_outlined, size: 12, color: Color(0xFF64748B)),
                                            const SizedBox(width: 4),
                                            Text(
                                              '$className • $subject',
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF64748B),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Uploaded: $uploadedAt',
                                          style: GoogleFonts.poppins(
                                            color: const Color(0xFF475569),
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Downloading paper...')),
                                      );
                                    },
                                    icon: const Icon(Icons.download_rounded, color: Color(0xFF6366F1)),
                                    style: IconButton.styleFrom(
                                      backgroundColor: const Color(0xFFF8FAFC),
                                    ),
                                  )
                                ],
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}


