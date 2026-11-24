import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Printer, ChevronLeft, ChevronRight, Award, 
  Search, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  CheckCircle2, Users, FileText, CheckSquare, Square, 
  Settings, ArrowLeft, Filter, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { api } from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface SubjectRow {
  slNo: number;
  subjectName: string;
  canonicalName: string;
  fa1: number | null;
  fa1Max: number;
  fa2: number | null;
  fa2Max: number;
  fa3: number | null;
  fa3Max: number;
  fa4: number | null;
  fa4Max: number;
  faTotal: number | null;
  faMax: number;
  sa1: number | null;
  sa1Max: number;
  sa2: number | null;
  sa2Max: number;
  saTotal: number | null;
  saMax: number;
  grandTotal: number | null;
  grandMax: number;
  percentage: number | null;
  grade: string;
  gradePoint: number | null;
}

interface StudentEvaluation {
  id: string;
  rollNo: string;
  name: string;
  photoUrl: string | null;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  admissionNo: string;
  className: string;
  academicYear: string;
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  subjectRows: SubjectRow[];
  summary: {
    totalObtained: number;
    totalMax: number;
    percentage: number;
    grade: string;
    gpa: string;
    result: string;
    rank: number;
  };
}

interface SchoolInfo {
  schoolName: string;
  schoolSubtitle: string;
  address: string;
  logoUrl: string;
  principalSignatureUrl: string | null;
  teacherSignatureUrl: string | null;
  udiseCode: string;
}

