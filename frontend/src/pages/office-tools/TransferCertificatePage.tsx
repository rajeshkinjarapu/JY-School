import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  CheckCircle2,
  FileText,
  Scale,
  UserCheck,
  BookOpen,
  SlidersHorizontal,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { api } from '../../api/axios';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  type AcademicHistoryRow,
  type DocumentKind,
  type SchoolCertSettings,
  TC_THEMES,
  type TcPayload,
  buildAcademicRowsForClass,
  buildDocumentCss,
  dobToWords,
  formatDateDdMmYyyy,
  generateDocumentInnerHtml,
  getClassInWords,
  getNextClassLabel,
  getPaperDimensions,
  isRecordSheetClass,
} from './tcTemplates';

interface StudentRecord {
  id: string;
  rollNo?: string;
  dob?: string;
  gender?: string;
  admissionDate?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  aadharNo?: string;
  penNumber?: string;
  childId?: string;
  apaarId?: string;
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
    section?: string;
  };
}

type DocModePreference = 'AUTO' | 'TC_LEGAL' | 'RECORD_SHEET_A4';
type StudioTab = 'CLASS' | 'PUPIL' | 'ACADEMIC';

const REASON_PRESETS = [
  'Completed Course / Passed Annual Examination',
  'Parent Transfer / Family Relocation',
  'Admission to Higher Studies / Junior College',
  'Parent Request / Personal Reasons',
];

