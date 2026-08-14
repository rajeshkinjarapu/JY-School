import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://chamber-strained-occupier.ngrok-free.dev';

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

  // Logout method
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
  }
}
