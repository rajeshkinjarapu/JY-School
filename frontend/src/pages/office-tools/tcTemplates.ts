import { getPhotoUrl } from '../../utils/photo';

export interface AcademicHistoryRow {
  year: string;
  className: string;
  remarks: string;
}

export interface SchoolCertSettings {
  schoolName: string;
  schoolSubtitle: string;
  address: string;
  logoUrl: string;
  principalSignatureUrl?: string;
}

export type DocumentKind = 'TC_LEGAL' | 'RECORD_SHEET_A4';

export interface TcTheme {
  id: string;
  name: string;
  primary: string;
  gold: string;
  tint: string;
  bg: string;
}

export const TC_THEMES: TcTheme[] = [
  { id: 'navy', name: 'Royal Navy & Gold', primary: '#0b1a33', gold: '#b45309', tint: '#eef2ff', bg: '#FDFBF7' },
  { id: 'maroon', name: 'Heritage Maroon', primary: '#5c1122', gold: '#c59b27', tint: '#fff1f2', bg: '#FFFDF9' },
  { id: 'emerald', name: 'Campus Emerald', primary: '#064e3b', gold: '#b45309', tint: '#ecfdf5', bg: '#FAFCFB' },
  { id: 'classic', name: 'Govt. Classic Parchment', primary: '#1e293b', gold: '#475569', tint: '#f1f5f9', bg: '#FFFDF6' },
];

