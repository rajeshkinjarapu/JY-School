import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class NavodayaPaperGeneratorScreen extends StatefulWidget {
  const NavodayaPaperGeneratorScreen({super.key});

  @override
  State<NavodayaPaperGeneratorScreen> createState() => _NavodayaPaperGeneratorScreenState();
}

class _NavodayaPaperGeneratorScreenState extends State<NavodayaPaperGeneratorScreen> {
  final _titleCtrl = TextEditingController();
  final _classCtrl = TextEditingController(text: '6');
  
  int _mentalAbilityCount = 40;
  int _arithmeticCount = 20;
  int _languageCount = 20;

  bool _isGenerating = false;
  bool _isSaving = false;
  List<dynamic> _generatedQuestions = [];

  Future<void> _generate() async {
    if (_titleCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title is required')));
      return;
    }

    setState(() => _isGenerating = true);
    
    // Simulate complex AI generation by calling standard AI with combined payload
    final payload = {
      'subject': 'Navodaya Model Paper',
      'className': _classCtrl.text,
      'chapter': 'All Chapters',
      'topic': 'Mental Ability, Arithmetic, Language',
      'difficulty': 'medium',
      'numberOfQuestions': _mentalAbilityCount + _arithmeticCount + _languageCount,
      'type': 'Navodaya'
    };

    final res = await ApiService.generateQuestionsFromAI(payload);
    setState(() => _isGenerating = false);

    if (res['success'] && res['data'] != null) {
      setState(() {
        _generatedQuestions = res['data']['questions'] ?? [];
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Navodaya questions generated!')));
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
      'type': 'Navodaya',
      'subject': 'Navodaya Model Paper',
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
        title: Text('Navodaya Generator', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0EA5E9), Color(0xFF06B6D4)],
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
                  Text('Navodaya Exam Details', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildTextField('Paper Title*', _titleCtrl),
                  _buildTextField('Class Level', _classCtrl),
                  
                  const SizedBox(height: 16),
                  Text('Section Configuration', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Mental Ability'),
                      Text('$_mentalAbilityCount Qs', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Slider(
                    value: _mentalAbilityCount.toDouble(),
                    min: 10, max: 50, divisions: 4,
                    activeColor: const Color(0xFF0EA5E9),
                    onChanged: (v) => setState(() => _mentalAbilityCount = v.toInt()),
                  ),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Arithmetic'),
                      Text('$_arithmeticCount Qs', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Slider(
                    value: _arithmeticCount.toDouble(),
                    min: 5, max: 30, divisions: 5,
                    activeColor: const Color(0xFF0EA5E9),
                    onChanged: (v) => setState(() => _arithmeticCount = v.toInt()),
                  ),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Language'),
                      Text('$_languageCount Qs', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Slider(
                    value: _languageCount.toDouble(),
                    min: 5, max: 30, divisions: 5,
                    activeColor: const Color(0xFF0EA5E9),
                    onChanged: (v) => setState(() => _languageCount = v.toInt()),
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
                          : Text('Generate Total ${_mentalAbilityCount + _arithmeticCount + _languageCount} Qs', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0EA5E9),
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
                  Text('Generated Navodaya Questions', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
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
