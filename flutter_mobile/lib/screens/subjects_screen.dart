import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SubjectsScreen extends StatefulWidget {
  const SubjectsScreen({super.key});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  bool _isLoading = true;
  String _errorMessage = '';

  List<dynamic> _subjects = [];
  List<dynamic> _classes = [];
  List<dynamic> _teachers = [];

  Map<String, List<dynamic>> _groupedSubjects = {};

  final List<List<Color>> _cardGradients = [
    [const Color(0xFF8B5CF6), const Color(0xFF7C3AED)], // Violet
    [const Color(0xFF3B82F6), const Color(0xFF4F46E5)], // Blue-Indigo
    [const Color(0xFF10B981), const Color(0xFF059669)], // Emerald
    [const Color(0xFFF43F5E), const Color(0xFFE11D48)], // Rose
    [const Color(0xFFF59E0B), const Color(0xFFD97706)], // Amber
    [const Color(0xFF06B6D4), const Color(0xFF0284C7)], // Cyan
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final results = await Future.wait([
        ApiService.getSubjects(),
        ApiService.getClasses(),
        ApiService.getTeachers(limit: 5000),
      ]);

      if (mounted) {
        final subRes = results[0];
        final classRes = results[1];
        final teachRes = results[2];

        if (subRes['success'] == true) {
          _subjects = subRes['data'] ?? [];
        } else {
          _errorMessage = subRes['message'] ?? 'Failed to load subjects';
        }

        if (classRes['success'] == true) {
          _classes = classRes['data'] ?? [];
        }

        if (teachRes['success'] == true) {
          dynamic tData = teachRes['data'];
          if (tData is Map && tData.containsKey('data')) {
            _teachers = tData['data'] ?? [];
          } else if (tData is List) {
            _teachers = tData;
          }
        }

        _groupSubjects();
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Network error: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _groupSubjects() {
    _groupedSubjects.clear();
    for (var sub in _subjects) {
      final key = (sub['name']?.toString().trim() ?? 'Unknown').toUpperCase();
      if (!_groupedSubjects.containsKey(key)) {
        _groupedSubjects[key] = [];
      }
      _groupedSubjects[key]!.add(sub);
    }
  }

  Future<void> _deleteSubject(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Subject', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to delete this subject entry?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleting...')));
      final result = await ApiService.deleteSubject(id);
      if (mounted) {
        if (result['success']) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted successfully', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
          _fetchData();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['message'] ?? 'Failed to delete'), backgroundColor: Colors.red));
        }
      }
    }
  }

  void _showSubjectForm({dynamic existingSubject}) {
    String name = existingSubject != null ? (existingSubject['name'] ?? '') : '';
    String? teacherId;

    if (existingSubject != null) {
      final teachersList = existingSubject['classSubjectTeachers'] as List? ?? [];
      if (teachersList.isNotEmpty) {
        teacherId = teachersList[0]['teacherId']?.toString();
      }
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.indigo.shade50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.menu_book_rounded, color: Colors.indigo.shade600),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                existingSubject != null ? 'Edit Subject' : 'New Subject',
                                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                existingSubject != null ? 'Update details.' : 'Add a new subject to curriculum.',
                                style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey.shade500),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text('SUBJECT NAME', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: TextEditingController(text: name)..selection = TextSelection.collapsed(offset: name.length),
                      onChanged: (val) => name = val,
                      decoration: InputDecoration(
                        hintText: 'e.g. Mathematics',
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.indigo.shade500)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (existingSubject != null) ...[
                      Text('CLASS ROOM', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Text(
                          existingSubject['class'] != null 
                              ? '${existingSubject['class']['name']}-${existingSubject['class']['section']}'
                              : 'N/A',
                          style: GoogleFonts.poppins(color: Colors.grey.shade600),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Text('ASSIGN TEACHER (OPTIONAL)', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: teacherId,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Select Teacher')),
                        ..._teachers.map((t) {
                          final user = t['user'] ?? {};
                          return DropdownMenuItem<String>(
                            value: t['id'].toString(),
                            child: Text('${user['name'] ?? 'Unknown'} (${t['employeeId'] ?? ''})'),
                          );
                        }),
                      ],
                      onChanged: (val) {
                        setModalState(() {
                          teacherId = val;
                        });
                      },
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
                            ),
                            child: Text('Cancel', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              if (name.isEmpty) return;
                              Navigator.pop(context);
                              setState(() => _isLoading = true);

                              try {
                                if (existingSubject != null) {
                                  await ApiService.updateSubject(existingSubject['id'].toString(), name);
                                  if (teacherId != null && teacherId!.isNotEmpty) {
                                    await ApiService.assignTeacherToSubject(
                                      existingSubject['classId'].toString(),
                                      existingSubject['id'].toString(),
                                      teacherId!,
                                    );
                                  }
                                } else {
                                  await ApiService.createSubject(name, teacherId);
                                }
                                _fetchData();
                                if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved successfully'), backgroundColor: Colors.green));
                              } catch (e) {
                                _fetchData();
                                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: Colors.indigo.shade600,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              existingSubject != null ? 'Save Changes' : 'Create Subject',
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }
        );
      },
    );
  }

  void _showSubjectDetails(String subjectName, List<dynamic> entries, List<Color> gradient) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: Color(0xFFF8FAFC),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 50, height: 50,
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                      child: Center(child: Text(subjectName.length >= 2 ? subjectName.substring(0, 2).toUpperCase() : subjectName.toUpperCase(), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white))),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(subjectName, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text('${entries.length} Classes', style: GoogleFonts.poppins(fontSize: 14, color: Colors.white70)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    )
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: entries.length,
                  itemBuilder: (context, index) {
                    final sub = entries[index];
                    final classInfo = sub['class'] ?? {};
                    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
                    
                    final teachersList = sub['classSubjectTeachers'] as List? ?? [];
                    String teacherName = 'Not Assigned';
                    if (teachersList.isNotEmpty) {
                      final teacher = teachersList[0]['teacher']?['user']?['name'];
                      if (teacher != null) teacherName = teacher;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: gradient[0].withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: Icon(Icons.class_, color: gradient[0]),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(className.isEmpty ? 'All Classes' : className, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade800)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.person_outline, size: 14, color: Colors.grey.shade500),
                                    const SizedBox(width: 4),
                                    Text(teacherName, style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey.shade600)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          PopupMenuButton<String>(
                            icon: Icon(Icons.more_vert, color: Colors.grey.shade500),
                            onSelected: (value) {
                              if (value == 'edit') {
                                Navigator.pop(context);
                                _showSubjectForm(existingSubject: sub);
                              } else if (value == 'delete') {
                                Navigator.pop(context);
                                _deleteSubject(sub['id'].toString());
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 18), SizedBox(width: 8), Text('Edit')])),
                              const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete, color: Colors.red, size: 18), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Colors.red))])),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final uniqueSubjectNames = _groupedSubjects.keys.toList()..sort();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Subjects & Curriculum',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showSubjectForm(),
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text('New Subject', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_errorMessage, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchData, child: const Text('Retry'))
                    ],
                  ),
                )
              : _subjects.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.menu_book_rounded, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text("No subjects configured yet.", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
                        ],
                      ),
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.2,
                      ),
                      itemCount: uniqueSubjectNames.length,
                      itemBuilder: (context, index) {
                        final subjectName = uniqueSubjectNames[index];
                        final entries = _groupedSubjects[subjectName]!;
                        final gradient = _cardGradients[index % _cardGradients.length];
                        final abbr = subjectName.length >= 2 ? subjectName.substring(0, 2).toUpperCase() : subjectName.toUpperCase();

                        return GestureDetector(
                          onTap: () => _showSubjectDetails(subjectName, entries, gradient),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(color: gradient[0].withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                              ],
                            ),
                            child: Stack(
                              children: [
                                Positioned(
                                  right: -20,
                                  top: -20,
                                  child: Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), shape: BoxShape.circle)),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          abbr,
                                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            subjectName,
                                            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            '${entries.length} Classes',
                                            style: GoogleFonts.poppins(fontSize: 12, color: Colors.white70),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
