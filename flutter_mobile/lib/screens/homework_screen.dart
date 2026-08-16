import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

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
        return const Color(0xFFEF4444); // Overdue - Red
      } else if (diff <= 1) {
        return const Color(0xFFF59E0B); // Due Soon - Amber
      } else {
        return const Color(0xFF10B981); // Emerald Green
      }
    } catch (_) {
      return Colors.grey;
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
      backgroundColor: const Color(0xFFF4F7FE), // Dark slate
      drawer: const AppDrawer(currentRoute: 'homework'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Daily Homework',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 16, color: Colors.blueGrey.shade400),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchHomework();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchHomework,
                  child: _homeworkList.isEmpty
                      ? Center(
                          child: Text(
                            'No homework assigned today.',
                            style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 16),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(20.0),
                          itemCount: _homeworkList.length,
                          itemBuilder: (context, index) {
                            final hw = _homeworkList[index];
                            final title = hw['title'] ?? 'Homework Assignment';
                            final desc = hw['description'] ?? '';
                            final subject = hw['subject']?['name'] ?? 'General';
                            final teacherName = hw['teacher']?['user']?['name'] ?? 'Teacher';
                            final dueDateStr = hw['dueDate']?.toString().split('T')[0] ?? '';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 18),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Theme(
                                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                                  child: ExpansionTile(
                                    tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                    title: Row(
                                      children: [
                                        // Subject Tag
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF6366F1).withOpacity(0.12),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.2)),
                                          ),
                                          child: Text(
                                            subject.toUpperCase(),
                                            style: GoogleFonts.poppins(
                                              color: const Color(0xFF818CF8),
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        // Due Date Tag
                                        if (dueDateStr.isNotEmpty)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: _getDueDateColor(dueDateStr).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              _getDueDateText(dueDateStr),
                                              style: GoogleFonts.poppins(
                                                color: _getDueDateColor(dueDateStr).withOpacity(0.85),
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
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
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Assigned by: $teacherName',
                                            style: GoogleFonts.poppins(
                                              color: const Color(0xFF94A3B8),
                                              fontSize: 11.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Divider(color: const Color(0xFFE2E8F0), height: 20),
                                            Text(
                                              'INSTRUCTIONS',
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF94A3B8),
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              desc,
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF475569),
                                                fontSize: 14,
                                                height: 1.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
