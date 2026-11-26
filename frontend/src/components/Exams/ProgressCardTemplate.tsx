import React from 'react';
import { Award, User, Hash, GraduationCap, Phone, Calendar, MapPin, Medal, BarChart3, PenTool, ClipboardList } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photo';

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
  const safeData = {
    studentName: data.studentName || "VENKATA SAI KUMAR",
    rollNo: data.rollNo || "SVJY-2026-045",
    className: data.className || "Class X",
    section: data.section || "Olympiad Batch",
    mobile: data.mobile || "9076882376",
    rank: data.rank || "",
    photo: data.photo || "",
    total: data.total || 0,
    academicYear: data.academicYear || "2026-2027",
    location: data.location || "Narasannapeta",
    marks: data.marks && data.marks.length > 0 ? data.marks : (data.studentId || data.rollNo ? [] : [
      { subject: "Mathematics", maxMarks: 100, obtained: 98 },
      { subject: "Physics", maxMarks: 100, obtained: 95 },
      { subject: "Chemistry", maxMarks: 100, obtained: 92 },
    ])
  };

  const TOTAL_MAX_MARKS = safeData.marks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
  const totalPct = TOTAL_MAX_MARKS > 0 ? ((safeData.total / TOTAL_MAX_MARKS) * 100).toFixed(1) : '0.0';
  const barWidth = Math.min(Number(totalPct), 100);
  const PASS_THRESHOLD = 35;

  const examTitle = settings?.examNameOverride || exam?.name || 'EXAMINATION RESULT CARD';
  const isNavodaya = String(examTitle || exam?.name || '').toUpperCase().includes('NAVODAYA');
  const logoUrl = settings?.logoUrl;
  const teacherSignatureUrl = settings?.teacherSignatureUrl;
  const principalSignatureUrl = settings?.signatureUrl || settings?.principalSignatureUrl;

  const resolveUrl = (url?: string) => {
    if (!url || url === 'null' || url === 'undefined') return '';
    if (url === '/logo.png' || url === 'logo.png') return '/logo.png';
    return getPhotoUrl(url) || '';
  };

  return (
    <div
      className="progress-card-container progress-card-page bg-white p-6 w-[210mm] min-h-[297mm] h-[297mm] max-h-[297mm] mx-auto flex flex-col justify-between box-border relative overflow-hidden"
      style={{
        fontFamily: "'Segoe UI', 'Roboto', system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
        background: '#ffffff',
      }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .progress-card-wrapper { page-break-after: always; break-after: page; page-break-inside: avoid; display: block !important; width: 210mm !important; min-height: 297mm !important; height: 297mm !important; margin: 0 auto !important; }
          .progress-card-page { width: 210mm !important; min-height: 297mm !important; height: 297mm !important; margin: 0 auto !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Watermark in Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
        <img
          src={resolveUrl(logoUrl) || '/logo.png'}
          alt="Watermark"
          className="w-[360px] h-[360px] object-contain grayscale"
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
          }}
        />
      </div>

      {/* Double Border Frame: Outer Navy Blue (3px) + Gap + Inner Gold (1.5px) */}
      <div className="w-full h-full flex-1 border-[3px] border-[#0b1a33] p-[2.5px] relative flex flex-col z-10 bg-transparent box-border">
        <div className="w-full h-full flex-1 border border-[#f39c12] flex flex-col justify-between bg-white/95 relative p-5 box-border">
          
          {/* 1. Header Area */}
          <div>
            <div className="flex items-center gap-5 pb-3 border-b-2 border-slate-900/80">
              <div className="w-20 h-20 shrink-0 bg-white border border-slate-200 p-1.5 shadow-xs rounded-xl flex items-center justify-center overflow-hidden">
                {resolveUrl(logoUrl) ? (
                  <img src={resolveUrl(logoUrl)} alt="Logo" className="max-w-full max-h-full object-contain" crossOrigin="anonymous" />
                ) : (
                  <Award className="w-10 h-10 text-[#0b1a33]" />
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-[22px] font-black uppercase tracking-wider text-[#0b1a33] leading-tight" style={{ fontFamily: '"Georgia", serif' }}>
                  {settings?.schoolName || "SRI VENKATESWARA JY SCHOOL"}
                </h1>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d97706] mt-1">
                  {settings?.schoolSubtitle || "(IIT-JEE / NEET Foundation – Olympiads)"}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {settings?.schoolAddress || settings?.headerAddress || "Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"}
                </p>
              </div>
              <div className="w-20 shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Title Badges */}
            <div className="flex flex-col items-center py-2.5 border-b border-slate-200">
              <div className="bg-[#0b1a33] text-white px-7 py-1 rounded-sm shadow-sm transform -skew-x-12 mb-1">
                <h2 className="text-sm font-black uppercase tracking-[0.25em] transform skew-x-12 text-[#fbbf24] flex items-center gap-2">
                  <span>✦</span> RESULT CARD <span>✦</span>
                </h2>
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-center">
                {examTitle}
              </h3>
            </div>
          </div>

          {/* 2. Candidate Details Box */}
          <div className="rounded-xl border border-slate-300 overflow-hidden shadow-2xs bg-white my-3">
            <div className="bg-[#0b1a33] px-4 py-2 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#fbbf24]" /> Candidate Details
              </h4>
              {safeData.rank ? (
                <span className="bg-[#fbbf24] text-[#0b1a33] font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Medal className="w-3 h-3 text-[#0b1a33]" /> Class Rank #{safeData.rank}
                </span>
              ) : null}
            </div>

            <div className={`flex items-center ${isNavodaya ? 'p-4' : 'p-3'} gap-4`}>
              {isNavodaya ? (
                <div className="flex-1 flex flex-col justify-center gap-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" /> Student Name:
                    </span>
                    <span className="font-black text-slate-900 uppercase text-[12px] leading-snug break-words">{safeData.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" /> Student ID:
                    </span>
                    <span className="font-extrabold text-slate-800">{safeData.rollNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Class & Sec:
                    </span>
                    <span className="font-extrabold text-slate-800">{safeData.className} {safeData.section ? `- ${safeData.section}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-rose-500" /> Mobile:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Academic Year:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.academicYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-600" /> Location:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.location}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" /> Student Name:
                    </span>
                    <span className="font-black text-slate-900 uppercase text-[12px] truncate">{safeData.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" /> Student ID:
                    </span>
                    <span className="font-extrabold text-slate-800">{safeData.rollNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Class & Sec:
                    </span>
                    <span className="font-extrabold text-slate-800">{safeData.className} {safeData.section ? `- ${safeData.section}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Academic Year:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.academicYear}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-rose-500" /> Mobile:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10.5px] w-28 shrink-0 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-600" /> Location:
                    </span>
                    <span className="font-bold text-slate-800">{safeData.location}</span>
                  </div>
                </div>
              )}

              {/* Student Photo */}
              <div className="shrink-0 w-24 h-28 p-1 bg-white border-2 border-[#f39c12] rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                {resolveUrl(safeData.photo) ? (
                  <img src={resolveUrl(safeData.photo)} alt="Candidate Photo" className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold">
                    <User className="w-8 h-8 text-slate-300 mb-1" />
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Performance Summary Table */}
          <div className="my-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0b1a33] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Performance Summary
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                Max Aggregate: <strong className="text-slate-800">{TOTAL_MAX_MARKS}</strong>
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0b1a33] text-white">
                    <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-[11px]">Subject</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-center">Max Marks</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-center">% Score</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {safeData.marks.map((sub: any, i: number) => {
                    const max = Number(sub.maxMarks) || 100;
                    const isAB = sub.remarks === 'AB' || sub.obtained === 'AB';
                    const obt = isAB ? 'AB' : (Number(sub.obtained) || 0);
                    const obtNum = Number(sub.obtained) || 0;
                    const subPct = isAB ? '0.0' : (max > 0 ? (obtNum / max) * 100 : 0).toFixed(1);
                    const isPass = !isAB && (max > 0 ? (obtNum / max) * 100 >= PASS_THRESHOLD : false);

                    return (
                      <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-2.5 px-4 font-bold text-slate-800 uppercase flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0b1a33]" />
                          {sub.subject}
                        </td>
                        <td className={`py-2.5 px-3 text-center font-black text-sm ${isAB ? 'text-red-600' : 'text-slate-900'}`}>
                          {obt}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">{max}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-indigo-700">{subPct}%</td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {isAB ? (
                            <span className="text-[10px] text-red-600 font-black">ABSENT</span>
                          ) : isPass ? (
                            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">PASS</span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NEEDS FOCUS</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-amber-50/80 border-t-2 border-[#0b1a33]">
                    <td className="py-3 px-4 font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <span className="text-red-600">✦</span> GRAND TOTAL
                    </td>
                    <td className="py-3 px-3 text-center font-black text-base text-red-600">
                      {safeData.total}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{TOTAL_MAX_MARKS}</td>
                    <td className="py-3 px-3 text-center font-black text-sm text-[#0b1a33]">{totalPct}%</td>
                    <td className="py-3 px-3 text-center font-black text-xs text-emerald-700 uppercase">
                      {Number(totalPct) >= 75 ? 'DISTINCTION' : Number(totalPct) >= 60 ? 'FIRST CLASS' : Number(totalPct) >= PASS_THRESHOLD ? 'PASSED' : 'FAILED'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Visual Score & Progress Gauge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
              <span>Overall Performance Gauge</span>
              <span className="text-indigo-700 font-black">{totalPct}% Overall Score</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>0%</span>
              <span className="text-slate-600 font-bold">Pass Threshold: {PASS_THRESHOLD}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 5. Result Summary & Signatures */}
          <div className="mt-auto pt-3 border-t-2 border-dashed border-slate-200 flex items-end justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#0b1a33] flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-indigo-600" /> Total Marks: {safeData.total} / {TOTAL_MAX_MARKS}
              </div>
              <div className="text-4xl font-black text-red-600 tracking-tight mt-0.5 leading-none">
                {totalPct}%
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Result Status: {Number(totalPct) >= PASS_THRESHOLD ? 'Qualified / Passed' : 'Needs Improvement'}
              </div>
            </div>

            <div className="flex items-end gap-10">
              {/* Teacher Signature */}
              <div className="text-center w-36 flex flex-col items-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  {resolveUrl(teacherSignatureUrl) ? (
                    <img
                      src={resolveUrl(teacherSignatureUrl)}
                      alt="Teacher Signature"
                      className="max-h-14 max-w-full object-contain"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-32 border-b-2 border-dashed border-slate-400 mb-2" />
                  )}
                </div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-orange-500" /> Class Teacher
                </span>
              </div>

              {/* Principal Signature */}
              <div className="text-center w-44 flex flex-col items-center">
                <div className="h-16 flex items-end justify-center mb-1 relative">
                  {resolveUrl(principalSignatureUrl) ? (
                    <img
                      src={resolveUrl(principalSignatureUrl)}
                      alt="Principal Signature"
                      className="max-h-16 max-w-full object-contain mix-blend-multiply"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-36 border-b-2 border-dashed border-slate-400 mb-2" />
                  )}
                </div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-orange-500" /> Principal / Head Master
                </span>
              </div>
            </div>
          </div>

          {/* 6. Footer bar */}
          <div className="bg-[#0b1a33] text-white text-[9.5px] font-semibold text-center py-1.5 px-3 rounded-b -mx-5 -mb-5 mt-2 tracking-wide">
            ★ This is a computer-generated official Progress Card issued by Sri Venkateswara JY School ★
          </div>

        </div>
      </div>
    </div>
  );
};
