import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GraduationCap,
  FileText,
  Database,
  CheckSquare,
  Square,
  Search,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Building,
  User,
  Award,
  Eye,
  SlidersHorizontal,
  AlertTriangle,
  RefreshCw,
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
  gender?: string;
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

interface CertTheme {
  id: string;
  name: string;
  primary: string;
  gold: string;
  bg: string;
}

const CERT_THEMES: CertTheme[] = [
  { id: 'navy', name: 'Royal Navy & Gold', primary: '#0b1a33', gold: '#b45309', bg: '#FDFBF7' },
  { id: 'maroon', name: 'Heritage Maroon', primary: '#5c1122', gold: '#c59b27', bg: '#FFFDF9' },
  { id: 'emerald', name: 'Campus Emerald', primary: '#064e3b', gold: '#b45309', bg: '#FAFCFB' },
];

const CLASS_SEQUENCE = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const resolveClassIndex = (rawName: string): number => {
  const s = (rawName || '').trim().toUpperCase();
  if (s.includes('NUR')) return 0;
  if (s.includes('LKG') || s.includes('PP1')) return 1;
  if (s.includes('UKG') || s.includes('PP2')) return 2;
  const digits = parseInt(s.replace(/\D/g, ''), 10);
  if (!isNaN(digits) && digits >= 1 && digits <= 12) return digits + 2;
  const romanMap: Record<string, number> = {
    I: 3, II: 4, III: 5, IV: 6, V: 7, VI: 8, VII: 9, VIII: 10, IX: 11, X: 12, XI: 13, XII: 14,
  };
  const token = s.split(/[\s-]+/).find(t => romanMap[t] !== undefined);
  return token ? romanMap[token] : 10;
};

const formatDob = (dob?: string | null) => {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return String(dob);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
};

interface CertPayload {
  certRefNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  relationPhrase: string;
  admissionNo: string;
  dob: string;
  currentClass: string;
  photoUrl?: string;
  udiseCode: string;
  conduct: string;
  purpose: string;
  place: string;
  date: string;
}

