import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class McqPaperGeneratorScreen extends StatefulWidget {
  const McqPaperGeneratorScreen({super.key});

  @override
  State<McqPaperGeneratorScreen> createState() => _McqPaperGeneratorScreenState();
}

class _McqPaperGeneratorScreenState extends State<McqPaperGeneratorScreen> {
  final _titleCtrl = TextEditingController();
  final _classCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _chapterCtrl = TextEditingController();
  final _topicCtrl = TextEditingController();
  final _difficultyCtrl = TextEditingController(text: 'medium');
  final _countCtrl = TextEditingController(text: '10');

  bool _isGenerating = false;
  bool _isSaving = false;
  List<dynamic> _generatedQuestions = [];

  Future<void> _generate() async {
    if (_titleCtrl.text.isEmpty || _classCtrl.text.isEmpty || _subjectCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title, Class, and Subject are required')));
      return;
    }

    setState(() => _isGenerating = true);
    final payload = {
      'subject': _subjectCtrl.text,
      'className': _classCtrl.text,
      'chapter': _chapterCtrl.text,
      'topic': _topicCtrl.text,
      'difficulty': _difficultyCtrl.text,
      'numberOfQuestions': int.tryParse(_countCtrl.text) ?? 10,
      'type': 'MCQ'
    };

    final res = await ApiService.generateQuestionsFromAI(payload);
    setState(() => _isGenerating = false);

    if (res['success'] && res['data'] != null) {
      setState(() {
        _generatedQuestions = res['data']['questions'] ?? [];
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Questions generated!')));
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: ${res['message']}')));
      }
    }
  }

  Future<void> _savePaper() async {
    if (_generatedQuestions.isEmpty) return;
    setState(() => _isSaving = true);
    final payload = {
      'title': _titleCtrl.text,
      'type': 'MCQ',
      'subject': _subjectCtrl.text,
      'className': _classCtrl.text,
      'totalMarks': _generatedQuestions.length,
      'questions': _generatedQuestions,
    };
    final res = await ApiService.saveGeneratedPaper(payload);
    setState(() => _isSaving = false);
    
    if (res['success']) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paper saved successfully!')));
        Navigator.pop(context);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: ${res['message']}')));
      }
    }
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('MCQ Generator', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Paper Details', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildTextField('Paper Title*', _titleCtrl),
                  Row(
                    children: [
                      Expanded(child: _buildTextField('Class*', _classCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildTextField('Subject*', _subjectCtrl)),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(child: _buildTextField('Chapter', _chapterCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildTextField('Topic', _topicCtrl)),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(child: _buildTextField('Difficulty (easy/medium/hard)', _difficultyCtrl)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildTextField('No. of Questions', _countCtrl)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _isGenerating ? null : _generate,
                      icon: _isGenerating ? const SizedBox() : const Icon(Icons.auto_awesome, color: Colors.white),
                      label: _isGenerating
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Generate with AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  )
                ],
              ),
            ),
            
            if (_generatedQuestions.isNotEmpty) ...[
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Generated Questions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _savePaper,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                    child: _isSaving ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Paper', style: TextStyle(color: Colors.white)),
                  )
                ],
              ),
              const SizedBox(height: 16),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _generatedQuestions.length,
                itemBuilder: (ctx, i) {
                  final q = _generatedQuestions[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Q${i + 1}. ${q['questionText']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          if (q['options'] != null)
                            ...(q['options'] as List).map((opt) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Text('• $opt', style: const TextStyle(color: Colors.black87)),
                                )),
                          const SizedBox(height: 8),
                          Text('Ans: ${q['answer']}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  );
                },
              )
            ]
          ],
        ),
      ),
    );
  }
}
