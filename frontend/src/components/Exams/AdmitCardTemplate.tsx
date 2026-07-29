import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getPhotoUrl } from '../../utils/photo';

interface AdmitCardTemplateProps {
  student: any;
  exam: any;
  examPlans: any[];
  className?: string;
  section?: string;
}

export const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({ student, exam, examPlans, className, section }) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';
  
  // Resolve relative /uploads/ paths to the backend URL so images load correctly on Vercel
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const signatureUrl = resolveUrl(settings.signatureUrl || '');
  const logoUrl = resolveUrl(settings.logoUrl || '');

  return (
    <div className="admit-card-wrapper bg-white p-4 sm:p-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full h-full border-2 border-black rounded-xl relative flex flex-col bg-white overflow-hidden">
        
        {/* Header - Plain for Printing */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between border-b-2 border-black gap-4 sm:gap-0">
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white flex items-center justify-center shrink-0 border border-gray-300 p-1 sm:mr-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl font-black text-black">LOGO</span>
            )}
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-[20px] sm:text-[28px] lg:text-[36px] leading-tight font-black uppercase tracking-wide text-black mb-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-gray-800 mb-2">
              (IIT-JEE/NEET Foundation – Olympiads)
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-black" />
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </div>
          </div>
          <div className="w-24 sm:w-28 shrink-0 hidden md:block"></div> {/* Spacer for centering */}
        </div>

        {/* Title Badge */}
        <div className="flex flex-col justify-center items-center mt-4 mb-2">
          <div className="bg-white border-2 border-black rounded-full px-12 py-1 mb-2">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-black">
              Admit Card
            </h2>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-black uppercase tracking-widest text-center px-4 py-1">
            {settings.examTitleOverride || `${exam?.name}`}
          </h3>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 mt-0">
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            
            {/* Student Info - True Tabular Form (One by One) */}
            <div className="flex-1 w-full bg-white border border-black overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-black">
                <h3 className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
                  <User className="w-4 h-4 text-black" /> Candidate Details
                </h3>
              </div>
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider w-2/5 border-r border-gray-300 bg-gray-50">Candidate Name</td>
                    <td className="p-2 px-4 font-black text-black text-base uppercase">
                      {student?.user?.name || student?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Roll Number</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      {student?.rollNo || 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Class</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      {className || student?.class?.name || student?.className || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Section</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      {section || student?.class?.section || student?.section || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Gender</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      {student?.gender || 'Male'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Date of Birth</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      12/05/2010
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 px-4 font-bold text-gray-800 uppercase text-xs tracking-wider border-r border-gray-300 bg-gray-50">Exam Center</td>
                    <td className="p-2 px-4 font-black text-black text-base">
                      {settings.examCenterOverride || 'JY School Main Campus, Hall A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Area */}
            <div className="w-[110px] sm:w-[130px] mx-auto sm:mx-0 shrink-0 flex flex-col gap-2">
              <div className="w-full aspect-[3/4] border border-black flex flex-col items-center justify-center text-gray-600 relative p-1 bg-white">
                {student?.user?.photoUrl ? (
                  <img src={getPhotoUrl(student.user.photoUrl)} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full border border-dashed border-gray-400 flex flex-col items-center justify-center text-center p-2 bg-white">
                    <User className="w-8 h-8 mb-2 opacity-50 text-gray-600" />
                    <span className="text-[10px] uppercase font-bold leading-tight text-gray-600">Affix<br/>Passport<br/>Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-black">
                <Calendar className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-black uppercase tracking-wider">
                Examination Schedule
              </h4>
            </div>
            <div className="border border-black overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-black border-b border-black">
                  <tr>
                    <th className="py-2 px-4 font-bold uppercase text-xs tracking-widest text-center w-12 border-r border-gray-400">S.No</th>
                    <th className="py-2 px-4 font-bold uppercase text-xs tracking-widest border-r border-gray-400">Date</th>
                    <th className="py-2 px-4 font-bold uppercase text-xs tracking-widest border-r border-gray-400">Subject</th>
                    <th className="py-2 px-4 font-bold uppercase text-xs tracking-widest border-r border-gray-400">Time</th>
                    <th className="py-2 px-4 font-bold uppercase text-xs tracking-widest text-center">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 bg-white">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i}>
                      <td className="py-2 px-4 font-bold text-sm text-center text-black border-r border-gray-300">{i + 1}</td>
                      <td className="py-2 px-4 font-bold text-sm text-black border-r border-gray-300">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-2 px-4 font-bold text-sm text-black border-r border-gray-300">{plan.subject?.name || plan.subject}</td>
                      <td className="py-2 px-4 font-bold text-sm text-black border-r border-gray-300">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-2 px-4 text-center text-black font-bold">................</td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500 font-medium bg-gray-50">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-2 mx-4 mb-4 p-4 border border-black flex flex-col sm:flex-row justify-between gap-6 px-4">
          <div className="flex-1">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
              <span className="bg-black w-1.5 h-1.5 rounded-full"></span> Important Instructions
            </h5>
            <ul className="text-[10px] text-black font-medium space-y-1 list-decimal pl-4 pr-4 text-justify leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                <li key={idx} className="pl-1">{line}</li>
              ))}
            </ul>
          </div>
          <div className="text-center w-48 shrink-0 flex flex-col items-center justify-end">
            <div className="w-full h-20 flex items-end justify-center mb-1 border-b border-black border-dashed pb-1">
              {signatureUrl && <img src={signatureUrl} alt="Signature" className="h-16 object-contain" />}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-black">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