export const StudyCertificatePage: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [certType, setCertType] = useState<'STUDY_CONDUCT' | 'BONAFIDE' | 'CHARACTER'>('STUDY_CONDUCT');
  const [themeId, setThemeId] = useState<string>('navy');

  const [classesLoading, setClassesLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(Recognized by Govt. of Andhra Pradesh | IIT-JEE & NEET Foundation)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
    logoUrl: '/logo.png',
  });

  const [rcNumber, setRcNumber] = useState('Rc. No. 281125100013 / Visakhapatnam / 2025');
  const [udiseCode, setUdiseCode] = useState('281125100013');
  const [conduct, setConduct] = useState('Excellent');
  const [purpose, setPurpose] = useState('Scholarship / Higher Studies / Official Verification');
  const [place, setPlace] = useState('Narasannapeta');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });

  // Visibility options
  const [showPhoto, setShowPhoto] = useState(true);
  const [showDob, setShowDob] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showQr, setShowQr] = useState(true);

  const [academicRows, setAcademicRows] = useState<AcademicRow[]>([
    { year: '2026-27', className: 'Nursery', remarks: 'Studying' },
  ]);

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);

  // Single Mode Fields
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualFatherName, setManualFatherName] = useState('');
  const [manualMotherName, setManualMotherName] = useState('');
  const [manualRollNo, setManualRollNo] = useState('');
  const [manualDob, setManualDob] = useState('');
  const [manualGender, setManualGender] = useState('');
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');

  // Bulk Mode State
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const [zoomScale, setZoomScale] = useState(0.75);
  const pdfCaptureRef = useRef<HTMLDivElement>(null);

  const activeTheme = useMemo(
    () => CERT_THEMES.find(t => t.id === themeId) || CERT_THEMES[0],
    [themeId]
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/api/settings').catch(() => null);
        const s = res?.data?.data || res?.data;
        if (s) {
          setSchoolSettings({
            schoolName: s.schoolName || 'SRI VENKATESWARA JY SCHOOL',
            schoolSubtitle: s.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)',
            address: s.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
            logoUrl: s.logoUrl || '/logo.png',
            principalSignatureUrl: s.principalSignatureUrl,
          });
        }
      } catch {}
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

  useEffect(() => {
    if (udiseCode) localStorage.setItem('study_cert_udise', udiseCode);
    if (rcNumber) localStorage.setItem('study_cert_rc', rcNumber);
    if (place) localStorage.setItem('study_cert_place', place);
  }, [udiseCode, rcNumber, place]);

  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await api.get('/api/classes?limit=1000');
      const list = res.data?.data || res.data || [];
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].id);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  };

  // Smart Academic History Builder (Handles NUR, LKG, UKG, I..XII accurately!)
  const autoGenerateAcademicRows = (cId: string) => {
    const cls = classes.find(c => c.id === cId);
    const rawName = cls?.name || 'VIII';
    const idx = resolveClassIndex(rawName);
    const currentYearNum = new Date().getFullYear();

    const stepCount = Math.min(3, idx + 1);
    const rows: AcademicRow[] = [];
    for (let offset = stepCount - 1; offset >= 0; offset--) {
      const yearStart = currentYearNum - offset;
      rows.push({
        year: `${yearStart}-${String(yearStart + 1).slice(-2)}`,
        className: CLASS_SEQUENCE[idx - offset] || rawName,
        remarks: offset === 0 ? 'Studying' : 'Promoted',
      });
    }
    setAcademicRows(rows);
  };

  const applyStudentToSingleForm = (s: StudentItem) => {
    setSelectedStudentId(s.id);
    setManualStudentName(s.user?.name || s.name || '');
    setManualFatherName(s.fatherName || '');
    setManualMotherName(s.motherName || '');
    setManualRollNo(s.rollNo || '');
    setManualDob(formatDob(s.dob));
    setManualGender(s.gender || '');
    setManualPhotoUrl(s.user?.photoUrl || '');
  };

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
        setBulkSelectedIds(list.map(s => s.id));
        setBulkPreviewIndex(0);
        autoGenerateAcademicRows(selectedClassId);

        if (list.length > 0) {
          applyStudentToSingleForm(list[0]);
        } else {
          setSelectedStudentId('');
        }
      } catch {
        toast.error('Failed to load students for class');
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudentsForClass();
  }, [selectedClassId]);

  const handleSelectStudent = (studentId: string) => {
    const s = classStudents.find(x => x.id === studentId);
    if (s) applyStudentToSingleForm(s);
  };

  const selectedClassObj = useMemo(
    () => classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const relationFromGender = (g?: string) => {
    const upper = (g || '').toUpperCase();
    if (upper === 'MALE') return 'S/o';
    if (upper === 'FEMALE') return 'D/o';
    return 'S/o / D/o';
  };

  const buildCertPayload = (s?: StudentItem, indexNum = 1): CertPayload => {
    const yr = new Date().getFullYear();
    const clsLabel = selectedClassObj
      ? `${selectedClassObj.name}${selectedClassObj.section ? ` - ${selectedClassObj.section}` : ''}`
      : 'Class';

    if (!s && mode === 'single') {
      const roll = manualRollNo || '____________';
      return {
        certRefNo: `SC/${yr}/${roll.replace(/[^A-Z0-9-]/gi, '') || '001'}`,
        studentName: manualStudentName || '___________________________',
        fatherName: manualFatherName || '___________________________',
        motherName: manualMotherName || '',
        relationPhrase: relationFromGender(manualGender),
        admissionNo: roll,
        dob: manualDob || '____________',
        currentClass: clsLabel,
        photoUrl: manualPhotoUrl || undefined,
        udiseCode: udiseCode || '281125100013',
        conduct,
        purpose,
        place,
        date,
      };
    }

    const roll = s?.rollNo || `00${indexNum}`;
    return {
      certRefNo: `SC/${yr}/${roll.replace(/[^A-Z0-9-]/gi, '')}`,
      studentName: s?.user?.name || s?.name || '___________________________',
      fatherName: s?.fatherName || '___________________________',
      motherName: s?.motherName || '',
      relationPhrase: relationFromGender(s?.gender),
      admissionNo: s?.rollNo || '____________',
      dob: formatDob(s?.dob) || '____________',
      currentClass: s?.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : clsLabel,
      photoUrl: s?.user?.photoUrl || undefined,
      udiseCode: udiseCode || '281125100013',
      conduct,
      purpose,
      place,
      date,
    };
  };

  const currentPreviewData: CertPayload = useMemo(() => {
    if (mode === 'single') return buildCertPayload(undefined, 1);
    const activeBulkId = bulkSelectedIds[bulkPreviewIndex] || selectedStudentId;
    const s = classStudents.find(x => x.id === activeBulkId);
    return buildCertPayload(s, bulkPreviewIndex + 1);
  }, [
    mode, bulkSelectedIds, bulkPreviewIndex, classStudents, selectedStudentId,
    manualStudentName, manualFatherName, manualMotherName, manualRollNo, manualDob,
    manualGender, manualPhotoUrl, udiseCode, conduct, purpose, place, date, selectedClassObj,
  ]);

  const filteredClassStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return classStudents;
    return classStudents.filter(s => {
      const name = (s.user?.name || s.name || '').toLowerCase();
      const roll = (s.rollNo || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [classStudents, studentSearch]);

  // KPI summary for selected class
  const kpis = useMemo(() => {
    const total = classStudents.length;
    const withFather = classStudents.filter(s => Boolean(s.fatherName && s.fatherName.trim())).length;
    const withDob = classStudents.filter(s => Boolean(s.dob)).length;
    const incomplete = classStudents.filter(s => !s.fatherName?.trim() || !s.dob).length;
    return { total, withFather, withDob, incomplete };
  }, [classStudents]);

  const certHeading =
    certType === 'BONAFIDE'
      ? 'BONAFIDE STUDENT CERTIFICATE'
      : certType === 'CHARACTER'
      ? 'CONDUCT & CHARACTER CERTIFICATE'
      : 'STUDY & CONDUCT CERTIFICATE';

  // ─────────────────────────────────────────────────────────────────────────
  // IFRAME PRINT GENERATOR (100% IDENTICAL TO LIVE PREVIEW)
  // ─────────────────────────────────────────────────────────────────────────
  const generateCertificateHtml = (cert: CertPayload) => {
    const logoUrl = getPhotoUrl(schoolSettings.logoUrl) || '/logo.png';
    const principalSignUrl = schoolSettings.principalSignatureUrl ? getPhotoUrl(schoolSettings.principalSignatureUrl) : '';
    const studentPhotoUrl = cert.photoUrl ? getPhotoUrl(cert.photoUrl) : '';
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
      `JY-CERT|${cert.certRefNo}|${cert.admissionNo}|${cert.studentName}`
    )}`;

    const bodyHtml =
      certType === 'BONAFIDE'
        ? `
          <p class="body-para">
            <span class="txt-regular">This is to certify that</span>
            <span class="txt-highlight">${cert.studentName}</span>,
            <span class="txt-regular">${cert.relationPhrase}</span>
            <span class="txt-highlight">${cert.fatherName}</span>,
            <span class="txt-regular">is a bona fide student of this institution studying in Class</span>
            <span class="txt-highlight">${cert.currentClass}</span>
            <span class="txt-regular">during the current academic session.</span>
          </p>
          ${showDob ? `<p class="body-para"><span class="txt-regular">As per the school admission register, his / her Date of Birth is</span> <span class="txt-highlight">${cert.dob}</span>.</p>` : ''}
          <p class="body-para">
            <span class="txt-regular">This Bonafide Certificate is issued on request for the purpose of</span>
            <span class="txt-highlight">${cert.purpose}</span>.
            <span class="txt-regular">During the period of study, his / her conduct has been found to be</span>
            <span class="txt-highlight font-italic">${cert.conduct}</span>.
          </p>
        `
        : certType === 'CHARACTER'
        ? `
          <p class="body-para">
            <span class="txt-regular">This is to certify that</span>
            <span class="txt-highlight">${cert.studentName}</span>,
            <span class="txt-regular">${cert.relationPhrase}</span>
            <span class="txt-highlight">${cert.fatherName}</span>,
            <span class="txt-regular">bearing Admission / Roll No.</span>
            <span class="txt-highlight">${cert.admissionNo}</span>,
            <span class="txt-regular">was / is a bona fide student of Class <strong>${cert.currentClass}</strong> at this institution.</span>
          </p>
          <p class="body-para">
            <span class="txt-regular">During his / her stay in this school, his / her moral character, discipline, attendance, and general conduct have been found to be</span>
            <span class="txt-highlight font-italic">${cert.conduct}</span>.
            <span class="txt-regular">He / She has never been involved in any act of indiscipline and bears a commendable record with faculty and peers.</span>
          </p>
          ${showDob ? `<p class="body-para"><span class="txt-regular">Date of Birth as recorded in school admission register:</span> <span class="txt-highlight">${cert.dob}</span>.</p>` : ''}
        `
        : `
          <p class="body-para">
            <span class="txt-regular">This is to certify that</span>
            <span class="txt-highlight">${cert.studentName}</span>,
            <span class="txt-regular">${cert.relationPhrase}</span>
            <span class="txt-highlight">${cert.fatherName}</span>${cert.motherName ? ` <span class="txt-regular">&amp; Smt.</span> <span class="txt-highlight">${cert.motherName}</span>` : ''},
            <span class="txt-regular">is / was a bona fide student of this institution${showDob ? ` with Date of Birth <span class="txt-highlight">${cert.dob}</span>` : ''}.</span>
          </p>
          <p class="body-para">
            <span class="txt-regular">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>
            <span class="txt-highlight font-italic">${cert.conduct}</span>.
            <span class="txt-regular">He / She consistently maintained good moral values and complied with the rules of the institution.</span>
          </p>
          <p class="body-para">
            <span class="txt-regular">He / She studied the following classes during the academic years noted below, as recorded in the school register:</span>
          </p>
        `;

    return `
      <div class="cert-page">
        <div class="cert-outer-frame"></div>
        <div class="cert-inner-frame"></div>
        <div class="corner-ornament tl"></div>
        <div class="corner-ornament tr"></div>
        <div class="corner-ornament bl"></div>
        <div class="corner-ornament br"></div>

        <div class="cert-watermark"><img src="${logoUrl}" alt="Watermark" /></div>

        <div class="cert-content">
          <div>
            <div class="cert-header">
              <div class="cert-logo">
                <img src="${logoUrl}" alt="Logo" onerror="this.src='/logo.png'" />
              </div>
              <div class="cert-titles">
                <h1 class="school-name">${schoolSettings.schoolName}</h1>
                <div class="school-sub">${schoolSettings.schoolSubtitle}</div>
                <div class="school-rc">${rcNumber}</div>
                <div class="school-addr">${schoolSettings.address}</div>
              </div>
              ${
                showPhoto
                  ? `<div class="cert-photo-box">${
                      studentPhotoUrl
                        ? `<img src="${studentPhotoUrl}" alt="Student Photo" />`
                        : `<div class="photo-empty">STUDENT<br/>PHOTO</div>`
                    }</div>`
                  : `<div style="width:22mm"></div>`
              }
            </div>

            <div class="cert-main-title"><span>${certHeading}</span></div>

            <div class="cert-meta-bar">
              <div class="meta-box">Ref No: <span class="m-val">${cert.certRefNo}</span></div>
              <div class="meta-box">Admission / Roll: <span class="m-val">${cert.admissionNo}</span></div>
              <div class="meta-box">UDISE: <span class="m-val">${cert.udiseCode}</span></div>
            </div>

            <div class="cert-body">${bodyHtml}</div>

            ${
              certType === 'STUDY_CONDUCT'
                ? `<div class="cert-table-container">
                    <table class="academic-table">
                      <thead>
                        <tr>
                          <th style="width:14%">SL. NO.</th>
                          <th style="width:32%">ACADEMIC YEAR</th>
                          <th style="width:24%">CLASS</th>
                          <th style="width:30%">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${academicRows
                          .map(
                            (r, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${r.year}</td>
                            <td>${r.className}</td>
                            <td>${r.remarks || 'Promoted'}</td>
                          </tr>`
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>`
                : ''
            }
          </div>

          <div class="cert-footer">
            <div class="footer-meta">
              <div class="meta-row"><span class="f-label">Place :</span> <span class="f-val">${cert.place}</span></div>
              <div class="meta-row"><span class="f-label">Date :</span> <span class="f-val">${cert.date}</span></div>
            </div>

            ${
              showQr
                ? `<div class="footer-qr"><img src="${qrSrc}" alt="Verify QR" /><span>VERIFY</span></div>`
                : ''
            }

            <div class="footer-sign">
              <div class="sig-img-wrap">
                ${showSignature && principalSignUrl ? `<img src="${principalSignUrl}" alt="Signature" />` : ''}
              </div>
              <div class="sig-line"></div>
              <div class="sig-label">HEADMASTER / PRINCIPAL</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const printCertificatesIframe = (certificates: CertPayload[]) => {
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
  <title>Certificates - ${schoolSettings.schoolName}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Times New Roman', Georgia, serif; }
    html, body { background: #fff !important; color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .cert-page { width: 210mm; height: 297mm; max-height: 297mm; background: ${activeTheme.bg} !important; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; padding: 14mm 16mm; }
    .cert-page:last-child { page-break-after: avoid; }
    .cert-outer-frame { position: absolute; inset: 8mm; border: 2px solid ${activeTheme.gold}; pointer-events: none; z-index: 10; }
    .cert-inner-frame { position: absolute; inset: 11mm; border: 4px solid ${activeTheme.primary}; pointer-events: none; z-index: 10; }
    .corner-ornament { position: absolute; width: 10mm; height: 10mm; border: 2.5px solid ${activeTheme.gold}; z-index: 11; pointer-events: none; }
    .corner-ornament.tl { top: 9.5mm; left: 9.5mm; border-right: none; border-bottom: none; }
    .corner-ornament.tr { top: 9.5mm; right: 9.5mm; border-left: none; border-bottom: none; }
    .corner-ornament.bl { bottom: 9.5mm; left: 9.5mm; border-right: none; border-top: none; }
    .corner-ornament.br { bottom: 9.5mm; right: 9.5mm; border-left: none; border-top: none; }
    .cert-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 110mm; height: 110mm; opacity: 0.04; z-index: 1; display: flex; align-items: center; justify-content: center; }
    .cert-watermark img { width: 100%; height: 100%; object-fit: contain; filter: grayscale(100%); }
    .cert-content { position: relative; z-index: 5; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 2mm 4mm; }
    .cert-header { display: flex; align-items: center; justify-content: space-between; gap: 3mm; margin-bottom: 4mm; border-bottom: 2px solid ${activeTheme.primary}; padding-bottom: 3mm; }
    .cert-logo { width: 22mm; height: 22mm; display: flex; align-items: center; justify-content: center; shrink: 0; }
    .cert-logo img { width: 100%; height: 100%; object-fit: contain; }
    .cert-titles { flex: 1; text-align: center; }
    .school-name { font-size: 21pt; font-weight: 900; color: ${activeTheme.primary}; text-transform: uppercase; line-height: 1.15; }
    .school-sub { font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 800; color: #b91c1c; margin-top: 1mm; }
    .school-rc { font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 700; color: #334155; margin-top: 0.8mm; }
    .school-addr { font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 700; color: ${activeTheme.primary}; margin-top: 0.8mm; }
    .cert-photo-box { width: 22mm; height: 26mm; border: 1.5px solid ${activeTheme.gold}; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .cert-photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .photo-empty { font-family: Arial, sans-serif; font-size: 6.5pt; color: #94a3b8; font-weight: 700; text-align: center; }
    .cert-main-title { text-align: center; margin: 4mm 0 5mm 0; }
    .cert-main-title span { font-size: 16pt; font-weight: 900; color: #fff; background: ${activeTheme.primary}; padding: 2mm 9mm; border-radius: 99px; letter-spacing: 1.5px; text-transform: uppercase; border: 1.5px solid ${activeTheme.gold}; display: inline-block; }
    .cert-meta-bar { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 6mm; }
    .meta-box { border: 1.2px solid ${activeTheme.primary}; padding: 2mm 3.5mm; border-radius: 3px; background: rgba(255,255,255,0.85); font-family: Arial, sans-serif; font-size: 9pt; font-weight: 700; color: #475569; }
    .meta-box .m-val { font-weight: 900; color: ${activeTheme.primary}; margin-left: 1mm; }
    .cert-body { font-size: 13pt; line-height: 1.9; color: #1e293b; text-align: justify; }
    .body-para { margin-bottom: 4.5mm; }
    .txt-regular { color: #334155; font-style: italic; }
    .txt-highlight { font-weight: 900; font-size: 13.5pt; color: ${activeTheme.primary}; border-bottom: 1.5px dotted #64748b; padding: 0 3mm; font-style: normal; }
    .font-italic { font-style: italic; }
    .cert-table-container { margin: 4mm 0; border: 1.5px solid ${activeTheme.primary}; border-radius: 3px; overflow: hidden; }
    .academic-table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10pt; }
    .academic-table th { background: ${activeTheme.primary}; color: #fff; padding: 2.5mm 3mm; font-weight: 900; text-transform: uppercase; text-align: center; }
    .academic-table td { padding: 2.2mm 3mm; text-align: center; border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; }
    .academic-table tr:last-child td { border-bottom: none; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6mm; padding-top: 4mm; border-top: 1px dashed #cbd5e1; }
    .footer-meta { display: flex; flex-direction: column; gap: 2mm; font-size: 11pt; font-weight: 700; color: #334155; }
    .f-label { font-style: italic; margin-right: 2mm; }
    .f-val { font-weight: 900; color: ${activeTheme.primary}; border-bottom: 1px dotted #64748b; padding: 0 2mm; }
    .footer-qr { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; font-size: 7pt; font-weight: 900; color: #64748b; }
    .footer-qr img { width: 15mm; height: 15mm; border: 1px solid #cbd5e1; padding: 0.5mm; background: #fff; margin-bottom: 0.5mm; }
    .footer-sign { text-align: center; width: 58mm; }
    .sig-img-wrap { height: 17mm; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 1mm; }
    .sig-img-wrap img { max-height: 16mm; max-width: 46mm; object-fit: contain; }
    .sig-line { border-bottom: 1.5px solid ${activeTheme.primary}; margin-bottom: 1.5mm; }
    .sig-label { font-size: 9.5pt; font-weight: 900; color: ${activeTheme.primary}; letter-spacing: 0.6px; }
  </style>
</head>
<body>${certificates.map(generateCertificateHtml).join('')}</body>
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
          try { iframe.remove(); } catch {}
        }, 3000);
      }
    }, 450);
  };

  const handlePrintCurrent = () => printCertificatesIframe([currentPreviewData]);

  const handlePrintAllBulk = () => {
    if (bulkSelectedIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    const list = bulkSelectedIds.map((id, i) => {
      const s = classStudents.find(x => x.id === id);
      return buildCertPayload(s, i + 1);
    });
    printCertificatesIframe(list);
  };

  // Unscaled 1:1 A4 PDF Export
  const handleExportSinglePDF = async () => {
    if (!pdfCaptureRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Generating 1:1 A4 PDF...');
    try {
      const imgData = await toJpeg(pdfCaptureRef.current, {
        quality: 0.96,
        pixelRatio: 2.3,
        backgroundColor: activeTheme.bg,
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      const cleanName = currentPreviewData.studentName.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
      pdf.save(`${certType}_${cleanName}.pdf`);
      toast.success('Certificate PDF downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error('PDF export failed: ' + (err?.message || 'Try Print -> Save as PDF'), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBulkZip = async () => {
    if (bulkSelectedIds.length === 0) {
      toast.error('Select at least one student');
      return;
    }
    setIsZipping(true);
    const toastId = toast.loading(`Creating ZIP (${bulkSelectedIds.length} PDFs)...`);
    try {
      const zip = new JSZip();
      const cls = classes.find(c => c.id === selectedClassId);
      const classLabel = cls ? `${cls.name}_${cls.section}` : 'Class';

      for (let i = 0; i < bulkSelectedIds.length; i++) {
        const s = classStudents.find(x => x.id === bulkSelectedIds[i]);
        if (!s) continue;
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed;top:0;left:-99999px;width:210mm;height:297mm;z-index:-9999;';
        tempDiv.innerHTML = generateCertificateHtml(buildCertPayload(s, i + 1));
        document.body.appendChild(tempDiv);

        const targetEl = tempDiv.querySelector('.cert-page') as HTMLElement;
        if (targetEl) {
          const imgData = await toJpeg(targetEl, { quality: 0.95, pixelRatio: 2, backgroundColor: activeTheme.bg });
          const pdf = new jsPDF('p', 'mm', 'a4');
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          const fn = (s.user?.name || s.name || `Student_${i + 1}`).replace(/[^a-zA-Z0-9]/g, '_');
          zip.file(`${certType}_${fn}.pdf`, pdf.output('blob'));
        }
        document.body.removeChild(tempDiv);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Certificates_${classLabel}.zip`);
      toast.success('Bulk ZIP downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error('ZIP creation failed: ' + err?.message, { id: toastId });
    } finally {
      setIsZipping(false);
    }
  };

  const logoSrc = getPhotoUrl(schoolSettings.logoUrl) || '/logo.png';
  const principalSignSrc = schoolSettings.principalSignatureUrl ? getPhotoUrl(schoolSettings.principalSignatureUrl) : undefined;
  const studentPhotoSrc = currentPreviewData.photoUrl ? getPhotoUrl(currentPreviewData.photoUrl) : undefined;
  const qrVerifyUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    `JY-CERT|${currentPreviewData.certRefNo}|${currentPreviewData.admissionNo}|${currentPreviewData.studentName}`
  )}`;

  const renderPreviewSheet = (refProp?: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={refProp}
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        backgroundColor: activeTheme.bg,
        fontFamily: "'Times New Roman', Georgia, serif",
      }}
      className="relative overflow-hidden flex flex-col justify-between p-[14mm] select-none"
    >
      {/* Double Formal Border */}
      <div style={{ borderColor: activeTheme.gold }} className="absolute inset-[8mm] border-2 pointer-events-none z-10" />
      <div style={{ borderColor: activeTheme.primary }} className="absolute inset-[11mm] border-[4px] pointer-events-none z-10" />
      <div style={{ borderColor: activeTheme.gold }} className="absolute top-[9.5mm] left-[9.5mm] w-8 h-8 border-t-[2.5px] border-l-[2.5px] z-11 pointer-events-none" />
      <div style={{ borderColor: activeTheme.gold }} className="absolute top-[9.5mm] right-[9.5mm] w-8 h-8 border-t-[2.5px] border-r-[2.5px] z-11 pointer-events-none" />
      <div style={{ borderColor: activeTheme.gold }} className="absolute bottom-[9.5mm] left-[9.5mm] w-8 h-8 border-b-[2.5px] border-l-[2.5px] z-11 pointer-events-none" />
      <div style={{ borderColor: activeTheme.gold }} className="absolute bottom-[9.5mm] right-[9.5mm] w-8 h-8 border-b-[2.5px] border-r-[2.5px] z-11 pointer-events-none" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-1">
        <img src={logoSrc} alt="Watermark" crossOrigin="anonymous" className="w-[105mm] h-[105mm] object-contain grayscale" />
      </div>

      <div className="relative z-5 h-full flex flex-col justify-between p-2">
        <div>
          {/* School Letterhead */}
          <div style={{ borderBottom: `2px solid ${activeTheme.primary}` }} className="flex items-center justify-between gap-3 pb-3 mb-4">
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              <img
                src={logoSrc}
                alt="School Logo"
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                onError={e => { e.currentTarget.src = '/logo.png'; }}
              />
            </div>

            <div className="flex-1 text-center px-2">
              <h1 style={{ color: activeTheme.primary }} className="text-[26px] font-black uppercase tracking-wide leading-tight">
                {schoolSettings.schoolName}
              </h1>
              <p className="text-[11px] font-extrabold text-rose-700 font-sans mt-0.5">{schoolSettings.schoolSubtitle}</p>
              <p className="text-[11px] font-bold text-slate-600 font-sans mt-0.5">{rcNumber}</p>
              <p style={{ color: activeTheme.primary }} className="text-[11px] font-bold font-sans mt-0.5">{schoolSettings.address}</p>
            </div>

            {showPhoto ? (
              <div style={{ borderColor: activeTheme.gold }} className="w-20 h-24 border-[1.5px] bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                {studentPhotoSrc ? (
                  <img src={studentPhotoSrc} alt="Student" crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-sans text-[8px] font-bold text-slate-400 text-center">STUDENT<br />PHOTO</span>
                )}
              </div>
            ) : (
              <div className="w-20 shrink-0" />
            )}
          </div>

          {/* Certificate Title Pill */}
          <div className="text-center my-4">
            <span
              style={{ backgroundColor: activeTheme.primary, borderColor: activeTheme.gold }}
              className="inline-block text-white text-lg font-black uppercase tracking-[0.14em] px-8 py-1.5 rounded-full border-[1.5px] shadow-xs"
            >
              {certHeading}
            </span>
          </div>

          {/* Ref No, Admission No & UDISE Bar */}
          <div className="flex justify-between items-center gap-2 my-4 font-sans text-xs">
            <div style={{ borderColor: activeTheme.primary }} className="border px-3 py-1.5 rounded bg-white/85 font-bold text-slate-600">
              Ref No: <strong style={{ color: activeTheme.primary }} className="font-black ml-1">{currentPreviewData.certRefNo}</strong>
            </div>
            <div style={{ borderColor: activeTheme.primary }} className="border px-3 py-1.5 rounded bg-white/85 font-bold text-slate-600">
              Admission / Roll: <strong style={{ color: activeTheme.primary }} className="font-black ml-1">{currentPreviewData.admissionNo}</strong>
            </div>
            <div style={{ borderColor: activeTheme.primary }} className="border px-3 py-1.5 rounded bg-white/85 font-bold text-slate-600">
              UDISE: <strong style={{ color: activeTheme.primary }} className="font-black ml-1">{currentPreviewData.udiseCode}</strong>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-justify text-[16.5px] leading-[1.85] text-slate-800 pt-2">
            {certType === 'BONAFIDE' ? (
              <>
                <p>
                  <span className="italic text-slate-600">This is to certify that</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.studentName}
                  </strong>
                  , <span className="italic text-slate-600">{currentPreviewData.relationPhrase}</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.fatherName}
                  </strong>
                  , <span className="italic text-slate-600">is a bona fide student of this institution studying in Class</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="font-black border-b-2 border-dotted border-slate-500 px-2">
                    {currentPreviewData.currentClass}
                  </strong>{' '}
                  <span className="italic text-slate-600">during the current academic session.</span>
                </p>
                {showDob && (
                  <p>
                    <span className="italic text-slate-600">As per the school admission register, his / her Date of Birth is</span>{' '}
                    <strong style={{ color: activeTheme.primary }} className="font-black border-b-2 border-dotted border-slate-500 px-2">
                      {currentPreviewData.dob}
                    </strong>.
                  </p>
                )}
                <p>
                  <span className="italic text-slate-600">This certificate is issued on request for</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="font-black border-b-2 border-dotted border-slate-500 px-2">
                    {currentPreviewData.purpose}
                  </strong>
                  . <span className="italic text-slate-600">His / Her conduct has been</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="italic font-black border-b-2 border-dotted border-slate-500 px-2">
                    {currentPreviewData.conduct}
                  </strong>.
                </p>
              </>
            ) : certType === 'CHARACTER' ? (
              <>
                <p>
                  <span className="italic text-slate-600">This is to certify that</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.studentName}
                  </strong>
                  , <span className="italic text-slate-600">{currentPreviewData.relationPhrase}</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.fatherName}
                  </strong>
                  , <span className="italic text-slate-600">bearing Admission / Roll No.</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="font-black px-1">{currentPreviewData.admissionNo}</strong>,{' '}
                  <span className="italic text-slate-600">was / is a bona fide student of Class <strong>{currentPreviewData.currentClass}</strong> at this institution.</span>
                </p>
                <p>
                  <span className="italic text-slate-600">During his / her stay in this school, his / her moral character, discipline, attendance, and general conduct were found to be</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="italic font-black border-b-2 border-dotted border-slate-500 px-2">
                    {currentPreviewData.conduct}
                  </strong>
                  . <span className="italic text-slate-600">He / She demonstrated exemplary conduct and respectful behavior towards faculty and fellow students.</span>
                </p>
                {showDob && (
                  <p>
                    <span className="italic text-slate-600">Date of Birth as per school admission register:</span>{' '}
                    <strong style={{ color: activeTheme.primary }} className="font-black border-b-2 border-dotted border-slate-500 px-2">
                      {currentPreviewData.dob}
                    </strong>.
                  </p>
                )}
              </>
            ) : (
              <>
                <p>
                  <span className="italic text-slate-600">This is to certify that</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.studentName}
                  </strong>
                  , <span className="italic text-slate-600">{currentPreviewData.relationPhrase}</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2.5">
                    {currentPreviewData.fatherName}
                  </strong>
                  {currentPreviewData.motherName ? (
                    <>
                      {' '}<span className="italic text-slate-600">&amp; Smt.</span>{' '}
                      <strong style={{ color: activeTheme.primary }} className="text-lg font-black border-b-2 border-dotted border-slate-500 px-2">
                        {currentPreviewData.motherName}
                      </strong>
                    </>
                  ) : null}
                  , <span className="italic text-slate-600">is / was a bona fide student of this institution</span>
                  {showDob ? (
                    <>
                      {' '}<span className="italic text-slate-600">with Date of Birth</span>{' '}
                      <strong style={{ color: activeTheme.primary }} className="font-black border-b-2 border-dotted border-slate-500 px-2">
                        {currentPreviewData.dob}
                      </strong>
                    </>
                  ) : null}
                  .
                </p>

                <p>
                  <span className="italic text-slate-600">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>{' '}
                  <strong style={{ color: activeTheme.primary }} className="italic font-black border-b-2 border-dotted border-slate-500 px-2">
                    {currentPreviewData.conduct}
                  </strong>
                  . <span className="italic text-slate-600">He / She consistently maintained good moral values and complied with the rules and regulations of the institution.</span>
                </p>

                <p className="italic text-slate-600">
                  He / She studied the following classes during the academic years noted below, as recorded in the school register:
                </p>
              </>
            )}
          </div>

          {certType === 'STUDY_CONDUCT' && (
            <div style={{ borderColor: activeTheme.primary }} className="border-[1.5px] rounded overflow-hidden my-4">
              <table className="w-full text-center border-collapse font-sans text-xs">
                <thead>
                  <tr style={{ backgroundColor: activeTheme.primary }} className="text-white">
                    <th className="py-2.5 px-3 font-black uppercase w-16">Sl. No.</th>
                    <th className="py-2.5 px-3 font-black uppercase">Academic Year</th>
                    <th className="py-2.5 px-3 font-black uppercase">Class</th>
                    <th className="py-2.5 px-3 font-black uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-bold text-slate-800 bg-white/75">
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
          )}
        </div>

        {/* Footer with Place/Date, QR Verification & Real Principal Signature */}
        <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-300">
          <div className="space-y-1.5 text-sm font-bold text-slate-700">
            <div>
              <span className="italic text-slate-500 mr-2">Place :</span>
              <strong style={{ color: activeTheme.primary }} className="border-b border-dotted border-slate-500 px-2">
                {currentPreviewData.place}
              </strong>
            </div>
            <div>
              <span className="italic text-slate-500 mr-2">Date &nbsp;:</span>
              <strong style={{ color: activeTheme.primary }} className="border-b border-dotted border-slate-500 px-2">
                {currentPreviewData.date}
              </strong>
            </div>
          </div>

          {showQr && (
            <div className="flex flex-col items-center font-sans">
              <img src={qrVerifyUrl} alt="QR Verify" crossOrigin="anonymous" className="w-14 h-14 border border-slate-300 bg-white p-0.5" />
              <span className="text-[8px] font-black text-slate-500 mt-0.5 tracking-widest">SCAN TO VERIFY</span>
            </div>
          )}

          <div className="text-center w-52">
            <div className="h-14 flex items-end justify-center mb-1">
              {showSignature && principalSignSrc && (
                <img src={principalSignSrc} alt="Principal Signature" crossOrigin="anonymous" className="max-h-14 max-w-44 object-contain" />
              )}
            </div>
            <div style={{ borderBottom: `2px solid ${activeTheme.primary}` }} className="mb-1.5" />
            <div style={{ color: activeTheme.primary }} className="text-xs font-black uppercase tracking-wider">
              Headmaster / Principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC] text-slate-800 pb-10">
      <PageHeader
        title="Study, Bonafide & Conduct Certificate Studio"
        icon={<GraduationCap className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadClasses}
              disabled={classesLoading}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${classesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Light Pastel KPI Cards */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-700/80">Class Strength</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.total}</h3>
              <p className="text-[11px] font-bold text-indigo-700">{selectedClassObj ? `${selectedClassObj.name}-${selectedClassObj.section}` : 'Class'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Building className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-700/80">Father / DOB Ready</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.withFather} / {kpis.withDob}</h3>
              <p className="text-[11px] font-bold text-emerald-800">Auto-Fill Verified</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-800/80">Incomplete Profiles</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.incomplete}</h3>
              <p className="text-[11px] font-bold text-amber-800">Missing Father or DOB</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-700/80">Certificate Format</p>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {certType === 'STUDY_CONDUCT' ? 'Study & Conduct' : certType === 'BONAFIDE' ? 'Bonafide Cert' : 'Character Cert'}
              </h3>
              <p className="text-[11px] font-bold text-violet-800">{activeTheme.name}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center"><Award className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col lg:flex-row gap-5">
        {/* LEFT CONTROL SIDEBAR */}
        <div className="w-full lg:w-[430px] bg-white rounded-[24px] shadow-xs border border-indigo-100 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border-b border-indigo-100 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-indigo-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Individual Student</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'bulk' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-indigo-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Bulk Class Mode</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Certificate Type & Theme Switcher */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFF] border border-indigo-100 space-y-2.5">
              <label className="text-[10px] font-black uppercase text-indigo-800 tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Certificate Format &amp; Border Theme</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-extrabold">
                {(
                  [
                    ['STUDY_CONDUCT', 'Study & Conduct'],
                    ['BONAFIDE', 'Bonafide'],
                    ['CHARACTER', 'Character'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCertType(k)}
                    className={`py-1.5 px-2 rounded-xl border cursor-pointer ${
                      certType === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CERT_THEMES.map(th => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setThemeId(th.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 cursor-pointer ${
                      themeId === th.id ? 'border-indigo-500 bg-white ring-2 ring-indigo-200' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.primary }} />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  ['Photo', showPhoto, setShowPhoto] as const,
                  ['DOB', showDob, setShowDob] as const,
                  ['Principal Sign', showSignature, setShowSignature] as const,
                  ['QR Verify', showQr, setShowQr] as const,
                ].map(([label, val, setter]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setter(!val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                      val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {val ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Class Selector */}
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 block">
                Target Class &amp; Section
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-800 outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- Section ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {studentsLoading ? (
              <div className="py-4 text-center text-xs font-bold text-slate-400">Loading students...</div>
            ) : mode === 'single' ? (
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-600" /> Student Autofill</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-indigo-700 border border-indigo-100">{classStudents.length} Students</span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student or roll no..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <select
                  value={selectedStudentId}
                  onChange={e => handleSelectStudent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="">Select student...</option>
                  {filteredClassStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name || s.name} · {s.rollNo || 'N/A'}
                    </option>
                  ))}
                </select>

                {(!manualFatherName.trim() || !manualDob.trim()) && selectedStudentId && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Father Name or DOB missing in profile — fill manually below!</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Student Full Name</label>
                    <input type="text" value={manualStudentName} onChange={e => setManualStudentName(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Father's Name</label>
                    <input type="text" value={manualFatherName} onChange={e => setManualFatherName(e.target.value)} placeholder="Enter Father Name" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mother's Name (Optional)</label>
                    <input type="text" value={manualMotherName} onChange={e => setManualMotherName(e.target.value)} placeholder="Mother Name" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Admission / Roll No</label>
                    <input type="text" value={manualRollNo} onChange={e => setManualRollNo(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Date of Birth</label>
                    <input type="text" value={manualDob} onChange={e => setManualDob(e.target.value)} placeholder="DD-MM-YYYY" className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Selected: {bulkSelectedIds.length} / {classStudents.length}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setBulkSelectedIds(classStudents.map(s => s.id))} className="px-2 py-0.5 bg-white rounded border text-indigo-600 cursor-pointer">All</button>
                    <button type="button" onClick={() => setBulkSelectedIds([])} className="px-2 py-0.5 bg-white rounded border text-slate-600 cursor-pointer">None</button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {classStudents.map(s => {
                    const isChecked = bulkSelectedIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => setBulkSelectedIds(prev => (isChecked ? prev.filter(x => x !== s.id) : [...prev, s.id]))}
                        className="px-3 py-2 flex items-center gap-2 cursor-pointer text-xs hover:bg-slate-50"
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                        <span className="font-bold truncate">{s.user?.name || s.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-auto">{s.rollNo}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">UDISE Code</label>
                  <input type="text" value={udiseCode} onChange={e => setUdiseCode(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Conduct</label>
                  <select value={conduct} onChange={e => setConduct(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none">
                    <option value="Excellent">Excellent</option>
                    <option value="Exemplary">Exemplary</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                  </select>
                </div>
              </div>

              {certType === 'BONAFIDE' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Bonafide Purpose</label>
                  <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Recognition / Rc. No.</label>
                <input type="text" value={rcNumber} onChange={e => setRcNumber(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Place</label>
                  <input type="text" value={place} onChange={e => setPlace(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Issue Date</label>
                  <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-1.5 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
              </div>
            </div>

            {certType === 'STUDY_CONDUCT' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase text-slate-600">Study Progression Years</h4>
                  <button
                    type="button"
                    onClick={() => setAcademicRows(prev => [...prev, { year: '2026-27', className: 'IX', remarks: 'Studying' }])}
                    className="text-xs font-extrabold text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                {academicRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-[#F8FAFF] p-1.5 rounded-xl border border-indigo-100 text-xs">
                    <input type="text" value={row.year} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, year: e.target.value } : r)))} className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                    <input type="text" value={row.className} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, className: e.target.value } : r)))} className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                    <input type="text" value={row.remarks} onChange={e => setAcademicRows(prev => prev.map((r, i) => (i === idx ? { ...r, remarks: e.target.value } : r)))} className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold" />
                    <button
                      type="button"
                      disabled={academicRows.length <= 1}
                      onClick={() => setAcademicRows(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-rose-500 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT A4 LIVE PREVIEW */}
        <div className="flex-1 bg-[#EAEFF8] rounded-[24px] border border-indigo-100 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-indigo-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-900 uppercase">A4 Live Certificate Preview</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">210 × 297 mm</span>
            </div>

            {mode === 'bulk' && bulkSelectedIds.length > 0 && (
              <div className="flex items-center bg-[#F4F7FC] rounded-xl p-0.5 border border-slate-200 text-xs font-black">
                <button type="button" onClick={() => setBulkPreviewIndex(p => Math.max(0, p - 1))} disabled={bulkPreviewIndex === 0} className="p-1.5 disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-2">{bulkPreviewIndex + 1} / {bulkSelectedIds.length}</span>
                <button type="button" onClick={() => setBulkPreviewIndex(p => Math.min(bulkSelectedIds.length - 1, p + 1))} disabled={bulkPreviewIndex >= bulkSelectedIds.length - 1} className="p-1.5 disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#F4F7FC] rounded-xl px-1.5 py-0.5 border border-slate-200">
                <button type="button" onClick={() => setZoomScale(s => Math.max(0.45, Number((s - 0.08).toFixed(2))))} className="p-1 text-slate-600 cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-[11px] font-black text-indigo-600 px-1.5">{Math.round(zoomScale * 100)}%</span>
                <button type="button" onClick={() => setZoomScale(s => Math.min(1.1, Number((s + 0.08).toFixed(2))))} className="p-1 text-slate-600 cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>

              {mode === 'single' ? (
                <>
                  <button type="button" onClick={handlePrintCurrent} className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 cursor-pointer">
                    <Printer className="w-3.5 h-3.5" /><span>Print A4</span>
                  </button>
                  <button type="button" onClick={handleExportSinglePDF} disabled={isExporting} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50">
                    {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}<span>Download PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handlePrintAllBulk} disabled={bulkSelectedIds.length === 0} className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    <Printer className="w-3.5 h-3.5" /><span>Print All ({bulkSelectedIds.length})</span>
                  </button>
                  <button type="button" onClick={handleExportBulkZip} disabled={isZipping || bulkSelectedIds.length === 0} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50">
                    {isZipping ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}<span>ZIP ({bulkSelectedIds.length} PDFs)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
            <div style={{ width: `${210 * zoomScale}mm`, height: `${297 * zoomScale}mm` }} className="relative shrink-0">
              <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top left' }} className="shadow-2xl">
                {renderPreviewSheet()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen Unscaled 1:1 Capture Surface for PDF */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, width: '210mm', height: '297mm', pointerEvents: 'none', zIndex: -1 }}>
        {renderPreviewSheet(pdfCaptureRef)}
      </div>
    </div>
  );
};

export default StudyCertificatePage;
