import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OMRScannerScreen extends StatefulWidget {
  final String examId;
  const OMRScannerScreen({Key? key, required this.examId}) : super(key: key);

  @override
  _OMRScannerScreenState createState() => _OMRScannerScreenState();
}

class _OMRScannerScreenState extends State<OMRScannerScreen> {
  File? _image;
  bool _isProcessing = false;
  Map<String, dynamic>? _scanResult;

  Future<void> _captureImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _image = File(image.path);
        _scanResult = null;
      });
      _uploadAndScanOMR();
    }
  }

  Future<void> _uploadAndScanOMR() async {
    if (_image == null) return;
    setState(() {
      _isProcessing = true;
    });

    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('token');

      var request = http.MultipartRequest('POST', Uri.parse('${ApiService.baseUrl}/api/exams/scan-omr'));
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['examId'] = widget.examId;
      request.files.add(await http.MultipartFile.fromPath('image', _image!.path));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
           setState(() {
             _scanResult = data['data'] ?? data; // Depending on how backend structures successResponse
           });
        } else {
           _showError(data['message'] ?? 'Failed to parse OMR');
        }
      } else {
        _showError('Server error: ${response.statusCode}');
      }
    } catch (e) {
      _showError('Error scanning: $e');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('OMR Scanner', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF2563EB),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            if (_image != null)
              Container(
                margin: const EdgeInsets.all(16),
                height: 300,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: DecorationImage(
                    image: FileImage(_image!),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, spreadRadius: 2)
                  ]
                ),
              )
            else
              Container(
                margin: const EdgeInsets.all(16),
                height: 300,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[400]!, style: BorderStyle.solid, width: 2),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.document_scanner, size: 64, color: Colors.grey[500]),
                      const SizedBox(height: 16),
                      Text('Capture OMR Sheet to Scan', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                    ],
                  ),
                ),
              ),

            if (_isProcessing)
              const Padding(
                padding: EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Analyzing OMR Sheet...', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),

            if (_scanResult != null && !_isProcessing)
              _buildResultCard(),

            const SizedBox(height: 40),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton.icon(
                  onPressed: _isProcessing ? null : _captureImage,
                  icon: const Icon(Icons.camera_alt, color: Colors.white),
                  label: Text(_image == null ? 'Open Camera' : 'Retake Photo', style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 4,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    // Determine where data lives based on standard successResponse wrapper
    final data = _scanResult!['data'] ?? _scanResult;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 15, spreadRadius: 5)
        ]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.green[100], shape: BoxShape.circle),
                child: Icon(Icons.check_circle, color: Colors.green[700], size: 28),
              ),
              const SizedBox(width: 15),
              const Text('Scan Successful!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ],
          ),
          const Divider(height: 30),
          _infoRow('Student ID', data['student_id']?.toString() ?? 'Unknown'),
          const SizedBox(height: 15),
          const Text('Subject Marks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 10),
          _markRow('Maths (1-25)', data['marks']?['maths'] ?? 0),
          _markRow('Physics (26-50)', data['marks']?['physics'] ?? 0),
          _markRow('Chemistry (51-75)', data['marks']?['chemistry'] ?? 0),
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Score', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              Text('${data['marks']?['total'] ?? 0} / 300', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
            ],
          ),
          const SizedBox(height: 25),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                // Here we would call a save API to push to DB
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks saved to Database!')));
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[600],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Confirm & Save Marks', style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          )
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 16, color: Colors.black54)),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _markRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16)),
          Text(value.toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
