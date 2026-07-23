import React from 'react';
import { Award, User, MapPin, Phone, GraduationCap, Trophy, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ProgressCardTemplateProps {
  data?: any;
  exam?: any;
  settings?: any;
}

export const ProgressCardTemplate: React.FC<ProgressCardTemplateProps> = ({ 
  data = {}, 
  exam = {}, 
  settings = {} 
}) => {
  // Fallback data for preview purposes if no data is provided
  const safeData = {
    studentName: data.studentName || "VENKATA SAI KUMAR",
    rollNo: data.rollNo || "SVJY-2026-045",
    className: data.className || "Class X",
    section: data.section || "Olympiad Batch",
    mobile: data.mobile || "+91 9876543210",
    rank: data.rank || "1",
    photo: data.photo || "",
    marks: data.marks && data.marks.length > 0 ? data.marks : [
      { subject: "Mathematics", maxMarks: 100, obtained: 98 },
      { subject: "Physics", maxMarks: 100, obtained: 95 },
      { subject: "Chemistry", maxMarks: 100, obtained: 92 },
      { subject: "Biology", maxMarks: 100, obtained: 89 },
      { subject: "English", maxMarks: 100, obtained: 85 }
    ]
  };

  const totalMaxMarks = safeData.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
  const totalObtained = safeData.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : "0.0";
  const percentNumber = Number(percentage);
  
  // Safe API URL handling (removed import.meta to avoid compilation issues)
  const API_BASE = settings?.apiBase || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const logoUrl = resolveUrl(settings?.logoUrl); 
  const principalSignatureUrl = resolveUrl(settings?.signatureUrl || '');
  const teacherSignatureUrl = resolveUrl(settings?.teacherSignatureUrl || '');

  let performanceRating = "Needs Improvement";
  let performanceColor = "text-rose-600 border-rose-200 bg-rose-50";
  let progressColor = "from-rose-400 to-rose-600";
  let gradeLetter = "F";
  
  if (percentNumber >= 90) { 
    performanceRating = "Outstanding"; 
    performanceColor = "text-emerald-700 border-emerald-200 bg-emerald-50"; 
    progressColor = "from-emerald-400 to-emerald-500";
    gradeLetter = "A+";
  } else if (percentNumber >= 75) { 
    performanceRating = "Excellent"; 
    performanceColor = "text-blue-700 border-blue-200 bg-blue-50"; 
    progressColor = "from-blue-400 to-blue-500";
    gradeLetter = "A";
  } else if (percentNumber >= 60) { 
    performanceRating = "Very Good"; 
    performanceColor = "text-indigo-700 border-indigo-200 bg-indigo-50"; 
    progressColor = "from-indigo-400 to-indigo-500";
    gradeLetter = "B";
  } else if (percentNumber >= 40) { 
    performanceRating = "Good"; 
    performanceColor = "text-amber-700 border-amber-200 bg-amber-50"; 
    progressColor = "from-amber-400 to-amber-500";
    gradeLetter = "C";
  }

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-[#fafafa] relative box-border flex flex-col shadow-2xl overflow-hidden print:shadow-none" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Premium Outer Border */}
      <div className="absolute inset-0 border-[10px] border-indigo-900 z-50 pointer-events-none rounded-sm opacity-90"></div>
      
      {/* Decorative Background Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1e1b4b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-[120px] opacity-10 pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="w-full h-full relative flex flex-col z-10 p-2 print:p-0">
        
        {}
        <div className="bg-indigo-950 rounded-t-xl overflow-hidden shadow-lg relative mx-2 mt-2">
          {/* Subtle gold line at top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300"></div>
          
          <div className="px-6 py-8 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative">
            {/* Background texture for header */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
            
            {/* Logo */}
            <div className="w-28 h-28 shrink-0 bg-white p-2 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)] border-4 border-amber-400/20 flex items-center justify-center relative z-10">
              {logoUrl ? (
                <img src={logoUrl} crossOrigin="anonymous" alt="Logo" className="w-full h-full object-contain rounded-full" />
              ) : (
                <GraduationCap className="w-14 h-14 text-indigo-900" />
              )}
            </div>
            
            {/* School Info */}
            <div className="flex-1 text-center relative z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200 uppercase mb-1 drop-shadow-sm" style={{ fontFamily: '"Playfair Display", serif' }}>
                Sri Venkateswara JY School
              </h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-[1px] w-12 bg-amber-400/50"></div>
                <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">
                  IIT-JEE • NEET • Olympiads
                </p>
                <div className="h-[1px] w-12 bg-amber-400/50"></div>
              </div>
              
              <div className="inline-flex items-center justify-center gap-2 text-[11px] font-medium bg-white/10 px-4 py-1.5 rounded-full text-indigo-50 border border-white/10 backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                SVL Paradise Campus, Narasannapeta, AP
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="relative flex justify-center -mt-4 z-20">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-indigo-950 font-black px-10 py-2.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] border-2 border-white text-sm sm:text-base tracking-[0.15em] uppercase">
            {exam?.name || 'Academic Progress Report'}
          </div>
        </div>

        {}
        <div className="flex-grow px-6 sm:px-10 py-8 flex flex-col gap-8">
          
          {}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch bg-white rounded-2xl shadow-sm border border-indigo-50 p-1">
            
            {/* Student Photo Container */}
            <div className="w-[130px] shrink-0 p-3">
              <div className="w-full aspect-[3/4] bg-slate-50 rounded-xl shadow-inner border border-slate-200 overflow-hidden flex items-center justify-center relative">
                {safeData.photo ? (
                  <img src={resolveUrl(safeData.photo)} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <User className="w-12 h-12 text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Photo</span>
                  </div>
                )}
                {/* Overlay gradient for premium feel */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] rounded-xl pointer-events-none"></div>
              </div>
            </div>

            {/* Student Info Grid */}
            <div className="flex-grow p-4 pl-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 h-full content-center">
                <div className="col-span-1 md:col-span-2 border-b border-slate-100 pb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Student Name</p>
                  <p className="text-lg sm:text-xl font-black text-indigo-950 uppercase">{safeData.studentName}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student ID / Roll No</p>
                  <p className="text-sm font-bold text-slate-700 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">{safeData.rollNo}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Class & Section</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{safeData.className}</span>
                    <span className="text-slate-300">|</span>
                    <span>{safeData.section || 'A'}</span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {safeData.mobile || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Class Rank</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                      <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-xl font-black text-amber-600">#{safeData.rank || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            <div className="flex items-center gap-3 mb-4 pl-1">
              <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
              <h3 className="font-bold text-indigo-950 text-base uppercase tracking-widest">Scholastic Performance</h3>
            </div>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50 border-b-2 border-indigo-100">
                    <th className="py-3.5 px-4 font-bold text-indigo-800 uppercase tracking-wider text-[11px] text-center w-14">S.No</th>
                    <th className="py-3.5 px-4 font-bold text-indigo-800 uppercase tracking-wider text-[11px]">Subject</th>
                    <th className="py-3.5 px-4 font-bold text-indigo-800 uppercase tracking-wider text-[11px] text-center w-28">Max Marks</th>
                    <th className="py-3.5 px-4 font-bold text-indigo-800 uppercase tracking-wider text-[11px] text-center w-28">Marks Secured</th>
                    <th className="py-3.5 px-4 font-bold text-indigo-800 uppercase tracking-wider text-[11px] text-center w-24">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeData.marks.map((m: any, idx: number) => {
                    const subPercent = (m.obtained / (m.maxMarks || 100)) * 100;
                    let subGradeColor = "text-rose-600 bg-rose-50";
                    let subGrade = "F";
                    
                    if (subPercent >= 90) { subGrade = "A+"; subGradeColor = "text-emerald-700 bg-emerald-50 border-emerald-100"; }
                    else if (subPercent >= 80) { subGrade = "A"; subGradeColor = "text-blue-700 bg-blue-50 border-blue-100"; }
                    else if (subPercent >= 70) { subGrade = "B"; subGradeColor = "text-indigo-700 bg-indigo-50 border-indigo-100"; }
                    else if (subPercent >= 50) { subGrade = "C"; subGradeColor = "text-amber-700 bg-amber-50 border-amber-100"; }

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{m.subject}</td>
                        <td className="py-3 px-4 text-center text-slate-500 font-medium">{m.maxMarks || 100}</td>
                        <td className="py-3 px-4 text-center font-black text-indigo-950 text-base">{m.obtained}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-black border ${subGradeColor}`}>
                            {subGrade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="grid grid-cols-12 gap-4">
            
            {/* Grand Total Box */}
            <div className="col-span-12 sm:col-span-5 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-400 opacity-10 rounded-full blur-xl translate-x-1/2 translate-y-1/2"></div>
              
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Grand Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{totalObtained}</span>
                    <span className="text-sm font-medium text-indigo-300">/ {totalMaxMarks}</span>
                  </div>
                </div>
                
                <div className="h-16 w-[1px] bg-indigo-700/50 mx-4"></div>
                
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-1">Percentage</span>
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-3xl font-black text-white">{percentage}</span>
                    <span className="text-sm font-bold text-amber-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Grade Box */}
            <div className={`col-span-6 sm:col-span-3 rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm border ${performanceColor}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Final Grade</span>
              <span className="text-3xl font-black mb-1">{gradeLetter}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded-md">{performanceRating}</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="col-span-6 sm:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Graph</span>
                <CheckCircle2 className={`w-4 h-4 ${percentNumber >= 50 ? 'text-emerald-500' : 'text-slate-300'}`} />
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.max(5, percentNumber)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-300">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
          </div>
        </div>

        {}
        <div className="mt-auto bg-slate-50 border-t border-slate-200 p-6 mx-2 mb-2 rounded-b-xl">
          
          {/* Grading Legend */}
          <div className="flex justify-center gap-3 sm:gap-6 mb-8 flex-wrap">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> A+: 90-100
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> A: 80-89
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> B: 60-79
            </div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> C: 40-59
            </div>
          </div>

          <div className="flex justify-between items-end px-4 sm:px-8">
            
            {/* Class Teacher Signature */}
            <div className="flex flex-col items-center w-32">
              <div className="h-12 flex items-end justify-center mb-2 w-full relative">
                {teacherSignatureUrl ? (
                  <img src={teacherSignatureUrl} crossOrigin="anonymous" alt="Teacher" className="max-h-12 object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-full border-b border-slate-300 border-dashed mb-1"></div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Class Teacher</p>
            </div>
            
            {/* School Seal Placeholder */}
            <div className="flex flex-col items-center justify-center pb-2">
               <div className="w-14 h-14 rounded-full border-2 border-indigo-100/50 flex items-center justify-center bg-white shadow-sm">
                  <span className="text-[8px] font-bold text-indigo-200 uppercase text-center leading-tight">School<br/>Seal</span>
               </div>
            </div>
            
            {/* Principal Signature */}
            <div className="flex flex-col items-center w-32">
              <div className="h-12 flex items-end justify-center mb-2 w-full relative">
                {principalSignatureUrl ? (
                  <img src={principalSignatureUrl} crossOrigin="anonymous" alt="Principal" className="max-h-12 object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-full border-b border-slate-300 border-dashed mb-1"></div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Principal</p>
            </div>
            
          </div>
          
          <div className="text-center mt-6">
             <p className="text-[8px] text-slate-400 font-medium uppercase tracking-widest">System Generated Report • Not valid without authorized signatures</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProgressCardTemplate;
