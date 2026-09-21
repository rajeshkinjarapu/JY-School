import React from 'react';
import { Award, User, Hash, GraduationCap, Users, Phone, Calendar, MapPin, Medal, BarChart3, PenTool, ClipboardList } from 'lucide-react';

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
  const logoUrl = settings?.logoUrl;
  const teacherSignatureUrl = settings?.teacherSignatureUrl;
  const principalSignatureUrl = settings?.signatureUrl;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url || url === 'null' || url === 'undefined') return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  };

  const infoRows = [
    { icon: <User className="w-4 h-4 text-purple-700" />, label: 'STUDENT NAME', value: safeData.studentName },
    { icon: <Hash className="w-4 h-4 text-indigo-500" />, label: 'STUDENT ID', value: safeData.rollNo },
    { icon: <GraduationCap className="w-4 h-4 text-emerald-600" />, label: 'CLASS', value: safeData.className },
    { icon: <Users className="w-4 h-4 text-blue-500" />, label: 'SECTION', value: safeData.section },
    { icon: <Phone className="w-4 h-4 text-red-500" />, label: 'MOBILE', value: safeData.mobile },
    { icon: <Calendar className="w-4 h-4 text-cyan-600" />, label: 'ACADEMIC YEAR', value: safeData.academicYear },
    { icon: <MapPin className="w-4 h-4 text-pink-600" />, label: 'LOCATION', value: safeData.location },
    ...(safeData.rank ? [{ icon: <Medal className="w-4 h-4 text-yellow-600" />, label: 'CLASS RANK', value: `#${safeData.rank}` }] : []),
  ];

  return (
    <div
      className="w-[794px] bg-white mx-auto shrink-0 print:shadow-none"
      style={{
        minHeight: '1123px', // Exact A4 Height in pixels at 96 DPI
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI','Roboto',system-ui,-apple-system,sans-serif",
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        borderRadius: 0,
        overflow: 'hidden',
        border: '3px solid #0b1a33', // outer dark blue
        outline: '1.5px solid #f39c12', // inner orange
        outlineOffset: -8, // white gap
        boxSizing: 'border-box',
        background: '#ffffff',
      }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .progress-card-wrapper { page-break-after: always; break-after: page; page-break-inside: avoid; }
          .w-\\\\[794px\\\\] { width: 210mm !important; max-width: 210mm !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', padding: '24px 32px 12px 32px', gap: 16 }}>
        <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {resolveUrl(logoUrl) ? (
            <img src={resolveUrl(logoUrl)} alt="Logo" style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }} />
          ) : (
            <Award style={{ width: 48, height: 48, color: '#1a4a7a' }} />
          )}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0b1a33', letterSpacing: 1.5, fontFamily: "'Times New Roman','Georgia',serif", lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {settings?.schoolName || "SRI VENKATESWARA JY SCHOOL"}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, whiteSpace: 'nowrap', fontWeight: 500 }}>
            {settings?.schoolAddress || "Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#64748b', letterSpacing: 2, margin: '8px 0 0', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {examTitle}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f39c12', letterSpacing: 4, marginTop: 4, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>✦</span> RESULT CARD <span style={{ fontSize: 18 }}>✦</span>
          </div>
        </div>
        <div style={{ width: 90, flexShrink: 0 }} />
      </div>

      {/* Decorative Divider */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 32px 16px 32px' }}>
        <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg,transparent,#f39c12)' }} />
        <span style={{ margin: '0 12px', color: '#d4a017', fontSize: 14 }}>✦</span>
        <span style={{ margin: '0 12px', color: '#d4a017', fontSize: 14 }}>✦</span>
        <span style={{ margin: '0 12px', color: '#d4a017', fontSize: 14 }}>✦</span>
        <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg,#f39c12,transparent)' }} />
      </div>

      {/* Student Info Box */}
      <div style={{ margin: '0 24px 14px 24px', border: '1.5px solid #f39c12', borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#ffffff,#fef8f0)', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          {infoRows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '175px 1fr', borderBottom: i < infoRows.length - 1 ? '1px solid #f5ede4' : 'none', background: i % 2 === 1 ? '#fdfcf9' : 'transparent' }}>
              <div style={{ padding: '11px 16px', fontWeight: 700, fontSize: 12, color: '#6a3a1a', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
                <span style={{ background: '#fff', padding: 4, borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{row.icon}</span> {row.label}
              </div>
              <div style={{ padding: '11px 16px', paddingRight: 120, fontWeight: 700, fontSize: 13, color: '#0b1a33', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', right: 14, top: 12 }}>
          {resolveUrl(safeData.photo) ? (
             <div style={{ padding: 2, background: '#fff', border: '2px solid #f39c12', borderRadius: 8, boxShadow: '0 4px 12px rgba(243,156,18,0.15)' }}>
                <img src={resolveUrl(safeData.photo)} alt="Student" style={{ width: 86, height: 106, objectFit: 'cover', borderRadius: 6 }} />
             </div>
          ) : (
            <div style={{ width: 90, height: 110, background: '#ede8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7a6a', fontSize: 38, border: '3px dashed #c8b8a8', borderRadius: 6 }}>📷</div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div style={{ margin: '24px 24px 16px 24px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0b1a33', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>Performance Summary</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>Max Marks: {TOTAL_MAX_MARKS}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', fontSize: 14, border: '1px solid #e2e8f0' }}>
          <thead>
            <tr style={{ background: '#0b1a33' }}>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px 14px 20px', textAlign: 'left', fontSize: 12 }}>Subject</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px', textAlign: 'center', fontSize: 12 }}>Marks</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px', textAlign: 'center', fontSize: 12 }}>Max Marks</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 16px', textAlign: 'center', fontSize: 12 }}>%</th>
            </tr>
          </thead>
          <tbody>
            {safeData.marks.map((sub: any, i: number) => {
              const max = Number(sub.maxMarks) || 100;
              const isAB = sub.remarks === 'AB';
              const obt = isAB ? 'AB' : (Number(sub.obtained) || 0);
              const subPct = isAB ? '0.0' : (max > 0 ? ((Number(sub.obtained) || 0) / max) * 100 : 0).toFixed(1);
              return (
                <tr key={i} style={{ background: i % 2 === 1 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px 14px 20px', textAlign: 'left', fontWeight: 700, color: '#0b1a33', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: '#38bdf8', marginRight: 12, borderRadius: 2 }}></span>
                    {sub.subject}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: 15, color: isAB ? '#ef4444' : '#0b1a33' }}>{obt}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>{max}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#1e3a8a' }}>{subPct}%</td>
                </tr>
              );
            })}
            <tr style={{ background: '#fffcf5' }}>
              <td style={{ padding: '16px 16px 16px 20px', textAlign: 'left', fontWeight: 900, color: '#0b1a33', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#dc2626', marginRight: 10, fontSize: 16 }}>✦</span> TOTAL
              </td>
              <td style={{ padding: '16px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#dc2626' }}>{safeData.total}</td>
              <td style={{ padding: '16px 16px', textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>{TOTAL_MAX_MARKS}</td>
              <td style={{ padding: '16px 16px', textAlign: 'center', fontWeight: 900, color: '#1e3a8a' }}>{totalPct}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Progress Bar (Neumorphic Pill) */}
      <div style={{ margin: '10px 24px 14px 24px', padding: '0 8px' }}>
        <div style={{ position: 'relative', width: '100%', padding: '14px 20px', background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ height: 16, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg,#1e3a8a,#38bdf8)', borderRadius: 20 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
            <span>0</span>
            <span>Threshold: {PASS_THRESHOLD}%</span>
            <span>{TOTAL_MAX_MARKS}</span>
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div style={{ margin: 'auto 24px 0 24px', paddingTop: 20, paddingBottom: 24, borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList className="w-5 h-5 text-indigo-600" /> TOTAL MARKS: {safeData.total} / {TOTAL_MAX_MARKS}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#dc2626', lineHeight: 1, letterSpacing: -1, marginTop: 6 }}>
            {totalPct}%
          </div>
        </div>
        <div style={{ display: 'flex', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140 }}>
            {resolveUrl(teacherSignatureUrl) ? (
              <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" style={{ maxWidth: 140, maxHeight: 56, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 56, borderBottom: '1.5px dashed #cbd5e1', marginBottom: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a33', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenTool className="w-4 h-4 text-orange-500" /> Teacher Signature
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140 }}>
            {resolveUrl(principalSignatureUrl) ? (
              <img src={resolveUrl(principalSignatureUrl)} alt="Principal Signature" style={{ maxWidth: 140, maxHeight: 56, objectFit: 'contain', marginBottom: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 56, borderBottom: '1.5px dashed #cbd5e1', marginBottom: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1a33', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PenTool className="w-4 h-4 text-orange-500" /> Principal Signature
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0b1a33', color: '#94a3b8', fontSize: 10, textAlign: 'center', padding: '10px 8px', fontWeight: 500, letterSpacing: 0.5 }}>
        ★ This is a system-generated result card for {examTitle} ★
      </div>
    </div>
  );
};
