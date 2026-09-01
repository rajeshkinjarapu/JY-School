import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AdminAppInstallsScreen extends StatefulWidget {
  const AdminAppInstallsScreen({Key? key}) : super(key: key);

  @override
  _AdminAppInstallsScreenState createState() => _AdminAppInstallsScreenState();
}

class _AdminAppInstallsScreenState extends State<AdminAppInstallsScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _allUsers = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchInstalls();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchInstalls() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await ApiService.getAppInstalls();
      if (res['success']) {
        if (mounted) {
          setState(() {
            _allUsers = res['data'] ?? [];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = res['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load app installs: $e';
          _isLoading = false;
        });
      }
    }
  }

  bool _isOnline(String? lastLogin) {
    if (lastLogin == null) return false;
    try {
      final date = DateTime.parse(lastLogin).toLocal();
      final diff = DateTime.now().difference(date);
      return diff.inHours < 24;
    } catch (e) {
      return false;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      return '${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateStr;
    }
  }

  Widget _buildList(String role) {
    final filteredUsers = _allUsers.where((u) => u['role'] == role).toList();

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: GoogleFonts.outfit(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchInstalls,
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (filteredUsers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.smartphone, color: Colors.grey.shade400, size: 64),
            const SizedBox(height: 16),
            Text('No app installs found for ${role.toLowerCase()}s',
                style: GoogleFonts.outfit(color: Colors.grey.shade600, fontSize: 16)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredUsers.length,
      itemBuilder: (context, index) {
        final user = filteredUsers[index];
        final isOnline = _isOnline(user['lastAppLoginAt']);
        String subtitle = user['phone'] ?? user['email'] ?? '';
        
        if (role == 'STUDENT' && user['student'] != null && user['student']['class'] != null) {
          final c = user['student']['class'];
          subtitle += ' • ${c['name']} - ${c['section']}';
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: const Color(0xFF4F46E5).withOpacity(0.1),
                      child: Text(
                        user['name'].toString()[0].toUpperCase(),
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF4F46E5),
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user['name'],
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: const Color(0xFF1E293B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            subtitle,
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isOnline ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isOnline ? Colors.green : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isOnline ? 'Online' : 'Offline',
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isOnline ? Colors.green.shade700 : Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.devices, size: 14, color: Colors.grey.shade500),
                              const SizedBox(width: 4),
                              Text(
                                'Device',
                                style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade500),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user['deviceModel'] ?? 'Unknown',
                            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'v${user['appVersion'] ?? 'N/A'}',
                            style: GoogleFonts.outfit(fontSize: 11, color: Colors.indigo.shade400, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 30, color: Colors.grey.shade200),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(left: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 14, color: Colors.grey.shade500),
                                const SizedBox(width: 4),
                                Text(
                                  'Last Active',
                                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _formatDate(user['lastAppLoginAt']),
                              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF0F172A),
        title: Text(
          'App Installs',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchInstalls,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF4F46E5),
          indicatorWeight: 4,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 15),
          tabs: const [
            Tab(text: 'Students'),
            Tab(text: 'Teachers'),
          ],
        ),
      ),
      body: SafeArea(
        bottom: true,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildList('STUDENT'),
            _buildList('TEACHER'),
          ],
        ),
      ),
    );
  }
}
