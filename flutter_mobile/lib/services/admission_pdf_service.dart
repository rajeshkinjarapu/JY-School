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

    final studentName = admission['studentName']?.toString().toUpperCase() ?? '';
    final fatherName = admission['fatherName']?.toString().toUpperCase() ?? '';
    final fatherOccupation = admission['fatherOccupation']?.toString() ?? '';
    final fatherAadhar = admission['fatherAadhar']?.toString() ?? '';
    final fatherPhone = admission['fatherPhone']?.toString() ?? admission['phone']?.toString() ?? '';

    final motherName = admission['motherName']?.toString().toUpperCase() ?? '';
    final motherOccupation = admission['motherOccupation']?.toString() ?? '';
    final motherAadhar = admission['motherAadhar']?.toString() ?? '';
    final motherPhone = admission['motherPhone']?.toString() ?? admission['alternatePhone']?.toString() ?? '';

    final aadharNo = admission['aadharNo']?.toString() ?? '';
    final genderStr = admission['gender']?.toString().toUpperCase() ?? '';
    final isBoy = genderStr == 'MALE' || genderStr == 'BOY';
    final isGirl = genderStr == 'FEMALE' || genderStr == 'GIRL';

    final classApplied = admission['classApplied']?.toString().toUpperCase() ?? '';
    final academicYear = admission['academicYear']?.toString() ?? '${DateTime.now().year}-${DateTime.now().year + 1}';

    final motherTongue = admission['motherTongue']?.toString() ?? 'Telugu';
    final nationality = admission['nationality']?.toString() ?? 'Indian';
    final state = admission['state']?.toString() ?? 'Andhra Pradesh';
    final religion = admission['religion']?.toString() ?? 'Hindu';
    final caste = admission['caste']?.toString() ?? '';
    final subCaste = admission['subCaste']?.toString() ?? '';

    final doorNo = admission['doorNo']?.toString() ?? '';
    final village = admission['village']?.toString() ?? '';
    final mandal = admission['mandal']?.toString() ?? '';
    final district = admission['district']?.toString() ?? '';
    final addressParts = [doorNo, village, mandal, district, state].where((s) => s.trim().isNotEmpty).toList();
    final fullAddress = (admission['address']?.toString().isNotEmpty == true)
        ? admission['address'].toString()
        : (addressParts.isNotEmpty ? addressParts.join(', ') : 'Narasannapeta, Srikakulam District');

    final previousSchool = admission['previousSchool']?.toString() ?? 'N/A (Fresher)';
    final admissionFee = admission['admissionFee']?.toString();
    final feeAmount = (admissionFee != null && admissionFee.isNotEmpty) ? 'Rs. $admissionFee' : '';

    final id = admission['id']?.toString() ?? '001';
    final regNo = admission['regNo']?.toString() ?? 'ADM-${DateTime.now().year}-${id.length >= 6 ? id.substring(0, 6).toUpperCase() : id.toUpperCase()}';

    String regDate = DateFormat('dd/MM/yyyy').format(DateTime.now());
    if (admission['createdAt'] != null) {
      try {
        regDate = DateFormat('dd/MM/yyyy').format(DateTime.parse(admission['createdAt']));
      } catch (_) {}
    }

    // DOB digits for [D][D] [M][M] [Y][Y][Y][Y]
    List<String> dobDigits = ['', '', '', '', '', '', '', ''];
    if (admission['dob'] != null) {
      try {
        final d = DateTime.parse(admission['dob']);
        final dayStr = d.day.toString().padLeft(2, '0');
        final monthStr = d.month.toString().padLeft(2, '0');
        final yearStr = d.year.toString();
        dobDigits = [
          dayStr[0], dayStr[1],
          monthStr[0], monthStr[1],
          yearStr[0], yearStr[1], yearStr[2], yearStr[3],
        ];
      } catch (_) {}
    }

    // Parse siblings
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

    // ==========================================
    // PAGE 1: ADMISSION FORM & ACKNOWLEDGEMENT
    // ==========================================
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // 1. Header with Logo & Photo
              pw.Container(
                decoration: const pw.BoxDecoration(
                  border: pw.Border(bottom: pw.BorderSide(color: PdfColors.black, width: 1.5)),
                ),
                padding: const pw.EdgeInsets.only(bottom: 6),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // SVJY Logo Placeholder / Crest
                    pw.Container(
                      width: 52,
                      height: 52,
                      decoration: pw.BoxDecoration(
                        shape: pw.BoxShape.circle,
                        border: pw.Border.all(color: PdfColors.indigo900, width: 1.5),
                        color: PdfColors.grey100,
                      ),
                      child: pw.Center(
                        child: pw.Text(
                          'SVJY\nSCHOOL',
                          textAlign: pw.TextAlign.center,
                          style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo900),
                        ),
                      ),
                    ),

                    pw.SizedBox(width: 8),

                    // School Info Center
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.center,
                        children: [
                          pw.Text(
                            'SRI VENKATESWARA JY SCHOOL',
                            style: pw.TextStyle(
                              fontSize: 14.5,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.indigo950,
                            ),
                          ),
                          pw.SizedBox(height: 1.5),
                          pw.Text(
                            '(IIT-JEE/NEET Foundation - Olympiads)',
                            style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.black),
                          ),
                          pw.Text(
                            'Near Axis Bank, Old Bus Stand, Narasannapeta',
                            style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey800),
                          ),
                          pw.SizedBox(height: 4),

                          // Admission Form Badge
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 2.5),
                            decoration: const pw.BoxDecoration(
                              color: PdfColors.black,
                              borderRadius: pw.BorderRadius.all(pw.Radius.circular(2)),
                            ),
                            child: pw.Text(
                              'ADMISSION FORM',
                              style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.white, letterSpacing: 1),
                            ),
                          ),
                        ],
                      ),
                    ),

                    pw.SizedBox(width: 8),

                    // Passport Photo Box
                    pw.Container(
                      width: 65,
                      height: 78,
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.black, width: 1),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(2)),
                        color: PdfColors.grey50,
                      ),
                      child: studentImageBytes != null
                          ? pw.Image(pw.MemoryImage(studentImageBytes), fit: pw.BoxFit.cover)
                          : pw.Center(
                              child: pw.Padding(
                                padding: const pw.EdgeInsets.all(3),
                                child: pw.Text(
                                  'Affix latest\nPassport Size\nPhotograph',
                                  textAlign: pw.TextAlign.center,
                                  style: pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700),
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 8),

              // 13 Numbered Items Form
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // 1. Admn No, Class, Academic Year
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      _buildInlineField('1. Admn No. : ', regNo, width: 90),
                      _buildInlineField('Class : ', classApplied, width: 80),
                      _buildInlineField('Academic Year : ', academicYear, width: 80),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 2. Date of Joining
                  _buildInlineField('2. Date of Joining : ', regDate, width: 180),
                  pw.SizedBox(height: 6),

                  // 3. Name of the Student
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      _buildInlineField('3. Name of the Student : ', studentName, expand: true),
                      pw.Padding(
                        padding: const pw.EdgeInsets.only(left: 14),
                        child: pw.Text('(In capital Letters)', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700)),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 4),

                  // 4. Gender
                  pw.Row(
                    children: [
                      pw.Text('4. Gender : ', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
                      pw.SizedBox(width: 15),
                      pw.Text('Boy ', style: const pw.TextStyle(fontSize: 8.5)),
                      _buildBoxTick(isBoy),
                      pw.SizedBox(width: 25),
                      pw.Text('Girl ', style: const pw.TextStyle(fontSize: 8.5)),
                      _buildBoxTick(isGirl),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 5. Date of Birth
                  pw.Row(
                    children: [
                      pw.Text('5. Date of Birth : ', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
                      pw.SizedBox(width: 10),
                      _buildDobBox(dobDigits[0]),
                      _buildDobBox(dobDigits[1]),
                      pw.SizedBox(width: 4),
                      pw.Text('/', style: const pw.TextStyle(fontSize: 8)),
                      pw.SizedBox(width: 4),
                      _buildDobBox(dobDigits[2]),
                      _buildDobBox(dobDigits[3]),
                      pw.SizedBox(width: 4),
                      pw.Text('/', style: const pw.TextStyle(fontSize: 8)),
                      pw.SizedBox(width: 4),
                      _buildDobBox(dobDigits[4]),
                      _buildDobBox(dobDigits[5]),
                      _buildDobBox(dobDigits[6]),
                      _buildDobBox(dobDigits[7]),
                      pw.SizedBox(width: 8),
                      pw.Text('(DD / MM / YYYY)', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 6. Mother Tongue & Aadhar No
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      _buildInlineField('6. Mother Tongue : ', motherTongue, width: 140),
                      _buildInlineField('Aadhar No : ', aadharNo, width: 140),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 7. Father's Name & Occupation / Aadhar & Phone
                  pw.Column(
                    children: [
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          _buildInlineField('7. Father’s Name : ', fatherName, width: 220),
                          _buildInlineField('Occupation : ', fatherOccupation, width: 110),
                        ],
                      ),
                      pw.SizedBox(height: 4),
                      pw.Row(
                        children: [
                          pw.SizedBox(width: 14),
                          _buildInlineField('Aadhar No : ', fatherAadhar, width: 140),
                          pw.Spacer(),
                          _buildInlineField('Phone No : ', fatherPhone, width: 140),
                        ],
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 8. Mother's Name & Occupation / Aadhar & Phone
                  pw.Column(
                    children: [
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          _buildInlineField('8. Mother’s Name : ', motherName, width: 220),
                          _buildInlineField('Occupation : ', motherOccupation, width: 110),
                        ],
                      ),
                      pw.SizedBox(height: 4),
                      pw.Row(
                        children: [
                          pw.SizedBox(width: 14),
                          _buildInlineField('Aadhar No : ', motherAadhar, width: 140),
                          pw.Spacer(),
                          _buildInlineField('Phone No : ', motherPhone, width: 140),
                        ],
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 9. Nationality, State, Religion
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      _buildInlineField('9. Nationality : ', nationality, width: 90),
                      _buildInlineField('State : ', state, width: 110),
                      _buildInlineField('Religion : ', religion, width: 100),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 10. Caste & Sub-Caste
                  pw.Row(
                    children: [
                      _buildInlineField('10. Caste : ', caste, width: 140),
                      pw.SizedBox(width: 30),
                      _buildInlineField('Sub-Caste : ', subCaste, width: 160),
                    ],
                  ),
                  pw.SizedBox(height: 6),

                  // 11. Residence
                  _buildInlineField('11. Residence : ', fullAddress, expand: true),
                  pw.SizedBox(height: 6),

                  // 12. Name of School Previous Studying / Studied
                  _buildInlineField('12. Name of the School Previous Studying/ Studied : ', previousSchool, expand: true),
                  pw.SizedBox(height: 6),

                  // 13. Annual Fee Fixed
                  _buildInlineField('13. Annual fee fixed for $academicYear : ', feeAmount, width: 160),
                ],
              ),

              pw.Spacer(),

              // Divider Cut Line
              pw.Container(
                margin: const pw.EdgeInsets.symmetric(vertical: 6),
                child: pw.Row(
                  children: [
                    pw.Expanded(child: pw.Container(height: 1, color: PdfColors.grey400)),
                    pw.Padding(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 8),
                      child: pw.Text('✂ CUT HERE / TEAR ALONG PERFORATION ✂', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
                    ),
                    pw.Expanded(child: pw.Container(height: 1, color: PdfColors.grey400)),
                  ],
                ),
              ),

              // ==========================================
              // ACKNOWLEDGEMENT SLIP (Page 1 Bottom)
              // ==========================================
              pw.Container(
                padding: const pw.EdgeInsets.all(6),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
                ),
                child: pw.Column(
                  children: [
                    pw.Text('SRI VENKATESWARA JY SCHOOL', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo950)),
                    pw.SizedBox(height: 1),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 1.5),
                      decoration: const pw.BoxDecoration(
                        color: PdfColors.black,
                        borderRadius: pw.BorderRadius.all(pw.Radius.circular(2)),
                      ),
                      child: pw.Text('Acknowledgement', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
                    ),
                    pw.SizedBox(height: 8),

                    _buildInlineField('Name of the Student : ', studentName, expand: true),
                    pw.SizedBox(height: 5),

                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        _buildInlineField('Class : ', classApplied, width: 120),
                        _buildInlineField('Father’s Name : ', fatherName, width: 220),
                      ],
                    ),
                    pw.SizedBox(height: 5),

                    _buildInlineField('Annual fee fixed for $academicYear : ', feeAmount, expand: true),
                    pw.SizedBox(height: 22),

                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Column(
                          children: [
                            pw.Container(width: 140, height: 0.8, color: PdfColors.black),
                            pw.SizedBox(height: 2),
                            pw.Text('Signature of the Parent', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                          ],
                        ),
                        pw.Column(
                          children: [
                            pw.Container(width: 140, height: 0.8, color: PdfColors.black),
                            pw.SizedBox(height: 2),
                            pw.Text('Signature of the Principal', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 2),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Text('Page 1 of 2 (Official Admission Form)', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey500)),
              ),
            ],
          );
        },
      ),
    );

    // ==========================================
    // PAGE 2: SIBLINGS, 11 TERMS, DECLARATION, SCHEDULE
    // ==========================================
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // 1. SIBLING DETAILS Table
              pw.Container(
                decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.black, width: 0.8)),
                child: pw.Column(
                  children: [
                    pw.Container(
                      width: double.infinity,
                      color: PdfColors.grey200,
                      padding: const pw.EdgeInsets.symmetric(vertical: 3),
                      alignment: pw.Alignment.center,
                      child: pw.Text('SIBLING DETAILS', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, letterSpacing: 0.8)),
                    ),
                    pw.Table(
                      border: pw.TableBorder.all(color: PdfColors.black, width: 0.6),
                      columnWidths: const {
                        0: pw.FlexColumnWidth(0.6),
                        1: pw.FlexColumnWidth(2.0),
                        2: pw.FlexColumnWidth(1.0),
                        3: pw.FlexColumnWidth(2.6),
                      },
                      children: [
                        pw.TableRow(
                          decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                          children: [
                            _buildTableTh('S.NO', align: pw.TextAlign.center),
                            _buildTableTh('NAME'),
                            _buildTableTh('CLASS', align: pw.TextAlign.center),
                            _buildTableTh('Where He/ She Studying'),
                          ],
                        ),
                        ...List.generate(4, (i) {
                          final sib = (siblingsList.length > i) ? siblingsList[i] : null;
                          final isFirstEmpty = (i == 0 && siblingsList.isEmpty);
                          return pw.TableRow(
                            children: [
                              _buildTableTd('${i + 1}', align: pw.TextAlign.center),
                              _buildTableTd(sib != null ? (sib['name']?.toString().toUpperCase() ?? '') : (isFirstEmpty ? 'NA (No Siblings Recorded)' : '')),
                              _buildTableTd(sib != null ? (sib['className']?.toString() ?? '') : '', align: pw.TextAlign.center),
                              _buildTableTd(sib != null ? (sib['schoolName']?.toString() ?? '') : ''),
                            ],
                          );
                        }),
                      ],
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 10),

              // 2. FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.only(bottom: 2),
                decoration: const pw.BoxDecoration(
                  border: pw.Border(bottom: pw.BorderSide(color: PdfColors.black, width: 1)),
                ),
                child: pw.Center(
                  child: pw.Text(
                    'FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED',
                    style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, letterSpacing: 0.5),
                  ),
                ),
              ),
              pw.SizedBox(height: 4),

              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _buildTermPoint('1.', 'Student should obey the rules and regulations set by the management.'),
                  _buildTermPoint('2.', 'Student would not be allowed to move around the premises of the school without uniform.'),
                  _buildTermPoint('3.', 'During school time no visitor is allowed.'),
                  _buildTermPoint('4.', 'During school time parents should not approach teachers without the permission of the management.'),
                  _buildTermPoint('5.', 'The management has the right to reject or accept the application. The name of the student will be struck out if the students fail to follow the rules and regulations of the school.'),
                  _buildTermPoint('6.', 'In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.'),
                  _buildTermPoint('7.', 'In case of the decision of the management would be final and the concerned parties would accept the management\'s decisions final.'),
                  _buildTermPoint('8.', 'If the student will remain absent from school for 10 days without information his/her name will be struck out from the school. Parent has to take prior permission for the students absence.'),
                  _buildTermPoint('9.', 'The students has pay all dues again to be readmitted.'),
                  _buildTermPoint('10.', 'The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.'),
                  _buildTermPoint('11.', 'The fee once paid will not be refunded.', isBold: true),
                ],
              ),

              pw.SizedBox(height: 10),

              // 3. DECLARATION BY THE PARENT / GUARDIAN
              pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(2)),
                  color: PdfColors.grey50,
                ),
                child: pw.Column(
                  children: [
                    pw.Text(
                      'DECLARATION BY THE PARENT / GUARDIAN',
                      style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, letterSpacing: 0.5),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'I, ${fatherName.isNotEmpty ? fatherName : (motherName.isNotEmpty ? motherName : '_________________________________')} Parent / Guardian of ${studentName.isNotEmpty ? studentName : '_________________________________'} do hereby declare that if my child is admitted, I promise to send my child daily to school in time with necessary books and pay the fee regularly. I will follow the rules and regulations of the school and abide by the directions given by the school authority I also state that outside of the school hours it is my responsibility to take care of the child and declare that all the information given above is true to the best of my knowledge and I am aware that if it is found wrong at any state, the admission of my ward will be cancelled.',
                      textAlign: pw.TextAlign.justify,
                      style: const pw.TextStyle(fontSize: 7.8, color: PdfColors.black, lineSpacing: 1.2),
                    ),
                    pw.SizedBox(height: 16),

                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('Place : Narasannapeta', style: const pw.TextStyle(fontSize: 8)),
                            pw.SizedBox(height: 2),
                            pw.Text('Date  : $regDate', style: const pw.TextStyle(fontSize: 8)),
                          ],
                        ),
                        pw.Column(
                          children: [
                            pw.Container(width: 150, height: 0.8, color: PdfColors.black),
                            pw.SizedBox(height: 2),
                            pw.Text('Signature of the Parent/Guardian', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 10),

              // 4. FEE PAYMENT SCHEDULE
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('FEE PAYMENT SCHEDULE', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, decoration: pw.TextDecoration.underline)),
                  pw.SizedBox(height: 3),
                  pw.Text('1st Term -> August 1st week', style: const pw.TextStyle(fontSize: 8)),
                  pw.Text('2nd Term -> November 1st week', style: const pw.TextStyle(fontSize: 8)),
                  pw.Text('3rd Term -> Before sankranti holidays', style: const pw.TextStyle(fontSize: 8)),
                ],
              ),

              pw.Spacer(),

              // Bottom Signatures of Page 2
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Row(
                    children: [
                      pw.Text('Date : ', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
                      pw.Container(
                        width: 90,
                        padding: const pw.EdgeInsets.only(left: 4),
                        decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: PdfColors.black, width: 0.8))),
                        child: pw.Text(regDate, style: const pw.TextStyle(fontSize: 8.5)),
                      ),
                    ],
                  ),
                  pw.Column(
                    children: [
                      pw.Container(width: 150, height: 0.8, color: PdfColors.black),
                      pw.SizedBox(height: 2),
                      pw.Text('Signature of the Principal', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 2),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Text('Page 2 of 2 (Rules & Parent Declaration)', style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey500)),
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  // Helpers
  static pw.Widget _buildInlineField(String label, String value, {double? width, bool expand = false}) {
    final lineWidget = pw.Container(
      padding: const pw.EdgeInsets.only(left: 4, right: 4, bottom: 0.5),
      decoration: const pw.BoxDecoration(
        border: pw.Border(bottom: pw.BorderSide(color: PdfColors.black, width: 0.8)),
      ),
      child: pw.Text(
        value,
        style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold),
      ),
    );

    return pw.Row(
      mainAxisSize: expand ? pw.MainAxisSize.max : pw.MainAxisSize.min,
      crossAxisAlignment: pw.CrossAxisAlignment.baseline,
      children: [
        pw.Text(label, style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
        if (expand)
          pw.Expanded(child: lineWidget)
        else if (width != null)
          pw.SizedBox(width: width, child: lineWidget)
        else
          lineWidget,
      ],
    );
  }

  static pw.Widget _buildBoxTick(bool isChecked) {
    return pw.Container(
      width: 12,
      height: 12,
      alignment: pw.Alignment.center,
      decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.black, width: 0.8)),
      child: isChecked ? pw.Text('✓', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)) : null,
    );
  }

  static pw.Widget _buildDobBox(String digit) {
    return pw.Container(
      width: 13,
      height: 13,
      alignment: pw.Alignment.center,
      decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.black, width: 0.8)),
      child: pw.Text(digit, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
    );
  }

  static pw.Widget _buildTableTh(String text, {pw.TextAlign align = pw.TextAlign.left}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(3.5),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(fontSize: 7.5, fontWeight: pw.FontWeight.bold),
      ),
    );
  }

  static pw.Widget _buildTableTd(String text, {pw.TextAlign align = pw.TextAlign.left}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(3.5),
      child: pw.Text(
        text,
        textAlign: align,
        style: const pw.TextStyle(fontSize: 7.5),
      ),
    );
  }

  static pw.Widget _buildTermPoint(String num, String text, {bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 2),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 16,
            child: pw.Text(num, style: pw.TextStyle(fontSize: 7.8, fontWeight: pw.FontWeight.bold)),
          ),
          pw.Expanded(
            child: pw.Text(
              text,
              style: pw.TextStyle(
                fontSize: 7.8,
                fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
              ),
            ),
          ),
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
