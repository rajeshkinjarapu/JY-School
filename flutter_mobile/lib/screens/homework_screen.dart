import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class HomeworkScreen extends StatefulWidget {
  const HomeworkScreen({super.key});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  List<dynamic> _homeworkList = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchHomework();
  }

  Future<void> _fetchHomework() async {
    final result = await ApiService.getHomework();

    if (mounted) {
      if (result['success']) {
        setState(() {
          _homeworkList = result['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _isLoading = false;
        });
      }
    }
  }

  Color _getDueDateColor(String dateStr) {
    try {
      final dueDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = dueDate.difference(now).inDays;

      if (diff < 0) {
        return const Color(0xFFEF4444); // Red
      } else if (diff <= 1) {
        return const Color(0xFFF59E0B); // Amber
      } else {
        return const Color(0xFF10B981); // Emerald
      }
    } catch (_) {
      return const Color(0xFF64748B); // Slate
    }
  }

  String _getDueDateText(String dateStr) {
    try {
      final dueDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = dueDate.difference(now).inDays;

      if (diff < 0) {
        return 'Overdue';
      } else if (diff == 0) {
        return 'Due Today';
      } else if (diff == 1) {
        return 'Due Tomorrow';
      } else {
        return 'Due in $diff days';
      }
    } catch (_) {
      return 'Due: $dateStr';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        leading: const BackButton(color: Colors.white),
        title: Text(
          'My Homework',
          style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
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
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _errorMessage != null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _fetchHomework,
                  color: const Color(0xFF4F46E5),
                  child: _homeworkList.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.all(16.0),
                          itemCount: _homeworkList.length,
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          itemBuilder: (context, index) {
                            return _buildHomeworkCard(_homeworkList[index]);
                          },
                        ),
                ),
    );
  }

  Widget _buildHomeworkCard(dynamic hw) {
    final title = hw['title'] ?? 'Homework Assignment';
    final desc = hw['description'] ?? 'No description provided.';
    final subject = hw['subject']?['name'] ?? 'General';
    final teacherName = hw['teacher']?['user']?['name'] ?? 'Teacher';
    final dueDateStr = hw['dueDate']?.toString().split('T')[0] ?? '';

    final dueColor = dueDateStr.isNotEmpty ? _getDueDateColor(dueDateStr) : const Color(0xFF64748B);
    final dueText = dueDateStr.isNotEmpty ? _getDueDateText(dueDateStr) : 'No due date';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5)),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.all(16),
            title: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: dueColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(Icons.menu_book_rounded, color: dueColor, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subject.toUpperCase(),
                        style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        title,
                        style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 12.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: dueColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: dueColor.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.schedule_rounded, size: 12, color: dueColor),
                        const SizedBox(width: 4),
                        Text(
                          dueText,
                          style: GoogleFonts.poppins(color: dueColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'By $teacherName',
                      style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'INSTRUCTIONS',
                      style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      desc,
                      style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 14, height: 1.6, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
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
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)],
            ),
            child: const Icon(Icons.assignment_turned_in_rounded, size: 60, color: Color(0xFFCBD5E1)),
          ),
          const SizedBox(height: 24),
          Text('No Homework Assigned', style: GoogleFonts.outfit(fontSize: 22, color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('You are all caught up! Enjoy your free time.', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline_rounded, size: 60, color: Color(0xFFEF4444)),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'Something went wrong',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 16, color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            onPressed: () {
              setState(() {
                _isLoading = true;
                _errorMessage = null;
              });
              _fetchHomework();
            },
            child: Text('Try Again', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
