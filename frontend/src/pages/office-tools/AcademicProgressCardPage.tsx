import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Award,
  Search,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Users,
  FileText,
  CheckSquare,
  Square,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Trophy,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { api } from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface SubjectRow {
  slNo: number;
  subjectName: string;
  canonicalName: string;
  fa1: number | null;
  fa1Max: number;
  fa2: number | null;
  fa2Max: number;
  fa3: number | null;
  fa3Max: number;
  fa4: number | null;
  fa4Max: number;
  faTotal: number | null;
  faMax: number;
  sa1: number | null;
  sa1Max: number;
  sa2: number | null;
  sa2Max: number;
  saTotal: number | null;
  saMax: number;
  grandTotal: number | null;
  grandMax: number;
  percentage: number | null;
  grade: string;
  gradePoint: number | null;
}

interface StudentEvaluation {
  id: string;
  rollNo: string;
  name: string;
  photoUrl: string | null;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  admissionNo: string;
  className: string;
  academicYear: string;
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
  };
  subjectRows: SubjectRow[];
  summary: {
    totalObtained: number;
    totalMax: number;
    percentage: number;
    grade: string;
    gpa: string;
    result: string;
    rank: number;
  };
}

interface SchoolInfo {
  schoolName: string;
  schoolSubtitle: string;
  address: string;
  logoUrl: string;
  principalSignatureUrl: string | null;
  teacherSignatureUrl: string | null;
  udiseCode: string;
}

interface CardTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accentBg: string;
  gold: string;
}

interface CardOptions {
  showPhoto: boolean;
  showRank: boolean;
  showCoScholastic: boolean;
  showSignatures: boolean;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'royal',
    name: 'Royal Navy & Gold',
    primary: '#0f294a',
    secondary: '#1d4ed8',
    accentBg: '#eff6ff',
    gold: '#c59b27',
  },
  {
    id: 'emerald',
    name: 'Campus Emerald',
    primary: '#064e3b',
    secondary: '#059669',
    accentBg: '#ecfdf5',
    gold: '#d97706',
  },
  {
    id: 'burgundy',
    name: 'Heritage Maroon',
    primary: '#6b1426',
    secondary: '#be123c',
    accentBg: '#fff1f2',
    gold: '#c59b27',
  },
];

const getDefaultRemark = (st: StudentEvaluation): string => {
  const g = (st.summary?.grade || '').toUpperCase();
  if (g === 'A1') return 'Outstanding academic achievement throughout the session. Exemplary dedication!';
  if (g === 'A2') return 'Excellent academic performance and consistent progress across subjects.';
  if (g === 'B1' || g === 'B2') return 'Very good effort and steady academic improvement shown this year.';
  if (g === 'C1' || g === 'C2') return 'Satisfactory progress. Greater consistency will yield stronger results.';
  if (g === 'D') return 'Passed with scope for improvement. Regular revision is recommended.';
  return 'Needs focused mentoring and additional academic support in core subjects.';
};

const getGradeBadgeStyle = (grade: string): React.CSSProperties => {
  const g = (grade || '').toUpperCase();
  if (g === 'A1' || g === 'A2') return { backgroundColor: '#dcfce7', color: '#166534' };
  if (g === 'B1' || g === 'B2') return { backgroundColor: '#e0e7ff', color: '#3730a3' };
  if (g === 'C1' || g === 'C2' || g === 'D') return { backgroundColor: '#fef3c7', color: '#92400e' };
  if (g === 'E') return { backgroundColor: '#ffe4e6', color: '#be123c' };
  return { backgroundColor: '#f1f5f9', color: '#475569' };
};

interface ProgressCardSheetProps {
  student: StudentEvaluation;
  schoolInfo: SchoolInfo;
  theme: CardTheme;
  options: CardOptions;
  remark: string;
}

