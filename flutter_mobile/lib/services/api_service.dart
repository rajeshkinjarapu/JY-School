import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://paralyze-canteen-goon.ngrok-free.dev';

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
    return _performGet('/api/auth/me', 'Failed to get profile');
  }

  // Get student attendance
  static Future<Map<String, dynamic>> getAttendance(String studentId, {String? startDate, String? endDate}) async {
    String url = '/api/attendance/student?studentId=$studentId';
    if (startDate != null) url += '&startDate=$startDate';
    if (endDate != null) url += '&endDate=$endDate';
    return _performGet(url, 'Failed to get attendance');
  }

  // Get student fee status
  static Future<Map<String, dynamic>> getFeeStatus(String studentId) async {
    return _performGet('/api/fees/student/$studentId', 'Failed to get fee status');
  }

  // Get student marks / exam results
  static Future<Map<String, dynamic>> getMarks(String studentId) async {
    return _performGet('/api/marks/student/$studentId', 'Failed to get results');
  }

  // Get class timetable
  static Future<Map<String, dynamic>> getTimetable(String classId) async {
    return _performGet('/api/timetable?classId=$classId', 'Failed to get timetable');
  }

  // Get school announcements
  static Future<Map<String, dynamic>> getAnnouncements() async {
    return _performGet('/api/announcements', 'Failed to get announcements');
  }

  // Get homework list
  static Future<Map<String, dynamic>> getHomework() async {
    return _performGet('/api/homework', 'Failed to get homework');
  }

  // Get school classes list
  static Future<Map<String, dynamic>> getClasses() async {
    return _performGet('/api/classes', 'Failed to get classes');
  }

  // Get all students
  static Future<Map<String, dynamic>> getStudents({String? classId, int limit = 50}) async {
    String url = '/api/students?limit=$limit';
    if (classId != null && classId.isNotEmpty) {
      url += '&classId=$classId';
    }
    return _performGet(url, 'Failed to get students');
  }

  // Get student by ID
  static Future<Map<String, dynamic>> getStudentById(String id) async {
    return _performGet('/api/students/$id', 'Failed to get student profile');
  }

  // Get school subjects list
  static Future<Map<String, dynamic>> getSubjects() async {
    return _performGet('/api/subjects?limit=5000', 'Failed to get subjects');
  }

  static Future<Map<String, dynamic>> createSubject(String name, String? teacherId) async {
    return _performPost('/api/subjects', {
      'name': name,
      if (teacherId != null && teacherId.isNotEmpty) 'teacherId': teacherId,
    }, 'Failed to create subject');
  }

  static Future<Map<String, dynamic>> updateSubject(String id, String name) async {
    return _performPut('/api/subjects/$id', {'name': name}, 'Failed to update subject');
  }

  static Future<Map<String, dynamic>> deleteSubject(String id) async {
    return _performDelete('/api/subjects/$id', 'Failed to delete subject');
  }

  static Future<Map<String, dynamic>> assignTeacherToSubject(String classId, String subjectId, String teacherId) async {
    return _performPost('/api/subjects/assign-teacher', {
      'classId': classId,
      'subjectId': subjectId,
      'teacherId': teacherId,
    }, 'Failed to assign teacher');
  }

  // Get exams list
  static Future<Map<String, dynamic>> getExams({String classId = ''}) async {
    final url = classId.isNotEmpty ? '/api/exams?classId=$classId' : '/api/exams?limit=500';
    return _performGet(url, 'Failed to get exams');
  }

  // Create exam
  static Future<Map<String, dynamic>> createExam(Map<String, dynamic> payload) async {
    return _performPost('/api/exams', payload, 'Failed to create exam');
  }

  // Update exam
  static Future<Map<String, dynamic>> updateExam(String examId, Map<String, dynamic> payload) async {
    return _performPut('/api/exams/$examId', payload, 'Failed to update exam');
  }

  // Delete exam
  static Future<Map<String, dynamic>> deleteExam(String examId) async {
    return _performDelete('/api/exams/$examId', 'Failed to delete exam');
  }

  static Future<Map<String, dynamic>> getExamById(String examId) async {
    return _performGet('/api/exams/$examId', 'Failed to get exam details');
  }

  // Marks Management
  static Future<Map<String, dynamic>> getMarksForExam(String examId) async {
    return _performGet('/api/marks/exam/$examId', 'Failed to get marks');
  }

  static Future<Map<String, dynamic>> bulkUploadMarks(Map<String, dynamic> payload) async {
    return _performPost('/api/marks/bulk', payload, 'Failed to save marks');
  }

  static Future<Map<String, dynamic>> freezeExamClass(String examId, String classId, bool isFrozen) async {
    return _performPost('/api/exams/$examId/freeze', {'classId': classId, 'isFrozen': isFrozen}, 'Failed to freeze exam');
  }

  // --- Clear Marks ---
  static Future<Map<String, dynamic>> clearMarks(String examId, String classId, String subject) async {
    return _request('DELETE', '/api/marks/exam/$examId', queryParams: {'classId': classId, 'subject': subject});
  }

  // --- Send Marks SMS ---
  static Future<Map<String, dynamic>> sendMarksSMS(String examId, String classId, {String template = 'Default'}) async {
    return _request('POST', '/api/exams/$examId/classes/$classId/send-sms', body: {'template': template});
  }

  // ==========================================
  // Finance & Fees API
  // ==========================================
  static Future<Map<String, dynamic>> getPendingBalances({String? classId, String? search}) async {
    String url = '/api/fees/pending-balances?limit=1000';
    if (classId != null && classId != 'ALL') url += '&classId=$classId';
    if (search != null && search.isNotEmpty) url += '&search=$search';
    return _performGet(url, 'Failed to fetch pending balances');
  }

  // Get all exams results
  static Future<Map<String, dynamic>> getExamResults(String examId, {String classId = ''}) async {
    String url = '/api/exams/$examId/results';
    if (classId.isNotEmpty) {
      url += '?classId=$classId';
    }
    return _performGet(url, 'Failed to get exam results');
  }

  // Get Students
  static Future<Map<String, dynamic>> getStudents(String classId) async {
    return _performGet('/api/students?classId=$classId&limit=1000', 'Failed to get students');
  }

  // Get exam status overview
  static Future<Map<String, dynamic>> getExamStatus() async {
    return _performGet('/api/exams/status/all', 'Failed to get exam status');
  }

  // Send marks SMS
  static Future<Map<String, dynamic>> sendMarksSMS(String examId, String classId, Map<String, dynamic> payload) async {
    return _performPost('/api/exams/$examId/classes/$classId/send-sms', payload, 'Failed to send SMS');
  }


  // Get all teachers
  static Future<Map<String, dynamic>> getTeachers({int limit = 500}) async {
    return _performGet('/api/teachers?limit=$limit', 'Failed to get teachers');
  }

  // Get teacher profile by ID
  static Future<Map<String, dynamic>> getTeacherById(String id) async {
    return _performGet('/api/teachers/$id', 'Failed to get teacher profile');
  }

  // Get classes assigned to a teacher
  static Future<Map<String, dynamic>> getTeacherClasses(String id) async {
    return _performGet('/api/teachers/$id/assigned-classes', 'Failed to get assigned classes');
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
    return _performGet('/api/classes/$classId/students', 'Failed request');
  }

  // Get all events and holidays
  static Future<Map<String, dynamic>> getEvents() async {
    return _performGet('/api/events', 'Failed request');
  }

  // Get transport routes
  static Future<Map<String, dynamic>> getTransportRoutes() async {
    return _performGet('/api/transport/routes', 'Failed request');
  }

  // Get my leave requests
  static Future<Map<String, dynamic>> getMyLeaves() async {
    return _performGet('/api/leave/my', 'Failed request');
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

  // Generic GET Helper with Offline Caching
  static Future<Map<String, dynamic>> _performGet(String endpoint, String errorMsg) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      try {
        final response = await http.get(
          Uri.parse('$baseUrl$endpoint'),
          headers: _getHeaders(token: token),
        ).timeout(const Duration(seconds: 10));

        final dynamic decoded = jsonDecode(response.body);
        if (response.statusCode == 200 || response.statusCode == 201) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('cache_$endpoint', response.body);
          
          return {'success': true, 'data': decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded};
        }
        return {'success': false, 'message': decoded is Map ? (decoded['message'] ?? errorMsg) : errorMsg};
      } catch (e) {
        final prefs = await SharedPreferences.getInstance();
        final cachedStr = prefs.getString('cache_$endpoint');
        
        if (cachedStr != null) {
          final dynamic decoded = jsonDecode(cachedStr);
          if (decoded is Map || decoded is List) {
             final data = decoded is Map && decoded.containsKey('data') ? decoded['data'] : decoded;
             return {'success': true, 'data': data, 'isCached': true};
          }
        }
        return {'success': false, 'message': 'Network error and no offline data. Please check your connection.'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // Generic POST Helper
  static Future<Map<String, dynamic>> _performPost(String endpoint, Map<String, dynamic> payload, String errorMsg) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token: token),
        body: jsonEncode(payload),
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
  static Future<Map<String, dynamic>> _performPut(String endpoint, Map<String, dynamic> payload, String errorMsg) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token: token),
        body: jsonEncode(payload),
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

  static Future<Map<String, dynamic>> _performDelete(String endpoint, String errorMsg) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(token: token),
      );

      final dynamic decoded = response.body.isNotEmpty ? jsonDecode(response.body) : {};
      if (response.statusCode == 200 || response.statusCode == 204) {
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

  // Get Answer Keys
  static Future<Map<String, dynamic>> getAnswerKeys() async {
    return _performGet('/api/answerKeys', 'Failed to get answer keys');
  }

  // Get Office Tools (Placeholder for now as this might be multiple endpoints)
  static Future<Map<String, dynamic>> getOfficeTools() async {
    return {'success': true, 'data': []};
  }

  // Get Reports (Placeholder for now as there are multiple report types)
  static Future<Map<String, dynamic>> getReports() async {
    return {'success': true, 'data': []};
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

  // Get all fee structures
  static Future<Map<String, dynamic>> getFeeStructures() async {
    return _performGet('/api/fees/structures', 'Failed to get fee structures');
  }

  // Get all fee payments
  static Future<Map<String, dynamic>> getFeePayments() async {
    return _performGet('/api/fees/payments', 'Failed to get fee payments');
  }

  // Get fee groups
  static Future<Map<String, dynamic>> getFeeGroups() async {
    return _performGet('/api/fees/groups', 'Failed to get fee groups');
  }

  // Get fee heads
  static Future<Map<String, dynamic>> getFeeHeads() async {
    return _performGet('/api/fees/heads', 'Failed to get fee heads');
  }

  // Approve fee payment
  static Future<Map<String, dynamic>> approvePayment(String paymentId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.put(
        Uri.parse('$baseUrl/api/fees/payments/$paymentId'),
        headers: _getHeaders(token: token),
        body: jsonEncode({'status': 'PAID'}),
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

  // Record a payment
  static Future<Map<String, dynamic>> recordPayment({
    required String studentId,
    required String feeStructureId,
    required double amountPaid,
    required String paymentMethod,
    String? remarks,
  }) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.post(
        Uri.parse('$baseUrl/api/fees/payments'),
        headers: _getHeaders(token: token),
        body: jsonEncode({
          'studentId': studentId,
          'feeStructureId': feeStructureId,
          'amountPaid': amountPaid,
          'paymentMethod': paymentMethod,
          'remarks': remarks ?? '',
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

  // Delete a payment
  static Future<Map<String, dynamic>> deletePayment(String paymentId) async {
    try {
      final token = await getToken();
      if (token == null) return {'success': false, 'message': 'No session token'};

      final response = await http.delete(
        Uri.parse('$baseUrl/api/fees/payments/$paymentId'),
        headers: _getHeaders(token: token),
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

  // Logout method
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
  }
}
