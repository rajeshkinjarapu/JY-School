import React from 'react';
import { Award } from 'lucide-react';

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
    { icon: '👤', label: 'Student Name', value: safeData.studentName },
    { icon: '🆔', label: 'Student ID', value: safeData.rollNo },
    { icon: '🏫', label: 'Class', value: safeData.className },
    { icon: '🏷️', label: 'Section', value: safeData.section },
    { icon: '📅', label: 'Academic Year', value: safeData.academicYear },
    { icon: '📍', label: 'Location', value: safeData.location },
    ...(safeData.rank ? [{ icon: '🏅', label: 'Class Rank', value: `#${safeData.rank}` }] : []),
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
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid #0b1a33',
        outline: '3px solid #1a4a7a',
        outlineOffset: -6,
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

      <div style={{ height: 10, background: 'linear-gradient(90deg,#0b1a33 0%,#1a4a7a 30%,#f39c12 60%,#d4a017 100%)' }} />

      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 28px 12px 28px', gap: 16, borderBottom: '3px solid #f39c12', background: 'linear-gradient(to bottom,rgba(255,255,255,0.96),#fff)' }}>
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
          {settings?.schoolSubtitle && (
            <div style={{ fontSize: 15, color: '#1a4a7a', letterSpacing: 0.8, margin: '2px 0', whiteSpace: 'nowrap' }}>{settings.schoolSubtitle}</div>
          )}
          <div style={{ fontSize: 12, color: '#5a7a8a', marginTop: 2, whiteSpace: 'nowrap' }}>
            {settings?.schoolAddress || "Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"}
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: '#0b1a33', letterSpacing: 2, margin: '5px 0 0', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {examTitle}
          </div>
          <div style={{ fontSize: 16, fontWeight: 400, color: '#d4a017', letterSpacing: 4, marginTop: 2, whiteSpace: 'nowrap' }}>
            ✦ RESULT CARD ✦
          </div>
        </div>
        <div style={{ width: 90, flexShrink: 0 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 32px 8px 32px' }}>
        <span style={{ fontSize: 16, color: '#d4a017' }}>✦</span>
        <div style={{ flex: 1, maxWidth: 140, height: 2, background: 'linear-gradient(90deg,transparent,#f39c12,transparent)' }} />
        <span style={{ fontSize: 16, color: '#d4a017' }}>*</span>
        <div style={{ flex: 1, maxWidth: 140, height: 2, background: 'linear-gradient(90deg,transparent,#f39c12,transparent)' }} />
        <span style={{ fontSize: 16, color: '#d4a017' }}>✦</span>
      </div>

      <div style={{ margin: '0 24px 14px 24px', border: '2px solid #f39c12', borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#ffffff,#fef8f0)', boxShadow: '0 4px 16px rgba(243,156,18,0.10)', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          {infoRows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '175px 1fr', borderBottom: i < infoRows.length - 1 ? '1px solid #f5ede4' : 'none', background: i % 2 === 1 ? '#fefcf9' : 'transparent' }}>
              <div style={{ padding: '7px 16px', fontWeight: 600, fontSize: 13, color: '#6a3a1a', borderRight: '1px solid #f5ede4', display: 'flex', alignItems: 'center', gap: 6, background: '#fdf9f4', whiteSpace: 'nowrap' }}>
                {row.icon} {row.label}
              </div>
              <div style={{ padding: '7px 16px', paddingRight: 120, fontWeight: 600, fontSize: 14, color: '#0b1a33', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', right: 14, top: 12 }}>
          {resolveUrl(safeData.photo) ? (
            <img src={resolveUrl(safeData.photo)} alt="Student" style={{ width: 90, height: 108, objectFit: 'cover', border: '3px solid #f39c12', borderRadius: 8, boxShadow: '0 4px 10px rgba(243,156,18,0.2)', background: '#fff' }} />
          ) : (
            <div style={{ width: 90, height: 108, background: '#ede8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7a6a', fontSize: 38, border: '3px dashed #c8b8a8', borderRadius: 6 }}>📷</div>
          )}
        </div>
      </div>

      <div style={{ margin: '0 24px 12px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0b1a33', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <span>Performance Summary</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#6a8aaa' }}>Max Marks: {TOTAL_MAX_MARKS}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: 14, border: '2px solid #e8e0d8' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg,#0b1a33,#1a4a7a,#0b1a33)' }}>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 16px 10px 20px', textAlign: 'left', fontSize: 12, border: '1px solid rgba(255,255,255,0.1)' }}>Subject</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 16px', textAlign: 'center', fontSize: 12, border: '1px solid rgba(255,255,255,0.1)' }}>Marks</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 16px', textAlign: 'center', fontSize: 12, border: '1px solid rgba(255,255,255,0.1)' }}>Max Marks</th>
              <th style={{ color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 16px', textAlign: 'center', fontSize: 12, border: '1px solid rgba(255,255,255,0.1)' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {safeData.marks.map((sub: any, i: number) => {
              const max = Number(sub.maxMarks) || 100;
              const isAB = sub.remarks === 'AB';
              const obt = isAB ? 'AB' : (Number(sub.obtained) || 0);
              const subPct = isAB ? '0.0' : (max > 0 ? ((Number(sub.obtained) || 0) / max) * 100 : 0).toFixed(1);
              return (
                <tr key={i} style={{ background: i % 2 === 1 ? '#fdfcf9' : '#fff' }}>
                  <td style={{ padding: '8px 16px 8px 20px', textAlign: 'left', border: '1px solid #e8e0d8', fontWeight: 600, color: '#1a3a5a' }}>📘 {sub.subject}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', border: '1px solid #e8e0d8', fontWeight: 700, fontSize: 15, color: isAB ? '#ef4444' : '#0b1a33' }}>{obt}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', border: '1px solid #e8e0d8', color: '#6a8aaa' }}>{max}</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', border: '1px solid #e8e0d8', fontWeight: 700, color: '#1a4a7a' }}>{subPct}%</td>
                </tr>
              );
            })}
            <tr style={{ background: 'linear-gradient(90deg,#fdf9f4,#fff3e0)' }}>
              <td style={{ padding: '9px 16px 9px 20px', textAlign: 'left', border: '2.5px solid #f39c12', fontWeight: 900, color: '#0b1a33', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>📌 TOTAL</td>
              <td style={{ padding: '9px 16px', textAlign: 'center', border: '2.5px solid #f39c12', fontWeight: 900, fontSize: 18, color: '#c0392b' }}>{safeData.total}</td>
              <td style={{ padding: '9px 16px', textAlign: 'center', border: '2.5px solid #f39c12', color: '#6a8aaa' }}>{TOTAL_MAX_MARKS}</td>
              <td style={{ padding: '9px 16px', textAlign: 'center', border: '2.5px solid #f39c12', fontWeight: 700, color: '#1a4a7a' }}>{totalPct}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ margin: '0 24px 14px 24px', background: 'linear-gradient(to right,#fff,#f9fbfd)', border: '1px solid #dce4ed', borderRadius: 12, padding: '10px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <div style={{ height: 14, background: '#eef2f7', borderRadius: 20, overflow: 'hidden', border: '1px solid #dce4ed' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg,#1a4a7a,#3498db)', borderRadius: 20 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 600, color: '#6a8aaa' }}>
          <span>0</span>
          <span>Threshold: {PASS_THRESHOLD}%</span>
          <span>{TOTAL_MAX_MARKS}</span>
        </div>
      </div>

      <div style={{ margin: 'auto 24px 16px 24px', paddingTop: 12, borderTop: '2px dashed #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a4a7a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            📋 Total Marks: {safeData.total} / {TOTAL_MAX_MARKS}
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#c0392b', lineHeight: 1, letterSpacing: -1 }}>
            {totalPct}%
          </div>
        </div>
        <div style={{ display: 'flex', gap: 36 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130 }}>
            {resolveUrl(teacherSignatureUrl) ? (
              <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" style={{ maxWidth: 130, maxHeight: 52, objectFit: 'contain', marginBottom: 6 }} />
            ) : (
              <div style={{ width: '100%', height: 52, borderBottom: '1.5px dashed #c8d6e4', marginBottom: 6 }} />
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a3a5a', textAlign: 'center' }}>✍ Teacher Signature</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130 }}>
            {resolveUrl(principalSignatureUrl) ? (
              <img src={resolveUrl(principalSignatureUrl)} alt="Principal Signature" style={{ maxWidth: 130, maxHeight: 52, objectFit: 'contain', marginBottom: 6 }} />
            ) : (
              <div style={{ width: '100%', height: 52, borderBottom: '1.5px dashed #c8d6e4', marginBottom: 6 }} />
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a3a5a', textAlign: 'center' }}>✍ Principal Signature</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0b1a33', color: '#aabaca', fontSize: 11, textAlign: 'center', padding: '7px 8px', fontWeight: 500, letterSpacing: 0.5 }}>
        * This is a system-generated result card for {examTitle} *
      </div>
    </div>
  );
};