const ProgressCardSheet: React.FC<ProgressCardSheetProps> = ({
  student,
  schoolInfo,
  theme,
  options,
  remark,
}) => {
  const faTotalSum = student.subjectRows.reduce((acc, r) => acc + (r.faTotal || 0), 0);
  const saTotalSum = student.subjectRows.reduce((acc, r) => acc + (r.saTotal || 0), 0);
  const logoSrc = schoolInfo.logoUrl ? getPhotoUrl(schoolInfo.logoUrl) : '/logo.png';
  const studentPhotoSrc = student.photoUrl ? getPhotoUrl(student.photoUrl) : undefined;
  const teacherSignSrc = schoolInfo.teacherSignatureUrl ? getPhotoUrl(schoolInfo.teacherSignatureUrl) : undefined;
  const principalSignSrc = schoolInfo.principalSignatureUrl ? getPhotoUrl(schoolInfo.principalSignatureUrl) : undefined;

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '6.5mm',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      }}
      className="flex flex-col justify-between relative overflow-hidden select-none"
    >
      {/* Formal Double Border Frame */}
      <div
        style={{
          border: `2.5px solid ${theme.primary}`,
          outline: `1.2px solid ${theme.gold}`,
          outlineOffset: '-4px',
          height: '100%',
          padding: '5.5mm 6.5mm',
          boxSizing: 'border-box',
        }}
        className="flex flex-col justify-between bg-white relative"
      >
        {/* Top School Letterhead */}
        <div
          style={{ borderBottom: `2px solid ${theme.primary}` }}
          className="flex items-center justify-between pb-2.5 mb-2 gap-3"
        >
          <div className="w-[72px] h-[72px] flex items-center justify-center shrink-0">
            <img
              src={logoSrc}
              alt="School Logo"
              crossOrigin="anonymous"
              className="max-h-[70px] max-w-[70px] object-contain"
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 text-center min-w-0 px-2">
            <h1
              style={{ color: theme.primary }}
              className="font-serif font-black text-[20px] tracking-wide uppercase leading-tight"
            >
              {schoolInfo.schoolName}
            </h1>
            <div className="text-[9.5px] font-extrabold text-rose-700 mt-0.5 leading-tight">
              {schoolInfo.schoolSubtitle}
            </div>
            <div className="text-[8.5px] text-slate-600 mt-0.5 leading-tight">
              {schoolInfo.address}
            </div>
            <div className="text-[8px] font-bold text-slate-500 mt-0.5 tracking-wide">
              UDISE CODE: <strong className="text-slate-800">{schoolInfo.udiseCode}</strong> &bull; OFFICIAL CUMULATIVE TRANSCRIPT
            </div>
          </div>

          {options.showPhoto ? (
            <div
              style={{ border: `1.5px solid ${theme.gold}` }}
              className="w-[70px] h-[84px] rounded bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs"
            >
              {studentPhotoSrc ? (
                <img
                  src={studentPhotoSrc}
                  alt={student.name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[7.5px] font-bold text-slate-400 text-center leading-tight px-1">
                  STUDENT
                  <br />
                  PHOTO
                </div>
              )}
            </div>
          ) : (
            <div className="w-[70px] shrink-0" />
          )}
        </div>

        {/* Title Ribbon */}
        <div
          style={{
            background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.primary} 100%)`,
          }}
          className="text-center py-1.5 rounded-sm mb-2 shadow-xs"
        >
          <div className="text-[11px] font-black tracking-[0.18em] text-amber-200 uppercase">
            ANNUAL CUMULATIVE ACADEMIC PROGRESS REPORT &bull; {student.academicYear}
          </div>
        </div>

        {/* Student Profile Dossier */}
        <div
          style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
          className="rounded-sm px-3 py-2 mb-2 text-[9px]"
        >
          <div className="grid grid-cols-3 gap-x-3 gap-y-1">
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">STUDENT NAME:</span>
              <strong style={{ color: theme.primary }} className="font-black text-[9.5px] uppercase">
                {student.name}
              </strong>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">ROLL NO / ID:</span>
              <strong className="font-extrabold text-slate-900">{student.rollNo}</strong>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">CLASS &amp; SEC:</span>
              <strong className="font-extrabold text-slate-900">{student.className}</strong>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">FATHER'S NAME:</span>
              <strong className="font-bold text-slate-800">{student.fatherName || '—'}</strong>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">MOTHER'S NAME:</span>
              <strong className="font-bold text-slate-800">{student.motherName || '—'}</strong>
            </div>
            <div className="truncate">
              <span className="text-slate-500 font-bold text-[8px] mr-1">DATE OF BIRTH:</span>
              <strong className="font-bold text-slate-800">{student.dob || '—'}</strong>
            </div>
          </div>
        </div>

        {/* PART I: SCHOLASTIC EVALUATION — 100% Unclipped Fixed-Layout Table */}
        <div className="mb-2">
          <div
            style={{ backgroundColor: theme.accentBg, color: theme.primary, borderLeft: `4px solid ${theme.primary}` }}
            className="text-[8.5px] font-black px-2.5 py-1 uppercase tracking-wider mb-1"
          >
            PART I : SCHOLASTIC EVALUATION (CCE FORMATIVE &amp; SUMMATIVE)
          </div>

          <table
            style={{ tableLayout: 'fixed', width: '100%', borderColor: theme.primary }}
            className="border-collapse border text-[8px]"
          >
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '5.5%' }} />
              <col style={{ width: '5.5%' }} />
              <col style={{ width: '5.5%' }} />
              <col style={{ width: '5.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '6.5%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: theme.primary }} className="text-white uppercase text-center font-extrabold text-[7px]">
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5">SL</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-1.5 text-left">CURRICULAR SUBJECTS</th>
                <th colSpan={4} className="border border-white/20 py-0.5">FORMATIVE ASSESSMENTS</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5 bg-black/15">FA<br />TOT</th>
                <th colSpan={2} className="border border-white/20 py-0.5">SUMMATIVE</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5 bg-black/15">SA<br />TOT</th>
                <th rowSpan={2} style={{ backgroundColor: theme.secondary }} className="border border-white/20 py-1 px-0.5">GRAND<br />TOTAL</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5">%</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5 bg-black/15">GRD</th>
                <th rowSpan={2} className="border border-white/20 py-1 px-0.5">GP</th>
              </tr>
              <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white uppercase text-center font-bold text-[6.8px]">
                <th className="border border-white/20 py-0.5">FA-1</th>
                <th className="border border-white/20 py-0.5">FA-2</th>
                <th className="border border-white/20 py-0.5">FA-3</th>
                <th className="border border-white/20 py-0.5">FA-4</th>
                <th className="border border-white/20 py-0.5">SA-1</th>
                <th className="border border-white/20 py-0.5">SA-2</th>
              </tr>
            </thead>
            <tbody>
              {student.subjectRows.map((row, idx) => (
                <tr
                  key={row.slNo}
                  style={{ backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}
                  className="border-b border-slate-300 text-slate-900"
                >
                  <td className="border-r border-slate-300 text-center font-bold py-1">{row.slNo}</td>
                  <td
                    style={{ color: theme.primary }}
                    className="border-r border-slate-300 font-bold uppercase py-1 px-1.5 truncate"
                    title={row.subjectName}
                  >
                    {row.subjectName}
                  </td>
                  <td className="border-r border-slate-300 text-center">{row.fa1 !== null ? row.fa1 : '-'}</td>
                  <td className="border-r border-slate-300 text-center">{row.fa2 !== null ? row.fa2 : '-'}</td>
                  <td className="border-r border-slate-300 text-center">{row.fa3 !== null ? row.fa3 : '-'}</td>
                  <td className="border-r border-slate-300 text-center">{row.fa4 !== null ? row.fa4 : '-'}</td>
                  <td className="border-r border-slate-300 text-center font-black bg-slate-100">
                    {row.faTotal !== null ? row.faTotal : '-'}
                  </td>
                  <td className="border-r border-slate-300 text-center">{row.sa1 !== null ? row.sa1 : '-'}</td>
                  <td className="border-r border-slate-300 text-center">{row.sa2 !== null ? row.sa2 : '-'}</td>
                  <td className="border-r border-slate-300 text-center font-black bg-slate-100">
                    {row.saTotal !== null ? row.saTotal : '-'}
                  </td>
                  <td
                    style={{ backgroundColor: theme.accentBg, color: theme.primary }}
                    className="border-r border-slate-300 text-center font-black"
                  >
                    {row.grandTotal !== null ? row.grandTotal : '-'}
                  </td>
                  <td className="border-r border-slate-300 text-center font-bold">
                    {row.percentage !== null ? `${row.percentage}%` : '-'}
                  </td>
                  <td className="border-r border-slate-300 text-center font-black">
                    <span
                      style={getGradeBadgeStyle(row.grade)}
                      className="inline-block px-1 py-0.2 rounded text-[7.5px] font-black"
                    >
                      {row.grade}
                    </span>
                  </td>
                  <td className="text-center font-bold">{row.gradePoint !== null ? row.gradePoint : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                style={{ backgroundColor: '#f1f5f9', borderTop: `2px solid ${theme.primary}`, color: theme.primary }}
                className="font-black text-[8px]"
              >
                <td colSpan={2} className="py-1 px-1.5 text-right uppercase tracking-wide text-[7.2px]">
                  CUMULATIVE SUMMARY
                </td>
                <td colSpan={4} className="border-l border-slate-300 text-center text-[7px] font-bold text-slate-600">
                  FA AGGREGATE
                </td>
                <td className="border-l border-slate-300 text-center font-black bg-slate-200/80">
                  {faTotalSum || '-'}
                </td>
                <td colSpan={2} className="border-l border-slate-300 text-center text-[7px] font-bold text-slate-600">
                  SA AGGREGATE
                </td>
                <td className="border-l border-slate-300 text-center font-black bg-slate-200/80">
                  {saTotalSum || '-'}
                </td>
                <td
                  style={{ backgroundColor: theme.accentBg, color: theme.primary }}
                  className="border-l border-slate-300 text-center font-black"
                >
                  {student.summary.totalObtained}
                </td>
                <td className="border-l border-slate-300 text-center font-black">{student.summary.percentage}%</td>
                <td className="border-l border-slate-300 text-center font-black">{student.summary.grade}</td>
                <td className="border-l border-slate-300 text-center font-black">{student.summary.gpa}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Performance KPI Summary Strip */}
        <div
          style={{ border: `1.5px solid ${theme.primary}` }}
          className="flex rounded-sm overflow-hidden mb-2 bg-white text-center"
        >
          <div className="flex-1 py-1 px-1.5 border-r border-slate-200">
            <span className="block text-[6.5px] font-extrabold text-slate-500 uppercase">Total Marks</span>
            <strong style={{ color: theme.primary }} className="text-[10.5px] font-black">
              {student.summary.totalObtained} / {student.summary.totalMax}
            </strong>
          </div>
          <div className="flex-1 py-1 px-1.5 border-r border-slate-200">
            <span className="block text-[6.5px] font-extrabold text-slate-500 uppercase">Aggregate %</span>
            <strong style={{ color: theme.primary }} className="text-[10.5px] font-black">
              {student.summary.percentage}%
            </strong>
          </div>
          <div className="flex-1 py-1 px-1.5 border-r border-slate-200">
            <span className="block text-[6.5px] font-extrabold text-slate-500 uppercase">Grade &amp; GPA</span>
            <strong style={{ color: theme.secondary }} className="text-[10.5px] font-black">
              {student.summary.grade} ({student.summary.gpa})
            </strong>
          </div>
          {options.showRank && (
            <div className="flex-1 py-1 px-1.5 border-r border-slate-200">
              <span className="block text-[6.5px] font-extrabold text-slate-500 uppercase">Class Rank</span>
              <strong className="text-[10.5px] font-black text-amber-700">#{student.summary.rank}</strong>
            </div>
          )}
          <div className="flex-1 py-1 px-1.5 bg-emerald-50">
            <span className="block text-[6.5px] font-extrabold text-emerald-800 uppercase">Final Result</span>
            <strong className="text-[10px] font-black text-emerald-800">{student.summary.result}</strong>
          </div>
        </div>

        {/* PART II: Co-Scholastic & CCE Scale */}
        {options.showCoScholastic && (
          <div className="flex gap-2.5 mb-2">
            <div className="flex-[1.12]">
              <div
                style={{ backgroundColor: theme.accentBg, color: theme.primary, borderLeft: `4px solid ${theme.primary}` }}
                className="text-[7.8px] font-black px-2 py-0.5 uppercase tracking-wider mb-1"
              >
                PART II : CO-SCHOLASTIC AREAS &amp; ATTENDANCE
              </div>
              <table className="w-full border-collapse border border-slate-300 text-[7.8px]">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 px-2 text-slate-600 font-medium">Attendance (Present / Working Days)</td>
                    <td style={{ color: theme.primary }} className="py-0.5 px-2 text-right font-black">
                      {student.attendance.presentDays} / {student.attendance.totalDays} ({student.attendance.percentage}%)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 px-2 text-slate-600 font-medium">Life Skills &amp; Value Education</td>
                    <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A+ (Exemplary)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 px-2 text-slate-600 font-medium">Art &amp; Cultural Education</td>
                    <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A (Proficient)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 px-2 text-slate-600 font-medium">Work &amp; Computer Literacy</td>
                    <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A+ (Exemplary)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-0.5 px-2 text-slate-600 font-medium">Physical &amp; Health Education</td>
                    <td className="py-0.5 px-2 text-right font-bold text-emerald-700">A (Proficient)</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-600 font-medium">General Conduct &amp; Discipline</td>
                    <td style={{ color: theme.primary }} className="py-0.5 px-2 text-right font-black">EXCELLENT</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex-[0.88]">
              <div
                style={{ backgroundColor: theme.accentBg, color: theme.primary, borderLeft: `4px solid ${theme.primary}` }}
                className="text-[7.8px] font-black px-2 py-0.5 uppercase tracking-wider mb-1"
              >
                CCE GRADING SCALE (REFERENCE)
              </div>
              <table className="w-full border-collapse border border-slate-300 text-[7.3px] text-center">
                <thead>
                  <tr className="bg-slate-100 font-black text-slate-800">
                    <th className="py-0.5 px-1 border border-slate-300">MARKS %</th>
                    <th className="py-0.5 px-1 border border-slate-300">GRADE</th>
                    <th className="py-0.5 px-1 border border-slate-300">GP</th>
                    <th className="py-0.5 px-1 border border-slate-300">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200"><td>91% - 100%</td><td className="font-bold">A1</td><td>10</td><td>Outstanding</td></tr>
                  <tr className="border-b border-slate-200"><td>81% - 90%</td><td className="font-bold">A2</td><td>9</td><td>Excellent</td></tr>
                  <tr className="border-b border-slate-200"><td>71% - 80%</td><td className="font-bold">B1</td><td>8</td><td>Very Good</td></tr>
                  <tr className="border-b border-slate-200"><td>61% - 70%</td><td className="font-bold">B2</td><td>7</td><td>Good</td></tr>
                  <tr className="border-b border-slate-200"><td>51% - 60%</td><td className="font-bold">C1</td><td>6</td><td>Above Avg</td></tr>
                  <tr className="border-b border-slate-200"><td>41% - 50%</td><td className="font-bold">C2</td><td>5</td><td>Average</td></tr>
                  <tr className="border-b border-slate-200"><td>35% - 40%</td><td className="font-bold">D</td><td>4</td><td>Pass</td></tr>
                  <tr><td>Below 35%</td><td className="font-bold text-rose-700">E</td><td>3</td><td className="text-rose-700">Needs Imp</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teacher's Remarks Box */}
        <div
          style={{ border: '1px solid #cbd5e1', backgroundColor: '#fafafa' }}
          className="rounded-sm px-2.5 py-1.5 mb-2 flex items-center gap-2 text-[8px]"
        >
          <span style={{ color: theme.primary }} className="font-black uppercase shrink-0">
            Class Teacher's Remarks:
          </span>
          <span className="font-semibold text-slate-700 italic">{remark || getDefaultRemark(student)}</span>
        </div>

        {/* Signatures Row */}
        {options.showSignatures && (
          <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-300 text-center">
            <div className="w-36">
              <div className="h-9" />
              <div style={{ borderBottom: `1.5px solid ${theme.primary}` }} className="mb-1" />
              <div style={{ color: theme.primary }} className="text-[8px] font-black uppercase">
                PARENT / GUARDIAN
              </div>
            </div>

            <div className="w-36">
              <div className="h-9 flex items-center justify-center">
                {teacherSignSrc && (
                  <img
                    src={teacherSignSrc}
                    alt="Class Teacher Signature"
                    crossOrigin="anonymous"
                    className="max-h-9 max-w-28 object-contain"
                  />
                )}
              </div>
              <div style={{ borderBottom: `1.5px solid ${theme.primary}` }} className="mb-1" />
              <div style={{ color: theme.primary }} className="text-[8px] font-black uppercase">
                CLASS TEACHER
              </div>
            </div>

            <div className="w-40">
              <div className="h-9 flex items-center justify-center">
                {principalSignSrc && (
                  <img
                    src={principalSignSrc}
                    alt="Principal Signature"
                    crossOrigin="anonymous"
                    className="max-h-9 max-w-32 object-contain"
                  />
                )}
              </div>
              <div style={{ borderBottom: `2px solid ${theme.primary}` }} className="mb-1" />
              <div style={{ color: theme.primary }} className="text-[8px] font-black uppercase">
                HEADMASTER / PRINCIPAL
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AcademicProgressCardPage: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    schoolName: 'SRI VENKATESWARA JY SCHOOL',
    schoolSubtitle: '(Recognized by Govt. of Andhra Pradesh | English Medium High School)',
    address: 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam',
    logoUrl: '/logo.png',
    principalSignatureUrl: null,
    teacherSignatureUrl: null,
    udiseCode: '281125100013',
  });
  const [students, setStudents] = useState<StudentEvaluation[]>([]);
  const [detectedExams, setDetectedExams] = useState<Record<string, any>>({});

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPreviewIndex, setBulkPreviewIndex] = useState(0);

  // Customization Controls
  const [themeId, setThemeId] = useState<string>('royal');
  const [cardOptions, setCardOptions] = useState<CardOptions>({
    showPhoto: true,
    showRank: true,
    showCoScholastic: true,
    showSignatures: true,
  });
  const [customRemarks, setCustomRemarks] = useState<Record<string, string>>({});

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zoomScale, setZoomScale] = useState(0.78);

  // Unscaled offscreen ref guarantees 1:1 exact A4 PDF output regardless of zoom level
  const pdfCaptureRef = useRef<HTMLDivElement>(null);
  const [captureStudent, setCaptureStudent] = useState<StudentEvaluation | null>(null);

  const activeTheme = useMemo(
    () => CARD_THEMES.find(t => t.id === themeId) || CARD_THEMES[0],
    [themeId]
  );

  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await api.get('/api/classes?limit=1000');
      const list = res.data?.data || res.data || [];
      setClasses(list);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].id);
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadCceData = async (classId: string) => {
    if (!classId) {
      setStudents([]);
      setBulkSelectedIds([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/marks/cce-cumulative-card?classId=${classId}`);
      const data = res.data?.data || res.data;
      if (data) {
        if (data.school) setSchoolInfo(data.school);
        if (data.detectedExams) setDetectedExams(data.detectedExams);
        const stList: StudentEvaluation[] = data.students || [];
        setStudents(stList);
        setBulkSelectedIds(stList.map(s => s.id));
        setBulkPreviewIndex(0);
        setSelectedStudentId(stList.length > 0 ? stList[0].id : '');
      }
    } catch (err) {
      console.error('Failed to load CCE cumulative data', err);
      toast.error('Failed to load Academic Progress Card data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCceData(selectedClassId);
  }, [selectedClassId]);

  const currentStudent: StudentEvaluation | undefined =
    mode === 'single'
      ? students.find(s => s.id === selectedStudentId) || students[0]
      : students[bulkPreviewIndex] || students[0];

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      s => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Class KPI summary
  const kpis = useMemo(() => {
    const total = students.length;
    const detectedCount = ['fa1', 'fa2', 'fa3', 'fa4', 'sa1', 'sa2'].filter(k => !!detectedExams[k]).length;
    const passed = students.filter(s => !(s.summary?.result || '').toUpperCase().includes('FAIL') && !(s.summary?.grade || '').toUpperCase().includes('E')).length;
    const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;
    const topper = students.length > 0
      ? [...students].sort((a, b) => (b.summary?.percentage || 0) - (a.summary?.percentage || 0))[0]
      : null;
    return { total, detectedCount, passed, passPct, topper };
  }, [students, detectedExams]);

  const toggleSelectAll = () => {
    if (bulkSelectedIds.length === students.length) setBulkSelectedIds([]);
    else setBulkSelectedIds(students.map(s => s.id));
  };

  const toggleSelectStudent = (id: string) => {
    setBulkSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Capture unscaled A4 container for 1:1 exact PDF export
  const captureElementToPdfBlob = async (): Promise<Blob | null> => {
    if (!pdfCaptureRef.current) return null;
    const canvas = await html2canvas(pdfCaptureRef.current, {
      scale: 2.2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: pdfCaptureRef.current.offsetWidth,
      height: pdfCaptureRef.current.offsetHeight,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    return pdf.output('blob');
  };

  const downloadSinglePdf = async (st: StudentEvaluation) => {
    setIsExportingPdf(true);
    const toastId = toast.loading(`Generating 1:1 A4 PDF for ${st.name}...`);
    try {
      setCaptureStudent(st);
      await new Promise(r => setTimeout(r, 250));
      const blob = await captureElementToPdfBlob();
      if (!blob) throw new Error('Capture container missing');
      saveAs(blob, `${st.rollNo}_${st.name.replace(/\s+/g, '_')}_Progress_Card.pdf`);
      toast.success('A4 PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('PDF capture failed — please try Print Card (Save as PDF)', { id: toastId });
    } finally {
      setCaptureStudent(null);
      setIsExportingPdf(false);
    }
  };

  const downloadBulkZip = async () => {
    const selectedStudents = students.filter(s => bulkSelectedIds.includes(s.id));
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setIsZipping(true);
    const toastId = toast.loading(`Preparing A4 PDFs for ${selectedStudents.length} students...`);
    try {
      const zip = new JSZip();
      for (let i = 0; i < selectedStudents.length; i++) {
        const st = selectedStudents[i];
        setCaptureStudent(st);
        await new Promise(r => setTimeout(r, 220));
        const blob = await captureElementToPdfBlob();
        if (blob) {
          zip.file(`${st.rollNo}_${st.name.replace(/\s+/g, '_')}_ProgressCard.pdf`, blob);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const clsName = classes.find(c => c.id === selectedClassId)?.name || 'Class';
      saveAs(content, `Progress_Cards_${clsName.replace(/\s+/g, '_')}.zip`);
      toast.success('All PDFs zipped & downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate ZIP', { id: toastId });
    } finally {
      setCaptureStudent(null);
      setIsZipping(false);
    }
  };

  // Native Print Engine matching the Live A4 JSX Card 1:1
  const printCceCards = (studentsToPrint: StudentEvaluation[]) => {
    if (studentsToPrint.length === 0) {
      toast.error('No students selected to print');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Failed to open print preview');
      document.body.removeChild(iframe);
      return;
    }

    const logoSrc = schoolInfo.logoUrl ? getPhotoUrl(schoolInfo.logoUrl) : '/logo.png';
    const principalSignSrc = schoolInfo.principalSignatureUrl ? getPhotoUrl(schoolInfo.principalSignatureUrl) : '';
    const teacherSignSrc = schoolInfo.teacherSignatureUrl ? getPhotoUrl(schoolInfo.teacherSignatureUrl) : '';

    const renderCardHtml = (st: StudentEvaluation) => {
      const studentPhoto = st.photoUrl ? getPhotoUrl(st.photoUrl) : '';
      const remarkText = customRemarks[st.id] ?? getDefaultRemark(st);
      const faSum = st.subjectRows.reduce((acc, r) => acc + (r.faTotal || 0), 0);
      const saSum = st.subjectRows.reduce((acc, r) => acc + (r.saTotal || 0), 0);

      return `
        <div class="cce-sheet">
          <div class="cce-inner-border">
            <div class="school-header">
              <div class="logo-box">
                <img src="${logoSrc}" alt="Logo" class="school-logo" onerror="this.style.display='none'" />
              </div>
              <div class="school-details">
                <h1 class="school-title">${schoolInfo.schoolName}</h1>
                <div class="school-subtitle">${schoolInfo.schoolSubtitle}</div>
                <div class="school-address">${schoolInfo.address}</div>
                <div class="school-udise">UDISE CODE: <strong>${schoolInfo.udiseCode}</strong> &bull; OFFICIAL CUMULATIVE TRANSCRIPT</div>
              </div>
              ${
                cardOptions.showPhoto
                  ? `<div class="photo-box">${
                      studentPhoto
                        ? `<img src="${studentPhoto}" class="student-photo" alt="Photo" />`
                        : `<div class="photo-placeholder">STUDENT<br/>PHOTO</div>`
                    }</div>`
                  : `<div style="width:20mm"></div>`
              }
            </div>

            <div class="ribbon-container">
              <div class="ribbon-text">ANNUAL CUMULATIVE ACADEMIC PROGRESS REPORT &bull; ${st.academicYear}</div>
            </div>

            <div class="student-profile-grid">
              <div class="profile-row">
                <div class="profile-cell"><span class="lbl">STUDENT NAME:</span> <strong class="val name-val">${st.name}</strong></div>
                <div class="profile-cell"><span class="lbl">ROLL NO / ID:</span> <strong class="val">${st.rollNo}</strong></div>
                <div class="profile-cell"><span class="lbl">CLASS &amp; SEC:</span> <strong class="val">${st.className}</strong></div>
              </div>
              <div class="profile-row">
                <div class="profile-cell"><span class="lbl">FATHER'S NAME:</span> <strong class="val">${st.fatherName || '—'}</strong></div>
                <div class="profile-cell"><span class="lbl">MOTHER'S NAME:</span> <strong class="val">${st.motherName || '—'}</strong></div>
                <div class="profile-cell"><span class="lbl">DATE OF BIRTH:</span> <strong class="val">${st.dob || '—'}</strong></div>
              </div>
            </div>

            <div class="section-badge">PART I : SCHOLASTIC EVALUATION (CCE FORMATIVE &amp; SUMMATIVE)</div>
            <table class="marks-table">
              <colgroup>
                <col style="width:4%" /><col style="width:24%" />
                <col style="width:5.5%" /><col style="width:5.5%" /><col style="width:5.5%" /><col style="width:5.5%" />
                <col style="width:6.5%" /><col style="width:6.5%" /><col style="width:6.5%" /><col style="width:6.5%" />
                <col style="width:8%" /><col style="width:6%" /><col style="width:5%" /><col style="width:5%" />
              </colgroup>
              <thead>
                <tr>
                  <th rowspan="2">SL</th>
                  <th rowspan="2" class="text-left" style="padding-left:2mm">CURRICULAR SUBJECTS</th>
                  <th colspan="4">FORMATIVE ASSESSMENTS</th>
                  <th rowspan="2" class="head-dark">FA<br/>TOT</th>
                  <th colspan="2">SUMMATIVE</th>
                  <th rowspan="2" class="head-dark">SA<br/>TOT</th>
                  <th rowspan="2" class="head-sec">GRAND<br/>TOTAL</th>
                  <th rowspan="2">%</th>
                  <th rowspan="2" class="head-dark">GRD</th>
                  <th rowspan="2">GP</th>
                </tr>
                <tr class="sub-head">
                  <th>FA-1</th><th>FA-2</th><th>FA-3</th><th>FA-4</th><th>SA-1</th><th>SA-2</th>
                </tr>
              </thead>
              <tbody>
                ${st.subjectRows
                  .map(
                    (row, idx) => `
                  <tr style="background:${idx % 2 === 1 ? '#f8fafc' : '#ffffff'}">
                    <td class="text-center font-bold">${row.slNo}</td>
                    <td class="font-bold subject-title">${row.subjectName}</td>
                    <td class="text-center">${row.fa1 !== null ? row.fa1 : '-'}</td>
                    <td class="text-center">${row.fa2 !== null ? row.fa2 : '-'}</td>
                    <td class="text-center">${row.fa3 !== null ? row.fa3 : '-'}</td>
                    <td class="text-center">${row.fa4 !== null ? row.fa4 : '-'}</td>
                    <td class="text-center font-black bg-highlight">${row.faTotal !== null ? row.faTotal : '-'}</td>
                    <td class="text-center">${row.sa1 !== null ? row.sa1 : '-'}</td>
                    <td class="text-center">${row.sa2 !== null ? row.sa2 : '-'}</td>
                    <td class="text-center font-black bg-highlight">${row.saTotal !== null ? row.saTotal : '-'}</td>
                    <td class="text-center font-black bg-total">${row.grandTotal !== null ? row.grandTotal : '-'}</td>
                    <td class="text-center font-bold">${row.percentage !== null ? `${row.percentage}%` : '-'}</td>
                    <td class="text-center font-black">${row.grade}</td>
                    <td class="text-center font-bold">${row.gradePoint !== null ? row.gradePoint : '-'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2" class="text-right font-black" style="padding-right:2mm">CUMULATIVE SUMMARY</td>
                  <td colspan="4" class="text-center font-bold">FA AGGREGATE</td>
                  <td class="text-center font-black bg-highlight">${faSum || '-'}</td>
                  <td colspan="2" class="text-center font-bold">SA AGGREGATE</td>
                  <td class="text-center font-black bg-highlight">${saSum || '-'}</td>
                  <td class="text-center font-black bg-total">${st.summary.totalObtained}</td>
                  <td class="text-center font-black">${st.summary.percentage}%</td>
                  <td class="text-center font-black">${st.summary.grade}</td>
                  <td class="text-center font-black">${st.summary.gpa}</td>
                </tr>
              </tfoot>
            </table>

            <div class="summary-metrics-bar">
              <div class="metric-box"><span class="m-lbl">Total Marks</span><span class="m-val">${st.summary.totalObtained} / ${st.summary.totalMax}</span></div>
              <div class="metric-box"><span class="m-lbl">Aggregate %</span><span class="m-val">${st.summary.percentage}%</span></div>
              <div class="metric-box"><span class="m-lbl">Grade &amp; GPA</span><span class="m-val">${st.summary.grade} (${st.summary.gpa})</span></div>
              ${cardOptions.showRank ? `<div class="metric-box"><span class="m-lbl">Class Rank</span><span class="m-val" style="color:#b45309">#${st.summary.rank}</span></div>` : ''}
              <div class="metric-box result-box"><span class="m-lbl">Final Result</span><span class="m-val result-highlight">${st.summary.result}</span></div>
            </div>

            ${
              cardOptions.showCoScholastic
                ? `<div class="two-col-layout">
              <div class="left-col">
                <div class="section-badge">PART II : CO-SCHOLASTIC AREAS &amp; ATTENDANCE</div>
                <table class="sub-mini-table">
                  <tr><td class="lbl">Attendance (Present / Working Days)</td><td class="val font-black">${st.attendance.presentDays} / ${st.attendance.totalDays} (${st.attendance.percentage}%)</td></tr>
                  <tr><td class="lbl">Life Skills &amp; Value Education</td><td class="val font-bold" style="color:#047857">A+ (Exemplary)</td></tr>
                  <tr><td class="lbl">Art &amp; Cultural Education</td><td class="val font-bold" style="color:#047857">A (Proficient)</td></tr>
                  <tr><td class="lbl">Work &amp; Computer Literacy</td><td class="val font-bold" style="color:#047857">A+ (Exemplary)</td></tr>
                  <tr><td class="lbl">Physical &amp; Health Education</td><td class="val font-bold" style="color:#047857">A (Proficient)</td></tr>
                  <tr><td class="lbl">General Conduct &amp; Discipline</td><td class="val font-black">EXCELLENT</td></tr>
                </table>
              </div>
              <div class="right-col">
                <div class="section-badge">CCE GRADING SCALE (REFERENCE)</div>
                <table class="scale-table">
                  <thead><tr><th>MARKS %</th><th>GRADE</th><th>GP</th><th>REMARKS</th></tr></thead>
                  <tbody>
                    <tr><td>91% - 100%</td><td class="font-bold">A1</td><td>10</td><td>Outstanding</td></tr>
                    <tr><td>81% - 90%</td><td class="font-bold">A2</td><td>9</td><td>Excellent</td></tr>
                    <tr><td>71% - 80%</td><td class="font-bold">B1</td><td>8</td><td>Very Good</td></tr>
                    <tr><td>61% - 70%</td><td class="font-bold">B2</td><td>7</td><td>Good</td></tr>
                    <tr><td>51% - 60%</td><td class="font-bold">C1</td><td>6</td><td>Above Avg</td></tr>
                    <tr><td>41% - 50%</td><td class="font-bold">C2</td><td>5</td><td>Average</td></tr>
                    <tr><td>35% - 40%</td><td class="font-bold">D</td><td>4</td><td>Pass</td></tr>
                    <tr><td>Below 35%</td><td class="font-bold" style="color:#be123c">E</td><td>3</td><td style="color:#be123c">Needs Imp</td></tr>
                  </tbody>
                </table>
              </div>
            </div>`
                : ''
            }

            <div class="remarks-box">
              <strong>CLASS TEACHER'S REMARKS:</strong> <em>${remarkText}</em>
            </div>

            ${
              cardOptions.showSignatures
                ? `<div class="signatures-wrapper">
              <div class="sign-column"><div class="sign-space"></div><div class="sign-line"></div><div class="sign-label">PARENT / GUARDIAN</div></div>
              <div class="sign-column"><div class="sign-space">${teacherSignSrc ? `<img src="${teacherSignSrc}" class="sign-img" />` : ''}</div><div class="sign-line"></div><div class="sign-label">CLASS TEACHER</div></div>
              <div class="sign-column"><div class="sign-space">${principalSignSrc ? `<img src="${principalSignSrc}" class="sign-img" />` : ''}</div><div class="sign-line" style="border-width:2px"></div><div class="sign-label">HEADMASTER / PRINCIPAL</div></div>
            </div>`
                : ''
            }
          </div>
        </div>
      `;
    };

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Academic Progress Cards</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
          .cce-sheet { width: 210mm; height: 297mm; max-height: 297mm; padding: 6.5mm; background: #fff; page-break-after: always; overflow: hidden; }
          .cce-sheet:last-child { page-break-after: avoid; }
          .cce-inner-border { border: 2.5px solid ${activeTheme.primary}; outline: 1.2px solid ${activeTheme.gold}; outline-offset: -4px; height: 100%; padding: 5.5mm 6.5mm; display: flex; flex-direction: column; justify-content: space-between; }
          .school-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${activeTheme.primary}; padding-bottom: 2.5mm; margin-bottom: 2mm; }
          .logo-box { width: 20mm; height: 20mm; display: flex; align-items: center; justify-content: center; }
          .school-logo { max-width: 19mm; max-height: 19mm; object-fit: contain; }
          .school-details { flex: 1; text-align: center; padding: 0 3mm; }
          .school-title { font-family: Georgia, serif; font-size: 16pt; font-weight: 900; color: ${activeTheme.primary}; text-transform: uppercase; line-height: 1.15; }
          .school-subtitle { font-size: 8pt; font-weight: 800; color: #be123c; margin-top: 0.5mm; }
          .school-address { font-size: 7.5pt; color: #475569; margin-top: 0.5mm; }
          .school-udise { font-size: 7pt; color: #64748b; margin-top: 0.5mm; font-weight: 700; }
          .photo-box { width: 19mm; height: 23mm; border: 1.5px solid ${activeTheme.gold}; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .student-photo { width: 100%; height: 100%; object-fit: cover; }
          .photo-placeholder { font-size: 6pt; text-align: center; color: #94a3b8; font-weight: 700; }
          .ribbon-container { background: linear-gradient(90deg, ${activeTheme.primary} 0%, ${activeTheme.secondary} 50%, ${activeTheme.primary} 100%); text-align: center; padding: 1.4mm 0; border-radius: 1mm; margin-bottom: 2mm; }
          .ribbon-text { font-size: 9pt; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #fde68a; }
          .student-profile-grid { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 1mm; padding: 2mm 3mm; margin-bottom: 2mm; font-size: 7.8pt; }
          .profile-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .profile-row:last-child { margin-bottom: 0; }
          .profile-cell { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 2mm; }
          .profile-cell .lbl { color: #64748b; font-size: 6.8pt; font-weight: 700; margin-right: 1mm; }
          .profile-cell .val { color: #0f172a; font-size: 8pt; }
          .profile-cell .name-val { color: ${activeTheme.primary}; font-weight: 900; }
          .section-badge { background: ${activeTheme.accentBg}; color: ${activeTheme.primary}; font-size: 7.2pt; font-weight: 900; padding: 0.9mm 2.5mm; border-left: 3.5px solid ${activeTheme.primary}; text-transform: uppercase; margin-bottom: 1.2mm; letter-spacing: 0.4px; }
          .marks-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 2mm; }
          .marks-table th, .marks-table td { border: 1px solid ${activeTheme.primary}; padding: 1.1mm 0.6mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .marks-table thead th { background: ${activeTheme.primary}; color: #fff; font-size: 6.4pt; font-weight: 800; text-align: center; text-transform: uppercase; }
          .marks-table thead .sub-head th { background: #1e3a5f; font-size: 6pt; }
          .head-dark { background: #0b223d !important; }
          .head-sec { background: ${activeTheme.secondary} !important; }
          .subject-title { text-transform: uppercase; text-align: left; padding-left: 1.5mm !important; color: ${activeTheme.primary}; }
          .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
          .font-bold { font-weight: 700; } .font-black { font-weight: 900; }
          .bg-highlight { background: #f1f5f9; }
          .bg-total { background: ${activeTheme.accentBg}; color: ${activeTheme.primary}; }
          .total-row { background: #f1f5f9; border-top: 2px solid ${activeTheme.primary}; color: ${activeTheme.primary}; }
          .summary-metrics-bar { display: flex; border: 1.5px solid ${activeTheme.primary}; border-radius: 1mm; margin-bottom: 2mm; overflow: hidden; }
          .metric-box { flex: 1; padding: 1.2mm 1.5mm; text-align: center; border-right: 1px solid #cbd5e1; }
          .metric-box:last-child { border-right: none; }
          .metric-box .m-lbl { display: block; font-size: 6pt; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .metric-box .m-val { font-size: 9pt; font-weight: 900; color: ${activeTheme.primary}; }
          .result-box { background: #ecfdf5; } .result-highlight { color: #065f46 !important; }
          .two-col-layout { display: flex; gap: 3mm; margin-bottom: 2mm; }
          .left-col { flex: 1.12; } .right-col { flex: 0.88; }
          .sub-mini-table, .scale-table { width: 100%; border-collapse: collapse; font-size: 6.8pt; }
          .sub-mini-table td, .scale-table td, .scale-table th { border: 1px solid #cbd5e1; padding: 0.9mm 1.4mm; }
          .sub-mini-table .lbl { color: #475569; } .sub-mini-table .val { text-align: right; }
          .scale-table thead th { background: #f1f5f9; color: #0f172a; font-weight: 800; text-align: center; }
          .scale-table td { text-align: center; }
          .remarks-box { border: 1px solid #cbd5e1; background: #fafafa; padding: 1.2mm 2.5mm; font-size: 7.2pt; margin-bottom: 2mm; color: #334155; }
          .remarks-box strong { color: ${activeTheme.primary}; margin-right: 1.5mm; }
          .signatures-wrapper { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 2mm; border-top: 1px dashed #cbd5e1; text-align: center; }
          .sign-column { width: 44mm; }
          .sign-space { height: 10mm; display: flex; align-items: center; justify-content: center; }
          .sign-img { max-height: 10mm; max-width: 34mm; object-fit: contain; }
          .sign-line { border-bottom: 1.5px solid ${activeTheme.primary}; margin-bottom: 1mm; }
          .sign-label { font-size: 7pt; font-weight: 900; text-transform: uppercase; color: ${activeTheme.primary}; }
        </style>
      </head>
      <body>${studentsToPrint.map(st => renderCardHtml(st)).join('')}</body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error(e);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          }, 1200);
        }
      }, 350);
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC]">
      <PageHeader
        title="Academic Progress Card Studio"
        icon={<Award className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/office-tools')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Office Tools</span>
            </button>

            <button
              type="button"
              onClick={() => loadCceData(selectedClassId)}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {mode === 'single' && currentStudent && (
              <>
                <button
                  type="button"
                  onClick={() => printCceCards([currentStudent])}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Card (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadSinglePdf(currentStudent)}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </>
            )}

            {mode === 'bulk' && (
              <>
                <button
                  type="button"
                  onClick={() => printCceCards(students.filter(s => bulkSelectedIds.includes(s.id)))}
                  disabled={bulkSelectedIds.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All ({bulkSelectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={downloadBulkZip}
                  disabled={isZipping || bulkSelectedIds.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-105 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isZipping ? 'Creating ZIP...' : `Download PDF ZIP (${bulkSelectedIds.length})`}</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Top 4 Pastel Class KPI Cards */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700/80">Class Strength</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.total}</h3>
              <p className="text-[11px] font-bold text-indigo-700">Students Evaluated</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-700/80">CCE Exams Synced</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.detectedCount} / 6</h3>
              <p className="text-[11px] font-bold text-violet-700">FA1–FA4 &amp; SA1–SA2</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700/80">Pass Rate</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.passPct}%</h3>
              <p className="text-[11px] font-bold text-emerald-800">{kpis.passed} Qualified</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800/80">Class Topper</p>
              <h3 className="text-base font-black text-slate-900 mt-0.5 truncate">
                {kpis.topper ? kpis.topper.name : '—'}
              </h3>
              <p className="text-[11px] font-bold text-amber-800">
                {kpis.topper ? `${kpis.topper.summary.percentage}% • Grade ${kpis.topper.summary.grade}` : 'No data yet'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Studio */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col lg:flex-row gap-5">
        {/* LEFT LIGHT CONTROL SIDEBAR */}
        <div className="w-full lg:w-[360px] xl:w-[390px] bg-white border border-indigo-100 rounded-[24px] shadow-sm flex flex-col shrink-0 overflow-hidden">
          {/* Mode Switcher */}
          <div className="p-3 bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border-b border-indigo-100 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-indigo-50 border border-indigo-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Single Student</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'bulk'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-indigo-50 border border-indigo-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Class Bulk Mode</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Class Selector */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Select Class &amp; Section
              </label>
              {classesLoading ? (
                <div className="p-2 text-xs text-slate-400 font-bold">Loading classes...</div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-indigo-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `- Section ${c.section}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Detected CCE Assessments */}
            <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-2xl p-3">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Detected CCE Assessments</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {['fa1', 'fa2', 'fa3', 'fa4', 'sa1', 'sa2'].map(key => {
                  const isFound = !!detectedExams[key];
                  return (
                    <div
                      key={key}
                      className={`p-1.5 rounded-xl border ${
                        isFound
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="font-black uppercase">{key}</div>
                      <div className="truncate text-[9px] font-bold mt-0.5">
                        {isFound ? detectedExams[key].name : 'Not Found'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Theme & Visibility Options */}
            <div className="bg-[#F8FAFF] border border-indigo-100 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-800 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Transcript Theme &amp; Sections</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CARD_THEMES.map(th => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setThemeId(th.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      themeId === th.id
                        ? 'bg-white border-indigo-500 text-indigo-800 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: th.primary }} />
                    <span>{th.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(
                  [
                    ['showPhoto', 'Photo'],
                    ['showRank', 'Rank'],
                    ['showCoScholastic', 'Co-Scholastic'],
                    ['showSignatures', 'Signatures'],
                  ] as [keyof CardOptions, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCardOptions(prev => ({ ...prev, [k]: !prev[k] }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                      cardOptions[k]
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {cardOptions[k] ? '✓ ' : ''}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Teacher Remark for Active Student */}
            {currentStudent && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-1.5">
                <label className="block text-[10px] font-black text-amber-900 uppercase tracking-wider">
                  Remark for {currentStudent.name}
                </label>
                <textarea
                  rows={2}
                  value={customRemarks[currentStudent.id] ?? getDefaultRemark(currentStudent)}
                  onChange={e =>
                    setCustomRemarks(prev => ({ ...prev, [currentStudent.id]: e.target.value }))
                  }
                  className="w-full bg-white border border-amber-200 rounded-xl p-2 text-[11px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/30 resize-none"
                />
              </div>
            )}

            {/* Single Mode Student Selector */}
            {mode === 'single' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Select Student ({students.length})
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or roll no..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.map(st => {
                    const isSelected = st.id === selectedStudentId;
                    const photo = st.photoUrl ? getPhotoUrl(st.photoUrl) : undefined;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-[#EEF2FF] border-indigo-400 shadow-xs'
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                          {photo ? (
                            <img src={photo} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black text-indigo-600">
                              {st.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-slate-900 truncate">{st.name}</div>
                          <div className="text-[10px] font-semibold text-slate-500">
                            Roll: {st.rollNo} &bull; Rank #{st.summary.rank} &bull; {st.summary.grade}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-6 text-xs font-bold text-slate-400">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bulk Mode Checklist */}
            {mode === 'bulk' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Student Checklist ({bulkSelectedIds.length}/{students.length})
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-indigo-600 hover:underline font-extrabold cursor-pointer"
                  >
                    {bulkSelectedIds.length === students.length ? 'Unselect All' : 'Select All'}
                  </button>
                </div>

                <div className="bg-[#F8FAFF] border border-indigo-100 rounded-xl p-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setBulkPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={bulkPreviewIndex === 0}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-700">
                    Previewing {bulkPreviewIndex + 1} of {students.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkPreviewIndex(prev => Math.min(students.length - 1, prev + 1))}
                    disabled={bulkPreviewIndex >= students.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {students.map((st, idx) => {
                    const isChecked = bulkSelectedIds.includes(st.id);
                    const isPreviewing = bulkPreviewIndex === idx;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setBulkPreviewIndex(idx)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isPreviewing
                            ? 'border-indigo-400 bg-[#EEF2FF]'
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              toggleSelectStudent(st.id);
                            }}
                            className="text-indigo-600 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 truncate">{st.name}</div>
                            <div className="text-[10px] font-semibold text-slate-500">Roll: {st.rollNo}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {st.summary.grade} ({st.summary.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT LIGHT WORKSPACE: LIVE A4 CANVAS PREVIEW */}
        <div className="flex-1 bg-[#EAEFF8] border border-indigo-100 rounded-[24px] p-4 sm:p-6 overflow-auto flex flex-col items-center relative min-h-[750px]">
          {/* Floating Zoom Bar */}
          <div className="sticky top-0 z-20 mb-4 bg-white/95 backdrop-blur-md border border-indigo-100 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-sm">
            <span className="text-xs font-black text-slate-700">A4 Live Transcript Preview</span>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.max(0.45, Number((prev - 0.08).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-indigo-600 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.min(1.15, Number((prev + 0.08).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-indigo-600 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.78)}
              className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full cursor-pointer"
            >
              Fit A4
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <div className="text-sm font-extrabold text-slate-600">Loading Academic Progress Card Data...</div>
            </div>
          ) : !currentStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Award className="w-14 h-14 stroke-1 text-indigo-300" />
              <p className="text-sm font-bold text-slate-500">No students or marks found for this class.</p>
            </div>
          ) : (
            <div
              style={{
                width: `${210 * zoomScale}mm`,
                height: `${297 * zoomScale}mm`,
              }}
              className="relative shrink-0"
            >
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left',
                }}
                className="shadow-xl rounded-xs overflow-hidden"
              >
                <ProgressCardSheet
                  student={currentStudent}
                  schoolInfo={schoolInfo}
                  theme={activeTheme}
                  options={cardOptions}
                  remark={customRemarks[currentStudent.id] ?? getDefaultRemark(currentStudent)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offscreen Unscaled Capture Surface (Guarantees 1:1 exact A4 PDF output) */}
      {captureStudent && (
        <div
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            width: '210mm',
            height: '297mm',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          <div ref={pdfCaptureRef} style={{ width: '210mm', height: '297mm', backgroundColor: '#ffffff' }}>
            <ProgressCardSheet
              student={captureStudent}
              schoolInfo={schoolInfo}
              theme={activeTheme}
              options={cardOptions}
              remark={customRemarks[captureStudent.id] ?? getDefaultRemark(captureStudent)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicProgressCardPage;
