import React from 'react';

interface StudentMark {
  id: string;
  name: string;
  marks: number;
}

export interface ProcessedStudent extends StudentMark {
  rank: number;
  percentage: string;
}

interface SlipTestRankCardProps {
  students: ProcessedStudent[];
  testName: string;
  subject: string;
  examDate: string;
  className: string;
  maxMarks: number;
  logoSrc?: string;
  teacherSigSrc?: string;
  principalSigSrc?: string;
}

export const SlipTestRankCard = React.forwardRef<HTMLDivElement, SlipTestRankCardProps>(({
  students,
  testName,
  subject,
  examDate,
  className,
  maxMarks,
  logoSrc,
  teacherSigSrc,
  principalSigSrc
}, ref) => {

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const getPctClass = (pct: number) => {
    if (pct >= 90) return 'high';
    if (pct >= 60) return 'medium';
    return 'low';
  };

  return (
    <div 
      id="resultCard" 
      ref={ref}
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#ffffff',
        padding: '0',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 20, 50, 0.12), 0 8px 24px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>
        {`
          .slip-table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04); font-size: 13px; }
          .slip-table thead tr { background: #1a3a7a; }
          .slip-table thead th { color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 14px; text-align: center; white-space: nowrap; font-size: 12px; border: 1px solid #1a3a6a; }
          .slip-table tbody td { padding: 8px 14px; text-align: center; white-space: nowrap; border: 1px solid #e8e0d8; background: #ffffff; font-weight: 500; color: #0a1e3a; font-size: 13px; }
          .slip-table tbody tr:nth-child(even) td { background: #faf8f6; }
          .slip-table tbody .rank-1 { background: #fff9e6 !important; font-weight: 800; color: #d4a017; }
          .slip-table tbody .rank-2 { background: #f0f2f5 !important; font-weight: 700; color: #5a7a8a; }
          .slip-table tbody .rank-3 { background: #fdf0e6 !important; font-weight: 700; color: #b87a3a; }
          .slip-table tbody .pct-cell.high { color: #1a7a3a; }
          .slip-table tbody .pct-cell.medium { color: #d4a017; }
          .slip-table tbody .pct-cell.low { color: #c0392b; }
        `}
      </style>
      
      {/* Top Bar */}
      <div style={{ height: '6px', background: '#1a3a7a', flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '20px 32px 12px 32px', gap: '24px', flexShrink: 0, 
        borderBottom: '2px solid #d4a017', background: '#ffffff'
      }}>
        <div style={{
          width: '80px', height: '80px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', flexShrink: 0, background: '#f8faff', 
          borderRadius: '10px', padding: '4px', border: '1px solid #e8edf6'
        }}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: '#4a7a8a', fontSize: '10px', textAlign: 'center' }}>LOGO</div>
          )}
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          <div style={{
            fontSize: '30px', fontWeight: 900, color: '#0a1e3a', letterSpacing: '1.5px',
            fontFamily: "'Times New Roman', 'Georgia', serif", lineHeight: 1.2, whiteSpace: 'nowrap'
          }}>
            SRI JYOTHI HIGH SCHOOL
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a4a7a', letterSpacing: '0.5px', margin: '2px 0' }}>
            EMPOWERING MINDS SHAPING FUTURE
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#2a5a7a', letterSpacing: '0.3px', margin: '0 0 2px 0' }}>
            Recognised by Govt. of AP (E.M & T.M)
          </div>
          <div style={{ fontSize: '13px', fontWeight: 400, color: '#4a7a8a', letterSpacing: '0.2px', marginTop: '2px' }}>
            Narasannapeta, Srikakulam Dist.
          </div>
        </div>
        <div style={{ width: '80px', flexShrink: 0 }}></div>
      </div>

      {/* Main Title */}
      <div style={{ textAlign: 'center', padding: '6px 32px 4px 32px', flexShrink: 0, background: '#ffffff' }}>
        <h2 style={{
          fontSize: '28px', fontWeight: 800, color: '#0a1e3a', letterSpacing: '3px',
          textTransform: 'uppercase', fontFamily: "'Times New Roman', 'Georgia', serif",
          marginBottom: 0, borderBottom: '2px solid #d4a017', display: 'inline-block', paddingBottom: '4px'
        }}>
          {testName || 'SLIP TEST'}
        </h2>
      </div>

      {/* Info Table */}
      <div style={{
        margin: '10px 32px 12px 32px', flexShrink: 0, background: '#f8faff',
        borderRadius: '10px', padding: '6px 8px', border: '1px solid #e4ebf4',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #e4ebf4', verticalAlign: 'middle' }}>
                <span style={{ fontWeight: 400, color: '#4a7a9a', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>CLASS</span>
                <span style={{ fontWeight: 700, color: '#0a1e3a', fontSize: '17px', display: 'block', marginTop: '2px' }}>{className || '-'}</span>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #e4ebf4', verticalAlign: 'middle' }}>
                <span style={{ fontWeight: 400, color: '#4a7a9a', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>SUBJECT</span>
                <span style={{ fontWeight: 700, color: '#0a1e3a', fontSize: '17px', display: 'block', marginTop: '2px' }}>{subject || '-'}</span>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #e4ebf4', verticalAlign: 'middle' }}>
                <span style={{ fontWeight: 400, color: '#4a7a9a', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>DATE</span>
                <span style={{ fontWeight: 700, color: '#0a1e3a', fontSize: '17px', display: 'block', marginTop: '2px' }}>{examDate ? new Date(examDate).toLocaleDateString('en-GB') : '-'}</span>
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                <span style={{ fontWeight: 400, color: '#4a7a9a', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>MAX MARKS</span>
                <span style={{ fontWeight: 800, color: '#c0392b', fontSize: '17px', display: 'block', marginTop: '2px' }}>{maxMarks}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table Section */}
      <div style={{ margin: '4px 28px 10px 28px', padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0a1e3a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📊</span> Rank List
          <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 500, color: '#4a7a9a', background: 'rgba(26,58,122,0.06)', padding: '2px 16px', borderRadius: '30px' }}>
            Total: {students.length}
          </span>
        </div>
        
        <table className="slip-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th style={{ textAlign: 'left', paddingLeft: '18px' }}>STUDENT NAME</th>
              <th>MARKS OBT.</th>
              <th>MAX MARKS</th>
              <th>PERCENTAGE</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', color: '#7a9aaa', fontStyle: 'italic', textAlign: 'center' }}>
                  No student data available.
                </td>
              </tr>
            ) : (
              students.map((student, i) => (
                <tr key={student.id || i}>
                  <td className={`rank-cell ${getRankClass(student.rank)}`}>
                    {student.rank === 1 ? '🥇 1' : student.rank === 2 ? '🥈 2' : student.rank === 3 ? '🥉 3' : student.rank}
                  </td>
                  <td className="name-cell" style={{ textAlign: 'left', paddingLeft: '18px', fontWeight: 600, color: '#0a1e3a' }}>
                    {student.name}
                  </td>
                  <td className="marks-cell" style={{ fontWeight: 700, fontSize: '15px', color: '#0a1e3a' }}>
                    {student.marks}
                  </td>
                  <td style={{ color: '#6a8aaa', fontWeight: 400 }}>{maxMarks}</td>
                  <td className={`pct-cell ${getPctClass(parseFloat(student.percentage))}`}>
                    {student.percentage}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        margin: '6px 28px 10px 28px', paddingTop: '12px', borderTop: '2px solid #d4a017',
        flexShrink: 0, background: '#ffffff'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#3a5a7a' }}>Generated automatically via System</span>
        </div>
        
        <div style={{ display: 'flex', gap: '50px', alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', minWidth: '110px' }}>
            {teacherSigSrc ? (
              <img src={teacherSigSrc} alt="Sig" style={{ maxWidth: '130px', maxHeight: '55px', display: 'block', margin: '0 auto 4px' }} />
            ) : (
              <div style={{ height: '40px', borderBottom: '2px dashed #d0c8c0', width: '120px', margin: '0 auto 4px' }} />
            )}
            <div style={{ fontSize: '12px', color: '#3a5a7a', fontWeight: 500, borderTop: '2px solid #d0c8c0', paddingTop: '4px' }}>Class Teacher</div>
          </div>
          
          <div style={{ textAlign: 'center', minWidth: '110px' }}>
            {principalSigSrc ? (
              <img src={principalSigSrc} alt="Sig" style={{ maxWidth: '130px', maxHeight: '55px', display: 'block', margin: '0 auto 4px' }} />
            ) : (
              <div style={{ height: '40px', borderBottom: '2px dashed #d0c8c0', width: '120px', margin: '0 auto 4px' }} />
            )}
            <div style={{ fontSize: '12px', color: '#3a5a7a', fontWeight: 500, borderTop: '2px solid #d0c8c0', paddingTop: '4px' }}>Principal</div>
          </div>
        </div>
      </div>
      
      <div style={{
        textAlign: 'center', fontSize: '11px', color: '#7a8a7a', margin: '4px 28px 14px 28px',
        paddingTop: '8px', borderTop: '1px solid #eee8e0', flexShrink: 0, fontWeight: 500
      }}>
        This document is system-generated and valid for internal reference only.
      </div>
    </div>
  );
});

SlipTestRankCard.displayName = 'SlipTestRankCard';
