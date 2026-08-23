import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../widgets/app_drawer.dart';
import 'finance_screen.dart';
import 'exams_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getNotifications();
      if (mounted) {
        setState(() {
          if (res['success']) {
            final data = res['data'];
            _notifications = (data is List) ? data : [];
          }
        });
      }
    } catch (e) {
      // Ignore errors, let it show empty state
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _markAllAsRead() async {
    final res = await ApiService.markNotificationsRead();
    if (res['success']) {
      setState(() {
        for (var n in _notifications) {
          n['isRead'] = true;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All notifications marked as read')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'notifications'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Notifications',
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
        actions: [
          IconButton(
            icon: const Icon(Icons.notification_add_rounded, color: Color(0xFF818CF8)),
            tooltip: 'Simulate Push Notification',
            onPressed: () {
              NotificationService().showTestNotification(
                'New Homework Added',
                'Mathematics chapter 5 exercises due tomorrow.',
                'homework'
              );
            },
          ),
          if (_notifications.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: Color(0xFF10B981)),
              tooltip: 'Mark all as read',
              onPressed: _markAllAsRead,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No New Notifications',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF64748B),
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final notif = _notifications[index];
                    return _buildNotificationCard(notif);
                  },
                ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notif) {
    final title = notif['title'] ?? 'Notification';
    final message = notif['message'] ?? '';
    final isRead = notif['isRead'] == true;
    final date = notif['createdAt'] != null 
        ? notif['createdAt'].toString().split('T')[0]
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isRead ? Colors.white : const Color(0xFF6366F1).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isRead ? const Color(0xFFE2E8F0) : const Color(0xFF6366F1).withOpacity(0.3),
        ),
      ),
      child: ListTile(
        onTap: () {
          if (notif['type'] == 'finance') {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const FinanceScreen()));
          } else if (notif['type'] == 'exams') {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamsScreen()));
          } else {
             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Viewing notification details')));
          }
        },
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isRead ? const Color(0xFFE2E8F0) : const Color(0xFF6366F1).withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded,
            color: isRead ? const Color(0xFF64748B) : const Color(0xFF818CF8),
          ),
        ),
        title: Text(
          title,
          style: GoogleFonts.outfit(
            color: const Color(0xFF1E293B),
            fontSize: 16,
            fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              message,
              style: GoogleFonts.poppins(
                color: isRead ? const Color(0xFF64748B) : const Color(0xFF475569),
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              date,
              style: GoogleFonts.poppins(
                color: const Color(0xFF475569),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


