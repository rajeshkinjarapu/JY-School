import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Download, Printer, ChevronLeft, ChevronRight, Plus, Trash2, 
  GraduationCap, FileText, Database, CheckSquare, Square, 
  Search, RefreshCw, ZoomIn, ZoomOut, Maximize2, Sparkles,
  CheckCircle2, Building, Calendar, MapPin, User, Award, Eye
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { api } from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface AcademicRow {
  year: string;
  className: string;
  remarks: string;
}

interface StudentItem {
  id: string;
  rollNo?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  admissionDate?: string;
  user?: {
    name?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
  };
  name?: string;
  class?: {
    id?: string;
    name: string;
    section: string;
  };
}

interface SchoolSettings {
  schoolName: string;
  schoolSubtitle: string;
  address: string;
  logoUrl: string;
  principalSignatureUrl?: string;
}

export const StudyCertificatePage: React.FC = () => {
  // Mode: 'single' (Individual Student) or 'bulk' (Whole Class)
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // School Settings
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(IIT-JEE / NEET Foundation – Olympiads)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
    logoUrl: '/logo.png',
  });

  // Common Certificate Settings
  const [rcNumber, setRcNumber] = useState('Rc. No. 281125100013 / Visakhapatnam/2025. Dated :21-10-2025');
  const [udiseCode, setUdiseCode] = useState('281125100013');
  const [conduct, setConduct] = useState('Excellent');
  const [place, setPlace] = useState('Narasannapeta');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });

  // Academic Progression Table
  const [academicRows, setAcademicRows] = useState<AcademicRow[]>([
    { year: '2023-24', className: 'VI', remarks: 'Promoted' },
    { year: '2024-25', className: 'VII', remarks: 'Promoted' },
    { year: '2025-26', className: 'VIII', remarks: 'Studying' },
  ]);

  // Classes & Students Data
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);

  // Single Mode State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualFatherName, setManualFatherName] = useState('');
  const [manualRollNo, setManualRollNo] = useState('');

  // Bulk Mode State
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Zoom scale for canvas preview (default: fit / 0.85)
  const [zoomScale, setZoomScale] = useState(0.85);

  const certPreviewRef = useRef<HTMLDivElement>(null);

  // 1. Load School Settings & Local Storage Presets
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/api/settings').catch(() => null);
        if (res?.data?.data || res?.data) {
          const s = res.data?.data || res.data;
          setSchoolSettings({
            schoolName: s.schoolName || 'SRI VENKATESWARA JY SCHOOL',
            schoolSubtitle: s.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)',
            address: s.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
            logoUrl: s.logoUrl || '/logo.png',
            principalSignatureUrl: s.principalSignatureUrl,
          });
        }
      } catch (_) {}
    };

    const savedUdise = localStorage.getItem('study_cert_udise');
    if (savedUdise) setUdiseCode(savedUdise);
    const savedRc = localStorage.getItem('study_cert_rc');
    if (savedRc) setRcNumber(savedRc);
    const savedPlace = localStorage.getItem('study_cert_place');
    if (savedPlace) setPlace(savedPlace);

    loadSettings();
    loadClasses();
  }, []);

  // Save Presets on change
  useEffect(() => {
    if (udiseCode) localStorage.setItem('study_cert_udise', udiseCode);
    if (rcNumber) localStorage.setItem('study_cert_rc', rcNumber);
    if (place) localStorage.setItem('study_cert_place', place);
  }, [udiseCode, rcNumber, place]);

  // 2. Load Classes
  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await api.get('/api/classes?limit=1000');
      const list = res.data?.data || res.data || [];
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].id);
      }
    } catch (_) {
      toast.error('Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  };

  // 3. Load Students whenever selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      setBulkSelectedIds([]);
      return;
    }

    const loadStudentsForClass = async () => {
      setStudentsLoading(true);
      try {
        const res = await api.get(`/api/classes/${selectedClassId}/students`);
        const list: StudentItem[] = res.data?.data || res.data || [];
        setClassStudents(list);

        // Select all by default in bulk mode
        setBulkSelectedIds(list.map((s) => s.id));
        setBulkPreviewIndex(0);

        // In single mode, select first student if available
        if (list.length > 0) {
          const first = list[0];
          setSelectedStudentId(first.id);
          setManualStudentName(first.user?.name || first.name || '');
          setManualFatherName(first.fatherName || '');
          setManualRollNo(first.rollNo || '');

          // Auto-adjust academic years for class
          autoGenerateAcademicRows(first);
        } else {
          setSelectedStudentId('');
        }
      } catch (_) {
        toast.error('Failed to load students for class');
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudentsForClass();
  }, [selectedClassId]);

  // Auto-generate academic years based on class name (e.g. 10th, 8th)
  const autoGenerateAcademicRows = (student?: StudentItem) => {
    const cls = classes.find((c) => c.id === selectedClassId);
    const className = cls?.name || 'VIII';
    const num = parseInt(className.replace(/\D/g, ''), 10) || 8;
    
    // Generate 3 years progression
    const currentYearNum = new Date().getFullYear();
    const rows: AcademicRow[] = [
      {
        year: `${currentYearNum - 2}-${String(currentYearNum - 1).slice(-2)}`,
        className: toRoman(Math.max(1, num - 2)),
        remarks: 'Promoted',
      },
      {
        year: `${currentYearNum - 1}-${String(currentYearNum).slice(-2)}`,
        className: toRoman(Math.max(1, num - 1)),
        remarks: 'Promoted',
      },
      {
        year: `${currentYearNum}-${String(currentYearNum + 1).slice(-2)}`,
        className: toRoman(num),
        remarks: 'Studying',
      },
    ];
    setAcademicRows(rows);
  };

  const toRoman = (num: number): string => {
    const romanMap: Record<number, string> = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
      6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
    };
    return romanMap[num] || String(num);
  };

  // Handle student selection in single mode
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    const s = classStudents.find((x) => x.id === studentId);
    if (s) {
      setManualStudentName(s.user?.name || s.name || '');
      setManualFatherName(s.fatherName || '');
      setManualRollNo(s.rollNo || '');
    }
  };

  // Add / Remove academic rows
  const handleAddAcademicRow = () => {
    setAcademicRows((prev) => [
      ...prev,
      { year: '2026-27', className: 'IX', remarks: 'Studying' },
    ]);
  };

  const handleRemoveAcademicRow = (index: number) => {
    setAcademicRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAcademicRow = (index: number, field: keyof AcademicRow, val: string) => {
    setAcademicRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Compute Active Certificate Data for live screen preview
  const currentPreviewData = useMemo(() => {
    if (mode === 'single') {
      return {
        studentName: manualStudentName || '___________________________',
        fatherName: manualFatherName || '___________________________',
        admissionNo: manualRollNo || '____________',
        udiseCode: udiseCode || '281125100013',
        conduct,
        place,
        date,
      };
    } else {
      // Bulk Mode
      const activeBulkStudentId = bulkSelectedIds[bulkPreviewIndex] || selectedStudentId;
      const s = classStudents.find((x) => x.id === activeBulkStudentId);
      return {
        studentName: s?.user?.name || s?.name || '___________________________',
        fatherName: s?.fatherName || '___________________________',
        admissionNo: s?.rollNo || '____________',
        udiseCode: udiseCode || '281125100013',
        conduct,
        place,
        date,
      };
    }
  }, [
    mode, bulkSelectedIds, bulkPreviewIndex, classStudents,
    selectedStudentId, manualStudentName, manualFatherName, manualRollNo,
    udiseCode, conduct, place, date
  ]);

  // Filtered student list for single mode search
  const filteredClassStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter((s) => {
      const name = (s.user?.name || s.name || '').toLowerCase();
      const roll = (s.rollNo || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [classStudents, studentSearch]);

  // -------------------------------------------------------------
  // 100% ROCK-SOLID IFRAME PRINT (SINGLE & BULK)
  // -------------------------------------------------------------
  const generateCertificateHtml = (cert: {
    studentName: string;
    fatherName: string;
    admissionNo: string;
    udiseCode: string;
    conduct: string;
    place: string;
    date: string;
  }) => {
    const logoUrl = getPhotoUrl(schoolSettings.logoUrl) || '/logo.png';

    return `
      <div class="cert-page">
        <!-- Outer Gold Frame -->
        <div class="cert-outer-frame"></div>
        <!-- Inner Royal Navy Frame -->
        <div class="cert-inner-frame"></div>

        <!-- Corner Ornaments -->
        <div class="corner-ornament tl"></div>
        <div class="corner-ornament tr"></div>
        <div class="corner-ornament bl"></div>
        <div class="corner-ornament br"></div>

        <!-- Watermark -->
        <div class="cert-watermark">
          <img src="${logoUrl}" alt="Watermark" />
        </div>

        <!-- Certificate Content -->
        <div class="cert-content">
          <!-- Header -->
          <div class="cert-header">
            <div class="cert-logo">
              <img src="${logoUrl}" alt="Logo" onerror="this.src='/logo.png'" />
            </div>
            <div class="cert-titles">
              <h1 class="school-name">${schoolSettings.schoolName}</h1>
              <div class="school-rc">${rcNumber}</div>
              <div class="school-addr">${schoolSettings.address}</div>
            </div>
          </div>

          <!-- Main Certificate Title -->
          <div class="cert-main-title">
            <span>STUDY & CONDUCT CERTIFICATE</span>
          </div>

          <!-- Admission & UDISE Bar -->
          <div class="cert-meta-bar">
            <div class="meta-box">
              <span class="m-label">Admission No. :</span>
              <span class="m-val">${cert.admissionNo}</span>
            </div>
            <div class="meta-box">
              <span class="m-label">UDISE Code :</span>
              <span class="m-val">${cert.udiseCode}</span>
            </div>
          </div>

          <!-- Certificate Body Paragraphs -->
          <div class="cert-body">
            <p class="body-para p-first">
              <span class="txt-regular">This is to certify that</span>
              <span class="txt-highlight">${cert.studentName}</span>
              <span class="txt-regular">, Son / Daughter of</span>
              <span class="txt-highlight">${cert.fatherName}</span>
              <span class="txt-regular">, was a bona fide student of this institution.</span>
            </p>

            <p class="body-para p-second">
              <span class="txt-regular">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>
              <span class="txt-highlight font-italic">${cert.conduct}</span>
              <span class="txt-regular">. The student consistently maintained good moral values, complied with the rules and regulations of the institution, and demonstrated respectful behavior towards teachers, staff, and fellow students.</span>
            </p>

            <p class="body-para p-third">
              <span class="txt-regular">He / She studied the following classes during the years noted below, as recorded in the school records:</span>
            </p>
          </div>

          <!-- Academic Progression Table -->
          <div class="cert-table-container">
            <table class="academic-table">
              <thead>
                <tr>
                  <th style="width: 15%;">SL. NO.</th>
                  <th style="width: 35%;">ACADEMIC YEAR</th>
                  <th style="width: 25%;">CLASS</th>
                  <th style="width: 25%;">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                ${academicRows.map((r, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${r.year}</td>
                    <td>${r.className}</td>
                    <td>${r.remarks || 'Promoted'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Signatures & Footer -->
          <div class="cert-footer">
            <div class="footer-meta">
              <div class="meta-row">
                <span class="f-label">Place :</span>
                <span class="f-val">${cert.place}</span>
              </div>
              <div class="meta-row">
                <span class="f-label">Date &nbsp;:</span>
                <span class="f-val">${cert.date}</span>
              </div>
            </div>

            <div class="footer-sign">
              <div class="sig-space"></div>
              <div class="sig-line"></div>
              <div class="sig-label">HEADMASTER / PRINCIPAL</div>
            </div>
          </div>

        </div>
      </div>
    `;
  };

  const printCertificatesIframe = (certificates: Array<any>) => {
    if (!certificates || certificates.length === 0) {
      toast.error('No certificates to print');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-9999;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Study Certificates - ${schoolSettings.schoolName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', 'TeX Gyre Schola', 'Century Schoolbook', Georgia, serif;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .cert-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      background: #FDFBF7 !important;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14mm 16mm;
      margin: 0 auto;
    }
    .cert-outer-frame {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 1.8px solid #b45309;
      pointer-events: none;
      z-index: 10;
    }
    .cert-inner-frame {
      position: absolute;
      top: 11mm;
      left: 11mm;
      right: 11mm;
      bottom: 11mm;
      border: 4.5px solid #0b1a33;
      pointer-events: none;
      z-index: 10;
    }
    .corner-ornament {
      position: absolute;
      width: 10mm;
      height: 10mm;
      border: 2px solid #b45309;
      z-index: 11;
      pointer-events: none;
    }
    .corner-ornament.tl { top: 9.5mm; left: 9.5mm; border-right: none; border-bottom: none; }
    .corner-ornament.tr { top: 9.5mm; right: 9.5mm; border-left: none; border-bottom: none; }
    .corner-ornament.bl { bottom: 9.5mm; left: 9.5mm; border-right: none; border-top: none; }
    .corner-ornament.br { bottom: 9.5mm; right: 9.5mm; border-left: none; border-top: none; }

    .cert-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 110mm;
      height: 110mm;
      opacity: 0.04;
      pointer-events: none;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cert-watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: grayscale(100%);
    }
    .cert-content {
      position: relative;
      z-index: 5;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2mm 4mm;
    }
    .cert-header {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-top: 2mm;
      margin-bottom: 5mm;
      min-height: 28mm;
    }
    .cert-logo {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 25mm;
      height: 25mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cert-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .cert-titles {
      text-align: center;
      width: 100%;
      padding: 0 28mm;
    }
    .school-name {
      font-size: 26pt;
      font-weight: 900;
      color: #0b1a33;
      letter-spacing: 0.8px;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .school-rc {
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #334155;
      margin-top: 1.5mm;
    }
    .school-addr {
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #0b1a33;
      margin-top: 1mm;
    }
    .cert-main-title {
      text-align: center;
      margin: 3mm 0 6mm 0;
    }
    .cert-main-title span {
      font-size: 17pt;
      font-weight: 900;
      color: #0b1a33;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-decoration: underline;
      text-underline-offset: 4px;
      text-decoration-thickness: 1.5px;
    }
    .cert-meta-bar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6mm;
    }
    .meta-box {
      border: 1.5px solid #0b1a33;
      padding: 2.5mm 6mm;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.7);
      font-size: 11pt;
      font-weight: 700;
      color: #0b1a33;
    }
    .meta-box .m-val {
      font-weight: 900;
      color: #0b1a33;
      margin-left: 2mm;
    }
    .cert-body {
      font-size: 13.5pt;
      line-height: 1.85;
      color: #1e293b;
      text-align: justify;
    }
    .body-para {
      margin-bottom: 4mm;
    }
    .txt-regular {
      color: #334155;
      font-style: italic;
    }
    .txt-highlight {
      font-weight: 900;
      font-size: 14pt;
      color: #0b1a33;
      border-bottom: 1.5px dotted #64748b;
      padding: 0 4mm;
      font-style: normal;
    }
    .font-italic {
      font-style: italic;
    }
    .cert-table-container {
      margin: 4mm 0 6mm 0;
      border: 1.5px solid #0b1a33;
      border-radius: 2px;
      overflow: hidden;
    }
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, sans-serif;
      font-size: 10.5pt;
    }
    .academic-table th {
      background: #f1f5f9;
      color: #0b1a33;
      border-bottom: 2px solid #0b1a33;
      padding: 2.8mm 4mm;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      text-align: center;
    }
    .academic-table td {
      padding: 2.2mm 4mm;
      text-align: center;
      border-bottom: 1px solid #cbd5e1;
      font-weight: 700;
      color: #1e293b;
    }
    .academic-table tr:last-child td {
      border-bottom: none;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 4mm;
      padding-bottom: 2mm;
    }
    .footer-meta {
      display: flex;
      flex-direction: column;
      gap: 2mm;
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
    }
    .meta-row {
      display: flex;
      align-items: center;
    }
    .f-label {
      width: 18mm;
      font-style: italic;
    }
    .f-val {
      font-weight: 800;
      color: #0b1a33;
      border-bottom: 1px dotted #64748b;
      min-width: 35mm;
    }
    .footer-sign {
      text-align: center;
      width: 60mm;
    }
    .sig-img-wrap {
      height: 18mm;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 1mm;
    }
    .sig-img-wrap img {
      max-height: 18mm;
      max-width: 50mm;
      object-fit: contain;
    }
    .sig-space {
      height: 18mm;
    }
    .sig-line {
      border-bottom: 1.5px solid #0b1a33;
      margin-bottom: 2mm;
    }
    .sig-label {
      font-size: 10pt;
      font-weight: 900;
      color: #0b1a33;
      letter-spacing: 0.8px;
    }
  </style>
</head>
<body>
  ${certificates.map((cert) => generateCertificateHtml(cert)).join('')}
</body>
</html>`);
    doc.close();

    // Focus and Print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Iframe print error:', e);
      } finally {
        setTimeout(() => {
          try {
            iframe.remove();
          } catch (_) {}
        }, 3000);
      }
    }, 450);
  };

  // Print Handlers
  const handlePrintCurrent = () => {
    printCertificatesIframe([currentPreviewData]);
  };

  const handlePrintAllBulk = () => {
    if (bulkSelectedIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const certificates = bulkSelectedIds.map((id) => {
      const s = classStudents.find((x) => x.id === id);
      return {
        studentName: s?.user?.name || s?.name || '___________________________',
        fatherName: s?.fatherName || '___________________________',
        admissionNo: s?.rollNo || '____________',
        udiseCode: udiseCode || '281125100013',
        conduct,
        place,
        date,
      };
    });

    printCertificatesIframe(certificates);
  };

  // Export Single PDF via html-to-image & jsPDF (avoids oklch error)
  const handleExportSinglePDF = async () => {
    if (!certPreviewRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating high-resolution PDF...');

    try {
      const el = certPreviewRef.current;
      const imgData = await toJpeg(el, {
        quality: 0.96,
        pixelRatio: 2.5,
        backgroundColor: '#FDFBF7',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

      const cleanName = currentPreviewData.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      pdf.save(`Study_Certificate_${cleanName}.pdf`);
      toast.success('Study Certificate downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to export PDF: ' + (err?.message || 'Unknown error'), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Export Bulk ZIP with individual PDFs
  const handleExportBulkZip = async () => {
    if (bulkSelectedIds.length === 0) {
      toast.error('Select at least one student for bulk export');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading(`Generating ZIP with ${bulkSelectedIds.length} certificates...`);

    try {
      const zip = new JSZip();
      const cls = classes.find((c) => c.id === selectedClassId);
      const classLabel = cls ? `${cls.name}_${cls.section}` : 'Class';

      // We use the hidden capture mechanism
      for (let i = 0; i < bulkSelectedIds.length; i++) {
        const studentId = bulkSelectedIds[i];
        const s = classStudents.find((x) => x.id === studentId);
        if (!s) continue;

        // Render in off-screen container
        const certData = {
          studentName: s.user?.name || s.name || 'Student',
          fatherName: s.fatherName || 'N/A',
          admissionNo: s.rollNo || 'N/A',
          udiseCode,
          conduct,
          place,
          date,
        };

        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed;top:0;left:0;width:210mm;height:297mm;opacity:0;pointer-events:none;z-index:-9999;';
        tempDiv.innerHTML = generateCertificateHtml(certData);
        document.body.appendChild(tempDiv);

        const targetEl = tempDiv.querySelector('.cert-page') as HTMLElement;
        if (targetEl) {
          const imgData = await toJpeg(targetEl, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#FDFBF7',
          });

          const pdf = new jsPDF('p', 'mm', 'a4');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

          const studentFileName = (s.user?.name || s.name || `Student_${i + 1}`).replace(/[^a-zA-Z0-9]/g, '_');
          zip.file(`Certificate_${studentFileName}.pdf`, pdf.output('blob'));
        }

        document.body.removeChild(tempDiv);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Study_Certificates_${classLabel}.zip`);
      toast.success('All certificates zipped and downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to create ZIP: ' + err.message, { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Page Header */}
      <PageHeader
        title="Study & Conduct Certificate Generator"
        icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6">
        
        {/* LEFT CONTROL PANEL (40% width on desktop) */}
        <div className="w-full lg:w-[460px] xl:w-[480px] bg-white rounded-3xl shadow-sm border border-slate-200/80 flex flex-col overflow-hidden shrink-0">
          
          {/* Header Tabs: Single Mode vs Bulk Class Mode */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Individual Student</span>
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Bulk Class Mode</span>
            </button>
          </div>

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            
            {/* Automatic School Branding Card */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl flex items-center gap-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
                <img
                  src={getPhotoUrl(schoolSettings.logoUrl) || '/logo.png'}
                  alt="School Logo"
                  className="w-full h-full object-contain"
                  onError={(e: any) => { e.target.src = '/logo.png'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Official Branding Active
                </div>
                <div className="text-xs font-black truncate">{schoolSettings.schoolName}</div>
                <div className="text-[10px] text-slate-300 truncate">{schoolSettings.address}</div>
              </div>
            </div>

            {/* Class & Section Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                Select Target Class & Section
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class: {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
            </div>

            {/* SINGLE MODE: Select Student with Live Autofill */}
            {mode === 'single' && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    Student Data Autofill
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                    {classStudents.length} Students in Class
                  </span>
                </div>

                {/* Quick Student Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student by name or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Student Select Dropdown */}
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="">Select student...</option>
                  {filteredClassStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name || s.name} · Roll: {s.rollNo || 'N/A'}
                    </option>
                  ))}
                </select>

                {/* Student Profile Quick View & Manual Overrides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Student Full Name</label>
                    <input
                      type="text"
                      value={manualStudentName}
                      onChange={(e) => setManualStudentName(e.target.value)}
                      placeholder="Student Name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Father / Guardian Name</label>
                    <input
                      type="text"
                      value={manualFatherName}
                      onChange={(e) => setManualFatherName(e.target.value)}
                      placeholder="Father's Name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Admission No. / Roll No.</label>
                    <input
                      type="text"
                      value={manualRollNo}
                      onChange={(e) => setManualRollNo(e.target.value)}
                      placeholder="e.g. JY26-1015"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BULK MODE: Student Checklist & Batch Controls */}
            {mode === 'bulk' && (
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">Class Student Checklist</h4>
                    <p className="text-[11px] font-semibold text-purple-700">
                      Selected: <strong>{bulkSelectedIds.length}</strong> of {classStudents.length} students
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBulkSelectedIds(classStudents.map((s) => s.id))}
                      className="text-[11px] font-black text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setBulkSelectedIds([])}
                      className="text-[11px] font-black text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Scrollable Checkbox List */}
                <div className="max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 custom-scrollbar">
                  {classStudents.map((s) => {
                    const isChecked = bulkSelectedIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (isChecked) {
                            setBulkSelectedIds((prev) => prev.filter((id) => id !== s.id));
                          } else {
                            setBulkSelectedIds((prev) => [...prev, s.id]);
                          }
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800">{s.user?.name || s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">({s.rollNo || 'N/A'})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {classStudents.length === 0 && (
                    <div className="p-4 text-center text-xs font-bold text-slate-400">
                      No students found in this class.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common Certificate Settings (UDISE, RC, Conduct, Date, Place) */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
                Certificate Details & Conduct
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">UDISE Code</label>
                  <input
                    type="text"
                    value={udiseCode}
                    onChange={(e) => setUdiseCode(e.target.value)}
                    placeholder="UDISE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Conduct & Character</label>
                  <select
                    value={conduct}
                    onChange={(e) => setConduct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Exemplary">Exemplary</option>
                    <option value="Good">Good</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Recognition / Rc. Number</label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="Rc. No. ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Place of Issue</label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Narasannapeta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Academic Progression Table Editor */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Academic Progress Records
                </h4>
                <button
                  onClick={handleAddAcademicRow}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-2">
                {academicRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                    <input
                      type="text"
                      value={row.year}
                      onChange={(e) => handleUpdateAcademicRow(idx, 'year', e.target.value)}
                      placeholder="2024-25"
                      className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      value={row.className}
                      onChange={(e) => handleUpdateAcademicRow(idx, 'className', e.target.value)}
                      placeholder="Class (VII)"
                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => handleUpdateAcademicRow(idx, 'remarks', e.target.value)}
                      placeholder="Remarks"
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                    />
                    <button
                      onClick={() => handleRemoveAcademicRow(idx)}
                      disabled={academicRows.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT LIVE A4 CANVAS PREVIEW AREA (60% width) */}
        <div className="flex-1 bg-slate-200/60 rounded-3xl border border-slate-200/80 flex flex-col overflow-hidden shadow-inner relative">
          
          {/* Preview Toolbar */}
          <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" /> Live Preview
              </h3>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                A4 Portrait (210mm × 297mm)
              </span>
            </div>

            {/* Bulk Navigation (< Prev / Next >) */}
            {mode === 'bulk' && bulkSelectedIds.length > 0 && (
              <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                <button
                  onClick={() => setBulkPreviewIndex((p) => Math.max(0, p - 1))}
                  disabled={bulkPreviewIndex === 0}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-black text-slate-700 min-w-[120px] text-center">
                  Student {bulkPreviewIndex + 1} of {bulkSelectedIds.length}
                </span>
                <button
                  onClick={() => setBulkPreviewIndex((p) => Math.min(bulkSelectedIds.length - 1, p + 1))}
                  disabled={bulkPreviewIndex >= bulkSelectedIds.length - 1}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons: Print & Download */}
            <div className="flex items-center gap-2.5">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 mr-2">
                <button
                  onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.1))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1 text-slate-600">{Math.round(zoomScale * 100)}%</span>
                <button
                  onClick={() => setZoomScale((s) => Math.min(1.2, s + 0.1))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {mode === 'single' ? (
                <>
                  <button
                    onClick={handlePrintCurrent}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print A4</span>
                  </button>
                  <button
                    onClick={handleExportSinglePDF}
                    disabled={isExporting}
                    className="btn-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Export PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrintAllBulk}
                    disabled={bulkSelectedIds.length === 0}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print All ({bulkSelectedIds.length})</span>
                  </button>
                  <button
                    onClick={handleExportBulkZip}
                    disabled={isZipping || bulkSelectedIds.length === 0}
                    className="btn-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isZipping ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                    <span>ZIP ({bulkSelectedIds.length} PDFs)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Zoomable Viewport */}
          <div className="flex-1 overflow-auto p-6 flex justify-center items-start custom-scrollbar">
            
            {/* The A4 Canvas Element */}
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shrink-0 mb-12 shadow-2xl"
            >
              <div
                ref={certPreviewRef}
                style={{
                  width: '210mm',
                  height: '297mm',
                  minHeight: '297mm',
                  maxHeight: '297mm',
                  background: '#FDFBF7',
                  fontFamily: "'Times New Roman', Georgia, serif",
                }}
                className="relative overflow-hidden flex flex-col justify-between p-12 select-none"
              >
                {/* Outer Golden Border */}
                <div className="absolute inset-[8mm] border-[1.8px] border-amber-600 pointer-events-none z-10" />
                {/* Inner Navy Border */}
                <div className="absolute inset-[11mm] border-[4.5px] border-[#0b1a33] pointer-events-none z-10" />

                {/* Corner Accents */}
                <div className="absolute top-[9.5mm] left-[9.5mm] w-8 h-8 border-t-2 border-l-2 border-amber-600 z-11 pointer-events-none" />
                <div className="absolute top-[9.5mm] right-[9.5mm] w-8 h-8 border-t-2 border-r-2 border-amber-600 z-11 pointer-events-none" />
                <div className="absolute bottom-[9.5mm] left-[9.5mm] w-8 h-8 border-b-2 border-l-2 border-amber-600 z-11 pointer-events-none" />
                <div className="absolute bottom-[9.5mm] right-[9.5mm] w-8 h-8 border-b-2 border-r-2 border-amber-600 z-11 pointer-events-none" />

                {/* Background Logo Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none z-1">
                  <img
                    src={getPhotoUrl(schoolSettings.logoUrl) || '/logo.png'}
                    alt="Watermark"
                    className="w-[110mm] h-[110mm] object-contain grayscale"
                  />
                </div>

                {/* Main Content Area */}
                <div className="relative z-5 h-full flex flex-col justify-between p-4">
                  
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-center relative min-h-[90px] mb-4">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center">
                        <img
                          src={getPhotoUrl(schoolSettings.logoUrl) || '/logo.png'}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                          onError={(e: any) => { e.target.src = '/logo.png'; }}
                        />
                      </div>
                      <div className="text-center px-24">
                        <h1 className="text-3xl font-black text-[#0b1a33] uppercase tracking-wide leading-tight">
                          {schoolSettings.schoolName}
                        </h1>
                        <p className="text-[12px] font-bold text-slate-700 font-sans mt-1">
                          {rcNumber}
                        </p>
                        <p className="text-[12px] font-bold text-[#0b1a33] font-sans mt-0.5">
                          {schoolSettings.address}
                        </p>
                      </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center my-4">
                      <h2 className="text-xl font-black text-[#0b1a33] uppercase tracking-widest underline underline-offset-8 decoration-2 inline-block">
                        STUDY & CONDUCT CERTIFICATE
                      </h2>
                    </div>

                    {/* Admission & UDISE Bar */}
                    <div className="flex justify-between items-center my-5 px-1 font-serif">
                      <div className="border-2 border-[#0b1a33] px-4 py-1 rounded bg-white/70 text-sm font-bold text-[#0b1a33]">
                        Admission No. : <span className="font-mono font-black ml-1 text-slate-900">{currentPreviewData.admissionNo}</span>
                      </div>
                      <div className="border-2 border-[#0b1a33] px-4 py-1 rounded bg-white/70 text-sm font-bold text-[#0b1a33]">
                        UDISE Code : <span className="font-mono font-black ml-1 text-slate-900">{currentPreviewData.udiseCode}</span>
                      </div>
                    </div>

                    {/* Certificate Body Paragraphs */}
                    <div className="space-y-4 text-justify font-serif text-[17px] leading-relaxed text-slate-800 pt-2">
                      <p>
                        <span className="italic text-slate-600">This is to certify that</span>{' '}
                        <strong className="text-xl font-black text-[#0b1a33] border-b-2 border-dotted border-slate-500 px-3">
                          {currentPreviewData.studentName}
                        </strong>
                        , <span className="italic text-slate-600">Son / Daughter of</span>{' '}
                        <strong className="text-xl font-black text-[#0b1a33] border-b-2 border-dotted border-slate-500 px-3">
                          {currentPreviewData.fatherName}
                        </strong>
                        , <span className="italic text-slate-600">was a bona fide student of this institution.</span>
                      </p>

                      <p>
                        <span className="italic text-slate-600">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>{' '}
                        <strong className="italic text-lg font-black text-[#0b1a33] border-b-2 border-dotted border-slate-500 px-2">
                          {currentPreviewData.conduct}
                        </strong>
                        . <span className="italic text-slate-600">The student consistently maintained good moral values, complied with the rules and regulations of the institution, and demonstrated respectful behavior towards teachers, staff, and fellow students.</span>
                      </p>

                      <p className="italic text-slate-600">
                        He / She studied the following classes during the years noted below, as recorded in the school records:
                      </p>
                    </div>

                    {/* Academic Progress Table */}
                    <div className="border-2 border-[#0b1a33] rounded overflow-hidden my-4">
                      <table className="w-full text-center border-collapse font-sans text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-[#0b1a33]">
                            <th style={{ color: '#0b1a33', backgroundColor: '#f1f5f9' }} className="py-2.5 px-3 font-black uppercase w-16">Sl. No.</th>
                            <th style={{ color: '#0b1a33', backgroundColor: '#f1f5f9' }} className="py-2.5 px-3 font-black uppercase">Academic Year</th>
                            <th style={{ color: '#0b1a33', backgroundColor: '#f1f5f9' }} className="py-2.5 px-3 font-black uppercase">Class</th>
                            <th style={{ color: '#0b1a33', backgroundColor: '#f1f5f9' }} className="py-2.5 px-3 font-black uppercase">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-bold text-slate-800 bg-white/40">
                          {academicRows.map((row, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3">{idx + 1}</td>
                              <td className="py-2 px-3">{row.year}</td>
                              <td className="py-2 px-3">{row.className}</td>
                              <td className="py-2 px-3">{row.remarks || 'Promoted'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signatures & Footer */}
                  <div className="flex justify-between items-end pt-6 font-serif">
                    <div className="space-y-1.5 text-sm font-bold text-slate-700">
                      <div>
                        <span className="italic text-slate-500 mr-2">Place :</span>
                        <strong className="text-[#0b1a33] border-b border-dotted border-slate-500 px-2">{currentPreviewData.place}</strong>
                      </div>
                      <div>
                        <span className="italic text-slate-500 mr-2">Date &nbsp;:</span>
                        <strong className="text-[#0b1a33] border-b border-dotted border-slate-500 px-2">{currentPreviewData.date}</strong>
                      </div>
                    </div>

                    <div className="text-center w-56">
                      <div className="h-14" />
                      <div className="border-b-2 border-[#0b1a33] mb-1.5" />
                      <div className="text-xs font-black uppercase tracking-wider text-[#0b1a33]">
                        Headmaster / Principal
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StudyCertificatePage;
