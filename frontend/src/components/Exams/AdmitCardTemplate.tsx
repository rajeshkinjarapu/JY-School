import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
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
}) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url?: string, defaultFallback: string = '') => {
    if (!url || url === 'null' || url === 'undefined') return defaultFallback;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url === '/logo.png' || url === 'logo.png') return '/logo.png';
    return `${API_BASE.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  };

  const signatureUrl = resolveUrl(propSignatureUrl || settings.signatureUrl || '');
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

  const renderHeader = () => (
    <div className="flex items-center gap-6 p-6 border-b-2 border-slate-900 bg-slate-50">
      <div className="w-24 h-24 shrink-0 bg-white border border-slate-300 p-2 shadow-sm rounded-lg flex items-center justify-center overflow-hidden">
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
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-white inline-flex px-4 py-1 rounded-full border border-slate-200 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-slate-800" />
          {settings.examCenterOverride || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta'}
        </div>
      </div>
    </div>
  );

  const renderTitleBadges = () => (
    <div className="flex flex-col items-center py-6 border-b border-slate-200">
      <div className="bg-slate-900 text-white px-8 py-1.5 rounded-sm shadow-md mb-3 transform -skew-x-12">
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
      <div className="flex-1 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-slate-800 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <User className="w-4 h-4" /> Candidate Details
          </h3>
        </div>
        <table className="w-full text-sm text-left border-collapse">
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider w-1/3 bg-slate-50 border-r border-slate-200">Candidate Name</td>
              <td className="py-3 px-4 font-black text-slate-900 uppercase text-[13px]">{student?.user?.name || student?.name}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Father Name</td>
              <td className="py-3 px-4 font-black text-slate-900 uppercase text-[13px]">{student?.parent?.fatherName || student?.fatherName || '-'}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Roll Number</td>
              <td className="py-3 px-4 font-black text-slate-900 text-[13px]">{student?.rollNo || 'N/A'}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Class & Section</td>
              <td className="py-3 px-4 font-black text-slate-900 text-[13px]">
                {className || student?.class?.name || student?.className || '-'} - {section || student?.class?.section || student?.section || '-'}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Gender / DOB</td>
              <td className="py-3 px-4 font-black text-slate-900 text-[13px]">
                {student?.gender || 'Male'} &nbsp;|&nbsp; {student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50 border-r border-slate-200">Exam Center</td>
              <td className="py-3 px-4 font-black text-slate-900 text-[13px]">{settings.examCenterOverride || 'JY School Main Campus, Hall A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="w-[120px] shrink-0 flex flex-col">
        <div className="w-full aspect-[3/4] border-2 border-slate-300 rounded-lg p-1 bg-white shadow-sm flex flex-col items-center justify-center overflow-hidden">
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
    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm mt-2">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-white" />
        <h4 className="text-xs font-bold text-white uppercase tracking-widest">
          Examination Schedule
        </h4>
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
          <tr>
            <th className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-widest text-center w-12 border-r border-slate-300">S.No</th>
            <th className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Date</th>
            <th className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Subject</th>
            <th className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-widest border-r border-slate-300">Time</th>
            <th className="py-3 px-4 font-extrabold uppercase text-[10px] tracking-widest text-center">Invigilator Sign</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {displaySchedule.map((plan: any, i: number) => (
            <tr key={plan.id || i} className="hover:bg-slate-50">
              <td className="py-2.5 px-4 text-[12px] font-bold text-center text-slate-800 border-r border-slate-200">{i + 1}</td>
              <td className="py-2.5 px-4 text-[12px] font-bold text-slate-800 border-r border-slate-200">
                {plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}
              </td>
              <td className="py-2.5 px-4 text-[12px] font-bold text-slate-800 border-r border-slate-200 uppercase">
                {plan.subject?.name || plan.subject || plan.name}
              </td>
              <td className="py-2.5 px-4 text-[12px] font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                {plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}` || '09:30 AM - 12:30 PM'}
              </td>
              <td className="py-2.5 px-4 text-center text-slate-400 font-bold tracking-widest">..................</td>
            </tr>
          ))}
          {displaySchedule.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400 font-medium text-xs bg-slate-50 italic">No schedule mapped for this class.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFooter = () => (
    <div className="mt-auto m-6 p-5 rounded-lg border-2 border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-end gap-6 relative">
      <div className="flex-1">
        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
          <span className="bg-slate-900 w-1.5 h-1.5 rounded-full"></span> Important Instructions
        </h5>
        <ul className="text-[10px] text-slate-700 font-semibold space-y-2 list-decimal pl-5 pr-4 text-justify leading-relaxed">
          {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
            <li key={idx} className="pl-1">{line}</li>
          ))}
        </ul>
      </div>

      <div className="w-56 shrink-0 flex flex-col items-center justify-end text-center">
        <div className="w-full h-24 flex items-end justify-center mb-2">
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature" className="h-full object-contain mix-blend-multiply" />
          ) : (
            <div className="w-full border-b border-dashed border-slate-400 mb-1" />
          )}
        </div>
        {signatureUrl && <div className="w-full border-t border-slate-300 mb-1"></div>}
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 mt-1">Principal Signature</span>
      </div>
    </div>
  );

  const Watermark = () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
      <img src={logoUrl || '/logo.png'} alt="Watermark" className="w-[380px] h-[380px] object-contain grayscale" />
    </div>
  );

  // Single page (default) — full A4 professional design unchanged
  return (
    <div
      className="admit-card-container admit-card-wrapper admit-card-page bg-white p-6 w-[210mm] min-h-[297mm] mx-auto flex flex-col relative"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <Watermark />
      <div className="w-full flex-1 border-4 border-slate-900 p-1 relative flex flex-col z-10 bg-transparent">
        <div className="w-full flex-1 border border-slate-900 flex flex-col bg-white/95 relative">
          {renderHeader()}
          {renderTitleBadges()}
          <div className="flex-1 flex flex-col gap-6 p-6">
            {renderCandidateDetails()}
            {renderExamSchedule()}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );
};
