import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class AdmissionPdfService {
  static Future<Uint8List> generateAdmissionPdf(Map<String, dynamic> admission) async {
    final pdf = pw.Document();

    final studentName = admission['studentName']?.toString() ?? 'Student';
    final fatherName = admission['fatherName']?.toString() ?? '-';
    final motherName = admission['motherName']?.toString() ?? '-';
    final phone = admission['phone']?.toString() ?? '-';
    final aadharNo = admission['aadharNo']?.toString() ?? '-';
    final gender = admission['gender']?.toString() ?? '-';
    final classApplied = admission['classApplied']?.toString() ?? '-';
    final address = admission['address']?.toString() ?? 'Narasannapeta, Srikakulam District';
    final admissionFee = admission['admissionFee']?.toString();
    final paymentMethod = admission['paymentMethod']?.toString() ?? 'CASH';
    final paymentStatus = admission['paymentStatus']?.toString() ?? 'PENDING';
    final status = admission['status']?.toString() ?? 'PENDING';
    final id = admission['id']?.toString() ?? '001';

    String regDate = DateFormat('dd MMM yyyy').format(DateTime.now());
    if (admission['createdAt'] != null) {
      try {
        regDate = DateFormat('dd MMM yyyy').format(DateTime.parse(admission['createdAt']));
      } catch (_) {}
    }

    String dobFormatted = '-';
    if (admission['dob'] != null) {
      try {
        dobFormatted = DateFormat('dd/MM/yyyy').format(DateTime.parse(admission['dob']));
      } catch (_) {}
    }

    final regNo = 'ADM-${DateTime.now().year}-${id.length >= 6 ? id.substring(0, 6).toUpperCase() : id.toUpperCase()}';

    // Try to download student image if available
    Uint8List? studentImageBytes;
    final imageUrl = admission['studentImage']?.toString();
    if (imageUrl != null && imageUrl.startsWith('http')) {
      try {
        final res = await http.get(Uri.parse(imageUrl)).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          studentImageBytes = res.bodyBytes;
        }
      } catch (_) {}
    }

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAlignment.start,
            children: [
              // Header
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(bottom: pw.BorderSide(color: PdfColors.indigo900, width: 2)),
                ),
                padding: const pw.EdgeInsets.only(bottom: 8),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAlignment.center,
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    // School Info
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAlignment.center,
                        children: [
                          pw.Text(
                            'SRI VENKATESWARA JY SCHOOL',
                            style: pw.TextStyle(
                              fontSize: 16,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.indigo900,
                            ),
                          ),
                          pw.SizedBox(height: 2),
                          pw.Text(
                            'Recognized by Govt. of Andhra Pradesh • English Medium',
                            style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                          ),
                          pw.Text(
                            'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.',
                            style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600),
                          ),
                          pw.Text(
                            'Phone: +91 94944 55667 | Email: info@jyschool.edu.in',
                            style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                          ),
                        ],
                      ),
                    ),

                    // Passport Photo Box
                    pw.Container(
                      width: 75,
                      height: 90,
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.indigo900, width: 1.5, style: pw.BorderStyle.dashed),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                        color: PdfColors.grey100,
                      ),
                      child: studentImageBytes != null
                          ? pw.ClipRRect(
                              horizontalRadius: 6,
                              verticalRadius: 6,
                              child: pw.Image(pw.MemoryImage(studentImageBytes), fit: pw.BoxFit.cover),
                            )
                          : pw.Center(
                              child: pw.Padding(
                                padding: const pw.EdgeInsets.all(4),
                                child: pw.Text(
                                  'AFFIX STUDENT\nPASSPORT\nPHOTO',
                                  textAlign: pw.TextAlign.center,
                                  style: pw.TextStyle(fontSize: 6.5, fontWeight: pw.FontWeight.bold, color: PdfColors.grey500),
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),

              // Title Ribbon
              pw.Container(
                width: double.infinity,
                margin: const pw.EdgeInsets.symmetric(vertical: 6),
                padding: const pw.EdgeInsets.symmetric(vertical: 4),
                decoration: const pw.BoxDecoration(
                  color: PdfColors.indigo900,
                  borderRadius: pw.BorderRadius.all(pw.Radius.circular(4)),
                ),
                child: pw.Center(
                  child: pw.Text(
                    'APPLICATION FOR ADMISSION / STUDENT REGISTRATION FORM',
                    style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: PdfColors.white, letterSpacing: 1),
                  ),
                ),
              ),

              // Application Meta Bar
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Application No: $regNo', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900)),
                    pw.Text('Date: $regDate', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Class Applied: $classApplied', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900)),
                  ],
                ),
              ),

              pw.SizedBox(height: 6),

              // 1. Student Personal Details Table
              _buildSectionHeader('1. STUDENT PERSONAL INFORMATION'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell('Student Full Name', isHeader: true),
                      _buildTableCell(studentName, colSpan: 3, isBold: true),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Gender', isHeader: true),
                      _buildTableCell(gender),
                      _buildTableCell('Date of Birth', isHeader: true),
                      _buildTableCell(dobFormatted),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Aadhar Card No.', isHeader: true),
                      _buildTableCell(aadharNo),
                      _buildTableCell('Class Admitted', isHeader: true),
                      _buildTableCell(classApplied, isBold: true),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Residential Address', isHeader: true),
                      _buildTableCell(address, colSpan: 3),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 8),

              // 2. Parent / Guardian Information
              _buildSectionHeader('2. PARENT & GUARDIAN DETAILS'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell("Father's Name", isHeader: true),
                      _buildTableCell(fatherName),
                      _buildTableCell('Primary Mobile', isHeader: true),
                      _buildTableCell(phone, isBold: true),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell("Mother's Name", isHeader: true),
                      _buildTableCell(motherName),
                      _buildTableCell('Emergency Contact', isHeader: true),
                      _buildTableCell(phone),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 8),

              // 3. Admission & Fee Particulars
              _buildSectionHeader('3. ADMISSION & FEE PARTICULARS'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell('Admission Fee', isHeader: true),
                      _buildTableCell(admissionFee != null ? 'Rs. $admissionFee' : 'As Per School Structure'),
                      _buildTableCell('Payment Mode', isHeader: true),
                      _buildTableCell(paymentMethod),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Payment Status', isHeader: true),
                      _buildTableCell(paymentStatus, isBold: true),
                      _buildTableCell('Admission Status', isHeader: true),
                      _buildTableCell(status, isBold: true),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 8),

              // 4. Parent Declaration
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
                  color: PdfColors.grey50,
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
                ),
                padding: const pw.EdgeInsets.all(6),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAlignment.start,
                  children: [
                    pw.Text(
                      'Declaration by Parent / Guardian:',
                      style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Text(
                      'I hereby declare that the particulars furnished above are true and correct to the best of my knowledge and belief. I agree to abide by the rules, regulations, and discipline of the school. I undertake to ensure regular attendance and timely payment of fees for my ward.',
                      style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey700),
                      textAlign: pw.TextAlign.justify,
                    ),
                  ],
                ),
              ),

              pw.Spacer(),

              // 5. Signatures
              pw.Container(
                margin: const pw.EdgeInsets.only(top: 14),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSignatureBox('Signature of Parent / Guardian'),
                    _buildSignatureBox('Verified by (Teacher / Staff)'),
                    _buildSignatureBox('Principal / School Seal'),
                  ],
                ),
              ),

              pw.SizedBox(height: 6),

              // Footer
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300, width: 0.5)),
                ),
                padding: const pw.EdgeInsets.only(top: 4),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('JY School ERP System Generated Official Admission Record', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey500)),
                    pw.Text('Page 1 of 1', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey500)),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static pw.Widget _buildSectionHeader(String title) {
    return pw.Container(
      width: double.infinity,
      color: PdfColors.grey200,
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      child: pw.Text(
        title,
        style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900),
      ),
    );
  }

  static pw.Widget _buildTableCell(String text, {bool isHeader = false, bool isBold = false, int colSpan = 1}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(5),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 7.5,
          fontWeight: isHeader || isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.grey800 : PdfColors.black,
        ),
      ),
    );
  }

  static pw.Widget _buildSignatureBox(String title) {
    return pw.Container(
      width: 150,
      child: pw.Column(
        children: [
          pw.Container(height: 25),
          pw.Container(height: 1, color: PdfColors.black),
          pw.SizedBox(height: 3),
          pw.Text(title, style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  // Print Form Direct
  static Future<void> printAdmissionForm(BuildContext context, Map<String, dynamic> admission) async {
    final pdfBytes = await generateAdmissionPdf(admission);
    final studentName = admission['studentName']?.toString().replaceAll(' ', '_') ?? 'Student';
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'Admission_Form_$studentName.pdf',
    );
  }

  // Share Form Direct
  static Future<void> shareAdmissionPdf(Map<String, dynamic> admission) async {
    final pdfBytes = await generateAdmissionPdf(admission);
    final studentName = admission['studentName']?.toString().replaceAll(' ', '_') ?? 'Student';
    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: 'Admission_Form_$studentName.pdf',
    );
  }
}
