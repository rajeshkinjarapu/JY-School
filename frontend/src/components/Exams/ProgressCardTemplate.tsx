import React from 'react';
import { Award, User, Calendar, Phone, BookOpen, Layers } from 'lucide-react';

interface ProgressCardTemplateProps {
  data: any;
  exam: any;
  settings?: any;
}

export const ProgressCardTemplate: React.FC<ProgressCardTemplateProps> = ({ data, exam, settings = {} }) => {
  const totalMaxMarks = data.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
  const totalObtained = data.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : "0.0";
  const percentNumber = Number(percentage);
  
  const logoUrl = settings?.logoUrl || '/logo.png'; // Assuming logo might come from settings
  const principalSignatureUrl = settings?.signatureUrl || '';

  // Determine Overall Performance
  let performanceRating = "Needs Improvement";
  let performanceColor = "bg-red-500";
  if (percentNumber >= 90) { performanceRating = "Outstanding"; performanceColor = "bg-emerald-500"; }
  else if (percentNumber >= 75) { performanceRating = "Excellent"; performanceColor = "bg-green-500"; }
  else if (percentNumber >= 60) { performanceRating = "Very Good"; performanceColor = "bg-blue-500"; }
  else if (percentNumber >= 40) { performanceRating = "Good"; performanceColor = "bg-amber-500"; }

  return (
    <div className="progress-card-wrapper w-[210mm] h-[297mm] overflow-hidden print:shadow-none print:m-0 mx-auto bg-white mb-8 border shadow-xl relative box-border flex flex-col" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always' }}>
      <div className="w-full h-full relative flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Top Dark Header */}
        <div className="bg-[#1e2a5c] text-white pt-8 pb-10 px-8 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 no-print" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 no-print" />
          
          <div className="flex items-center gap-6 relative z-10">
            {/* Logo */}
            <div className="w-24 h-24 bg-white rounded-full p-2 flex-shrink-0 shadow-lg border-2 border-indigo-200 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-blue-800 font-bold text-2xl text-center leading-none">
                  SJY<br/><span className="text-[7px]">Minds Shaping Future</span>
                </div>
              )}
            </div>
            
            <div className="flex-grow text-center pr-12">
              <h1 className="text-[32px] font-black tracking-wider mb-2 drop-shadow-md" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                SRI VENKATESWARA JY SCHOOL
              </h1>
              <p className="text-[13px] font-semibold tracking-[0.2em] text-indigo-200 mb-5 uppercase drop-shadow">
                (IIT-JEE / NEET Foundation • Olympiads)
              </p>
              <div className="inline-block bg-[#da9f47] text-[#1e2a5c] px-8 py-2 rounded-full font-black text-[15px] tracking-widest uppercase shadow-md border border-[#edba6e]">
                {exam?.name || 'EXAMINATION RESULT'}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-10 flex flex-col gap-10 bg-white">
          
          {/* Student Info & Photo Row */}
          <div className="flex gap-10">
            <div className="flex-grow grid grid-cols-2 gap-x-6 gap-y-5 h-max">
              {/* Box 1: Student Name */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#415fd7]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Name</span>
                  <span className="text-[15px] font-black text-gray-800 uppercase">{data.studentName}</span>
                </div>
              </div>
              {/* Box 2: Student ID */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#e1526f]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student ID</span>
                  <span className="text-[15px] font-black text-gray-800 uppercase">{data.rollNo}</span>
                </div>
              </div>
              {/* Box 3: Class & Section */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#1fb981]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Class & Section</span>
                  <span className="text-[15px] font-black text-gray-800 uppercase">{data.className} - {data.section || 'A'}</span>
                </div>
              </div>
              {/* Box 4: Contact */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#da9f47]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact / Mobile</span>
                  <span className="text-[15px] font-black text-gray-800 uppercase">{data.mobile || '-'}</span>
                </div>
              </div>
              {/* Box 5: Academic Year */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#7344c2]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Academic Year</span>
                  <span className="text-[15px] font-black text-gray-800 uppercase">2026 - 2027</span>
                </div>
              </div>
              {/* Box 6: Class Rank */}
              <div className="bg-[#fafbfc] rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center border-l-4 border-l-[#0ca4a5]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Class Rank</span>
                  <span className="text-[15px] font-black text-[#da9f47]">#{data.rank || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Photo */}
            <div className="w-36 h-[170px] flex-shrink-0 rounded-[16px] p-1.5 bg-gradient-to-tr from-[#1e2a5c] via-purple-500 to-pink-500 shadow-xl">
              <div className="w-full h-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
                {data.photo ? (
                  <img src={data.photo} crossOrigin="anonymous" alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {/* Academic Performance Header */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-1.5 bg-[#da9f47] rounded-full"></div>
            <h3 className="font-black text-[#1e2a5c] text-[20px] tracking-wide">Academic Performance</h3>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#2d3a4c] text-white">
                  <th className="py-4 px-6 text-left font-black text-[12px] uppercase tracking-widest w-2/5">Subject</th>
                  <th className="py-4 px-6 text-center font-black text-[12px] uppercase tracking-widest">Marks Obtained</th>
                  <th className="py-4 px-6 text-center font-black text-[12px] uppercase tracking-widest">Max Marks</th>
                  <th className="py-4 px-6 text-center font-black text-[12px] uppercase tracking-widest">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.marks.map((m: any, idx: number) => {
                  const subPercent = m.maxMarks ? ((m.obtained / m.maxMarks) * 100).toFixed(0) : 0;
                  const dotColors = ['bg-pink-500', 'bg-purple-500', 'bg-[#0ca4a5]', 'bg-amber-500', 'bg-[#415fd7]'];
                  const dotColor = dotColors[idx % dotColors.length];
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50 bg-white">
                      <td className="py-4 px-6 font-bold text-gray-700 flex items-center gap-3 text-[14px]">
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div> {m.subject}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-gray-900 text-[14px]">{m.obtained}</td>
                      <td className="py-4 px-6 text-center font-bold text-gray-500 text-[14px]">{m.maxMarks || 100}</td>
                      <td className="py-4 px-6 text-center font-black text-gray-700 text-[14px]">{subPercent}%</td>
                    </tr>
                  );
                })}
                
                {/* Grand Total Row */}
                <tr className="bg-[#fffdf3] border-t-2 border-t-[#da9f47]/50 shadow-[inset_0_0_15px_rgba(218,159,71,0.05)] border-b border-b-gray-100">
                  <td className="py-5 px-6 font-black text-[#da9f47] text-[15px] uppercase tracking-wider">Grand Total</td>
                  <td className="py-5 px-6 text-center font-black text-[#da9f47] text-xl">{totalObtained}</td>
                  <td className="py-5 px-6 text-center font-bold text-gray-600 text-[15px]">{totalMaxMarks}</td>
                  <td className="py-5 px-6 text-center font-black text-[#1fb981] text-xl">{percentage}%</td>
                </tr>
              </tbody>
            </table>
            
            {/* Overall Performance Badge inside Table Wrapper */}
            <div className="bg-[#f8f9fc] px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <span className="font-bold text-[#415fd7] text-[13px] uppercase tracking-widest">Overall Performance</span>
              <span className={`${performanceColor} text-white px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md`}>
                {performanceRating}
              </span>
            </div>
          </div>

          {/* Progress Bar Score Indicator */}
          <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-6 shadow-sm mt-2">
            <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              <span>0</span>
              <span className="text-gray-400">Score Indicator</span>
              <span>{totalMaxMarks}</span>
            </div>
            <div className="h-3 w-full bg-white border border-gray-200 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#0ca4a5] via-[#415fd7] to-[#1e2a5c]" 
                style={{ width: `${percentNumber}%` }}
              ></div>
            </div>
          </div>

        </div>

        {/* Footer Area with Signatures - Absolutely positioned at bottom to ensure consistency */}
        <div className="absolute bottom-0 w-full px-10 pb-12 pt-6 bg-white">
          <div className="border-t-2 border-dashed border-gray-200 mb-8 w-full relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4">
               <Award className="w-5 h-5 text-gray-300" />
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="text-center w-48">
              <div className="h-20 flex items-end justify-center mb-2">
                {/* Class Teacher Signature Placeholder */}
                <div className="text-blue-800/60 font-signature text-[28px] transform -rotate-12" style={{ fontFamily: '"Brush Script MT", cursive' }}>Signature</div>
              </div>
              <div className="border-t-2 border-dashed border-gray-300 pt-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Class Teacher</p>
              </div>
            </div>
            
            <div className="text-center pb-2">
              <h2 className="text-2xl font-black text-[#1e2a5c] tracking-tight">{totalObtained} <span className="text-lg text-gray-400">/ {totalMaxMarks}</span></h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Overall Score</p>
            </div>
            
            <div className="text-center w-48">
              <div className="h-20 flex items-end justify-center mb-2 relative">
                {principalSignatureUrl ? (
                  <img src={principalSignatureUrl} crossOrigin="anonymous" alt="Principal Signature" className="max-h-16 object-contain mix-blend-multiply" />
                ) : (
                  <div className="text-green-800/60 font-signature text-[28px] transform -rotate-12" style={{ fontFamily: '"Brush Script MT", cursive' }}>Principal</div>
                )}
              </div>
              <div className="border-t-2 border-dashed border-gray-300 pt-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Principal</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
