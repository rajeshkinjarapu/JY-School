import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AnswerKeysScreen extends StatefulWidget {
  const AnswerKeysScreen({super.key});

  @override
  State<AnswerKeysScreen> createState() => _AnswerKeysScreenState();
}

class _AnswerKeysScreenState extends State<AnswerKeysScreen> {
  List<dynamic> _papers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPapers();
  }

  Future<void> _fetchPapers() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getGeneratedPapers();
    if (res['success']) {
      setState(() {
        _papers = res['data'];
      });
    }
    setState(() => _isLoading = false);
  }

  void _viewAnswerKey(Map<String, dynamic> paper) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${paper['title']} - Answer Key', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: (paper['questions'] as List?)?.length ?? 0,
            itemBuilder: (context, index) {
              final q = paper['questions'][index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Text('Q${index + 1}. ${q['answer'] ?? 'N/A'}', style: GoogleFonts.poppins()),
              );
            },
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Answer Keys', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF10B981), Color(0xFF059669)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _papers.isEmpty
              ? Center(child: Text('No answer keys available', style: GoogleFonts.poppins(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _papers.length,
                  itemBuilder: (ctx, i) {
                    final p = _papers[i];
                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.key, color: Colors.green),
                        ),
                        title: Text(p['title'] ?? 'Untitled', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                        subtitle: Text('${p['className']} • ${p['subject']}'),
                        trailing: ElevatedButton(
                          onPressed: () => _viewAnswerKey(p),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('View Key', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