export const TransferCertificatePage: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [docPref, setDocPref] = useState<DocModePreference>('AUTO');
  const [activeTab, setActiveTab] = useState<StudioTab>('CLASS');
  const [themeId, setThemeId] = useState<string>('navy');

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<StudentRecord[]>([]);
  const [classSubjectsText, setClassSubjectsText] = useState<string>(
    'Telugu, Hindi, English, Mathematics, General Science, Social Studies'
  );
  const [classesLoading, setClassesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState<SchoolCertSettings>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(Recognized by Govt. of Andhra Pradesh | IIT-JEE & NEET Foundation)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
    logoUrl: '/logo.png',
  });

  // Visibility Toggles
  const [showPhoto, setShowPhoto] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showSealBox, setShowSealBox] = useState(true);

  // Institutional Codes
  const [rcNumber, setRcNumber] = useState('Rc. No. 281125100013 / Visakhapatnam / 2025');
  const [udiseCode, setUdiseCode] = useState('281125100013');
  const [schoolCode, setSchoolCode] = useState('57012');
  const [affiliationNo, setAffiliationNo] = useState('AP-RECOG-2025');
  const [place, setPlace] = useState('Narasannapeta');

  // Student Selection & Editable Fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const todayFormatted = useMemo(() => formatDateDdMmYyyy(new Date().toISOString()), []);

  const [tcNo, setTcNo] = useState('TC/2026-27/001');
  const [bookNo, setBookNo] = useState('BK-2026-01');
  const [admissionNo, setAdmissionNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [dobFigures, setDobFigures] = useState('');
  const [dobWords, setDobWords] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [religionCaste, setReligionCaste] = useState('Hindu / General');
  const [motherTongue, setMotherTongue] = useState('Telugu');
  const [penNumber, setPenNumber] = useState('');
  const [childId, setChildId] = useState('');
  const [apaarId, setApaarId] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [dateOfAdmission, setDateOfAdmission] = useState('');
  const [classAtAdmission, setClassAtAdmission] = useState('Nursery');
  const [lastClassStudied, setLastClassStudied] = useState('');
  const [lastClassInWords, setLastClassInWords] = useState('');
  const [medium, setMedium] = useState('English Medium');
  const [firstLanguage, setFirstLanguage] = useState('English');
  const [secondLanguage, setSecondLanguage] = useState('Telugu');
  const [thirdLanguage, setThirdLanguage] = useState('Hindi');
  const [subjectsOffered, setSubjectsOffered] = useState(
    'Telugu, Hindi, English, Mathematics, General Science, Social Studies'
  );
  const [examResult, setExamResult] = useState('Passed Annual Examination');
  const [qualifiedForPromotion, setQualifiedForPromotion] = useState('Yes');
  const [promotedToClass, setPromotedToClass] = useState('');
  const [feesPaid, setFeesPaid] = useState('Yes, Paid in Full (No Dues)');
  const [feeConcession, setFeeConcession] = useState('No');
  const [workingDays, setWorkingDays] = useState('220');
  const [attendedDays, setAttendedDays] = useState('208');
  const [lastAttendanceDate, setLastAttendanceDate] = useState(todayFormatted);
  const [idMark1, setIdMark1] = useState('A mole on the right cheek');
  const [idMark2, setIdMark2] = useState('A small scar on the left forearm');
  const [applicationDate, setApplicationDate] = useState(todayFormatted);
  const [issueDate, setIssueDate] = useState(todayFormatted);
  const [conduct, setConduct] = useState('Good & Satisfactory');
  const [reasonForLeaving, setReasonForLeaving] = useState(REASON_PRESETS[0]);
  const [remarks, setRemarks] = useState('Promoted & Eligible');
  const [academicRows, setAcademicRows] = useState<AcademicHistoryRow[]>([
    { year: '2026-27', className: 'V', remarks: 'Promoted' },
  ]);

  // Bulk Mode & Export State
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zoomScale, setZoomScale] = useState(0.64);

  const pdfCaptureRef = useRef<HTMLDivElement>(null);

  const selectedClassObj = useMemo(
    () => classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const autoDocKind: DocumentKind = useMemo(() => {
    const className = selectedClassObj?.name || lastClassStudied || 'VIII';
    return isRecordSheetClass(className) ? 'RECORD_SHEET_A4' : 'TC_LEGAL';
  }, [selectedClassObj, lastClassStudied]);

  const activeDocKind: DocumentKind = useMemo(() => {
    if (docPref === 'AUTO') return autoDocKind;
    return docPref;
  }, [docPref, autoDocKind]);

  const activePaper = useMemo(() => getPaperDimensions(activeDocKind), [activeDocKind]);

  const activeTheme = useMemo(
    () => TC_THEMES.find(t => t.id === themeId) || TC_THEMES[0],
    [themeId]
  );

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await api.get('/api/settings').catch(() => null);
        const s = res?.data?.data || res?.data;
        if (s) {
          setSchoolSettings({
            schoolName: s.schoolName || 'SRI VENKATESWARA JY SCHOOL',
            schoolSubtitle: s.schoolSubtitle || '(Recognized by Govt. of Andhra Pradesh | IIT-JEE & NEET Foundation)',
            address: s.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
            logoUrl: s.logoUrl || '/logo.png',
            principalSignatureUrl: s.principalSignatureUrl,
          });
        }
      } catch {}

      const savedUdise = localStorage.getItem('tc_udise_code');
      if (savedUdise) setUdiseCode(savedUdise);
      const savedRc = localStorage.getItem('tc_rc_number');
      if (savedRc) setRcNumber(savedRc);
      const savedPlace = localStorage.getItem('tc_place');
      if (savedPlace) setPlace(savedPlace);
      const savedSchoolCode = localStorage.getItem('tc_school_code');
      if (savedSchoolCode) setSchoolCode(savedSchoolCode);

      setClassesLoading(true);
      try {
        const clsRes = await api.get('/api/classes?limit=1000');
        const list = clsRes.data?.data || clsRes.data || [];
        setClasses(list);
        if (list.length > 0) setSelectedClassId(list[0].id);
      } catch {
        toast.error('Failed to load classes');
      } finally {
        setClassesLoading(false);
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    if (udiseCode) localStorage.setItem('tc_udise_code', udiseCode);
    if (rcNumber) localStorage.setItem('tc_rc_number', rcNumber);
    if (place) localStorage.setItem('tc_place', place);
    if (schoolCode) localStorage.setItem('tc_school_code', schoolCode);
  }, [udiseCode, rcNumber, place, schoolCode]);

  const applyStudentToForm = (s: StudentRecord, idx = 1, clsNameOverride?: string) => {
    const clsName = clsNameOverride || s.class?.name || selectedClassObj?.name || 'VIII';
    const isRs = isRecordSheetClass(clsName);
    const dobFormatted = formatDateDdMmYyyy(s.dob);
    const computedWords = dobToWords(dobFormatted);
    const nextCls = getNextClassLabel(clsName);

    setSelectedStudentId(s.id);
    setStudentName(s.user?.name || s.name || '');
    setGender((s.gender || 'MALE').toUpperCase());
    setAdmissionNo(s.rollNo || '');
    setFatherName(s.fatherName || '');
    setMotherName(s.motherName || '');
    setGuardianName(s.guardianName || '');
    setDobFigures(dobFormatted);
    setDobWords(computedWords);
    setPenNumber(s.penNumber || '');
    setChildId(s.childId || '');
    setApaarId(s.apaarId || '');
    setAadharNo(s.aadharNo || '');
    setPhotoUrl(s.user?.photoUrl || '');
    setDateOfAdmission(formatDateDdMmYyyy(s.admissionDate) || todayFormatted);
    setLastClassStudied(clsName);
    setLastClassInWords(getClassInWords(clsName));
    setPromotedToClass(nextCls);
    setClassAtAdmission(isRs ? 'Nursery' : 'VI');
    setTcNo(`${isRs ? 'RS' : 'TC'}/2026-27/${String(idx).padStart(3, '0')}`);
    setAcademicRows(buildAcademicRowsForClass(clsName));
  };

  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      setBulkSelectedIds([]);
      return;
    }

    const loadClassData = async () => {
      setStudentsLoading(true);
      const clsObj = classes.find(c => c.id === selectedClassId);
      const clsName = clsObj?.name || 'VIII';
      try {
        const [studRes, subRes] = await Promise.all([
          api.get(`/api/classes/${selectedClassId}/students?includePhoto=true`),
          api.get(`/api/classes/${selectedClassId}/subjects`).catch(() => null),
        ]);

        const list: StudentRecord[] = studRes.data?.data || studRes.data || [];
        setClassStudents(list);
        setBulkSelectedIds(list.map(x => x.id));
        setBulkPreviewIndex(0);

        const subsList = subRes?.data?.data || subRes?.data || [];
        if (Array.isArray(subsList) && subsList.length > 0) {
          const joined = subsList.map((sb: any) => sb.name).filter(Boolean).join(', ');
          if (joined) {
            setClassSubjectsText(joined);
            setSubjectsOffered(joined);
          }
        }

        if (list.length > 0) {
          applyStudentToForm(list[0], 1, clsName);
        } else {
          setSelectedStudentId('');
          setLastClassStudied(clsName);
          setLastClassInWords(getClassInWords(clsName));
          setPromotedToClass(getNextClassLabel(clsName));
          setAcademicRows(buildAcademicRowsForClass(clsName));
        }
      } catch {
        toast.error('Failed to load class students');
      } finally {
        setStudentsLoading(false);
      }
    };

    loadClassData();
  }, [selectedClassId]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return classStudents;
    return classStudents.filter(
      s =>
        (s.user?.name || s.name || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.penNumber || '').toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const classStats = useMemo(() => {
    const total = classStudents.length;
    const ready = classStudents.filter(s => Boolean(s.fatherName && s.dob)).length;
    const missing = total - ready;
    const govReady = classStudents.filter(s => Boolean(s.penNumber || s.childId || s.apaarId)).length;
    return { total, ready, missing, govReady };
  }, [classStudents]);

  const buildPayloadForStudent = (s?: StudentRecord, idx = 1): TcPayload => {
    const clsName = (mode === 'single' ? lastClassStudied : s?.class?.name || selectedClassObj?.name || 'VIII');
    const isRs = activeDocKind === 'RECORD_SHEET_A4';
    const rawDob = mode === 'single' ? dobFigures : formatDateDdMmYyyy(s?.dob);
    const wordsDob = mode === 'single' ? dobWords || dobToWords(rawDob) : dobToWords(rawDob);

    return {
      docKind: activeDocKind,
      tcNo: mode === 'single' ? tcNo : `${isRs ? 'RS' : 'TC'}/2026-27/${String(idx).padStart(3, '0')}`,
      bookNo,
      admissionNo: mode === 'single' ? admissionNo : s?.rollNo || '—',
      studentName: mode === 'single' ? studentName : s?.user?.name || s?.name || 'STUDENT NAME',
      gender: mode === 'single' ? gender : (s?.gender || 'MALE').toUpperCase(),
      fatherName: mode === 'single' ? fatherName : s?.fatherName || '',
      motherName: mode === 'single' ? motherName : s?.motherName || '',
      guardianName: mode === 'single' ? guardianName : s?.guardianName || '',
      dobFigures: rawDob,
      dobWords: wordsDob,
      nationality,
      religionCaste,
      motherTongue,
      penNumber: mode === 'single' ? penNumber : s?.penNumber || '',
      childId: mode === 'single' ? childId : s?.childId || '',
      apaarId: mode === 'single' ? apaarId : s?.apaarId || '',
      aadharNo: mode === 'single' ? aadharNo : s?.aadharNo || '',
      dateOfAdmission: mode === 'single' ? dateOfAdmission : formatDateDdMmYyyy(s?.admissionDate) || todayFormatted,
      classAtAdmission,
      lastClassStudied: clsName,
      lastClassInWords: mode === 'single' ? lastClassInWords || getClassInWords(clsName) : getClassInWords(clsName),
      medium,
      firstLanguage,
      secondLanguage,
      thirdLanguage,
      subjectsOffered: mode === 'single' ? subjectsOffered : classSubjectsText,
      examResult,
      qualifiedForPromotion,
      promotedToClass: mode === 'single' ? promotedToClass || getNextClassLabel(clsName) : getNextClassLabel(clsName),
      feesPaid,
      feeConcession,
      workingDays,
      attendedDays,
      lastAttendanceDate,
      idMark1: mode === 'single' ? idMark1 : 'As per school admission register',
      idMark2: mode === 'single' ? idMark2 : '—',
      applicationDate,
      issueDate,
      conduct,
      reasonForLeaving,
      remarks,
      photoUrl: mode === 'single' ? photoUrl : s?.user?.photoUrl || '',
      udiseCode,
      schoolCode,
      affiliationNo,
      rcNumber,
      place,
      academicRows,
    };
  };

  const renderOptions = {
    showPhoto,
    showSignature,
    showQr,
    showAadhaar,
    showSealBox,
  };

  const currentPreviewPayload = useMemo(() => {
    if (mode === 'single') {
      return buildPayloadForStudent(undefined, 1);
    }
    const targetList = classStudents.filter(s => bulkSelectedIds.includes(s.id));
    const idx = Math.min(bulkPreviewIndex, Math.max(0, targetList.length - 1));
    return buildPayloadForStudent(targetList[idx], idx + 1);
  }, [
    mode, activeDocKind, tcNo, bookNo, admissionNo, studentName, gender, fatherName, motherName,
    guardianName, dobFigures, dobWords, nationality, religionCaste, motherTongue, penNumber,
    childId, apaarId, aadharNo, photoUrl, dateOfAdmission, classAtAdmission, lastClassStudied,
    lastClassInWords, medium, firstLanguage, secondLanguage, thirdLanguage, subjectsOffered,
    examResult, qualifiedForPromotion, promotedToClass, feesPaid, feeConcession, workingDays,
    attendedDays, lastAttendanceDate, idMark1, idMark2, applicationDate, issueDate, conduct,
    reasonForLeaving, remarks, udiseCode, schoolCode, affiliationNo, rcNumber, place,
    academicRows, classStudents, bulkSelectedIds, bulkPreviewIndex, selectedClassObj, classSubjectsText,
  ]);

  const currentPreviewHtml = useMemo(() => {
    const css = buildDocumentCss(activeTheme, activeDocKind);
    const body = generateDocumentInnerHtml(currentPreviewPayload, schoolSettings, activeTheme, renderOptions);
    return `<style>${css}</style>${body}`;
  }, [currentPreviewPayload, schoolSettings, activeTheme, activeDocKind, showPhoto, showSignature, showQr, showAadhaar, showSealBox]);

  const printDocumentsIframe = (payloads: TcPayload[]) => {
    if (!payloads.length) {
      toast.error('Nothing to print');
      return;
    }

    const css = buildDocumentCss(activeTheme, activeDocKind);
    const pageCssSize =
      activeDocKind === 'TC_LEGAL' ? '215.9mm 355.6mm' : 'A4 portrait';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;top:0;left:0;width:${activePaper.widthMm}mm;height:${activePaper.heightMm}mm;border:0;opacity:0;pointer-events:none;z-index:-9999;`;
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${activeDocKind === 'TC_LEGAL' ? 'Transfer Certificates' : 'Record Sheets'} - ${schoolSettings.schoolName}</title>
  <style>
    @page { size: ${pageCssSize}; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .doc-sheet { page-break-after: always; }
    .doc-sheet:last-child { page-break-after: avoid; }
    ${css}
  </style>
</head>
<body>
  ${payloads.map(p => generateDocumentInnerHtml(p, schoolSettings, activeTheme, renderOptions)).join('')}
</body>
</html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1200);
      }
    }, 550);
  };

  const handlePrintCurrent = () => {
    if (mode === 'single' && !studentName.trim()) {
      toast.error('Please enter or select student name');
      return;
    }
    printDocumentsIframe([currentPreviewPayload]);
  };

  const handlePrintBulk = () => {
    const selected = classStudents.filter(s => bulkSelectedIds.includes(s.id));
    if (!selected.length) {
      toast.error('Select at least one student');
      return;
    }
    printDocumentsIframe(selected.map((s, i) => buildPayloadForStudent(s, i + 1)));
  };

  const handleDownloadPdf = async () => {
    if (!pdfCaptureRef.current) return;
    if (!studentName.trim()) {
      toast.error('Please enter or select student name');
      return;
    }

    setIsExporting(true);
    try {
      const node = pdfCaptureRef.current.querySelector('.doc-sheet') as HTMLElement || pdfCaptureRef.current;
      const dataUrl = await toJpeg(node, {
        quality: 0.96,
        pixelRatio: 2.5,
        backgroundColor: activeTheme.bg,
        cacheBust: true,
      });

      const isLegal = activeDocKind === 'TC_LEGAL';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isLegal ? [215.9, 355.6] : 'a4',
      });
      pdf.addImage(dataUrl, 'JPEG', 0, 0, activePaper.widthMm, activePaper.heightMm, undefined, 'FAST');
      const prefix = isLegal ? 'TC_Legal' : 'RecordSheet_A4';
      pdf.save(`${prefix}_${(studentName || 'Student').replace(/\s+/g, '_')}.pdf`);
      toast.success(`${isLegal ? 'Legal TC' : 'A4 Record Sheet'} PDF downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed. Try Print → Save as PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBulkZip = async () => {
    const selected = classStudents.filter(s => bulkSelectedIds.includes(s.id));
    if (!selected.length) {
      toast.error('Select at least one student');
      return;
    }

    setIsZipping(true);
    const toastId = toast.loading(`Generating ${selected.length} PDFs...`);
    try {
      const zip = new JSZip();
      const folderName = activeDocKind === 'TC_LEGAL' ? 'Transfer_Certificates_Legal' : 'Record_Sheets_A4';
      const folder = zip.folder(folderName);
      const css = buildDocumentCss(activeTheme, activeDocKind);

      const container = document.createElement('div');
      container.style.cssText = `position:fixed;left:-99999px;top:0;width:${activePaper.widthMm}mm;height:${activePaper.heightMm}mm;z-index:-1;pointer-events:none;`;
      document.body.appendChild(container);

      for (let i = 0; i < selected.length; i++) {
        const payload = buildPayloadForStudent(selected[i], i + 1);
        toast.loading(`Rendering ${i + 1}/${selected.length}: ${payload.studentName}`, { id: toastId });
        container.innerHTML = `<style>${css}</style>${generateDocumentInnerHtml(payload, schoolSettings, activeTheme, renderOptions)}`;
        await new Promise(r => setTimeout(r, 150));

        const node = (container.querySelector('.doc-sheet') as HTMLElement) || container;
        const dataUrl = await toJpeg(node, {
          quality: 0.94,
          pixelRatio: 2,
          backgroundColor: activeTheme.bg,
          cacheBust: true,
        });

        const isLegal = activeDocKind === 'TC_LEGAL';
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: isLegal ? [215.9, 355.6] : 'a4',
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, activePaper.widthMm, activePaper.heightMm, undefined, 'FAST');
        const safeName = (payload.studentName || `Student_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        folder?.file(`${payload.admissionNo || i + 1}_${safeName}.pdf`, pdf.output('blob'));
      }

      document.body.removeChild(container);
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${folderName}_${selectedClassObj?.name || 'Class'}.zip`);
      toast.success('ZIP exported successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export bulk ZIP', { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  if (classesLoading && classes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-[#F4F7FC]">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-slate-600 font-bold text-sm">Loading Transfer Certificate &amp; Record Sheet Studio...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FC] min-h-screen">
      <PageHeader
        title="Transfer Certificate & Record Sheet Studio"
        icon={<FileSpreadsheet className="w-5 h-5 text-white" />}
        action={
          <Link
            to="/office-tools"
            className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Office Tools</span>
          </Link>
        }
      />

      {/* Light Pastel ERP KPI Analytics Strip */}
      <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-w-[1680px] w-full mx-auto">
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Class Strength</p>
            <p className="text-xl font-black text-slate-800">{classStats.total} Pupils</p>
            <p className="text-[11px] font-bold text-indigo-600 truncate">
              {selectedClassObj ? `${selectedClassObj.name} ${selectedClassObj.section || ''}` : 'Select Class'} · {classStats.govReady} PEN/APAAR
            </p>
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Father / DOB Ready</p>
            <p className="text-xl font-black text-emerald-700">{classStats.ready} / {classStats.total}</p>
            <p className="text-[11px] font-bold text-emerald-600">Register verified profiles</p>
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Incomplete Profiles</p>
            <p className="text-xl font-black text-amber-700">{classStats.missing}</p>
            <p className="text-[11px] font-bold text-amber-600">Editable live on left panel</p>
          </div>
        </div>

        <div className="bg-white border border-violet-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Document &amp; Paper</p>
            <p className="text-sm font-black text-violet-800 truncate">
              {activeDocKind === 'RECORD_SHEET_A4' ? 'Record Sheet (A4)' : 'Transfer Certificate (Legal)'}
            </p>
            <p className="text-[11px] font-bold text-violet-600">
              {activeDocKind === 'RECORD_SHEET_A4' ? 'Nur–V Rule · 210 × 297 mm' : 'VI–X Rule · 215.9 × 355.6 mm'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 max-w-[1680px] w-full mx-auto flex flex-col xl:flex-row gap-5">
        {/* LEFT CONTROL PANEL */}
        <div className="w-full xl:w-[445px] shrink-0 bg-white border border-indigo-100 rounded-[24px] shadow-sm flex flex-col overflow-hidden xl:max-h-[calc(100vh-195px)]">
          {/* Top Mode & Tab Strip */}
          <div className="p-4 border-b border-slate-100 bg-[#F8FAFF] space-y-3">
            <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-indigo-100">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  mode === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Single Student
              </button>
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  mode === 'bulk' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bulk Class ({bulkSelectedIds.length})
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['CLASS', 'Class & Setup', SlidersHorizontal],
                  ['PUPIL', 'Pupil & IDs', UserCheck],
                  ['ACADEMIC', 'TC / Marks', BookOpen],
                ] as const
              ).map(([tabKey, label, Icon]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    activeTab === tabKey
                      ? 'bg-white text-indigo-700 border-indigo-300 shadow-xs ring-2 ring-indigo-100'
                      : 'bg-white/60 text-slate-500 border-slate-200 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'CLASS' && (
              <>
                {/* Class Dropdown */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
                    Target Class &amp; Section
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full bg-[#F8FAFF] border border-indigo-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- Section ${c.section}` : ''} ({isRecordSheetClass(c.name) ? 'Nur–V: Record Sheet A4' : 'VI–X: Legal TC'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Smart Auto-Format & Paper Rule */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFF] border border-indigo-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">
                      Document &amp; Paper Rule
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                      {autoDocKind === 'RECORD_SHEET_A4' ? 'Auto: Record Sheet' : 'Auto: Legal TC'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10.5px] font-extrabold">
                    {(
                      [
                        ['AUTO', 'Auto by Class'],
                        ['RECORD_SHEET_A4', 'Record Sheet (A4)'],
                        ['TC_LEGAL', 'TC (Legal)'],
                      ] as const
                    ).map(([key, lbl]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDocPref(key)}
                        className={`py-2 px-2 rounded-xl border cursor-pointer transition-all ${
                          docPref === key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] font-bold text-slate-500 leading-snug">
                    Nursery–Class V విద్యార్థులకు ఆటోమేటిక్‌గా <strong>A4 Record Sheet</strong>, మరియు Class VI–X విద్యార్థులకు <strong>Legal Transfer Certificate</strong> సిద్ధమవుతుంది.
                  </p>
                </div>

                {/* Theme & Visibility Pills */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">
                    Certificate Border Theme
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TC_THEMES.map(th => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setThemeId(th.id)}
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border flex items-center gap-1.5 cursor-pointer ${
                          themeId === th.id ? 'border-indigo-500 bg-white ring-2 ring-indigo-100 text-indigo-900' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.primary }} />
                        <span>{th.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(
                      [
                        ['Photo', showPhoto, setShowPhoto],
                        ['Principal Sign', showSignature, setShowSignature],
                        ['QR Verify', showQr, setShowQr],
                        ['Aadhaar', showAadhaar, setShowAadhaar],
                        ['Seal Box', showSealBox, setShowSealBox],
                      ] as const
                    ).map(([lbl, val, setter]) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setter(!val)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border cursor-pointer ${
                          val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {val ? '✓ ' : ''}{lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single Student Selector OR Bulk Checklist */}
                {studentsLoading ? (
                  <div className="py-6 text-center text-xs font-bold text-slate-400">Loading students...</div>
                ) : mode === 'single' ? (
                  <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-indigo-950">Select Pupil from Register</span>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-indigo-100 text-indigo-700">
                        {classStudents.length} Pupils
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, roll no, PEN..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <select
                      value={selectedStudentId}
                      onChange={e => {
                        const idx = classStudents.findIndex(st => st.id === e.target.value);
                        if (idx >= 0) applyStudentToForm(classStudents[idx], idx + 1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                    >
                      <option value="">Choose student...</option>
                      {filteredStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.user?.name || s.name} · {s.rollNo || 'No Roll'}
                        </option>
                      ))}
                    </select>

                    {(!fatherName.trim() || !dobFigures.trim()) && selectedStudentId && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Father Name or Date of Birth missing in database. Switch to <strong>Pupil &amp; IDs</strong> tab to fill it before printing.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-violet-950">
                      <span>Selected: {bulkSelectedIds.length} / {classStudents.length}</span>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setBulkSelectedIds(classStudents.map(s => s.id))} className="px-2 py-0.5 bg-white rounded border text-indigo-600 cursor-pointer">All</button>
                        <button type="button" onClick={() => setBulkSelectedIds([])} className="px-2 py-0.5 bg-white rounded border text-slate-600 cursor-pointer">None</button>
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {classStudents.map(s => {
                        const checked = bulkSelectedIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => setBulkSelectedIds(prev => (checked ? prev.filter(x => x !== s.id) : [...prev, s.id]))}
                            className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50"
                          >
                            {checked ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                            <span className="font-bold text-slate-800 truncate">{s.user?.name || s.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 ml-auto">{s.rollNo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Institutional Codes */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">UDISE Code</label>
                    <input type="text" value={udiseCode} onChange={e => setUdiseCode(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">School Code</label>
                    <input type="text" value={schoolCode} onChange={e => setSchoolCode(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Recognition / Rc. No.</label>
                    <input type="text" value={rcNumber} onChange={e => setRcNumber(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Affiliation / Board Code</label>
                    <input type="text" value={affiliationNo} onChange={e => setAffiliationNo(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Place</label>
                    <input type="text" value={place} onChange={e => setPlace(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'PUPIL' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Student Full Name (Block Letters)</label>
                  <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none">
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Admission / Roll No</label>
                  <input type="text" value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Father's Name</label>
                  <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mother's Name</label>
                  <input type="text" value={motherName} onChange={e => setMotherName(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Date of Birth (DD-MM-YYYY)</label>
                  <input
                    type="text"
                    value={dobFigures}
                    onChange={e => {
                      setDobFigures(e.target.value);
                      const autoW = dobToWords(e.target.value);
                      if (autoW) setDobWords(autoW);
                    }}
                    placeholder="DD-MM-YYYY"
                    className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mother Tongue</label>
                  <input type="text" value={motherTongue} onChange={e => setMotherTongue(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Date of Birth in Words (Auto-generated)</label>
                  <input type="text" value={dobWords} onChange={e => setDobWords(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nationality</label>
                  <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Religion &amp; Caste</label>
                  <input type="text" value={religionCaste} onChange={e => setReligionCaste(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Student PEN Number</label>
                  <input type="text" value={penNumber} onChange={e => setPenNumber(e.target.value)} placeholder="UDISE+ PEN" className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Child ID (State Info)</label>
                  <input type="text" value={childId} onChange={e => setChildId(e.target.value)} placeholder="Child Info ID" className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">APAAR ID</label>
                  <input type="text" value={apaarId} onChange={e => setApaarId(e.target.value)} placeholder="12-digit APAAR" className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Student Aadhaar</label>
                  <input type="text" value={aadharNo} onChange={e => setAadharNo(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Identification Mark 1</label>
                  <input type="text" value={idMark1} onChange={e => setIdMark1(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Identification Mark 2</label>
                  <input type="text" value={idMark2} onChange={e => setIdMark2(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
              </div>
            )}

            {activeTab === 'ACADEMIC' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      {activeDocKind === 'TC_LEGAL' ? 'T.C. Serial No' : 'Record Sheet No'}
                    </label>
                    <input type="text" value={tcNo} onChange={e => setTcNo(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Book / Register No</label>
                    <input type="text" value={bookNo} onChange={e => setBookNo(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Date of Admission</label>
                    <input type="text" value={dateOfAdmission} onChange={e => setDateOfAdmission(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Class at Admission</label>
                    <input type="text" value={classAtAdmission} onChange={e => setClassAtAdmission(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Last Class Studied</label>
                    <input type="text" value={lastClassStudied} onChange={e => setLastClassStudied(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Medium</label>
                    <input type="text" value={medium} onChange={e => setMedium(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Last Class in Words</label>
                    <input type="text" value={lastClassInWords} onChange={e => setLastClassInWords(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">1st Language</label>
                    <input type="text" value={firstLanguage} onChange={e => setFirstLanguage(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">2nd / 3rd Language</label>
                    <div className="flex gap-1">
                      <input type="text" value={secondLanguage} onChange={e => setSecondLanguage(e.target.value)} className="w-1/2 px-2 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                      <input type="text" value={thirdLanguage} onChange={e => setThirdLanguage(e.target.value)} className="w-1/2 px-2 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                    </div>
                  </div>

                  {activeDocKind === 'TC_LEGAL' && (
                    <>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Subjects Offered</label>
                        <input type="text" value={subjectsOffered} onChange={e => setSubjectsOffered(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Annual Exam Taken &amp; Result</label>
                        <input type="text" value={examResult} onChange={e => setExamResult(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Fee Concession</label>
                        <input type="text" value={feeConcession} onChange={e => setFeeConcession(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Promoted To Class</label>
                    <input type="text" value={promotedToClass} onChange={e => setPromotedToClass(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Qualified for Promotion?</label>
                    <select value={qualifiedForPromotion} onChange={e => setQualifiedForPromotion(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Course Completed">Course Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">School Dues Paid</label>
                    <input type="text" value={feesPaid} onChange={e => setFeesPaid(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Working / Attended Days</label>
                    <div className="flex gap-1">
                      <input type="text" value={workingDays} onChange={e => setWorkingDays(e.target.value)} placeholder="220" className="w-1/2 px-2 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                      <input type="text" value={attendedDays} onChange={e => setAttendedDays(e.target.value)} placeholder="208" className="w-1/2 px-2 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Last Attendance Date</label>
                    <input type="text" value={lastAttendanceDate} onChange={e => setLastAttendanceDate(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Application Date</label>
                    <input type="text" value={applicationDate} onChange={e => setApplicationDate(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Issue Date</label>
                    <input type="text" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">General Conduct</label>
                    <input type="text" value={conduct} onChange={e => setConduct(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Reason for Leaving</label>
                    <select value={REASON_PRESETS.includes(reasonForLeaving) ? reasonForLeaving : '__CUSTOM__'} onChange={e => e.target.value !== '__CUSTOM__' && setReasonForLeaving(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none mb-1.5">
                      {REASON_PRESETS.map(rp => (
                        <option key={rp} value={rp}>{rp}</option>
                      ))}
                      <option value="__CUSTOM__">Custom Reason...</option>
                    </select>
                    <input type="text" value={reasonForLeaving} onChange={e => setReasonForLeaving(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">General Remarks</label>
                    <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                </div>

                {activeDocKind === 'RECORD_SHEET_A4' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10.5px] font-black uppercase text-slate-600">Study History (Record Sheet)</h4>
                      <button
                        type="button"
                        onClick={() => setAcademicRows(prev => [...prev, { year: '2026-27', className: 'V', remarks: 'Promoted' }])}
                        className="text-xs font-extrabold text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>
                    {academicRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-[#F8FAFF] p-1.5 rounded-xl border border-indigo-100">
                        <input type="text" value={row.year} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, year: e.target.value } : r)))} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                        <input type="text" value={row.className} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, className: e.target.value } : r)))} className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                        <input type="text" value={row.remarks} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, remarks: e.target.value } : r)))} className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                        <button type="button" disabled={academicRows.length <= 1} onClick={() => setAcademicRows(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-rose-500 disabled:opacity-30 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT LIVE PREVIEW */}
        <div className="flex-1 bg-[#EAEFF8] rounded-[24px] border border-indigo-100 flex flex-col overflow-hidden min-h-[680px] xl:max-h-[calc(100vh-195px)]">
          <div className="bg-white border-b border-indigo-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-900 uppercase">
                {activeDocKind === 'TC_LEGAL' ? 'Transfer Certificate · Legal' : 'Record Sheet · A4'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  activeDocKind === 'TC_LEGAL'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {activePaper.label}
              </span>
            </div>

            {mode === 'bulk' && bulkSelectedIds.length > 0 && (
              <div className="flex items-center bg-[#F4F7FC] rounded-xl p-0.5 border border-slate-200 text-xs font-black">
                <button type="button" onClick={() => setBulkPreviewIndex(p => Math.max(0, p - 1))} disabled={bulkPreviewIndex === 0} className="p-1.5 disabled:opacity-30 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2">{bulkPreviewIndex + 1} / {bulkSelectedIds.length}</span>
                <button type="button" onClick={() => setBulkPreviewIndex(p => Math.min(bulkSelectedIds.length - 1, p + 1))} disabled={bulkPreviewIndex >= bulkSelectedIds.length - 1} className="p-1.5 disabled:opacity-30 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#F4F7FC] rounded-xl px-1.5 py-0.5 border border-slate-200">
                <button type="button" onClick={() => setZoomScale(s => Math.max(0.4, Number((s - 0.08).toFixed(2))))} className="p-1 text-slate-600 cursor-pointer">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-black text-indigo-600 px-1.5">{Math.round(zoomScale * 100)}%</span>
                <button type="button" onClick={() => setZoomScale(s => Math.min(1.1, Number((s + 0.08).toFixed(2))))} className="p-1 text-slate-600 cursor-pointer">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setZoomScale(0.64)} title="Reset zoom" className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {mode === 'single' ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrintCurrent}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print {activeDocKind === 'TC_LEGAL' ? 'Legal' : 'A4'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Download PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePrintBulk}
                    disabled={bulkSelectedIds.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All ({bulkSelectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBulkZip}
                    disabled={isZipping || bulkSelectedIds.length === 0}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isZipping ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
                    <span>ZIP ({bulkSelectedIds.length} PDFs)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
            <div
              style={{
                width: `${activePaper.widthMm * zoomScale}mm`,
                height: `${activePaper.heightMm * zoomScale}mm`,
              }}
              className="relative shrink-0"
            >
              <div
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top left' }}
                className="shadow-2xl"
                dangerouslySetInnerHTML={{ __html: currentPreviewHtml }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen Unscaled 1:1 Surface for Razor-Sharp PDF Export */}
      <div
        ref={pdfCaptureRef}
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: `${activePaper.widthMm}mm`,
          height: `${activePaper.heightMm}mm`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        dangerouslySetInnerHTML={{ __html: currentPreviewHtml }}
      />
    </div>
  );
};

export default TransferCertificatePage;
