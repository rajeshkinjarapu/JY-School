import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'student_profile_screen.dart';
import 'add_student_screen.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  List<dynamic> _students = [];
  List<dynamic> _filteredStudents = [];
  List<dynamic> _classes = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String? _selectedClassId;
  Timer? _debounce;

  // Avatar gradients matching the web
  final List<List<Color>> avatarGradients = [
    [const Color(0xFF2DD4BF), const Color(0xFF10B981)], // Teal to Emerald
    [const Color(0xFFFB7185), const Color(0xFFE11D48)], // Rose to Pink
    [const Color(0xFFFBBF24), const Color(0xFFF97316)], // Amber to Orange
    [const Color(0xFF22D3EE), const Color(0xFF3B82F6)], // Cyan to Blue
    [const Color(0xFFA78BFA), const Color(0xFF7C3AED)], // Violet to Purple
  ];

  @override
  void initState() {
    super.initState();
    _fetchClasses();
    _fetchStudents();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await ApiService.getClasses();
      if (res['success']) {
        setState(() {
          _classes = res['data'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Failed to load classes: $e');
    }
  }

  Future<void> _fetchStudents([String? classId, String? search]) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final res = await ApiService.getStudents(classId: classId, search: search);
      if (res['success']) {
        setState(() {
          _students = res['data'] ?? [];
          _filteredStudents = List.from(_students);
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _runSearch(String query) {
    setState(() {
      _searchQuery = query;
    });

    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _fetchStudents(_selectedClassId, query);
    });
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'ST';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  Widget _buildAvatar(String name, String? photoUrl) {
    final safeName = name.isEmpty ? 'Student' : name;
    final colorIndex = safeName.codeUnitAt(0) % avatarGradients.length;
    final gradientColors = avatarGradients[colorIndex];

    if (photoUrl != null && photoUrl.isNotEmpty && !photoUrl.startsWith('data:')) {
      final url = ApiService.getImageUrl(photoUrl);
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.10), blurRadius: 8, offset: const Offset(0, 4)),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            url,
            fit: BoxFit.cover,
            headers: const {'ngrok-skip-browser-warning': '69420'},
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: const Color(0xFFF1F5F9),
                alignment: Alignment.center,
                child: const Icon(Icons.person_rounded, color: Color(0xFF94A3B8)),
              );
            },
          ),
        ),
      );
    } else {
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(color: gradientColors[1].withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          _getInitials(safeName),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE), // Premium soft blue-gray background
      drawer: const AppDrawer(currentRoute: 'students'),
      appBar: AppBar(
        title: Text('Students Directory', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22)),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFD946EF)], // Vibrant multi-stop gradient
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
            ),
            child: IconButton(
              icon: const Icon(Icons.person_add_rounded, size: 22, color: Colors.white),
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const AddStudentScreen()),
                );
                if (result == true) {
                  _fetchStudents(_selectedClassId, _searchQuery);
                }
              },
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Sleek Header with floating search/filter card
          Stack(
            children: [
              Container(
                height: 60,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFD946EF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.15), blurRadius: 24, offset: const Offset(0, 8)),
                    ],
                  ),
                  child: Column(
                    children: [
                      if (_classes.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              isExpanded: true,
                              value: _selectedClassId,
                              hint: Text('All Classes', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
                              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6366F1)),
                              items: _classes.map<DropdownMenuItem<String>>((c) {
                                final className = '${c['name']} ${c['section'] ?? ''}'.trim();
                                return DropdownMenuItem<String>(
                                  value: c['id'],
                                  child: Text(className, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (value != null && value != _selectedClassId) {
                                  setState(() { _selectedClassId = value; });
                                  _fetchStudents(value, _searchQuery);
                                }
                              },
                            ),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Container(
                        height: 50,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: TextField(
                          onChanged: _runSearch,
                          style: GoogleFonts.poppins(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search by name or roll...',
                            hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8)),
                            prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8)),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 15),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Student List Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                Text(
                  '${_filteredStudents.length} Students',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Student List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
                : _filteredStudents.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        color: const Color(0xFF8B5CF6),
                        onRefresh: () => _fetchStudents(_selectedClassId, _searchQuery),
                        child: ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24, top: 4),
                          itemCount: _filteredStudents.length,
                          itemBuilder: (context, index) {
                            return _buildStudentCard(_filteredStudents[index], index);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(dynamic student, int index) {
    final user = student['user'] ?? {};
    final name = user['name'] ?? 'Unknown';
    final photoUrl = user['photoUrl'];
    final rollNo = student['rollNo'] ?? 'N/A';
    final className = student['class']?['name'] ?? student['class']?['grade'] ?? '';
    final section = student['class']?['section'] ?? '';
    final classLabel = [className, section].where((s) => s.isNotEmpty).join('-');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => StudentProfileScreen(student: student)));
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Minimal Serial Number
                Container(
                  width: 30,
                  alignment: Alignment.center,
                  child: Text(
                    '${index + 1}',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFCBD5E1),
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                _buildAvatar(name, photoUrl),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 15, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            'Roll: $rollNo',
                            style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                          ),
                          if (classLabel.isNotEmpty) ...[
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFD946EF)]),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                classLabel,
                                style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                // Premium Phone Button
                Container(
                  width: 40,
                  height: 40,
                  margin: const EdgeInsets.only(right: 4),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF22C55E).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.phone_rounded, color: Colors.white, size: 20),
                    onPressed: () async {
                      final phone = student['parentPhone'] ?? student['parent']?['phone'] ?? student['parent']?['user']?['phone'] ?? '';
                      if (phone.isNotEmpty) {
                        final url = Uri.parse('tel:$phone');
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url);
                        } else {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch phone app')));
                          }
                        }
                      } else {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Phone number not available')));
                        }
                      }
                    },
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, size: 24, color: Color(0xFFCBD5E1)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: const Color(0xFF8B5CF6).withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            child: const Icon(Icons.search_off_rounded, size: 50, color: Color(0xFF8B5CF6)),
          ),
          const SizedBox(height: 24),
          Text(
            _searchQuery.isNotEmpty ? 'No students match "$_searchQuery"' : 'No students found in this class.',
            style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 15, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
