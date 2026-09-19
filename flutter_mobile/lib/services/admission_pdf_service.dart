import 'dart:convert';
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
    final fatherOccupation = admission['fatherOccupation']?.toString() ?? '-';
    final fatherAadhar = admission['fatherAadhar']?.toString() ?? '-';
    final fatherPhone = admission['fatherPhone']?.toString() ?? admission['phone']?.toString() ?? '-';

    final motherName = admission['motherName']?.toString() ?? '-';
    final motherOccupation = admission['motherOccupation']?.toString() ?? '-';
    final motherAadhar = admission['motherAadhar']?.toString() ?? '-';
    final motherPhone = admission['motherPhone']?.toString() ?? '-';

    final phone = admission['phone']?.toString() ?? '-';
    final alternatePhone = admission['alternatePhone']?.toString() ?? '-';

    final aadharNo = admission['aadharNo']?.toString() ?? '-';
    final gender = admission['gender']?.toString() ?? '-';
    final classApplied = admission['classApplied']?.toString() ?? '-';
    final academicYear = admission['academicYear']?.toString() ?? '${DateTime.now().year}-${DateTime.now().year + 1}';

    final motherTongue = admission['motherTongue']?.toString() ?? 'Telugu';
    final nationality = admission['nationality']?.toString() ?? 'Indian';
    final religion = admission['religion']?.toString() ?? 'Hindu';
    final caste = admission['caste']?.toString() ?? '-';
    final subCaste = admission['subCaste']?.toString() ?? '';
    final casteFormatted = (subCaste.isNotEmpty && subCaste != '-') ? '$caste ($subCaste)' : caste;

    final doorNo = admission['doorNo']?.toString() ?? '';
    final village = admission['village']?.toString() ?? '';
    final mandal = admission['mandal']?.toString() ?? '';
    final district = admission['district']?.toString() ?? '';
    final state = admission['state']?.toString() ?? '';
    final addressParts = [doorNo, village, mandal, district, state].where((s) => s.trim().isNotEmpty).toList();
    final address = (admission['address']?.toString().isNotEmpty == true)
        ? admission['address'].toString()
        : (addressParts.isNotEmpty ? addressParts.join(', ') : 'Narasannapeta, Srikakulam District');

    final previousSchool = admission['previousSchool']?.toString() ?? 'N/A (Fresher)';

    final admissionFee = admission['admissionFee']?.toString();
    final paymentMethod = admission['paymentMethod']?.toString() ?? 'CASH';
    final paymentStatus = admission['paymentStatus']?.toString() ?? 'PENDING';
    final cashReceivedByName = admission['cashReceivedByName']?.toString();
    final registeredByName = admission['registeredByName']?.toString();
    final status = admission['status']?.toString() ?? 'PENDING';
    final id = admission['id']?.toString() ?? '001';

    // Parse siblings safely
    List<dynamic> siblingsList = [];
    final siblingsDataRaw = admission['siblingsData'];
    if (siblingsDataRaw != null && siblingsDataRaw != 'NA') {
      if (siblingsDataRaw is List) {
        siblingsList = siblingsDataRaw;
      } else if (siblingsDataRaw is String) {
        try {
          siblingsList = jsonDecode(siblingsDataRaw);
        } catch (_) {}
      }
    }

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

    // Download student image if available
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
        margin: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(bottom: pw.BorderSide(color: PdfColors.indigo900, width: 1.5)),
                ),
                padding: const pw.EdgeInsets.only(bottom: 4),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.center,
                        children: [
                          pw.Text(
                            'SRI VENKATESWARA JY SCHOOL',
                            style: pw.TextStyle(
                              fontSize: 14,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.indigo900,
                            ),
                          ),
                          pw.SizedBox(height: 1),
                          pw.Text(
                            'Recognized by Govt. of Andhra Pradesh • English Medium',
                            style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                          ),
                          pw.Text(
                            'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.',
                            style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
                          ),
                          pw.Text(
                            'Phone: +91 94944 55667 | Email: info@jyschool.edu.in',
                            style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                          ),
                        ],
                      ),
                    ),

                    // Passport Photo Box
                    pw.Container(
                      width: 60,
                      height: 72,
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.indigo900, width: 1.2, style: pw.BorderStyle.dashed),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                        color: PdfColors.grey100,
                      ),
                      child: studentImageBytes != null
                          ? pw.ClipRRect(
                              horizontalRadius: 4,
                              verticalRadius: 4,
                              child: pw.Image(pw.MemoryImage(studentImageBytes), fit: pw.BoxFit.cover),
                            )
                          : pw.Center(
                              child: pw.Padding(
                                padding: const pw.EdgeInsets.all(3),
                                child: pw.Text(
                                  'AFFIX STUDENT\nPASSPORT\nPHOTO',
                                  textAlign: pw.TextAlign.center,
                                  style: pw.TextStyle(fontSize: 5.5, fontWeight: pw.FontWeight.bold, color: PdfColors.grey500),
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
                margin: const pw.EdgeInsets.symmetric(vertical: 3),
                padding: const pw.EdgeInsets.symmetric(vertical: 2.5),
                decoration: const pw.BoxDecoration(
                  color: PdfColors.indigo900,
                  borderRadius: pw.BorderRadius.all(pw.Radius.circular(3)),
                ),
                child: pw.Center(
                  child: pw.Text(
                    'APPLICATION FOR ADMISSION & STUDENT RECORD',
                    style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.white, letterSpacing: 0.8),
                  ),
                ),
              ),

              // Application Meta Bar
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Application No: $regNo', style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900)),
                    pw.Text('Date: $regDate', style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Academic Year: $academicYear', style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900)),
                    pw.Text('Class Applied: $classApplied', style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900)),
                  ],
                ),
              ),

              pw.SizedBox(height: 3),

              // 1. Student Personal Information
              _buildSectionHeader('1. STUDENT PERSONAL INFORMATION'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                columnWidths: const {
                  0: pw.FlexColumnWidth(1.2),
                  1: pw.FlexColumnWidth(2.0),
                  2: pw.FlexColumnWidth(1.2),
                  3: pw.FlexColumnWidth(1.6),
                },
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell('Student Full Name', isHeader: true),
                      _buildTableCell(studentName, isBold: true),
                      _buildTableCell('Gender', isHeader: true),
                      _buildTableCell(gender, isBold: true),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Date of Birth', isHeader: true),
                      _buildTableCell(dobFormatted),
                      _buildTableCell('Student Aadhaar', isHeader: true),
                      _buildTableCell(aadharNo),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Mother Tongue', isHeader: true),
                      _buildTableCell(motherTongue),
                      _buildTableCell('Nationality', isHeader: true),
                      _buildTableCell(nationality),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Religion', isHeader: true),
                      _buildTableCell(religion),
                      _buildTableCell('Caste / Sub-Caste', isHeader: true),
                      _buildTableCell(casteFormatted),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 4),

              // 2. Parent & Guardian Details
              _buildSectionHeader('2. PARENT & GUARDIAN PARTICULARS'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                columnWidths: const {
                  0: pw.FlexColumnWidth(1.2),
                  1: pw.FlexColumnWidth(2.0),
                  2: pw.FlexColumnWidth(1.2),
                  3: pw.FlexColumnWidth(1.6),
                },
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell("Father's Name", isHeader: true),
                      _buildTableCell(fatherName, isBold: true),
                      _buildTableCell('Occupation', isHeader: true),
                      _buildTableCell(fatherOccupation),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Father Aadhar No', isHeader: true),
                      _buildTableCell(fatherAadhar),
                      _buildTableCell('Mobile No', isHeader: true),
                      _buildTableCell(fatherPhone, isBold: true),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell("Mother's Name", isHeader: true),
                      _buildTableCell(motherName, isBold: true),
                      _buildTableCell('Occupation', isHeader: true),
                      _buildTableCell(motherOccupation),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Mother Aadhar No', isHeader: true),
                      _buildTableCell(motherAadhar),
                      _buildTableCell('Mobile No', isHeader: true),
                      _buildTableCell(motherPhone),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Primary Contact No', isHeader: true),
                      _buildTableCell(phone, isBold: true),
                      _buildTableCell('Alternate Mobile No', isHeader: true),
                      _buildTableCell(alternatePhone),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 4),

              // 3. Residential Address & Previous School
              _buildSectionHeader('3. RESIDENTIAL ADDRESS & PREVIOUS SCHOOL'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                columnWidths: const {
                  0: pw.FlexColumnWidth(1.2),
                  1: pw.FlexColumnWidth(4.8),
                },
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell('Residence', isHeader: true),
                      _buildTableCell(address),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Previous School Studied', isHeader: true),
                      _buildTableCell(previousSchool),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 4),

              // 4. Sibling Details
              _buildSectionHeader('4. SIBLING DETAILS ${siblingsList.isEmpty ? "(NA)" : ""}'),
              siblingsList.isNotEmpty
                  ? pw.Table(
                      border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                      columnWidths: const {
                        0: pw.FlexColumnWidth(0.5),
                        1: pw.FlexColumnWidth(2.0),
                        2: pw.FlexColumnWidth(1.0),
                        3: pw.FlexColumnWidth(2.5),
                      },
                      children: [
                        pw.TableRow(
                          decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                          children: [
                            _buildTableCell('S.NO', isHeader: true, align: pw.TextAlign.center),
                            _buildTableCell('NAME', isHeader: true),
                            _buildTableCell('CLASS', isHeader: true),
                            _buildTableCell('WHERE HE / SHE STUDYING', isHeader: true),
                          ],
                        ),
                        ...siblingsList.asMap().entries.map((entry) {
                          final i = entry.key;
                          final s = entry.value is Map ? entry.value : <String, dynamic>{};
                          return pw.TableRow(
                            children: [
                              _buildTableCell('${i + 1}', align: pw.TextAlign.center),
                              _buildTableCell(s['name']?.toString() ?? '-'),
                              _buildTableCell(s['className']?.toString() ?? '-'),
                              _buildTableCell(s['schoolName']?.toString() ?? '-'),
                            ],
                          );
                        }),
                      ],
                    )
                  : pw.Container(
                      width: double.infinity,
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
                        color: PdfColors.grey50,
                      ),
                      padding: const pw.EdgeInsets.symmetric(vertical: 3),
                      child: pw.Center(
                        child: pw.Text(
                          'Sibling Details : NA (No Siblings Recorded)',
                          style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey600),
                        ),
                      ),
                    ),

              pw.SizedBox(height: 4),

              // 5. Application Fee & Mode
              _buildSectionHeader('5. APPLICATION FEE & PAYMENT PARTICULARS'),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
                columnWidths: const {
                  0: pw.FlexColumnWidth(1.2),
                  1: pw.FlexColumnWidth(2.0),
                  2: pw.FlexColumnWidth(1.2),
                  3: pw.FlexColumnWidth(1.6),
                },
                children: [
                  pw.TableRow(
                    children: [
                      _buildTableCell('Application Fee', isHeader: true),
                      _buildTableCell(admissionFee != null ? 'Rs. $admissionFee' : 'As Per School Structure', isBold: true),
                      _buildTableCell('Payment Mode', isHeader: true),
                      _buildTableCell(paymentMethod),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _buildTableCell('Payment Status', isHeader: true),
                      _buildTableCell(paymentStatus, isBold: true),
                      _buildTableCell(paymentMethod == 'CASH' ? 'Cash Received By' : 'Status', isHeader: true),
                      _buildTableCell(paymentMethod == 'CASH' ? (cashReceivedByName ?? 'School Office') : status, isBold: true),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 4),

              // 6. Terms and Conditions
              pw.Container(
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey400, width: 0.5),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(2)),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Container(
                      width: double.infinity,
                      color: PdfColors.red900,
                      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                      child: pw.Text(
                        'FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED',
                        style: pw.TextStyle(fontSize: 6.2, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                      ),
                    ),
                    pw.Padding(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                      child: pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Expanded(
                            child: pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                _buildTermItem('1. Student should obey the rules and regulations set by the management.'),
                                _buildTermItem('2. Student would not be allowed to move around premises without uniform.'),
                                _buildTermItem('3. During school time no visitor is allowed.'),
                                _buildTermItem('4. During school time parents should not approach teachers without permission.'),
                                _buildTermItem('5. Management has right to reject/accept application or strike out student.'),
                                _buildTermItem('6. In case of damage to school property, parent would pay value of damage.'),
                              ],
                            ),
                          ),
                          pw.SizedBox(width: 6),
                          pw.Expanded(
                            child: pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                _buildTermItem('7. Decision of management would be final and parties would accept it.'),
                                _buildTermItem('8. Absent for 10 days without info leads to name being struck out.'),
                                _buildTermItem('9. Student has to pay all dues again to be readmitted.'),
                                _buildTermItem('10. Fee collected in 3 terms. Otherwise fee concession not allowed.'),
                                _buildTermItem('11. The fee once paid will strictly NOT be refunded under any circumstances.', isBold: true, color: PdfColors.red900),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              pw.Spacer(),

              // Signatures
              pw.Container(
                margin: const pw.EdgeInsets.only(top: 8),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSignatureBox('Signature of Parent / Guardian'),
                    _buildSignatureBox('Verified by (Teacher / Staff)', subtext: registeredByName),
                    _buildSignatureBox('Principal / Correspondent'),
                  ],
                ),
              ),

              pw.SizedBox(height: 4),

              // Footer
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300, width: 0.5)),
                ),
                padding: const pw.EdgeInsets.only(top: 2),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('JY School ERP System Generated Official Admission Record', style: const pw.TextStyle(fontSize: 6, color: PdfColors.grey500)),
                    pw.Text('Page 1 of 1 • Date: $regDate', style: const pw.TextStyle(fontSize: 6, color: PdfColors.grey500)),
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
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      child: pw.Text(
        title,
        style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900),
      ),
    );
  }

  static pw.Widget _buildTableCell(
    String text, {
    bool isHeader = false,
    bool isBold = false,
    pw.TextAlign align = pw.TextAlign.left,
  }) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2.2),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(
          fontSize: 6.8,
          fontWeight: isHeader || isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.grey800 : PdfColors.black,
        ),
      ),
    );
  }

  static pw.Widget _buildTermItem(String text, {bool isBold = false, PdfColor color = PdfColors.black}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 1),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 5.5,
          fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: color,
        ),
      ),
    );
  }

  static pw.Widget _buildSignatureBox(String title, {String? subtext}) {
    return pw.Container(
      width: 150,
      child: pw.Column(
        children: [
          pw.Container(height: 18),
          pw.Container(height: 0.8, color: PdfColors.black),
          pw.SizedBox(height: 2),
          pw.Text(title, style: pw.TextStyle(fontSize: 6.8, fontWeight: pw.FontWeight.bold)),
          if (subtext != null && subtext.isNotEmpty)
            pw.Text(subtext, style: const pw.TextStyle(fontSize: 6, color: PdfColors.indigo900)),
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