export const CLASS_SEQUENCE = [
  'Nursery', 'LKG', 'UKG',
  'I', 'II', 'III', 'IV', 'V',
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

const CLASS_WORDS_MAP: Record<string, string> = {
  Nursery: 'Nursery (Pre-Primary)',
  LKG: 'LKG (Lower Kindergarten)',
  UKG: 'UKG (Upper Kindergarten)',
  I: 'Class I (First Standard)',
  II: 'Class II (Second Standard)',
  III: 'Class III (Third Standard)',
  IV: 'Class IV (Fourth Standard)',
  V: 'Class V (Fifth Standard)',
  VI: 'Class VI (Sixth Standard)',
  VII: 'Class VII (Seventh Standard)',
  VIII: 'Class VIII (Eighth Standard)',
  IX: 'Class IX (Ninth Standard)',
  X: 'Class X (Tenth Standard / S.S.C.)',
  XI: 'Class XI (Eleventh Standard)',
  XII: 'Class XII (Twelfth Standard)',
};

export const resolveClassIndex = (rawName: string): number => {
  const s = (rawName || '').trim().toUpperCase();
  if (!s) return 0;
  if (s.includes('NUR') || s.includes('PLAY')) return 0;
  if (s.includes('LKG') || s.includes('PP1') || s.includes('PP-1')) return 1;
  if (s.includes('UKG') || s.includes('PP2') || s.includes('PP-2')) return 2;

  const romanMap: Record<string, number> = {
    I: 3, II: 4, III: 5, IV: 6, V: 7,
    VI: 8, VII: 9, VIII: 10, IX: 11, X: 12, XI: 13, XII: 14,
  };
  const tokens = s.split(/[\s\-_/]+/);
  for (const t of tokens) {
    if (romanMap[t] !== undefined) return romanMap[t];
  }

  const digits = parseInt(s.replace(/\D/g, ''), 10);
  if (!isNaN(digits) && digits >= 1 && digits <= 12) return digits + 2;
  return 8;
};

export const isRecordSheetClass = (rawName: string): boolean => {
  return resolveClassIndex(rawName) <= 7; // Nursery(0) through Class V(7)
};

export const getClassInWords = (rawName: string): string => {
  const idx = resolveClassIndex(rawName);
  const label = CLASS_SEQUENCE[idx] || rawName;
  return CLASS_WORDS_MAP[label] || rawName;
};

export const getNextClassLabel = (rawName: string): string => {
  const idx = resolveClassIndex(rawName);
  return CLASS_SEQUENCE[idx + 1] || 'Higher Studies / College';
};

export const buildAcademicRowsForClass = (rawName: string): AcademicHistoryRow[] => {
  const idx = resolveClassIndex(rawName);
  const currentYear = new Date().getFullYear();
  const count = Math.min(3, idx + 1);
  const rows: AcademicHistoryRow[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const startYear = currentYear - offset;
    rows.push({
      year: `${startYear}-${String(startYear + 1).slice(-2)}`,
      className: CLASS_SEQUENCE[idx - offset] || rawName,
      remarks: offset === 0 ? 'Studying / Completed' : 'Promoted',
    });
  }
  return rows;
};

export const formatDateDdMmYyyy = (val?: string | null): string => {
  if (!val) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(val.trim())) return val.trim();
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const ORDINALS = [
  '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
  'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitsToWords = (n: number): string => {
  if (n < 20) return ONES[n] || '';
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`.trim();
};

const yearToWords = (year: number): string => {
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    return rem === 0 ? 'Two Thousand' : `Two Thousand ${twoDigitsToWords(rem)}`;
  }
  if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    return rem === 0 ? 'Nineteen Hundred' : `Nineteen ${twoDigitsToWords(rem)}`;
  }
  return String(year);
};

export const dobToWords = (dobInput?: string | null): string => {
  const formatted = formatDateDdMmYyyy(dobInput);
  const parts = formatted.split(/[-/]/);
  if (parts.length !== 3) return '';
  let day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (parts[0].length === 4) {
    year = parseInt(parts[0], 10);
    day = parseInt(parts[2], 10);
  }
  if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12) {
    return '';
  }
  return `${ORDINALS[day]} ${MONTHS[month - 1]} ${yearToWords(year)}`;
};

export interface TcPayload {
  docKind: DocumentKind;
  tcNo: string;
  bookNo: string;
  admissionNo: string;
  studentName: string;
  gender: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  dobFigures: string;
  dobWords: string;
  nationality: string;
  religionCaste: string;
  motherTongue: string;
  penNumber: string;
  childId: string;
  apaarId: string;
  aadharNo: string;
  dateOfAdmission: string;
  classAtAdmission: string;
  lastClassStudied: string;
  lastClassInWords: string;
  medium: string;
  firstLanguage: string;
  secondLanguage: string;
  thirdLanguage: string;
  subjectsOffered: string;
  examResult: string;
  qualifiedForPromotion: string;
  promotedToClass: string;
  feesPaid: string;
  feeConcession: string;
  workingDays: string;
  attendedDays: string;
  lastAttendanceDate: string;
  idMark1: string;
  idMark2: string;
  applicationDate: string;
  issueDate: string;
  conduct: string;
  reasonForLeaving: string;
  remarks: string;
  photoUrl?: string;
  udiseCode: string;
  schoolCode: string;
  affiliationNo: string;
  rcNumber: string;
  place: string;
  academicRows: AcademicHistoryRow[];
}

export interface TcRenderOptions {
  showPhoto: boolean;
  showSignature: boolean;
  showQr: boolean;
  showAadhaar: boolean;
  showSealBox: boolean;
}

const esc = (v?: string | null): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const valOrDash = (v?: string | null, fallback = '—'): string => {
  const s = (v || '').trim();
  return s ? esc(s) : fallback;
};

export const getPaperDimensions = (docKind: DocumentKind) =>
  docKind === 'TC_LEGAL'
    ? { widthMm: 215.9, heightMm: 355.6, label: 'Legal Portrait (215.9 × 355.6 mm / 8.5 × 14 in)' }
    : { widthMm: 210, heightMm: 297, label: 'A4 Portrait (210 × 297 mm)' };

export const buildDocumentCss = (theme: TcTheme, docKind: DocumentKind): string => {
  const dim = getPaperDimensions(docKind);
  const isLegal = docKind === 'TC_LEGAL';
  return `
    .doc-sheet {
      width: ${dim.widthMm}mm;
      height: ${dim.heightMm}mm;
      max-height: ${dim.heightMm}mm;
      background: ${theme.bg} !important;
      color: #0f172a;
      position: relative;
      overflow: hidden;
      font-family: 'Times New Roman', Georgia, serif;
      padding: ${isLegal ? '10.5mm 13mm' : '9.5mm 11.5mm'};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .doc-outer-frame { position: absolute; inset: 4.5mm; border: 1.8px solid ${theme.gold}; pointer-events: none; z-index: 10; }
    .doc-inner-frame { position: absolute; inset: 6.5mm; border: 2.8px solid ${theme.primary}; pointer-events: none; z-index: 10; }
    .corner { position: absolute; width: 6.5mm; height: 6.5mm; border: 2px solid ${theme.gold}; z-index: 11; pointer-events: none; }
    .corner.tl { top: 5.5mm; left: 5.5mm; border-right: none; border-bottom: none; }
    .corner.tr { top: 5.5mm; right: 5.5mm; border-left: none; border-bottom: none; }
    .corner.bl { bottom: 5.5mm; left: 5.5mm; border-right: none; border-top: none; }
    .corner.br { bottom: 5.5mm; right: 5.5mm; border-left: none; border-top: none; }

    .doc-watermark {
      position: absolute; top: 53%; left: 50%; transform: translate(-50%, -50%);
      width: 98mm; height: 98mm; opacity: 0.045; z-index: 1; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
    }
    .doc-watermark img { width: 100%; height: 100%; object-fit: contain; filter: grayscale(100%); }

    .doc-content { position: relative; z-index: 5; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .doc-body-main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .clause-table-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; margin: ${isLegal ? '1.8mm 0' : '1.2mm 0'}; }

    /* Pure Institutional School Header (No student photo in header) */
    .doc-header {
      display: flex; align-items: center; justify-content: space-between; gap: 3mm;
      border-bottom: 1.8px solid ${theme.primary}; padding-bottom: 1.8mm; margin-bottom: 1.6mm;
    }
    .doc-logo { width: 17.5mm; height: 17.5mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .doc-logo img { width: 100%; height: 100%; object-fit: contain; }
    .doc-header-spacer { width: 17.5mm; flex-shrink: 0; }
    .doc-school-info { flex: 1; text-align: center; }
    .school-title { font-size: ${isLegal ? '19pt' : '17pt'}; font-weight: 900; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.08; }
    .school-sub { font-family: Arial, sans-serif; font-size: 7.6pt; font-weight: 800; color: #b91c1c; margin-top: 0.5mm; }
    .school-rc { font-family: Arial, sans-serif; font-size: 7.3pt; font-weight: 700; color: #334155; margin-top: 0.4mm; }
    .school-addr { font-family: Arial, sans-serif; font-size: 7.5pt; font-weight: 700; color: ${theme.primary}; margin-top: 0.4mm; }

    .doc-banner { text-align: center; margin: 0.8mm 0 1.8mm 0; }
    .doc-banner-pill {
      display: inline-block; background: ${theme.primary}; color: #fff;
      border: 1.5px solid ${theme.gold}; border-radius: 99px;
      padding: 1.1mm 7mm; font-size: ${isLegal ? '13pt' : '11.5pt'}; font-weight: 900;
      letter-spacing: 1px; text-transform: uppercase;
    }
    .doc-banner-sub {
      font-family: Arial, sans-serif; font-size: 7pt; font-weight: 800;
      color: ${theme.gold}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.7mm;
    }

    /* Pupil Identity Strip Below Banner */
    .pupil-top-row {
      display: flex; align-items: stretch; gap: 2mm; margin-bottom: 1.8mm;
    }
    .pupil-meta-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.4mm; }
    .meta-strip {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5mm;
    }
    .meta-cell {
      border: 1px solid ${theme.primary}; background: rgba(255,255,255,0.9);
      padding: 1mm 1.8mm; border-radius: 2.5px; font-family: Arial, sans-serif; font-size: 7.2pt;
    }
    .meta-cell .ml { color: #64748b; font-weight: 700; display: block; font-size: 6pt; text-transform: uppercase; }
    .meta-cell .mv { color: ${theme.primary}; font-weight: 900; font-size: 7.8pt; word-break: break-all; }

    .gov-ids-strip {
      display: flex; justify-content: space-between; gap: 2mm;
      background: ${theme.tint}; border: 1px solid #cbd5e1; border-radius: 2.5px;
      padding: 0.9mm 2.2mm; font-family: Arial, sans-serif; font-size: 7.1pt; font-weight: 700; color: #334155;
    }
    .gov-ids-strip strong { color: ${theme.primary}; font-weight: 900; }

    .photo-box {
      width: 17mm; height: 20mm; border: 1.3px solid ${theme.gold}; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; border-radius: 2px;
    }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { font-family: Arial, sans-serif; font-size: 5.5pt; font-weight: 800; color: #94a3b8; text-align: center; line-height: 1.2; }

    .clause-table {
      width: 100%; height: 100%; flex: 1; border-collapse: collapse; border: 1.3px solid ${theme.primary};
      background: rgba(255,255,255,0.95);
    }
    .clause-table td {
      border: 1px solid #cbd5e1;
      padding: ${isLegal ? '1.8mm 2.5mm' : '1.35mm 2.1mm'};
      vertical-align: middle;
      font-size: ${isLegal ? '9.6pt' : '8.5pt'};
      line-height: 1.24;
    }
    .col-sl {
      width: 6.5%; text-align: center; font-family: Arial, sans-serif; font-weight: 900;
      color: ${theme.primary}; background: ${theme.tint};
    }
    .col-lbl {
      width: 41.5%; font-weight: 700; color: #334155;
    }
    .col-val {
      width: 52%; font-weight: 900; color: #0f172a; font-family: 'Times New Roman', Georgia, serif;
    }
    .val-sub {
      display: block; font-family: Arial, sans-serif; font-size: 6.9pt; font-weight: 700; color: #475569; margin-top: 0.3mm;
    }

    .mini-history-wrap { margin-top: 1.6mm; border: 1.1px solid ${theme.primary}; }
    .mini-history-title {
      background: ${theme.primary}; color: #fff; font-family: Arial, sans-serif;
      font-size: 7pt; font-weight: 900; padding: 0.8mm 2.2mm; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .mini-history-table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 7.2pt; }
    .mini-history-table th { background: ${theme.tint}; color: ${theme.primary}; font-weight: 800; padding: 0.75mm 1.8mm; border-bottom: 1px solid #cbd5e1; text-align: center; }
    .mini-history-table td { padding: 0.7mm 1.8mm; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; }
    .mini-history-table tr:last-child td { border-bottom: none; }

    .cert-declaration {
      margin-top: 1.5mm; font-size: 7.6pt; font-style: italic; color: #334155;
      background: ${theme.tint}; border-left: 3px solid ${theme.primary}; padding: 1mm 2.2mm;
      line-height: 1.24;
    }

    .doc-footer-note {
      font-family: Arial, sans-serif; font-size: 6.8pt; font-weight: 700; color: #b91c1c;
      text-align: center; margin-top: 1.2mm;
    }

    .doc-signatures {
      display: flex; justify-content: space-between; align-items: flex-end; gap: 3mm;
      margin-top: 1.5mm; padding-top: 1.5mm; border-top: 1px dashed #94a3b8;
    }
    .sig-col { text-align: center; width: 40mm; font-family: Arial, sans-serif; }
    .sig-space { height: 10.5mm; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 0.8mm; }
    .sig-space img { max-height: 10mm; max-width: 36mm; object-fit: contain; }
    .sig-rule { border-bottom: 1.2px solid ${theme.primary}; margin-bottom: 0.8mm; }
    .sig-title { font-size: 7.3pt; font-weight: 900; color: ${theme.primary}; text-transform: uppercase; }
    .sig-sub { font-size: 6pt; font-weight: 700; color: #64748b; }

    .seal-box {
      width: 21mm; height: 14mm; border: 1px dashed #94a3b8; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: Arial, sans-serif; font-size: 5.6pt; font-weight: 800; color: #94a3b8;
      text-align: center; text-transform: uppercase;
    }
    .qr-box { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; }
    .qr-box img { width: 12mm; height: 12mm; border: 1px solid #cbd5e1; padding: 0.4mm; background: #fff; }
    .qr-box span { font-size: 5.5pt; font-weight: 900; color: #475569; margin-top: 0.3mm; }
  `;
};

export const generateDocumentInnerHtml = (
  payload: TcPayload,
  schoolSettings: SchoolCertSettings,
  theme: TcTheme,
  opts: TcRenderOptions
): string => {
  const logoUrl = getPhotoUrl(schoolSettings.logoUrl) || '/logo.png';
  const photoSrc = getPhotoUrl(payload.photoUrl || '');
  const signSrc = getPhotoUrl(schoolSettings.principalSignatureUrl || '');
  const isLegal = payload.docKind === 'TC_LEGAL';

  const qrData = encodeURIComponent(
    `${isLegal ? 'TC' : 'RECORD_SHEET'}|${payload.tcNo}|${payload.admissionNo}|${payload.studentName}|${payload.lastClassStudied}|${schoolSettings.schoolName}`
  );
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;

  // Clean centered School Header (NO student photo in header)
  const headerHtml = `
    <div class="doc-header">
      <div class="doc-logo"><img src="${esc(logoUrl)}" alt="Logo" onerror="this.src='/logo.png'" /></div>
      <div class="doc-school-info">
        <div class="school-title">${esc(schoolSettings.schoolName)}</div>
        <div class="school-sub">${esc(schoolSettings.schoolSubtitle)}</div>
        <div class="school-rc">${esc(payload.rcNumber)}</div>
        <div class="school-addr">${esc(schoolSettings.address)}${payload.schoolCode ? ` | School Code: ${esc(payload.schoolCode)}` : ''}</div>
      </div>
      <div class="doc-header-spacer"></div>
    </div>
  `;

  const metaStripHtml = `
    <div class="pupil-top-row">
      <div class="pupil-meta-col">
        <div class="meta-strip">
          <div class="meta-cell"><span class="ml">${isLegal ? 'T.C. Serial No' : 'Record Sheet No'}</span><span class="mv">${valOrDash(payload.tcNo)}</span></div>
          <div class="meta-cell"><span class="ml">Book / Register No</span><span class="mv">${valOrDash(payload.bookNo)}</span></div>
          <div class="meta-cell"><span class="ml">Admission No</span><span class="mv">${valOrDash(payload.admissionNo)}</span></div>
          <div class="meta-cell"><span class="ml">UDISE Code</span><span class="mv">${valOrDash(payload.udiseCode)}</span></div>
        </div>
        <div class="gov-ids-strip">
          <span>Student PEN: <strong>${valOrDash(payload.penNumber)}</strong></span>
          <span>Child ID: <strong>${valOrDash(payload.childId)}</strong></span>
          <span>APAAR ID: <strong>${valOrDash(payload.apaarId)}</strong></span>
          ${opts.showAadhaar ? `<span>Aadhaar: <strong>${valOrDash(payload.aadharNo)}</strong></span>` : ''}
        </div>
      </div>
      ${
        opts.showPhoto
          ? `<div class="photo-box">${
              photoSrc
                ? `<img src="${esc(photoSrc)}" alt="Student" />`
                : `<div class="photo-placeholder">AFFIX<br/>PASSPORT<br/>PHOTO</div>`
            }</div>`
          : ''
      }
    </div>
  `;

  const signaturesHtml = `
    <div class="doc-signatures">
      <div class="sig-col">
        <div class="sig-space"></div>
        <div class="sig-rule"></div>
        <div class="sig-title">Prepared By</div>
        <div class="sig-sub">Office Clerk / Date: ${esc(payload.issueDate)}</div>
      </div>

      <div class="sig-col" style="width:36mm;">
        <div class="sig-space"></div>
        <div class="sig-rule"></div>
        <div class="sig-title">Verified By</div>
        <div class="sig-sub">Class Teacher / In-charge</div>
      </div>

      ${
        opts.showSealBox
          ? `<div class="seal-box">School<br/>Official<br/>Seal</div>`
          : ''
      }

      ${
        opts.showQr
          ? `<div class="qr-box"><img src="${qrSrc}" alt="QR Verify" /><span>DIGITAL VERIFY</span></div>`
          : ''
      }

      <div class="sig-col" style="width:48mm;">
        <div class="sig-space">
          ${opts.showSignature && signSrc ? `<img src="${esc(signSrc)}" alt="Principal Signature" />` : ''}
        </div>
        <div class="sig-rule"></div>
        <div class="sig-title">Headmaster / Principal</div>
        <div class="sig-sub">${esc(payload.place)} &middot; Signature with Stamp</div>
      </div>
    </div>
  `;

  if (!isLegal) {
    // RECORD SHEET (A4: Classes Nursery - V)
    const rsRows: [string, string, string][] = [
      ['1', 'Name of the Pupil (in Block Letters)', `<strong style="text-transform:uppercase">${valOrDash(payload.studentName)}</strong><span class="val-sub">Gender: ${valOrDash(payload.gender)} | Nationality: ${valOrDash(payload.nationality)}</span>`],
      ['2', "Father's Name / Guardian's Name", valOrDash(payload.fatherName || payload.guardianName)],
      ['3', "Mother's Name", valOrDash(payload.motherName)],
      ['4', 'Religion, Caste / Social Category & Mother Tongue', `${valOrDash(payload.religionCaste)} &nbsp;|&nbsp; Mother Tongue: ${valOrDash(payload.motherTongue)}`],
      ['5', 'Date of Birth (as entered in Admission Register)', `<strong>${valOrDash(payload.dobFigures)}</strong>${payload.dobWords ? `<span class="val-sub">In Words: ${esc(payload.dobWords)}</span>` : ''}`],
      ['6', 'Class in which Pupil was first admitted & Date', `${valOrDash(payload.classAtAdmission)} &nbsp;(Admitted on: ${valOrDash(payload.dateOfAdmission)})`],
      ['7', 'Class in which Pupil was studying at leaving', `<strong>${valOrDash(payload.lastClassStudied)}</strong> — ${esc(payload.lastClassInWords)}`],
      ['8', 'Medium of Instruction & Languages Studied', `${valOrDash(payload.medium)} &nbsp;|&nbsp; Languages: ${valOrDash(payload.firstLanguage)}, ${valOrDash(payload.secondLanguage)}`],
      ['9', 'Personal Marks of Identification (as per register)', `1) ${valOrDash(payload.idMark1)}<br/>2) ${valOrDash(payload.idMark2)}`],
      ['10', 'Whether qualified for promotion to higher class', `${valOrDash(payload.qualifiedForPromotion)} &nbsp;→&nbsp; ${valOrDash(payload.promotedToClass)}`],
      ['11', 'Whether all School Fees & Dues paid up to date', valOrDash(payload.feesPaid)],
      ['12', 'Total Working Days / Days Attended by Pupil', `${valOrDash(payload.attendedDays)} / ${valOrDash(payload.workingDays)} Days &nbsp;(Last Attended: ${valOrDash(payload.lastAttendanceDate)})`],
      ['13', 'General Conduct, Discipline & Character', valOrDash(payload.conduct)],
      ['14', 'Date of Application & Date of Issue of Record Sheet', `Applied: ${valOrDash(payload.applicationDate)} &nbsp;|&nbsp; Issued: ${valOrDash(payload.issueDate)}`],
      ['15', 'Reason for Leaving & Remarks', `${valOrDash(payload.reasonForLeaving)}${payload.remarks && payload.remarks !== '—' ? ` (${esc(payload.remarks)})` : ''}`],
    ];

    return `
      <div class="doc-sheet">
        <div class="doc-outer-frame"></div>
        <div class="doc-inner-frame"></div>
        <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
        <div class="doc-watermark"><img src="${esc(logoUrl)}" alt="Watermark" /></div>
        <div class="doc-content">
          <div class="doc-body-main">
            ${headerHtml}
            <div class="doc-banner">
              <div class="doc-banner-pill">PRIMARY SCHOOL RECORD SHEET</div>
              <div class="doc-banner-sub">Issued for Pre-Primary &amp; Primary Students (Nursery to Class V) &middot; Govt. Approved Proforma</div>
            </div>
            ${metaStripHtml}
            <div class="clause-table-wrap">
              <table class="clause-table">
                <tbody>
                  ${rsRows
                    .map(
                      ([sl, lbl, val]) => `
                    <tr>
                      <td class="col-sl">${sl}</td>
                      <td class="col-lbl">${lbl}</td>
                      <td class="col-val">${val}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="mini-history-wrap">
              <div class="mini-history-title">Academic Study Progression in this Institution</div>
              <table class="mini-history-table">
                <thead>
                  <tr><th style="width:15%">Sl.</th><th style="width:30%">Academic Year</th><th style="width:25%">Class Studied</th><th style="width:30%">Promotion Status</th></tr>
                </thead>
                <tbody>
                  ${payload.academicRows
                    .map(
                      (r, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${esc(r.year)}</td>
                      <td>${esc(r.className)}</td>
                      <td>${esc(r.remarks)}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="cert-declaration">
              Certified that the particulars entered above strictly conform to the School Admission Register and Attendance Records maintained by this institution.
            </div>
          </div>

          <div>
            ${signaturesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // TRANSFER CERTIFICATE (LEGAL: Classes VI - X+)
  const tcRows: [string, string, string][] = [
    ['1', 'Name of the Pupil (in Block Letters)', `<strong style="text-transform:uppercase;font-size:10.2pt;">${valOrDash(payload.studentName)}</strong> &nbsp;(${valOrDash(payload.gender)})`],
    ['2', "Father's Name / Guardian's Name", valOrDash(payload.fatherName || payload.guardianName)],
    ['3', "Mother's Name", valOrDash(payload.motherName)],
    ['4', 'Nationality, Religion & Caste / Social Category', `${valOrDash(payload.nationality)} &nbsp;|&nbsp; ${valOrDash(payload.religionCaste)} &nbsp;|&nbsp; Mother Tongue: ${valOrDash(payload.motherTongue)}`],
    ['5', 'Date of Birth according to Admission Register (in Figures & Words)', `<strong>${valOrDash(payload.dobFigures)}</strong>${payload.dobWords ? `<span class="val-sub">In Words: ${esc(payload.dobWords)}</span>` : ''}`],
    ['6', 'Date of First Admission in School & Class Admitted', `${valOrDash(payload.dateOfAdmission)} &nbsp;|&nbsp; Admitted in: ${valOrDash(payload.classAtAdmission)}`],
    ['7', 'Class in which the Pupil last studied (in Figures & Words)', `<strong>${valOrDash(payload.lastClassStudied)}</strong> — ${esc(payload.lastClassInWords)}`],
    ['8', 'School / Board Annual Examination last taken & Result', valOrDash(payload.examResult)],
    ['9', 'Medium of Instruction & Languages Studied', `${valOrDash(payload.medium)} &nbsp;|&nbsp; 1st: ${valOrDash(payload.firstLanguage)}, 2nd: ${valOrDash(payload.secondLanguage)}, 3rd: ${valOrDash(payload.thirdLanguage)}`],
    ['10', 'Subjects Studied in the last attended Class', valOrDash(payload.subjectsOffered)],
    ['11', 'Whether qualified for promotion to higher class', `${valOrDash(payload.qualifiedForPromotion)} &nbsp;→&nbsp; ${valOrDash(payload.promotedToClass)}`],
    ['12', 'Whether all School / Library / Bus Fees paid up to date', valOrDash(payload.feesPaid)],
    ['13', 'Any Fee Concession / Scholarship availed (if so, nature)', valOrDash(payload.feeConcession)],
    ['14', 'Total Working Days & Number of Days Pupil Attended', `${valOrDash(payload.attendedDays)} Days Attended out of ${valOrDash(payload.workingDays)} Working Days`],
    ['15', "Date on which Pupil's name was struck off / Last Attendance", valOrDash(payload.lastAttendanceDate)],
    ['16', 'Personal Marks of Identification (as per Admission Register)', `i) ${valOrDash(payload.idMark1)}<br/>ii) ${valOrDash(payload.idMark2)}`],
    ['17', 'Date of Application for T.C. & Date of Issue of T.C.', `Applied on: ${valOrDash(payload.applicationDate)} &nbsp;|&nbsp; Issued on: ${valOrDash(payload.issueDate)}`],
    ['18', 'General Conduct, Character & Reason for Leaving', `Conduct: <strong>${valOrDash(payload.conduct)}</strong> &nbsp;|&nbsp; Reason: ${valOrDash(payload.reasonForLeaving)}${payload.remarks && payload.remarks !== '—' ? ` — ${esc(payload.remarks)}` : ''}`],
  ];

  return `
    <div class="doc-sheet">
      <div class="doc-outer-frame"></div>
      <div class="doc-inner-frame"></div>
      <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
      <div class="doc-watermark"><img src="${esc(logoUrl)}" alt="Watermark" /></div>
      <div class="doc-content">
        <div class="doc-body-main">
          ${headerHtml}
          <div class="doc-banner">
            <div class="doc-banner-pill">TRANSFER CERTIFICATE (T.C.)</div>
            <div class="doc-banner-sub">${payload.affiliationNo ? `Affiliation / Recog: ${esc(payload.affiliationNo)} &middot; ` : ''}Official Secondary &amp; High School Transfer Certificate (Legal Format)</div>
          </div>
          ${metaStripHtml}
          <div class="clause-table-wrap">
            <table class="clause-table">
              <tbody>
                ${tcRows
                  .map(
                    ([sl, lbl, val]) => `
                  <tr>
                    <td class="col-sl">${sl}</td>
                    <td class="col-lbl">${lbl}</td>
                    <td class="col-val">${val}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="cert-declaration">
            I hereby certify that the above entries match the original School Admission Register. Issued strictly for bonafide academic transfer &amp; higher education admission.
          </div>
          <div class="doc-footer-note">
            NOTE: No change or unauthorized alteration in any entry shall be made except by the issuing authority. Overwriting renders this certificate invalid.
          </div>
        </div>

        <div>
          ${signaturesHtml}
        </div>
      </div>
    </div>
  `;
};