export const AcademicProgressCardPage: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'single' (Individual Student) or 'bulk' (Whole Class)
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  // Classes & Selection
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Loaded Data from /api/marks/cce-cumulative-card
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(Recognized by Govt. of Andhra Pradesh | English Medium High School)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam',
    logoUrl: '/logo.png',
    principalSignatureUrl: null,
    teacherSignatureUrl: null,
    udiseCode: '281125100013',
  });
  const [students, setStudents] = useState<StudentEvaluation[]>([]);
  const [detectedExams, setDetectedExams] = useState<Record<string, any>>({});

  // Single Mode
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Bulk Mode
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);

  // Export States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Zoom scale for canvas preview (default: 0.85)
  const [zoomScale, setZoomScale] = useState(0.85);

  const cardCanvasRef = useRef<HTMLDivElement>(null);

  // 1. Load Classes on mount
  useEffect(() => {
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
    loadClasses();
  }, []);

  // 2. Load CCE Cumulative Data whenever selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setBulkSelectedIds([]);
      return;
    }

    const loadCceData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/marks/cce-cumulative-card?classId=${selectedClassId}`);
        const data = res.data?.data || res.data;
        if (data) {
          if (data.school) setSchoolInfo(data.school);
          if (data.detectedExams) setDetectedExams(data.detectedExams);
          const stList: StudentEvaluation[] = data.students || [];
          setStudents(stList);

          // By default, select all in bulk
          setBulkSelectedIds(stList.map(s => s.id));
          setBulkPreviewIndex(0);

          // In single mode, select first student
          if (stList.length > 0) {
            setSelectedStudentId(stList[0].id);
          } else {
            setSelectedStudentId('');
          }
        }
      } catch (err: any) {
        console.error('Failed to load CCE cumulative data', err);
        toast.error('Failed to load Academic Progress Card data');
      } finally {
        setLoading(false);
      }
    };

    loadCceData();
  }, [selectedClassId]);

  // Active student being previewed
  const currentStudent: StudentEvaluation | undefined = mode === 'single'
    ? students.find(s => s.id === selectedStudentId) || students[0]
    : students[bulkPreviewIndex] || students[0];

  // Filtered students for single mode search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (bulkSelectedIds.length === students.length) {
      setBulkSelectedIds([]);
    } else {
      setBulkSelectedIds(students.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setBulkSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Isolated Iframe Printing Engine (100% Reliable, 0 Blank Pages)
  // ─────────────────────────────────────────────────────────────────────────
  const printCceCards = (studentsToPrint: StudentEvaluation[]) => {
    if (studentsToPrint.length === 0) {
      toast.error('No students selected to print');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Failed to open print preview');
      document.body.removeChild(iframe);
      return;
    }

    const logoSrc = schoolInfo.logoUrl ? getPhotoUrl(schoolInfo.logoUrl) : '/logo.png';
    const principalSignSrc = schoolInfo.principalSignatureUrl ? getPhotoUrl(schoolInfo.principalSignatureUrl) : '';
    const teacherSignSrc = schoolInfo.teacherSignatureUrl ? getPhotoUrl(schoolInfo.teacherSignatureUrl) : '';

    const renderCardHtml = (st: StudentEvaluation) => {
      const studentPhoto = st.photoUrl ? getPhotoUrl(st.photoUrl) : '';

      return `
        <div class="cce-sheet">
          <div class="cce-inner-border">
            
            <!-- School Header -->
            <div class="school-header">
              <div class="logo-box">
                <img src="${logoSrc}" alt="Logo" class="school-logo" onerror="this.style.display='none'" />
              </div>
              <div class="school-details">
                <h1 class="school-title">${schoolInfo.schoolName}</h1>
                <div class="school-subtitle">${schoolInfo.schoolSubtitle}</div>
                <div class="school-address">${schoolInfo.address}</div>
                <div class="school-udise">UDISE CODE: <strong>${schoolInfo.udiseCode}</strong> &bull; AFFILIATED TO STATE BOARD</div>
              </div>
              <div class="photo-box">
                ${studentPhoto ? `<img src="${studentPhoto}" class="student-photo" alt="Photo" />` : `<div class="photo-placeholder">STUDENT<br/>PHOTO</div>`}
              </div>
            </div>

            <!-- Ribbon -->
            <div class="ribbon-container">
              <div class="ribbon-text">ANNUAL CUMULATIVE ACADEMIC PROGRESS REPORT &bull; ${st.academicYear}</div>
            </div>

            <!-- Student Profile Grid -->
            <div class="student-profile-grid">
              <div class="profile-row">
                <div class="profile-cell"><span class="lbl">STUDENT NAME:</span> <strong class="val">${st.name}</strong></div>
                <div class="profile-cell"><span class="lbl">ROLL NO / ID:</span> <strong class="val">${st.rollNo}</strong></div>
                <div class="profile-cell"><span class="lbl">CLASS &amp; SEC:</span> <strong class="val">${st.className}</strong></div>
              </div>
              <div class="profile-row">
                <div class="profile-cell"><span class="lbl">FATHER'S NAME:</span> <strong class="val">${st.fatherName}</strong></div>
                <div class="profile-cell"><span class="lbl">MOTHER'S NAME:</span> <strong class="val">${st.motherName}</strong></div>
                <div class="profile-cell"><span class="lbl">DATE OF BIRTH:</span> <strong class="val">${st.dob}</strong></div>
              </div>
            </div>

            <!-- Part I: Scholastic Performance Table -->
            <div class="section-badge">PART I : SCHOLASTIC EVALUATION (CURRICULAR AREAS)</div>
            <table class="marks-table">
              <thead>
                <tr>
                  <th rowspan="2" class="col-sl">SL</th>
                  <th rowspan="2" class="col-sub">CURRICULAR SUBJECTS</th>
                  <th colspan="4" class="col-group">FORMATIVE ASSESSMENTS</th>
                  <th rowspan="2" class="col-fa-tot">FA<br/>TOT</th>
                  <th colspan="2" class="col-group">SUMMATIVE</th>
                  <th rowspan="2" class="col-sa-tot">SA<br/>TOT</th>
                  <th rowspan="2" class="col-grand">GRAND<br/>TOTAL</th>
                  <th rowspan="2" class="col-pct">%</th>
                  <th rowspan="2" class="col-grade">GRADE</th>
                  <th rowspan="2" class="col-gp">GRADE<br/>POINT</th>
                </tr>
                <tr class="sub-head">
                  <th class="col-fa">FA-1</th>
                  <th class="col-fa">FA-2</th>
                  <th class="col-fa">FA-3</th>
                  <th class="col-fa">FA-4</th>
                  <th class="col-sa">SA-1</th>
                  <th class="col-sa">SA-2</th>
                </tr>
              </thead>
              <tbody>
                ${st.subjectRows.map(row => `
                  <tr>
                    <td class="text-center font-bold">${row.slNo}</td>
                    <td class="font-bold subject-title">${row.subjectName}</td>
                    <td class="text-center">${row.fa1 !== null ? row.fa1 : '-'}</td>
                    <td class="text-center">${row.fa2 !== null ? row.fa2 : '-'}</td>
                    <td class="text-center">${row.fa3 !== null ? row.fa3 : '-'}</td>
                    <td class="text-center">${row.fa4 !== null ? row.fa4 : '-'}</td>
                    <td class="text-center font-bold bg-highlight">${row.faTotal !== null ? row.faTotal : '-'}</td>
                    <td class="text-center">${row.sa1 !== null ? row.sa1 : '-'}</td>
                    <td class="text-center">${row.sa2 !== null ? row.sa2 : '-'}</td>
                    <td class="text-center font-bold bg-highlight">${row.saTotal !== null ? row.saTotal : '-'}</td>
                    <td class="text-center font-bold bg-total">${row.grandTotal !== null ? row.grandTotal : '-'}</td>
                    <td class="text-center font-bold">${row.percentage !== null ? row.percentage + '%' : '-'}</td>
                    <td class="text-center font-black grade-badge grade-${row.grade}">${row.grade}</td>
                    <td class="text-center font-bold">${row.gradePoint !== null ? row.gradePoint : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2" class="text-right font-black uppercase tracking-wider">CUMULATIVE PERFORMANCE SUMMARY</td>
                  <td colspan="4" class="text-center font-bold">SCHOLASTIC TOTAL</td>
                  <td class="text-center font-black bg-highlight">${st.subjectRows.reduce((acc, r) => acc + (r.faTotal || 0), 0) || '-'}</td>
                  <td colspan="2" class="text-center font-bold">SUMMATIVE TOTAL</td>
                  <td class="text-center font-black bg-highlight">${st.subjectRows.reduce((acc, r) => acc + (r.saTotal || 0), 0) || '-'}</td>
                  <td class="text-center font-black bg-total">${st.summary.totalObtained}</td>
                  <td class="text-center font-black">${st.summary.percentage}%</td>
                  <td class="text-center font-black grade-pill">${st.summary.grade}</td>
                  <td class="text-center font-black">${st.summary.gpa}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Summary Bar -->
            <div class="summary-metrics-bar">
              <div class="metric-box">
                <span class="m-lbl">TOTAL MARKS:</span>
                <span class="m-val">${st.summary.totalObtained} / ${st.summary.totalMax}</span>
              </div>
              <div class="metric-box">
                <span class="m-lbl">PERCENTAGE:</span>
                <span class="m-val">${st.summary.percentage}%</span>
              </div>
              <div class="metric-box">
                <span class="m-lbl">CUMULATIVE GRADE:</span>
                <span class="m-val">${st.summary.grade}</span>
              </div>
              <div class="metric-box">
                <span class="m-lbl">CLASS RANK:</span>
                <span class="m-val">${st.summary.rank}</span>
              </div>
              <div class="metric-box result-box">
                <span class="m-lbl">RESULT:</span>
                <span class="m-val result-highlight">${st.summary.result}</span>
              </div>
            </div>

            <!-- Part II: Co-Scholastic & Attendance & CCE Key -->
            <div class="two-col-layout">
              <div class="left-col">
                <div class="section-badge">PART II : CO-SCHOLASTIC AREAS &amp; ATTENDANCE</div>
                <div class="co-scholastic-table-wrap">
                  <table class="sub-mini-table">
                    <tr>
                      <td class="lbl">Days Attended / Total Days</td>
                      <td class="val font-bold">${st.attendance.presentDays} / ${st.attendance.totalDays} (${st.attendance.percentage}%)</td>
                    </tr>
                    <tr>
                      <td class="lbl">Life Skills &amp; Value Education</td>
                      <td class="val font-bold grade-A1">A+ (Exemplary)</td>
                    </tr>
                    <tr>
                      <td class="lbl">Art &amp; Cultural Education</td>
                      <td class="val font-bold grade-A2">A (Proficient)</td>
                    </tr>
                    <tr>
                      <td class="lbl">Work &amp; Computer Literacy</td>
                      <td class="val font-bold grade-A1">A+ (Exemplary)</td>
                    </tr>
                    <tr>
                      <td class="lbl">Physical &amp; Health Education</td>
                      <td class="val font-bold grade-A2">A (Proficient)</td>
                    </tr>
                    <tr>
                      <td class="lbl">General Conduct &amp; Character</td>
                      <td class="val font-bold text-navy">EXCELLENT</td>
                    </tr>
                  </table>
                </div>
              </div>

              <div class="right-col">
                <div class="section-badge">CCE GRADING SCALE (REFERENCE)</div>
                <div class="scale-table-wrap">
                  <table class="scale-table">
                    <thead>
                      <tr>
                        <th>MARKS %</th>
                        <th>GRADE</th>
                        <th>GRADE POINT</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>91% - 100%</td><td class="font-bold">A1</td><td>10</td><td>Outstanding</td></tr>
                      <tr><td>81% - 90%</td><td class="font-bold">A2</td><td>9</td><td>Excellent</td></tr>
                      <tr><td>71% - 80%</td><td class="font-bold">B1</td><td>8</td><td>Very Good</td></tr>
                      <tr><td>61% - 70%</td><td class="font-bold">B2</td><td>7</td><td>Good</td></tr>
                      <tr><td>51% - 60%</td><td class="font-bold">C1</td><td>6</td><td>Above Average</td></tr>
                      <tr><td>41% - 50%</td><td class="font-bold">C2</td><td>5</td><td>Average</td></tr>
                      <tr><td>35% - 40%</td><td class="font-bold">D</td><td>4</td><td>Pass</td></tr>
                      <tr><td>Below 35%</td><td class="font-bold">E</td><td>3</td><td>Needs Improvement</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="signatures-wrapper">
              <div class="sign-column text-center">
                <div class="sign-space"></div>
                <div class="sign-line"></div>
                <div class="sign-label">PARENT / GUARDIAN</div>
              </div>
              <div class="sign-column text-center">
                <div class="sign-space">
                  ${teacherSignSrc ? `<img src="${teacherSignSrc}" class="sign-img" alt="Teacher" />` : ''}
                </div>
                <div class="sign-line"></div>
                <div class="sign-label">CLASS TEACHER</div>
              </div>
              <div class="sign-column text-center">
                <div class="sign-space">
                  ${principalSignSrc ? `<img src="${principalSignSrc}" class="sign-img" alt="Principal" />` : ''}
                </div>
                <div class="sign-line"></div>
                <div class="sign-label">HEADMASTER / PRINCIPAL</div>
              </div>
            </div>

          </div>
        </div>
      `;
    };

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Academic Progress Cards</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #fff;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            color: #0b1a33;
          }
          .cce-sheet {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            padding: 7mm;
            background: #ffffff;
            page-break-after: always;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .cce-sheet:last-child {
            page-break-after: avoid;
          }
          .cce-inner-border {
            border: 2.5px solid #0b1a33;
            outline: 1px solid #d4af37;
            outline-offset: -3.5px;
            height: 100%;
            padding: 6mm 7mm;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .school-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0b1a33;
            padding-bottom: 3.5mm;
            margin-bottom: 2.5mm;
          }
          .logo-box {
            width: 22mm;
            height: 22mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .school-logo {
            max-width: 22mm;
            max-height: 22mm;
            object-fit: contain;
          }
          .school-details {
            flex: 1;
            text-align: center;
            padding: 0 4mm;
          }
          .school-title {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 17pt;
            font-weight: 900;
            color: #0b1a33;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            line-height: 1.15;
          }
          .school-subtitle {
            font-size: 8.5pt;
            font-weight: bold;
            color: #991b1b;
            margin-top: 1mm;
          }
          .school-address {
            font-size: 8pt;
            color: #334155;
            margin-top: 0.5mm;
          }
          .school-udise {
            font-size: 7.5pt;
            color: #475569;
            margin-top: 0.5mm;
          }
          .photo-box {
            width: 22mm;
            height: 25mm;
            border: 1.5px solid #d4af37;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            overflow: hidden;
          }
          .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .photo-placeholder {
            font-size: 6.5pt;
            text-align: center;
            color: #94a3b8;
            font-weight: bold;
          }
          .ribbon-container {
            background: linear-gradient(135deg, #0b1a33 0%, #1e3a8a 100%);
            color: #ffffff;
            text-align: center;
            padding: 1.5mm 0;
            border-radius: 1mm;
            margin-bottom: 2.5mm;
          }
          .ribbon-text {
            font-size: 9.5pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #fef08a;
          }
          .student-profile-grid {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 1mm;
            padding: 2mm 3mm;
            margin-bottom: 2.5mm;
            font-size: 8pt;
          }
          .profile-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1.2mm;
          }
          .profile-row:last-child {
            margin-bottom: 0;
          }
          .profile-cell {
            flex: 1;
          }
          .profile-cell .lbl {
            color: #64748b;
            font-size: 7pt;
            font-weight: bold;
            margin-right: 1.5mm;
          }
          .profile-cell .val {
            color: #0b1a33;
            font-size: 8.5pt;
          }
          .section-badge {
            background: #e2e8f0;
            color: #0b1a33;
            font-size: 7.5pt;
            font-weight: 900;
            padding: 1mm 2.5mm;
            border-left: 3px solid #0b1a33;
            text-transform: uppercase;
            margin-bottom: 1.5mm;
            letter-spacing: 0.5px;
          }
          .marks-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
            margin-bottom: 2.5mm;
          }
          .marks-table th, .marks-table td {
            border: 1px solid #0b1a33;
            padding: 1.5mm 1mm;
          }
          .marks-table thead th {
            background-color: #0b1a33;
            color: #ffffff;
            font-size: 7pt;
            font-weight: 800;
            text-align: center;
            text-transform: uppercase;
          }
          .marks-table thead .sub-head th {
            background-color: #1e293b;
            font-size: 6.5pt;
          }
          .col-sl { width: 6mm; }
          .col-sub { width: 38mm; text-align: left !important; padding-left: 2mm !important; }
          .col-fa { width: 10mm; }
          .col-fa-tot { width: 12mm; }
          .col-sa { width: 12mm; }
          .col-sa-tot { width: 12mm; }
          .col-grand { width: 14mm; }
          .col-pct { width: 11mm; }
          .col-grade { width: 12mm; }
          .col-gp { width: 12mm; }
          .subject-title { text-transform: uppercase; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .bg-highlight { background-color: #f1f5f9; }
          .bg-total { background-color: #e0f2fe; }
          .grade-badge { font-size: 8.5pt; color: #0b1a33; }
          .total-row {
            background-color: #f8fafc;
            border-top: 2px solid #0b1a33;
          }
          .summary-metrics-bar {
            display: flex;
            border: 1.5px solid #0b1a33;
            background: #ffffff;
            border-radius: 1mm;
            margin-bottom: 2.5mm;
            overflow: hidden;
          }
          .metric-box {
            flex: 1;
            padding: 1.5mm 2mm;
            text-align: center;
            border-right: 1px solid #cbd5e1;
          }
          .metric-box:last-child {
            border-right: none;
          }
          .metric-box .m-lbl {
            display: block;
            font-size: 6.5pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
          }
          .metric-box .m-val {
            font-size: 9.5pt;
            font-weight: 900;
            color: #0b1a33;
          }
          .result-box {
            background: #f0fdf4;
          }
          .result-highlight {
            color: #166534 !important;
          }
          .two-col-layout {
            display: flex;
            gap: 3.5mm;
            margin-bottom: 2.5mm;
          }
          .left-col {
            flex: 1.1;
          }
          .right-col {
            flex: 0.9;
          }
          .sub-mini-table, .scale-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
          }
          .sub-mini-table td, .scale-table td, .scale-table th {
            border: 1px solid #cbd5e1;
            padding: 1.1mm 1.5mm;
          }
          .sub-mini-table .lbl {
            color: #334155;
            width: 60%;
          }
          .sub-mini-table .val {
            text-align: right;
            width: 40%;
          }
          .scale-table thead th {
            background: #f1f5f9;
            color: #0b1a33;
            font-weight: 800;
            text-align: center;
            font-size: 6.5pt;
          }
          .scale-table td {
            text-align: center;
          }
          .signatures-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 4mm;
            border-top: 1px dashed #cbd5e1;
          }
          .sign-column {
            width: 48mm;
          }
          .sign-space {
            height: 12mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .sign-img {
            max-height: 12mm;
            max-width: 40mm;
            object-fit: contain;
          }
          .sign-line {
            border-bottom: 1.5px solid #0b1a33;
            margin-bottom: 1.5mm;
          }
          .sign-label {
            font-size: 7.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0b1a33;
          }
        </style>
      </head>
      <body>
        ${studentsToPrint.map(st => renderCardHtml(st)).join('')}
      </body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error(e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 300);
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Export Single PDF via html2canvas & jsPDF
  // ─────────────────────────────────────────────────────────────────────────
  const downloadSinglePdf = async (st: StudentEvaluation) => {
    if (!cardCanvasRef.current) return;
    setIsExportingPdf(true);
    const toastId = toast.loading(`Generating PDF for ${st.name}...`);

    try {
      const canvas = await html2canvas(cardCanvasRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`${st.name.replace(/\s+/g, '_')}_Academic_Progress_Card.pdf`);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF', { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Bulk Download ZIP of all PDFs
  // ─────────────────────────────────────────────────────────────────────────
  const downloadBulkZip = async () => {
    const selectedStudents = students.filter(s => bulkSelectedIds.includes(s.id));
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading(`Preparing ZIP for ${selectedStudents.length} students...`);

    try {
      const zip = new JSZip();
      
      // Temporarily switch preview index to render each student and capture
      for (let i = 0; i < selectedStudents.length; i++) {
        const st = selectedStudents[i];
        setBulkPreviewIndex(students.findIndex(s => s.id === st.id));
        // wait for state and DOM to update
        await new Promise(r => setTimeout(r, 200));

        if (cardCanvasRef.current) {
          const canvas = await html2canvas(cardCanvasRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          const pdfBlob = pdf.output('blob');
          const fileName = `${st.rollNo}_${st.name.replace(/\s+/g, '_')}_ProgressCard.pdf`;
          zip.file(fileName, pdfBlob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Academic_Progress_Cards_${classes.find(c => c.id === selectedClassId)?.name || 'Class'}.zip`);
      toast.success('ZIP download complete!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ZIP', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 min-h-screen">
      {/* Top Navbar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/office-tools')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to Office Tools"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h1 className="text-base font-bold text-white tracking-wide">
                Academic Progress Card Generator
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                FA1–FA4 &bull; SA1–SA2 CCE System
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generate official cumulative annual progress report cards with real database marks
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {mode === 'single' && currentStudent && (
            <>
              <button
                onClick={() => printCceCards([currentStudent])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print Card (A4)
              </button>
              <button
                onClick={() => downloadSinglePdf(currentStudent)}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExportingPdf ? 'Exporting...' : 'PDF'}
              </button>
            </>
          )}

          {mode === 'bulk' && (
            <>
              <button
                onClick={() => {
                  const toPrint = students.filter(s => bulkSelectedIds.includes(s.id));
                  printCceCards(toPrint);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print All Selected ({bulkSelectedIds.length})
              </button>
              <button
                onClick={downloadBulkZip}
                disabled={isZipping || bulkSelectedIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isZipping ? 'Zipping...' : `Download ZIP (${bulkSelectedIds.length})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Layout (Left Control Panel + Right Live A4 Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT CONTROL SIDEBAR ────────────────────────────────────────── */}
        <div className="w-80 md:w-96 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          
          {/* Mode Switcher Tabs */}
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex gap-2">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Single Student
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Class Bulk Mode
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Class Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Select Class &amp; Section
              </label>
              {classesLoading ? (
                <div className="p-2 text-center text-xs text-slate-500">Loading classes...</div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-indigo-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `- Section ${c.section}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Exam Detection Summary Banner */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Detected CCE Assessments:
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {['fa1', 'fa2', 'fa3', 'fa4', 'sa1', 'sa2'].map((key) => {
                  const isFound = !!detectedExams[key];
                  return (
                    <div
                      key={key}
                      className={`p-1.5 rounded border ${
                        isFound 
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
                      }`}
                    >
                      <div className="font-black uppercase">{key}</div>
                      <div className="truncate text-[9px] mt-0.5">
                        {isFound ? detectedExams[key].name : 'Not Found'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SINGLE MODE: Student Search & Selection */}
            {mode === 'single' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Student ({students.length})
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name or roll no..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.map((st) => {
                    const isSelected = st.id === selectedStudentId;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {st.photoUrl ? (
                            <img src={getPhotoUrl(st.photoUrl)} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-indigo-400">{st.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{st.name}</div>
                          <div className="text-[10px] text-slate-400">Roll: {st.rollNo} &bull; Rank: #{st.summary.rank}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BULK MODE: Student Checklist */}
            {mode === 'bulk' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Student Checklist
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    {bulkSelectedIds.length === students.length ? 'Unselect All' : 'Select All'}
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 flex items-center justify-between">
                  <span>Selected for bulk print:</span>
                  <strong className="text-indigo-400 font-bold">{bulkSelectedIds.length} of {students.length}</strong>
                </div>

                {/* Carousel Navigator */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                  <button
                    onClick={() => setBulkPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={bulkPreviewIndex === 0}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-300">
                    Previewing: <span className="text-white">{bulkPreviewIndex + 1}</span> of {students.length}
                  </span>
                  <button
                    onClick={() => setBulkPreviewIndex(prev => Math.min(students.length - 1, prev + 1))}
                    disabled={bulkPreviewIndex >= students.length - 1}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {students.map((st, idx) => {
                    const isChecked = bulkSelectedIds.includes(st.id);
                    const isPreviewing = bulkPreviewIndex === idx;
                    return (
                      <div
                        key={st.id}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isPreviewing ? 'border-indigo-500 bg-slate-900' : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/40'
                        }`}
                        onClick={() => setBulkPreviewIndex(idx)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectStudent(st.id);
                            }}
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{st.name}</div>
                            <div className="text-[10px] text-slate-500">Roll: {st.rollNo}</div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          st.summary.grade === 'A1' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {st.summary.grade} ({st.summary.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* School Info Badge */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-400">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Branding Info</div>
              <div>School: <strong className="text-white">{schoolInfo.schoolName}</strong></div>
              <div>UDISE: <strong className="text-white">{schoolInfo.udiseCode}</strong></div>
              <div>Principal Signature: <span className={schoolInfo.principalSignatureUrl ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{schoolInfo.principalSignatureUrl ? 'Available' : 'None'}</span></div>
            </div>

          </div>
        </div>

        {/* ── RIGHT LIVE CANVAS PREVIEW ────────────────────────────────────── */}
        <div className="flex-1 bg-slate-900/90 overflow-auto flex flex-col items-center p-6 relative">
          
          {/* Floating Zoom & Controls Bar */}
          <div className="sticky top-0 z-30 mb-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-xl">
            <span className="text-xs font-bold text-slate-400">A4 Live Canvas Preview</span>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-indigo-400 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(1.2, prev + 0.1))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(0.85)}
              className="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <div className="text-sm font-bold text-slate-400">Loading Academic Progress Card Data...</div>
            </div>
          ) : !currentStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Award className="w-12 h-12 stroke-1" />
              <p className="text-sm">No students or marks found for this class.</p>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shadow-2xl"
            >
              {/* ───────────────────────────────────────────────────────────── */}
              {/* THE EXACT A4 CANVAS (210mm x 297mm)                          */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div
                ref={cardCanvasRef}
                style={{
                  width: '210mm',
                  height: '297mm',
                  minHeight: '297mm',
                  maxHeight: '297mm',
                  padding: '7mm',
                  backgroundColor: '#ffffff',
                  color: '#0b1a33',
                  boxSizing: 'border-box',
                  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
                }}
                className="flex flex-col justify-between relative overflow-hidden select-none"
              >
                {/* Outer/Inner Gold Certificate Border */}
                <div
                  style={{
                    border: '2.5px solid #0b1a33',
                    outline: '1px solid #d4af37',
                    outlineOffset: '-3.5px',
                    height: '100%',
                    padding: '6mm 7mm',
                    boxSizing: 'border-box',
                  }}
                  className="flex flex-col justify-between relative bg-white"
                >
                  
                  {/* Top School Header */}
                  <div className="flex items-center justify-between border-b-2 border-[#0b1a33] pb-2.5 mb-2">
                    <div className="w-20 h-20 flex items-center justify-center shrink-0">
                      <img
                        src={schoolInfo.logoUrl ? getPhotoUrl(schoolInfo.logoUrl) : '/logo.png'}
                        alt="School Logo"
                        className="max-h-20 max-w-20 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>

                    <div className="flex-1 text-center px-3">
                      <h1 className="font-serif font-black text-xl text-[#0b1a33] tracking-wider uppercase leading-tight">
                        {schoolInfo.schoolName}
                      </h1>
                      <div className="text-[10px] font-bold text-rose-800 mt-0.5">
                        {schoolInfo.schoolSubtitle}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        {schoolInfo.address}
                      </div>
                      <div className="text-[8.5px] font-semibold text-slate-500 mt-0.5">
                        UDISE CODE: <strong className="text-slate-800">{schoolInfo.udiseCode}</strong> &bull; AFFILIATED TO STATE BOARD
                      </div>
                    </div>

                    <div className="w-20 h-24 border border-[#d4af37] bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {currentStudent.photoUrl ? (
                        <img
                          src={getPhotoUrl(currentStudent.photoUrl)}
                          alt={currentStudent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[8px] font-bold text-slate-400 text-center leading-tight">
                          STUDENT<br />PHOTO
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ribbon Banner */}
                  <div className="bg-gradient-to-r from-[#0b1a33] via-[#1e3a8a] to-[#0b1a33] text-center py-1.5 rounded mb-2 shadow-sm">
                    <div className="text-[11.5px] font-black tracking-widest text-yellow-200 uppercase">
                      ANNUAL CUMULATIVE ACADEMIC PROGRESS REPORT &bull; {currentStudent.academicYear}
                    </div>
                  </div>

                  {/* Student Profile Box */}
                  <div className="border border-slate-300 bg-slate-50/70 rounded p-2 mb-2 text-[9.5px]">
                    <div className="flex justify-between mb-1">
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">STUDENT NAME:</span>
                        <strong className="text-[#0b1a33] font-black text-[10.5px]">{currentStudent.name}</strong>
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">ROLL NO / ID:</span>
                        <strong className="text-[#0b1a33] font-bold">{currentStudent.rollNo}</strong>
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">CLASS &amp; SEC:</span>
                        <strong className="text-[#0b1a33] font-bold">{currentStudent.className}</strong>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">FATHER'S NAME:</span>
                        <strong className="text-[#0b1a33] font-bold">{currentStudent.fatherName}</strong>
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">MOTHER'S NAME:</span>
                        <strong className="text-[#0b1a33] font-bold">{currentStudent.motherName}</strong>
                      </div>
                      <div className="flex-1">
                        <span className="text-slate-500 font-bold mr-1.5 text-[8.5px]">DATE OF BIRTH:</span>
                        <strong className="text-[#0b1a33] font-bold">{currentStudent.dob}</strong>
                      </div>
                    </div>
                  </div>

                  {/* PART I: CCE Marks Table */}
                  <div className="mb-2">
                    <div className="bg-slate-200 text-[#0b1a33] text-[9px] font-black px-2 py-0.5 border-l-4 border-[#0b1a33] uppercase tracking-wider mb-1">
                      PART I : SCHOLASTIC EVALUATION (CURRICULAR AREAS)
                    </div>

                    <table className="w-full border-collapse border border-[#0b1a33] text-[8.5px]">
                      <thead>
                        <tr className="bg-[#0b1a33] text-white uppercase text-center font-bold text-[8px]">
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-6">SL</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-2 text-left w-36">CURRICULAR SUBJECTS</th>
                          <th colSpan={4} className="border border-slate-700 py-1">FORMATIVE ASSESSMENTS</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-10 bg-slate-800">FA<br />TOT</th>
                          <th colSpan={2} className="border border-slate-700 py-1">SUMMATIVE</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-10 bg-slate-800">SA<br />TOT</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-12 bg-indigo-900">GRAND<br />TOTAL</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-10">%</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-10 bg-slate-800">GRADE</th>
                          <th rowSpan={2} className="border border-slate-700 py-1 px-1 w-8">GRADE<br />POINT</th>
                        </tr>
                        <tr className="bg-slate-800 text-white uppercase text-center font-bold text-[7.5px]">
                          <th className="border border-slate-700 py-0.5 px-1 w-8">FA-1</th>
                          <th className="border border-slate-700 py-0.5 px-1 w-8">FA-2</th>
                          <th className="border border-slate-700 py-0.5 px-1 w-8">FA-3</th>
                          <th className="border border-slate-700 py-0.5 px-1 w-8">FA-4</th>
                          <th className="border border-slate-700 py-0.5 px-1 w-10">SA-1</th>
                          <th className="border border-slate-700 py-0.5 px-1 w-10">SA-2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStudent.subjectRows.map((row) => (
                          <tr key={row.slNo} className="border-b border-[#0b1a33]/40 hover:bg-slate-50 text-slate-900 font-medium">
                            <td className="border-r border-[#0b1a33]/40 text-center font-bold py-1 px-0.5">{row.slNo}</td>
                            <td className="border-r border-[#0b1a33]/40 font-bold uppercase py-1 px-2 text-[#0b1a33]">{row.subjectName}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.fa1 !== null ? row.fa1 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.fa2 !== null ? row.fa2 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.fa3 !== null ? row.fa3 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.fa4 !== null ? row.fa4 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center font-black bg-slate-100">{row.faTotal !== null ? row.faTotal : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.sa1 !== null ? row.sa1 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center">{row.sa2 !== null ? row.sa2 : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center font-black bg-slate-100">{row.saTotal !== null ? row.saTotal : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center font-black bg-indigo-50 text-indigo-950">{row.grandTotal !== null ? row.grandTotal : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center font-bold">{row.percentage !== null ? `${row.percentage}%` : '-'}</td>
                            <td className="border-r border-[#0b1a33]/40 text-center font-black text-[9.5px]">{row.grade}</td>
                            <td className="text-center font-bold">{row.gradePoint !== null ? row.gradePoint : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-[#0b1a33] font-black text-[#0b1a33]">
                          <td colSpan={2} className="py-1 px-2 text-right uppercase tracking-wider text-[8px]">
                            CUMULATIVE PERFORMANCE SUMMARY
                          </td>
                          <td colSpan={4} className="border-l border-[#0b1a33]/40 text-center text-[7.5px] font-bold text-slate-600">
                            SCHOLASTIC TOTAL
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black bg-slate-200">
                            {currentStudent.subjectRows.reduce((acc, r) => acc + (r.faTotal || 0), 0) || '-'}
                          </td>
                          <td colSpan={2} className="border-l border-[#0b1a33]/40 text-center text-[7.5px] font-bold text-slate-600">
                            SUMMATIVE TOTAL
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black bg-slate-200">
                            {currentStudent.subjectRows.reduce((acc, r) => acc + (r.saTotal || 0), 0) || '-'}
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black bg-indigo-100 text-indigo-950">
                            {currentStudent.summary.totalObtained}
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black">
                            {currentStudent.summary.percentage}%
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black text-[10px]">
                            {currentStudent.summary.grade}
                          </td>
                          <td className="border-l border-[#0b1a33]/40 text-center font-black">
                            {currentStudent.summary.gpa}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex border border-[#0b1a33] rounded overflow-hidden mb-2 bg-white text-center text-[9px]">
                    <div className="flex-1 py-1 px-1.5 border-r border-slate-300">
                      <span className="block text-[7px] font-bold text-slate-500 uppercase">Total Marks</span>
                      <strong className="text-[11px] font-black text-[#0b1a33]">
                        {currentStudent.summary.totalObtained} / {currentStudent.summary.totalMax}
                      </strong>
                    </div>
                    <div className="flex-1 py-1 px-1.5 border-r border-slate-300">
                      <span className="block text-[7px] font-bold text-slate-500 uppercase">Percentage</span>
                      <strong className="text-[11px] font-black text-[#0b1a33]">
                        {currentStudent.summary.percentage}%
                      </strong>
                    </div>
                    <div className="flex-1 py-1 px-1.5 border-r border-slate-300">
                      <span className="block text-[7px] font-bold text-slate-500 uppercase">Cumulative Grade</span>
                      <strong className="text-[11px] font-black text-indigo-950">
                        {currentStudent.summary.grade}
                      </strong>
                    </div>
                    <div className="flex-1 py-1 px-1.5 border-r border-slate-300">
                      <span className="block text-[7px] font-bold text-slate-500 uppercase">Class Rank</span>
                      <strong className="text-[11px] font-black text-amber-700">
                        #{currentStudent.summary.rank}
                      </strong>
                    </div>
                    <div className="flex-1 py-1 px-1.5 bg-emerald-50">
                      <span className="block text-[7px] font-bold text-emerald-800 uppercase">Result Status</span>
                      <strong className="text-[10px] font-black text-emerald-800">
                        {currentStudent.summary.result}
                      </strong>
                    </div>
                  </div>

                  {/* PART II: Co-Scholastic & Attendance & CCE Scale */}
                  <div className="flex gap-2.5 mb-2">
                    {/* Left: Co-Scholastic & Attendance */}
                    <div className="flex-[1.1]">
                      <div className="bg-slate-200 text-[#0b1a33] text-[8px] font-black px-2 py-0.5 border-l-4 border-[#0b1a33] uppercase tracking-wider mb-1">
                        PART II : CO-SCHOLASTIC AREAS &amp; ATTENDANCE
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[8px]">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 px-2 text-slate-600">Days Attended / Working Days</td>
                            <td className="py-0.5 px-2 text-right font-bold text-[#0b1a33]">
                              {currentStudent.attendance.presentDays} / {currentStudent.attendance.totalDays} ({currentStudent.attendance.percentage}%)
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 px-2 text-slate-600">Life Skills &amp; Value Education</td>
                            <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A+ (Exemplary)</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 px-2 text-slate-600">Art &amp; Cultural Education</td>
                            <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A (Proficient)</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 px-2 text-slate-600">Work &amp; Computer Literacy</td>
                            <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A+ (Exemplary)</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-0.5 px-2 text-slate-600">Physical &amp; Health Education</td>
                            <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A (Proficient)</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-2 text-slate-600">General Conduct &amp; Character</td>
                            <td className="py-0.5 px-2 text-right font-black text-[#0b1a33]">EXCELLENT</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right: CCE Scale Legend */}
                    <div className="flex-[0.9]">
                      <div className="bg-slate-200 text-[#0b1a33] text-[8px] font-black px-2 py-0.5 border-l-4 border-[#0b1a33] uppercase tracking-wider mb-1">
                        CCE GRADING SCALE (REFERENCE)
                      </div>
                      <table className="w-full border-collapse border border-slate-300 text-[7.5px] text-center">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-[#0b1a33]">
                            <th className="py-0.5 px-1 border border-slate-300">MARKS %</th>
                            <th className="py-0.5 px-1 border border-slate-300">GRADE</th>
                            <th className="py-0.5 px-1 border border-slate-300">POINT</th>
                            <th className="py-0.5 px-1 border border-slate-300">REMARKS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200"><td>91% - 100%</td><td className="font-bold">A1</td><td>10</td><td>Outstanding</td></tr>
                          <tr className="border-b border-slate-200"><td>81% - 90%</td><td className="font-bold">A2</td><td>9</td><td>Excellent</td></tr>
                          <tr className="border-b border-slate-200"><td>71% - 80%</td><td className="font-bold">B1</td><td>8</td><td>Very Good</td></tr>
                          <tr className="border-b border-slate-200"><td>61% - 70%</td><td className="font-bold">B2</td><td>7</td><td>Good</td></tr>
                          <tr className="border-b border-slate-200"><td>51% - 60%</td><td className="font-bold">C1</td><td>6</td><td>Above Avg</td></tr>
                          <tr className="border-b border-slate-200"><td>41% - 50%</td><td className="font-bold">C2</td><td>5</td><td>Average</td></tr>
                          <tr className="border-b border-slate-200"><td>35% - 40%</td><td className="font-bold">D</td><td>4</td><td>Pass</td></tr>
                          <tr><td>Below 35%</td><td className="font-bold text-rose-700">E</td><td>3</td><td className="text-rose-700">Needs Imp</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="flex justify-between items-end pt-3 border-t border-dashed border-slate-300 text-center font-sans">
                    <div className="w-36">
                      <div className="h-9"></div>
                      <div className="border-b border-[#0b1a33] mb-1"></div>
                      <div className="text-[8.5px] font-black uppercase text-[#0b1a33]">
                        PARENT / GUARDIAN
                      </div>
                    </div>

                    <div className="w-36">
                      <div className="h-9 flex items-center justify-center">
                        {schoolInfo.teacherSignatureUrl && (
                          <img
                            src={getPhotoUrl(schoolInfo.teacherSignatureUrl)}
                            alt="Teacher Signature"
                            className="max-h-9 max-w-28 object-contain"
                          />
                        )}
                      </div>
                      <div className="border-b border-[#0b1a33] mb-1"></div>
                      <div className="text-[8.5px] font-black uppercase text-[#0b1a33]">
                        CLASS TEACHER
                      </div>
                    </div>

                    <div className="w-40">
                      <div className="h-9 flex items-center justify-center">
                        {schoolInfo.principalSignatureUrl && (
                          <img
                            src={getPhotoUrl(schoolInfo.principalSignatureUrl)}
                            alt="Principal Signature"
                            className="max-h-9 max-w-32 object-contain"
                          />
                        )}
                      </div>
                      <div className="border-b-2 border-[#0b1a33] mb-1"></div>
                      <div className="text-[8.5px] font-black uppercase text-[#0b1a33]">
                        HEADMASTER / PRINCIPAL
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AcademicProgressCardPage;
