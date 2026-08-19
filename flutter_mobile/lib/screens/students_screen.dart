import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'student_profile_screen.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  List<dynamic> _classes = [];
  String? _selectedClassId;
  List<dynamic> _students = [];
  List<dynamic> _filteredStudents = [];
  String _searchQuery = '';
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    final classResult = await ApiService.getClasses();
    if (mounted) {
      if (classResult['success']) {
        final classes = classResult['data'] as List<dynamic>? ?? [];
        String? defaultClassId;
        
        if (classes.isNotEmpty) {
          // Look for Nursery
          final nursery = classes.firstWhere(
            (c) => (c['name'] as String).toLowerCase().contains('nursery'),
            orElse: () => null,
          );
          defaultClassId = nursery?['id'] ?? classes.first['id'];
        }

        setState(() {
          _classes = classes;
          _selectedClassId = defaultClassId;
        });

        if (defaultClassId != null) {
          await _fetchStudents(defaultClassId);
        } else {
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _errorMessage = classResult['message'] ?? 'Failed to load classes';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchStudents(String classId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    
    final result = await ApiService.getStudents(classId: classId, limit: 500);
    if (mounted) {
      if (result['success']) {
        setState(() {
          _students = result['data'] ?? [];
          _filteredStudents = _students;
          _runSearch(_searchQuery); // Apply existing search if any
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load students';
          _isLoading = false;
        });
      }
    }
  }

  void _runSearch(String query) {
    setState(() {
      _searchQuery = query.toLowerCase();
      if (_searchQuery.isEmpty) {
        _filteredStudents = _students;
      } else {
        _filteredStudents = _students.where((student) {
          final user = student['user'] ?? {};
          final name = (user['name'] ?? '').toString().toLowerCase();
          final rollNo = (student['rollNo'] ?? '').toString().toLowerCase();
          return name.contains(_searchQuery) || rollNo.contains(_searchQuery);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'Students Directory',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF222854)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
              : _errorMessage.isNotEmpty
                ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
                : _filteredStudents.isEmpty
                  ? _buildEmptyState()
                  : SingleChildScrollView(
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6366F1).withOpacity(0.06),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildTableHeader(),
                              ...List.generate(_filteredStudents.length, (index) {
                                return _buildTableRow(_filteredStudents[index], index);
                              }),
                            ],
                          ),
                        ),
                      ),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          if (_classes.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedClassId,
                  hint: const Text('Select Class'),
                  icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
                  items: _classes.map<DropdownMenuItem<String>>((c) {
                    final className = '${c['name']} ${c['section'] ?? ''}'.trim();
                    return DropdownMenuItem<String>(
                      value: c['id'],
                      child: Text(
                        className,
                        style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w500),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null && value != _selectedClassId) {
                      setState(() {
                        _selectedClassId = value;
                      });
                      _fetchStudents(value);
                    }
                  },
                ),
              ),
            ),
          const SizedBox(height: 12),
          // Search Bar
          Container(
            height: 45,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: TextField(
              style: const TextStyle(color: Color(0xFF1E293B)),
              decoration: InputDecoration(
                hintText: 'Search student by name or ID...',
                hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: _runSearch,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text('Student Info', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            flex: 2,
            child: Text('Class', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 40), // For action button space
        ],
      ),
    );
  }

  Widget _buildTableRow(dynamic student, int index) {
    final user = student['user'] ?? {};
    final classInfo = student['class'] ?? {};
    final name = user['name'] ?? 'Unknown';
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
        
    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
    final rollNo = student['rollNo'] ?? 'N/A';
    final isEven = index % 2 == 0;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StudentProfileScreen(student: student),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isEven ? Colors.white : const Color(0xFFF8FAFC).withOpacity(0.5),
          border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(image),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF1E293B),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          rollNo,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF475569),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF34D399).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  className,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF059669),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            const SizedBox(width: 16),
            const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 80, color: const Color(0xFF94A3B8).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty ? 'No students found matching "$_searchQuery"' : 'No students found in this class.',
            style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 16),
          ),
        ],
      ),
    );
  }
}




