import React from 'react';
import { User, Calendar, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photo';

export const getAutoExamSchedule = (
  exam: any,
  classId?: string,
  className?: string,
  section?: string,
  defaultTiming?: string
) => {
  if (!exam || !exam.subjects) return [];

  let subjectsData = exam.subjects;
  if (typeof subjectsData === 'string') {
    try { subjectsData = JSON.parse(subjectsData); } catch (e) {}
  }

  let classSubs: any[] = [];

  // 1. Try to find class in classConfigs
  if (subjectsData?.classConfigs && Array.isArray(subjectsData.classConfigs)) {
    let foundCfg = classId ? subjectsData.classConfigs.find((c: any) => c.classId === classId) : null;
    if (!foundCfg && className) {
      const cleanTarget = `${className}${section || ''}`.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      foundCfg = subjectsData.classConfigs.find((c: any) => {
        const cleanName = (c.className || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        return cleanName === cleanTarget;
      });
    }
    if (foundCfg && Array.isArray(foundCfg.subjects) && foundCfg.subjects.length > 0) {
      classSubs = foundCfg.subjects;
    }
  }

  // 2. Fallback to globalSubjects or flat subjects array
  if (classSubs.length === 0) {
    if (Array.isArray(subjectsData?.globalSubjects) && subjectsData.globalSubjects.length > 0) {
      classSubs = subjectsData.globalSubjects;
    } else if (Array.isArray(subjectsData) && subjectsData.length > 0) {
      classSubs = subjectsData;
    }
  }

  if (classSubs.length === 0) return [];

  const timing = defaultTiming || exam?.admitCardSettings?.defaultTiming || '09:30 AM - 12:30 PM';

  return classSubs.map((sub: any, idx: number) => ({
    id: sub.id || idx,
    date: sub.date || (exam?.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : ''),
    subject: typeof sub === 'string' ? sub : (sub.name || sub.subject || ''),
    timing: sub.timing || timing,
    maxMarks: sub.maxMarks
  }));
};

const resolveUrl = (url?: string, defaultFallback: string = '') => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (!url || url === 'null' || url === 'undefined') return defaultFallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url === '/logo.png' || url === 'logo.png') return '/logo.png';
  return `${API_BASE.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. FRONT HALF-CARD (A5: 134mm Height, Full Width: 100%)
// Clean, spacious, prestigious Front Page:
// - Grand Georgia serif header (increased height & size, prominent logo & campus)
// - Centered skewed black ADMIT CARD badge + Exam Title
// - Integrated Candidate Details Box (Student Image inside the box on the right)
// - Instructions, bottom signatures & reverse notice removed as requested
// ──────────────────────────────────────────────────────────────────────────────
export const AdmitCardFrontHalf: React.FC<{
  student: any;
  exam: any;
  className?: string;
  section?: string;
  logoUrl?: string;
  signatureUrl?: string;
}> = ({ student, exam, className, section, logoUrl: propLogoUrl }) => {
  if (!student) {
    return (
      <div className="w-full h-[134mm] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">
        End of Class Roster (No Candidate)
      </div>
    );
  }

  const settings = exam?.admitCardSettings || {};
  const logoUrl = resolveUrl(propLogoUrl || settings.logoUrl, '/logo.png');
  const resolvedClass = className || student?.class?.name || student?.className || '-';
  const resolvedSection = section || student?.class?.section || student?.section || '-';
  const examTitle = settings.examTitleOverride || exam?.name || 'EXAMINATION ADMIT CARD';
  const examCenter = settings.examCenterOverride || 'JY School Main Campus, Hall A';
  const schoolName = settings.schoolName || 'SRI VENKATESWARA JY SCHOOL';
  const schoolSubtitle = settings.schoolSubtitle || '(IIT-JEE/NEET Foundation – Olympiads)';

  return (
    <div
      className="w-full h-full max-h-[138.5mm] bg-white border-[3px] border-slate-900 p-0.5 box-border relative overflow-hidden flex flex-col justify-between"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <img src={logoUrl || '/logo.png'} alt="Watermark" className="w-[180px] h-[180px] object-contain grayscale" />
      </div>

      <div className="w-full h-full flex-1 border border-slate-900 bg-white/95 relative z-10 flex flex-col justify-between p-2.5 box-border overflow-hidden">
        {/* Grand School Header (Bolder & Larger Size) */}
        <div className="flex items-center gap-4 pb-2 border-b-2 border-slate-900 bg-slate-50 -mx-2.5 -mt-2.5 p-2 px-3.5">
          <div className="w-[72px] h-[72px] shrink-0 bg-white border border-slate-300 p-1.5 shadow-2xs rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src={logoUrl || '/logo.png'}
              alt="Logo"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
              }}
            />
          </div>
          <div className="flex-1 text-center pr-2">
            <h1 className="text-[22px] sm:text-[25px] leading-tight font-black uppercase tracking-wider text-slate-950" style={{ fontFamily: '"Georgia", serif' }}>
              {schoolName}
            </h1>
            <p className="text-[12px] sm:text-[13px] font-black uppercase tracking-[0.16em] text-slate-800 leading-tight mt-1">
              {schoolSubtitle}
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-bold text-slate-800 bg-white px-3.5 py-0.5 rounded-full border border-slate-300 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-slate-900" />
              <span className="truncate max-w-[380px]">{examCenter}</span>
            </div>
          </div>
        </div>

        {/* Title Badges */}
        <div className="flex flex-col items-center py-1">
          <div className="bg-slate-900 text-white px-8 py-1.5 rounded-xs shadow-xs mb-0.5 transform -skew-x-12 inline-block">
            <h2 className="text-[13px] font-black uppercase tracking-[0.25em] transform skew-x-12">
              ADMIT CARD
            </h2>
          </div>
          <h3 className="text-[15px] sm:text-[17px] font-black text-slate-950 uppercase tracking-widest text-center mt-1 leading-tight">
            {examTitle}
          </h3>
        </div>

        {/* Unified Candidate Details Box (Student Image Integrated Inside - Aligned to TOP on right) */}
        <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-2xs bg-white flex flex-col flex-1 my-0.5">
          {/* Box Header */}
          <div className="bg-slate-800 px-3.5 py-1.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white" />
              <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-white">
                Candidate Details
              </h4>
            </div>
            <span className="text-[8.5px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              OFFICIAL HALL TICKET
            </span>
          </div>

          {/* Box Content: Table on Left + Photo on Right (Aligned TOP) */}
          <div className="flex items-stretch flex-1 divide-x divide-slate-200 bg-white">
            {/* Table Area */}
            <table className="w-full h-full text-left border-collapse text-[10px] flex-1">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider w-[34%] bg-slate-50 border-r border-slate-200">
                    Candidate Name
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 uppercase text-[12px] truncate">
                    {student?.user?.name || student?.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider bg-slate-50 border-r border-slate-200">
                    Father Name
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 uppercase text-[11.5px] truncate">
                    {student?.parent?.fatherName || student?.fatherName || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider bg-slate-50 border-r border-slate-200">
                    Roll Number
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 text-[12px]">
                    {student?.rollNo || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider bg-slate-50 border-r border-slate-200">
                    Class & Section
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 text-[11.5px]">
                    {resolvedClass} - {resolvedSection}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider bg-slate-50 border-r border-slate-200">
                    Gender / DOB
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 text-[11px]">
                    {student?.gender || 'Male'} &nbsp;|&nbsp; {student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold text-slate-600 uppercase text-[9px] tracking-wider bg-slate-50 border-r border-slate-200">
                    Exam Center
                  </td>
                  <td className="py-2 px-3.5 font-black text-slate-900 text-[11px] truncate">
                    {examCenter}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Photo Inside Box - Aligned to TOP */}
            <div className="w-[130px] shrink-0 p-2.5 pt-3.5 bg-slate-50/40 flex flex-col items-center justify-start">
              <div className="w-full aspect-[3/4] border-2 border-slate-300 rounded-lg p-1 bg-white shadow-2xs flex flex-col items-center justify-center overflow-hidden">
                {student?.user?.photoUrl ? (
                  <img
                    src={getPhotoUrl(student.user.photoUrl)}
                    alt="Student"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full border border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-center p-1 bg-slate-50">
                    <User className="w-8 h-8 mb-1 opacity-30 text-slate-800" />
                    <span className="text-[8.5px] uppercase font-bold leading-tight text-slate-400 tracking-wider">
                      Affix<br />Photo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. BACK HALF-CARD (A5: 134mm Height, Full Width: 100%)
// Examination Timetable, Instructions & 3 Signatures:
// - Direct Examination Schedule (School header removed as requested)
// - Reduced Subject column width, Invigilator Sign single-line & dots removed
// - Enlarged instructions text size
// - 3 Signatures: Parent Signature, Class Teacher Sign & Principal Signature
// ──────────────────────────────────────────────────────────────────────────────
export const AdmitCardBackHalf: React.FC<{
  student: any;
  exam: any;
  className?: string;
  section?: string;
  logoUrl?: string;
  signatureUrl?: string;
  teacherSignatureUrl?: string;
  examPlans?: any[];
}> = ({ student, exam, className, section, logoUrl: propLogoUrl, signatureUrl: propSignatureUrl, teacherSignatureUrl: propTeacherSignatureUrl, examPlans }) => {
  if (!student) {
    return (
      <div className="w-full h-[134mm] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">
        End of Class Roster (No Candidate)
      </div>
    );
  }

  const settings = exam?.admitCardSettings || {};
  const logoUrl = resolveUrl(propLogoUrl || settings.logoUrl, '/logo.png');
  const signatureUrl = resolveUrl(propSignatureUrl || settings.signatureUrl || '');
  const teacherSignatureUrl = resolveUrl(propTeacherSignatureUrl || settings.teacherSignatureUrl || '');
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';

  const autoSchedule = getAutoExamSchedule(
    exam,
    student?.classId || student?.class?.id,
    className || student?.class?.name || student?.className,
    section || student?.class?.section || student?.section,
    settings.defaultTiming
  );

  const displaySchedule = (settings.schedule && settings.schedule.length > 0)
    ? settings.schedule
    : (autoSchedule.length > 0 ? autoSchedule : (examPlans || []));

  return (
    <div
      className="w-full h-full max-h-[138.5mm] bg-white border-[3px] border-slate-900 p-0.5 box-border relative overflow-hidden flex flex-col justify-between"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <img src={logoUrl || '/logo.png'} alt="Watermark" className="w-[160px] h-[160px] object-contain grayscale" />
      </div>

      <div className="w-full h-full flex-1 border border-slate-900 bg-white/95 relative z-10 flex flex-col justify-between p-2.5 box-border overflow-hidden">
        {/* Examination Schedule Table - Directly on top without bulky school header */}
        <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-2xs bg-white">
          <div className="bg-slate-800 px-3.5 py-1.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">
                Examination Schedule & Time Table
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] font-bold text-amber-300 uppercase tracking-wider">
                Reporting: 30 Mins Before
              </span>
              <span className="text-[9px] font-bold text-slate-300 uppercase">
                • Candidate: <strong className="text-white font-black">{student?.user?.name || student?.name}</strong> ({student?.rollNo || '-'})
              </span>
            </div>
          </div>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[9px] uppercase font-black">
              <tr>
                <th className="py-1 px-2 text-center w-8 border-r border-slate-300">S.No</th>
                <th className="py-1 px-2.5 w-24 border-r border-slate-300 whitespace-nowrap">Date</th>
                <th className="py-1 px-2.5 w-32 border-r border-slate-300">Subject</th>
                <th className="py-1 px-2.5 w-32 border-r border-slate-300 whitespace-nowrap">Time</th>
                <th className="py-1 px-3 text-center w-44 min-w-[140px] border-slate-300 whitespace-nowrap font-black uppercase tracking-wider text-[9.5px]">
                  Invigilator Sign
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {displaySchedule.slice(0, 8).map((plan: any, i: number) => (
                <tr key={plan.id || i} className="hover:bg-slate-50">
                  <td className="py-1 px-2 font-bold text-center text-slate-800 border-r border-slate-200">{i + 1}</td>
                  <td className="py-1 px-2.5 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                    {plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="py-1 px-2.5 font-black text-slate-900 border-r border-slate-200 uppercase truncate">
                    {plan.subject?.name || plan.subject || plan.name}
                  </td>
                  <td className="py-1 px-2.5 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap text-[9px]">
                    {plan.timing || '09:30 AM - 12:30 PM'}
                  </td>
                  <td className="py-1 px-3 text-center border-slate-200"></td>
                </tr>
              ))}
              {displaySchedule.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-400 font-medium text-[9px] italic">
                    No schedule mapped for this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Instructions & Candidate Declaration Box - Reduced top padding & English only */}
        <div className="p-2 px-2.5 rounded-lg border border-slate-200 bg-slate-50 mt-1 mb-0.5">
          <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-0.5 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Instructions & Candidate Declaration
          </h5>
          <ul className="text-[9.5px] text-slate-800 font-semibold space-y-0.5 list-decimal pl-4.5 leading-relaxed">
            {instructions.split('\n').filter(Boolean).slice(0, 3).map((line: string, idx: number) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>

        {/* 3 Signatures: Parent, Class Teacher & Principal (Clean - No lines above signatures, 3x Principal Sign) */}
        <div className="flex items-end justify-between px-6 pb-0.5 bg-white">
          {/* Parent Signature */}
          <div className="text-center w-36 flex flex-col items-center">
            <div className="h-12 flex items-end justify-center mb-1" />
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-800">
              Parent Signature
            </span>
          </div>

          {/* Class Teacher Signature */}
          <div className="text-center w-40 flex flex-col items-center">
            <div className="h-12 flex items-end justify-center mb-1">
              {teacherSignatureUrl ? (
                <img src={teacherSignatureUrl} alt="Teacher Signature" className="h-full max-h-[48px] w-auto max-w-[130px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-800">
              Class Teacher Sign
            </span>
          </div>

          {/* Principal Signature (3x larger image) */}
          <div className="text-center w-48 flex flex-col items-center">
            <div className="h-14 flex items-end justify-center mb-1">
              {signatureUrl ? (
                <img src={signatureUrl} alt="Principal Signature" className="h-full max-h-[56px] w-auto max-w-[160px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-900">
              Principal Signature
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. 2-IN-1 A4 SHEET PAIR (276mm Height: Fits 100% on ANY A4 Printer!)
// Top Card (134mm) + Cutline (6mm) + Bottom Card (134mm) = 274mm total!
// Guaranteed to NEVER overflow onto a second page!
// ──────────────────────────────────────────────────────────────────────────────
export const AdmitCardSheetPair: React.FC<{
  side: 'front' | 'back';
  studentTop: any;
  studentBottom?: any;
  exam: any;
  className?: string;
  section?: string;
  logoUrl?: string;
  signatureUrl?: string;
  teacherSignatureUrl?: string;
  examPlans?: any[];
}> = ({ side, studentTop, studentBottom, exam, className, section, logoUrl, signatureUrl, teacherSignatureUrl, examPlans }) => {
  return (
    <div
      className="w-[204mm] h-[288mm] max-h-[288mm] mx-auto bg-white box-border flex flex-col justify-between overflow-hidden relative"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Upper Half Card (138.5mm) */}
      <div className="w-full h-[138.5mm] shrink-0 overflow-hidden">
        {side === 'front' ? (
          <AdmitCardFrontHalf
            student={studentTop}
            exam={exam}
            className={className}
            section={section}
            logoUrl={logoUrl}
            signatureUrl={signatureUrl}
          />
        ) : (
          <AdmitCardBackHalf
            student={studentTop}
            exam={exam}
            className={className}
            section={section}
            logoUrl={logoUrl}
            signatureUrl={signatureUrl}
            teacherSignatureUrl={teacherSignatureUrl}
            examPlans={examPlans}
          />
        )}
      </div>

      {/* Center Dashed Cut Line (11mm - centered at exact 148.5mm midpoint of A4) */}
      <div className="w-full h-[11mm] shrink-0 flex items-center justify-center relative my-0">
        <div className="w-full border-t-2 border-dashed border-slate-400"></div>
        <span className="absolute bg-white px-4 py-0.5 text-[8.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border border-slate-300 rounded-full shadow-2xs">
          ✂ CUT ALONG THIS LINE (A5 SIZE) ✂
        </span>
      </div>

      {/* Lower Half Card (138.5mm) */}
      <div className="w-full h-[138.5mm] shrink-0 overflow-hidden">
        {studentBottom ? (
          side === 'front' ? (
            <AdmitCardFrontHalf
              student={studentBottom}
              exam={exam}
              className={className}
              section={section}
              logoUrl={logoUrl}
              signatureUrl={signatureUrl}
            />
          ) : (
            <AdmitCardBackHalf
              student={studentBottom}
              exam={exam}
              className={className}
              section={section}
              logoUrl={logoUrl}
              signatureUrl={signatureUrl}
              teacherSignatureUrl={teacherSignatureUrl}
              examPlans={examPlans}
            />
          )
        ) : (
          <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
            End of Class Roster (No Candidate)
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. FULL SINGLE PAGE ADMIT CARD (Default when Double Side is unchecked)
// ──────────────────────────────────────────────────────────────────────────────
interface AdmitCardTemplateProps {
  student: any;
  exam: any;
  examPlans: any[];
  className?: string;
  section?: string;
  doubleSided?: boolean;
  logoUrl?: string;
  signatureUrl?: string;
  teacherSignatureUrl?: string;
}

export const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({
  student,
  exam,
  examPlans,
  className,
  section,
  doubleSided = false,
  logoUrl: propLogoUrl,
  signatureUrl: propSignatureUrl,
  teacherSignatureUrl: propTeacherSignatureUrl,
}) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';

  const signatureUrl = resolveUrl(propSignatureUrl || settings.signatureUrl || '');
  const teacherSignatureUrl = resolveUrl(propTeacherSignatureUrl || settings.teacherSignatureUrl || '');
  const logoUrl = resolveUrl(propLogoUrl || settings.logoUrl, '/logo.png');

  const autoSchedule = getAutoExamSchedule(
    exam,
    student?.classId || student?.class?.id,
    className || student?.class?.name || student?.className,
    section || student?.class?.section || student?.section,
    settings.defaultTiming
  );

  const displaySchedule = (settings.schedule && settings.schedule.length > 0)
    ? settings.schedule
    : (autoSchedule.length > 0 ? autoSchedule : (examPlans || []));

  // If double-sided is requested for a single student view/download:
  if (doubleSided) {
    return (
      <div className="flex flex-col gap-6 mx-auto admit-card-container">
        {/* Page 1: Front Half */}
        <div className="admit-card-wrapper admit-card-page bg-white p-2 w-[200mm] flex justify-center">
          <AdmitCardFrontHalf
            student={student}
            exam={exam}
            className={className}
            section={section}
            logoUrl={logoUrl}
            signatureUrl={signatureUrl}
          />
        </div>

        {/* Page 2: Back Half */}
        <div className="admit-card-wrapper admit-card-page bg-white p-2 w-[200mm] flex justify-center">
          <AdmitCardBackHalf
            student={student}
            exam={exam}
            className={className}
            section={section}
            logoUrl={logoUrl}
            signatureUrl={signatureUrl}
            teacherSignatureUrl={teacherSignatureUrl}
            examPlans={examPlans}
          />
        </div>
      </div>
    );
  }

  // Single Page View (Default Full A4)
  const Watermark = () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
      <img src={logoUrl || '/logo.png'} alt="Watermark" className="w-[380px] h-[380px] object-contain grayscale" />
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center gap-6 p-6 border-b-2 border-slate-900 bg-slate-50">
      <div className="w-24 h-24 shrink-0 bg-white border border-slate-300 p-2 shadow-xs rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={logoUrl || '/logo.png'}
          alt="School Logo"
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
          }}
        />
      </div>
      <div className="flex-1 text-center pr-10">
        <h1 className="text-[22px] sm:text-[28px] whitespace-nowrap font-black uppercase tracking-wider text-slate-900 mb-1" style={{ fontFamily: '"Georgia", serif' }}>
          {settings?.schoolName || "SRI VENKATESWARA JY SCHOOL"}
        </h1>
        <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-700 mb-2">
          {settings?.schoolSubtitle || "(IIT-JEE/NEET Foundation – Olympiads)"}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-white inline-flex px-4 py-1 rounded-full border border-slate-200 shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-slate-800" />
          {settings.examCenterOverride || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta'}
        </div>
      </div>
    </div>
  );

  const renderTitleBadges = () => (
    <div className="flex flex-col items-center py-5 border-b border-slate-200">
      <div className="bg-slate-900 text-white px-8 py-1.5 rounded-sm shadow-md mb-2 transform -skew-x-12">
        <h2 className="text-xl font-black uppercase tracking-[0.25em] transform skew-x-12">
          ADMIT CARD
        </h2>
      </div>
      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest text-center">
        {settings.examTitleOverride || `${exam?.name}`}
      </h3>
    </div>
  );

  const renderCandidateDetails = () => (
    <div className="flex gap-6 items-stretch">
      <div className="flex-1 border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
        <div className="bg-slate-800 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <User className="w-4 h-4" /> Candidate Details
          </h3>
        </div>
        <table className="w-full text-sm text-left border-collapse">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider w-1/3 bg-slate-50 border-r border-slate-200">Candidate Name</td>
              <td className="py-2.5 px-4 font-black text-slate-900 uppercase text-[13px]">{student?.user?.name || student?.name}</td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Father Name</td>
              <td className="py-2.5 px-4 font-black text-slate-900 uppercase text-[13px]">{student?.parent?.fatherName || student?.fatherName || '-'}</td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Roll Number</td>
              <td className="py-2.5 px-4 font-black text-slate-900 text-[13px]">{student?.rollNo || 'N/A'}</td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Class & Section</td>
              <td className="py-2.5 px-4 font-black text-slate-900 text-[13px]">
                {className || student?.class?.name || student?.className || '-'} - {section || student?.class?.section || student?.section || '-'}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Gender / DOB</td>
              <td className="py-2.5 px-4 font-black text-slate-900 text-[13px]">
                {student?.gender || 'Male'} &nbsp;|&nbsp; {student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Exam Center</td>
              <td className="py-2.5 px-4 font-black text-slate-900 text-[13px]">{settings.examCenterOverride || 'JY School Main Campus, Hall A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="w-[120px] shrink-0 flex flex-col">
        <div className="w-full aspect-[3/4] border-2 border-slate-300 rounded-lg p-1 bg-white shadow-2xs flex flex-col items-center justify-center overflow-hidden">
          {student?.user?.photoUrl ? (
            <img src={getPhotoUrl(student.user.photoUrl)} alt="Student" className="w-full h-full object-cover rounded-md" />
          ) : (
            <div className="w-full h-full border border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-center p-2 bg-slate-50">
              <User className="w-8 h-8 mb-2 opacity-30 text-slate-800" />
              <span className="text-[10px] uppercase font-bold leading-tight text-slate-400 tracking-wider">Affix<br/>Photo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExamSchedule = () => (
    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs mt-2">
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-white" />
        <h4 className="text-xs font-bold text-white uppercase tracking-widest">
          Examination Schedule
        </h4>
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
          <tr>
            <th className="py-2 px-4 font-extrabold uppercase text-[10px] tracking-widest text-center w-12 border-r border-slate-300">S.No</th>
            <th className="py-2 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Date</th>
            <th className="py-2 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Subject</th>
            <th className="py-2 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Time</th>
            <th className="py-2 px-4 font-extrabold uppercase text-[10px] tracking-widest text-center whitespace-nowrap w-44 min-w-[140px]">Invigilator Sign</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {displaySchedule.map((plan: any, i: number) => (
            <tr key={plan.id || i} className="hover:bg-slate-50">
              <td className="py-2 px-4 font-bold text-center text-slate-800 border-r border-slate-200">{i + 1}</td>
              <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200">
                {plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}
              </td>
              <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200 uppercase">
                {plan.subject?.name || plan.subject || plan.name}
              </td>
              <td className="py-2 px-4 font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                {plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}` || '09:30 AM - 12:30 PM'}
              </td>
              <td className="py-2 px-4 text-center border-slate-200"></td>
            </tr>
          ))}
          {displaySchedule.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-slate-400 font-medium text-xs bg-slate-50 italic">No schedule mapped for this class.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFooter = () => (
    <div className="mt-auto rounded-lg border-2 border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
      {/* 1. Important Instructions at TOP */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50">
        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> Important Instructions
        </h5>
        <ul className="text-[10px] text-slate-800 font-semibold space-y-1 list-decimal pl-5 pr-4 text-justify leading-relaxed">
          {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
            <li key={idx} className="pl-0.5">{line}</li>
          ))}
        </ul>
      </div>

      {/* 2. 3 Signatures BELOW Instructions (Clean - No lines above signatures, 3x Principal Sign) */}
      <div className="flex items-end justify-between px-10 py-3.5 bg-white">
        {/* Parent Signature */}
        <div className="text-center w-36 flex flex-col items-center">
          <div className="h-12 flex items-end justify-center mb-1" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
            Parent Signature
          </span>
        </div>

        {/* Class Teacher Signature */}
        <div className="text-center w-40 flex flex-col items-center">
          <div className="h-12 flex items-end justify-center mb-1">
            {teacherSignatureUrl ? (
              <img src={teacherSignatureUrl} alt="Class Teacher Sign" className="h-full max-h-[48px] w-auto max-w-[130px] object-contain mix-blend-multiply" />
            ) : null}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
            Class Teacher Sign
          </span>
        </div>

        {/* Principal Signature (3x larger image) */}
        <div className="text-center w-48 flex flex-col items-center">
          <div className="h-14 flex items-end justify-center mb-1">
            {signatureUrl ? (
              <img src={signatureUrl} alt="Principal Signature" className="h-full max-h-[56px] w-auto max-w-[160px] object-contain mix-blend-multiply" />
            ) : null}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
            Principal Signature
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admit-card-container admit-card-wrapper admit-card-page bg-white p-6 w-[210mm] min-h-[297mm] mx-auto flex flex-col relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Watermark />
      <div className="w-full flex-1 border-4 border-slate-900 p-1 relative flex flex-col z-10 bg-transparent">
        <div className="w-full flex-1 border border-slate-900 flex flex-col bg-white/95 relative">
          {renderHeader()}
          {renderTitleBadges()}
          <div className="flex-1 flex flex-col gap-4 p-5">
            {renderCandidateDetails()}
            {renderExamSchedule()}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );
};
