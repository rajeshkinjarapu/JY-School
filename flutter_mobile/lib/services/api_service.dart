import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://retouch-buckskin-overgrown.ngrok-free.dev';

  // Base headers for API requests
  static Map<String, String> _getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Get active session token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  // Login method
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: _getHeaders(),
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Safe check for different formats in responses
        var responseData = data['data'] ?? data;
        String? accessToken = responseData['accessToken'];
        String? refreshToken = responseData['refreshToken'];
        var user = responseData['user'];

        if (accessToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('accessToken', accessToken);
          if (refreshToken != null) {
            await prefs.setString('refreshToken', refreshToken);
          }
          if (user != null) {
            await prefs.setString('user', jsonEncode(user));
          }
          return {'success': true, 'user': user};
        }
      }
      return {'success': false, 'message': data['message'] ?? 'Login failed'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Fetch student/staff profile
  static Future<Map<String, dynamic>> getMe() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/me'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get profile'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get student attendance
  static Future<Map<String, dynamic>> getAttendance(String studentId, {String? startDate, String? endDate}) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      String url = '$baseUrl/api/attendance/student?studentId=$studentId';
      if (startDate != null) url += '&startDate=$startDate';
      if (endDate != null) url += '&endDate=$endDate';

      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get attendance'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get student fee status
  static Future<Map<String, dynamic>> getFeeStatus(String studentId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/fees/student/$studentId'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get fee status'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }


  // Get student marks / exam results
  static Future<Map<String, dynamic>> getMarks(String studentId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/marks/student/$studentId'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get results'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get class timetable
  static Future<Map<String, dynamic>> getTimetable(String classId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/timetable?classId=$classId'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get timetable'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get school announcements
  static Future<Map<String, dynamic>> getAnnouncements() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/announcements'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get announcements'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get homework list
  static Future<Map<String, dynamic>> getHomework() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/homework'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get homework'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get school classes list
  static Future<Map<String, dynamic>> getClasses() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/classes'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get classes'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get school subjects list
  static Future<Map<String, dynamic>> getSubjects() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/subjects'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get subjects'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get exams list
  static Future<Map<String, dynamic>> getExams({String classId = ''}) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final url = classId.isNotEmpty 
          ? '$baseUrl/api/exams?classId=$classId' 
          : '$baseUrl/api/exams';

      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get exams'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get all students
  static Future<Map<String, dynamic>> getStudents({int limit = 500}) async {
    return _performGet('/api/students?limit=$limit', 'Failed to get students');
  }


  // Get all teachers
  static Future<Map<String, dynamic>> getTeachers({int limit = 500}) async {
    return _performGet('/api/teachers?limit=$limit', 'Failed to get teachers');
  }

  // Get class student attendance list
  static Future<Map<String, dynamic>> getAttendanceByClass(String classId, String date) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/attendance/class?classId=$classId&date=$date'),
        headers: _getHeaders(token: token),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data'] ?? data};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to get student list'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Submit bulk attendance
  static Future<Map<String, dynamic>> submitBulkAttendance(
      String classId, String date, List<Map<String, dynamic>> records) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/attendance/bulk'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'classId': classId,
          'date': date,
          'records': records,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': data['message'] ?? 'Attendance marked successfully'};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to mark attendance'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Submit new homework
  static Future<Map<String, dynamic>> submitHomework(
      String classId, String subjectId, String title, String description, String dueDate) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/homework'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'classId': classId,
          'subjectId': subjectId,
          'title': title,
          'description': description,
          'dueDate': dueDate,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': data['message'] ?? 'Homework posted successfully'};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to post homework'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Submit bulk marks
  static Future<Map<String, dynamic>> submitBulkMarks(List<Map<String, dynamic>> marks) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/marks/bulk'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'marks': marks,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': data['message'] ?? 'Marks saved successfully'};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to save marks'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }


  // Get students list in a class
  static Future<Map<String, dynamic>> getClassStudents(String classId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/classes/$classId/students'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get all events and holidays
  static Future<Map<String, dynamic>> getEvents() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/events'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get transport routes
  static Future<Map<String, dynamic>> getTransportRoutes() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/transport/routes'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get my leave requests
  static Future<Map<String, dynamic>> getMyLeaves() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl/api/leave/my'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Apply for leave
  static Future<Map<String, dynamic>> applyLeave({
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/leave'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'startDate': startDate,
          'endDate': endDate,
          'reason': reason,
        }),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': decoded is Map ? (decoded['message'] ?? 'Success') : 'Success'};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get Gate Passes
  static Future<Map<String, dynamic>> getGatePasses() async {
    return _performGet('/api/gatePass', 'Failed to get gate passes');
  }

  // Apply Gate Pass
  static Future<Map<String, dynamic>> applyGatePass({
    required String reason,
    required String outTime,
  }) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/gatePass'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'reason': reason,
          'outTime': outTime,
        }),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': decoded is Map ? (decoded['message'] ?? 'Success') : 'Success'};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get Salary (Teachers Only)
  static Future<Map<String, dynamic>> getSalary() async {
    return _performGet('/api/salary', 'Failed to get salary details');
  }

  // Get Slip Tests
  static Future<Map<String, dynamic>> getSlipTests() async {
    return _performGet('/api/slipTests', 'Failed to get slip tests');
  }

  // Get Notifications
  static Future<Map<String, dynamic>> getNotifications() async {
    return _performGet('/api/notifications', 'Failed to get notifications');
  }

  // Mark all notifications as read
  static Future<Map<String, dynamic>> markNotificationsRead() async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/read-all'),
        headers: _getHeaders(token: token),
      );

      return {'success': response.statusCode == 200 || response.statusCode == 201};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get Chat Conversations
  static Future<Map<String, dynamic>> getChatConversations() async {
    return _performGet('/api/messages/conversations', 'Failed to get conversations');
  }

  // Get Chat Messages for a specific user
  static Future<Map<String, dynamic>> getConversation(String userId) async {
    return _performGet('/api/messages/$userId', 'Failed to get messages');
  }

  // Send a message
  static Future<Map<String, dynamic>> sendMessage(String receiverId, String content) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/messages'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'receiverId': receiverId,
          'content': content,
        }),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed request') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Generic GET Helper
  static Future<Map<String, dynamic>> _performGet(String endpoint, String errorMsg) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? errorMsg) : errorMsg};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Get Admin Dashboard Stats
  static Future<Map<String, dynamic>> getAdminDashboardStats() async {
    return _performGet('/api/dashboard/admin', 'Failed to get admin statistics');
  }

  // Get Question Papers (Study Material)
  static Future<Map<String, dynamic>> getQuestionPapers() async {
    return _performGet('/api/questionPapers', 'Failed to get question papers');
  }

  // Get Generated Papers (Study Material)
  static Future<Map<String, dynamic>> getGeneratedPapers() async {
    return _performGet('/api/generatedPapers', 'Failed to get generated papers');
  }

  // Change Password
  static Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.put(
        Uri.parse('$baseUrl/api/auth/change-password'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final dynamic decoded = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'message': decoded is Map ? (decoded['message'] ?? 'Password changed successfully') : 'Success'};
      }
      return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? 'Failed to change password') : 'Failed request'};
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }


  // Teacher Dashboard Stats
  static Future<Map<String, dynamic>> getAttendanceStats() async {
    return _performGet('/api/dashboard/teacher', 'Failed to get teacher dashboard stats');
  }

  // Logout method
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
  }
}
