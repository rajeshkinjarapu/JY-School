import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import 'id_card_preview_screen.dart';

class IdCardStudentsScreen extends StatefulWidget {
  final String templateId;
  final String templateName;
  final Color themeColor;

  const IdCardStudentsScreen({
    super.key,
    required this.templateId,
    required this.templateName,
    required this.themeColor,
  });

  @override
  State<IdCardStudentsScreen> createState() => _IdCardStudentsScreenState();
}

class _IdCardStudentsScreenState extends State<IdCardStudentsScreen> {
  bool _isLoading = true;
  List<dynamic> _classes = [];
  List<dynamic> _students = [];
  String? _selectedClassId;

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getClasses();
    if (mounted) {
      if (res['success']) {
        setState(() {
          _classes = res['data'] ?? [];
          if (_classes.isNotEmpty) {
            _selectedClassId = _classes[0]['id'];
            _fetchStudents(_selectedClassId!);
          } else {
            _isLoading = false;
          }
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchStudents(String classId) async {
    setState(() => _isLoading = true);
    final res = await ApiService.getStudents(classId: classId, limit: 500);
    if (mounted) {
      if (res['success']) {
        setState(() {
          _students = res['data']?['data'] ?? res['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Select Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: widget.themeColor,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filter by Class', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedClassId,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  items: _classes.map((c) {
                    return DropdownMenuItem<String>(
                      value: c['id'],
                      child: Text('${c['name']} - ${c['section']}'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedClassId = val);
                      _fetchStudents(val);
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: widget.themeColor))
                : _students.isEmpty
                    ? Center(child: Text('No students found', style: GoogleFonts.outfit()))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _students.length,
                        itemBuilder: (context, index) {
                          final student = _students[index];
                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(8),
                              leading: CircleAvatar(
                                radius: 25,
                                backgroundImage: NetworkImage(student['user']?['photoUrl'] ?? 'https://ui-avatars.com/api/?name=${student['user']?['name'] ?? 'User'}'),
                              ),
                              title: Text(student['user']?['name'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                              subtitle: Text(student['rollNo'] ?? ''),
                              trailing: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: widget.themeColor,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                ),
                                onPressed: () {
                                  Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => IdCardPreviewScreen(
                                      student: student,
                                      templateId: widget.templateId,
                                      templateName: widget.templateName,
                                      themeColor: widget.themeColor,
                                    )
                                  ));
                                },
                                child: const Text('Generate'),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
