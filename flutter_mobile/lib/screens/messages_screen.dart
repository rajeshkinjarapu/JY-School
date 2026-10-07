import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  bool _isLoading = true;
  List<dynamic> _conversations = [];
  Map<String, dynamic>? _currentUser;

  @override
  void initState() {
    super.initState();
    _initUserAndFetch();
  }

  Future<void> _initUserAndFetch() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() {
        _currentUser = jsonDecode(userStr);
      });
    }
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getConversations();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _conversations = res['data'] ?? [];
        }
      });
    }
  }

  void _showNewChatModal() async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return _NewChatSheet(currentUser: _currentUser, onUserSelected: (user) {
          Navigator.pop(ctx);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ChatScreen(
                userId: user['id'] ?? '',
                userName: user['name'] ?? 'Chat',
              ),
            ),
          ).then((_) => _fetchConversations());
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'messages'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Messages',
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
            icon: const Icon(Icons.edit_square),
            onPressed: _showNewChatModal,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _conversations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Conversations Yet',
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
                  itemCount: _conversations.length,
                  itemBuilder: (context, index) {
                    final convo = _conversations[index];
                    final otherUser = convo['otherUser'] ?? {};
                    final lastMessage = convo['lastMessage'] ?? {};

                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      leading: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF818CF8), Color(0xFFC084FC)],
                          ),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Center(
                          child: Text(
                            (otherUser['name'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      title: Text(
                        otherUser['name'] ?? 'Unknown User',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF1E293B),
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        lastMessage['content'] ?? 'Started a conversation',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF64748B),
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: convo['unreadCount'] != null && convo['unreadCount'] > 0
                          ? Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Color(0xFF6366F1),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '\',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF1E293B),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          : const SizedBox.shrink(),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(
                              userId: otherUser['id'] ?? '',
                              userName: otherUser['name'] ?? 'Chat',
                            ),
                          ),
                        ).then((_) => _fetchConversations());
                      },
                    );
                  },
                ),
    );
  }
}

class _NewChatSheet extends StatefulWidget {
  final Map<String, dynamic>? currentUser;
  final Function(dynamic) onUserSelected;

  const _NewChatSheet({required this.currentUser, required this.onUserSelected});

  @override
  State<_NewChatSheet> createState() => _NewChatSheetState();
}

class _NewChatSheetState extends State<_NewChatSheet> {
  bool _isLoading = true;
  List<dynamic> _users = [];

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    final res = await ApiService.performGet('/api/messages/users', 'Failed to fetch users');
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          final raw = res['data'] ?? [];
          final list = (raw is List ? raw : (raw['data'] ?? raw['users'] ?? [])).toList();
          
          _users = list.where((u) {
            if (u['id'] == widget.currentUser?['id']) return false;
            if (widget.currentUser?['role'] == 'STUDENT' && u['role'] == 'STUDENT') return false;
            return true;
          }).toList();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(4))),
          const SizedBox(height: 12),
          Text('New Chat', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
          const Divider(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _users.isEmpty
                    ? const Center(child: Text('No users found'))
                    : ListView.builder(
                        itemCount: _users.length,
                        itemBuilder: (ctx, idx) {
                          final u = _users[idx];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF6366F1),
                              child: Text(
                                (u['name'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(u['name'] ?? 'Unknown', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                            subtitle: Text(u['role'] ?? '', style: GoogleFonts.poppins(fontSize: 12)),
                            onTap: () => widget.onUserSelected(u),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String userId;
  final String userName;

  const ChatScreen({super.key, required this.userId, required this.userName});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _msgController = TextEditingController();
  bool _isLoading = true;
  List<dynamic> _messages = [];
  Map<String, dynamic>? _currentUser;

  @override
  void initState() {
    super.initState();
    _initUserAndFetch();
  }

  Future<void> _initUserAndFetch() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() {
        _currentUser = jsonDecode(userStr);
      });
    }
    _fetchMessages();
  }

  Future<void> _fetchMessages() async {
    final res = await ApiService.performGet('/api/messages/conversation/\', 'Failed');
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          final raw = res['data'] ?? [];
          _messages = raw is List ? raw : (raw['messages'] ?? []);
        }
      });
    }
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;

    _msgController.clear();
    // Optimistic UI update
    setState(() {
      _messages.insert(0, {
        'content': text,
        'senderId': _currentUser?['id'] ?? 'me',
        'createdAt': DateTime.now().toIso8601String(),
      });
    });

    await ApiService.performPost('/api/messages', {
      'receiverId': widget.userId,
      'content': text,
    }, 'Failed to send message');
    _fetchMessages();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          widget.userName,
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
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                : ListView.builder(
                    reverse: true, // Messages usually show bottom-up
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      // If senderId == current user id, it's sent by me
                      final isMe = msg['senderId'] == _currentUser?['id'] || msg['senderId'] == 'me';

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isMe ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isMe ? 16 : 0),
                              bottomRight: Radius.circular(isMe ? 0 : 16),
                            ),
                          ),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.75,
                          ),
                          child: Text(
                            msg['content'] ?? '',
                            style: GoogleFonts.poppins(
                              color: isMe ? Colors.white : const Color(0xFF1E293B),
                              fontSize: 14,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          
          // Chat Input
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              border: Border(top: BorderSide(color: const Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      style: GoogleFonts.poppins(color: const Color(0xFF1E293B)),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: GoogleFonts.poppins(color: const Color(0xFF475569)),
                        filled: true,
                        fillColor: const Color(0xFFE2E8F0),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Color(0xFF6366F1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
