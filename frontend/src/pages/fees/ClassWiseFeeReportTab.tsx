import React, { useState, useMemo } from 'react';
import {
  Search, Users, FileText, FileSpreadsheet, ArrowLeft,
  ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  AlertCircle, CheckCircle2, AlertTriangle, Layers, Percent, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { shareFileNatively } from '../../utils/nativeShare';
import { Capacitor } from '@capacitor/core';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface ClassWiseFeeReportTabProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

type PercentFilterType = 'ALL' | 'BELOW_25' | 'BELOW_50' | 'BETWEEN_50_75' | 'ABOVE_75' | 'FULL_100' | 'ZERO_UNPAID' | 'CUSTOM';
type SortType = 'DEFAULT' | 'PERCENT_DESC' | 'PERCENT_ASC' | 'PAID_DESC' | 'PAID_ASC' | 'NAME_ASC';

export const ClassWiseFeeReportTab: React.FC<ClassWiseFeeReportTabProps> = ({ students, structures, payments, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [percentFilter, setPercentFilter] = useState<PercentFilterType>('ALL');
  const [sortOption, setSortOption] = useState<SortType>('DEFAULT');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');

  // Pre-compute maps once for fast lookup
  const allClassData = useMemo(() => {
    const paymentsMap = new Map<string, number>();
    const classStructuresMap = new Map<string, any[]>();
    const studentStructuresMap = new Map<string, any[]>();

    payments.forEach(p => {
      if (p.status === 'PAID' || p.status === 'PARTIAL') {
        const cur = paymentsMap.get(p.studentId) || 0;
        paymentsMap.set(p.studentId, cur + (Number(p.amountPaid) || 0));
      }
    });
    structures.forEach(st => {
      if (st.classId) {
        const arr = classStructuresMap.get(st.classId) || [];
        arr.push(st);
        classStructuresMap.set(st.classId, arr);
      }
      if (st.studentId) {
        const arr = studentStructuresMap.get(st.studentId) || [];
        arr.push(st);
        studentStructuresMap.set(st.studentId, arr);
      }
    });
    return { paymentsMap, classStructuresMap, studentStructuresMap };
  }, [payments, structures]);

  // Builds and filters rows for a selected class (or ALL classes)
  const buildRows = (
    classId: string,
    search = '',
    pctFilter: PercentFilterType = 'ALL',
    sort: SortType = 'DEFAULT',
    minVal = '',
    maxVal = ''
  ) => {
    const isAll = classId === 'ALL';
    let targetStudents: any[] = [];
    let title = '';
    let teacherName = '';
    let teacherPhone: string | null = null;

    const { paymentsMap, classStructuresMap, studentStructuresMap } = allClassData;

    if (isAll) {
      title = 'All Classes (Consolidated)';
      teacherName = 'All Faculty / Institutional Level';
      targetStudents = students.filter(s => !(s.user && s.user.isActive === false));
    } else {
      const classInfo = classes.find(c => String(c.id) === String(classId));
      if (!classInfo) return { classInfo: null, title: '', teacherName: '', teacherPhone: null, rows: [] as any[], rawUnfilteredRows: [] as any[], stats: { total: 0, fullPaid: 0, below50: 0, above75: 0, zero: 0, totalFee: 0, totalPaid: 0 } };

      title = `${classInfo.name} - ${classInfo.section}`;
      teacherName = classInfo.classTeacher?.user?.name || classInfo.classTeacher?.name || 'Not Assigned';
      teacherPhone = (classInfo.classTeacher?.user?.phone || classInfo.classTeacher?.phone || null) as string | null;

      targetStudents = students.filter(s => {
        if (s.user && s.user.isActive === false) return false;
        const sClassId = String(s.classId || s.class?.id || '');
        const targetId = String(classId || '');
        if (sClassId && targetId && sClassId === targetId) return true;

        const cName = String(classInfo.name || '').trim().toLowerCase();
        const cSec = String(classInfo.section || '').trim().toLowerCase();
        if (s.class && typeof s.class === 'object') {
          const scName = String(s.class.name || '').trim().toLowerCase();
          const scSec = String(s.class.section || '').trim().toLowerCase();
          if (scName === cName && (!cSec || scSec === cSec)) return true;
        }

        const rawClassStr = String(s.className || (typeof s.class === 'string' ? s.class : '')).trim().toLowerCase();
        if (rawClassStr) {
          if (
            rawClassStr === `${cName}-${cSec}` ||
            rawClassStr === `${cName} - ${cSec}` ||
            rawClassStr === `${cName} ${cSec}` ||
            (rawClassStr.includes(cName) && (cSec ? rawClassStr.includes(cSec) : true))
          ) {
            return true;
          }
        }
        return false;
      });
    }

    // 1. Compute rows
    const rawRows = targetStudents.map((student) => {
      // Find matching class
      const sClass = classes.find(c => String(c.id) === String(student.classId || student.class?.id))
        || (student.class && typeof student.class === 'object' ? student.class : null);
      const studentClassId = sClass?.id || student.classId;
      const className = sClass ? `${sClass.name} - ${sClass.section}` : (student.className || 'General');

      const classStructures = (studentClassId ? classStructuresMap.get(studentClassId) : []) || [];
      const stdStructs = studentStructuresMap.get(student.id) || [];
      const allStructs = [...classStructures, ...stdStructs];
      const totalFee = allStructs.reduce((sum: number, st: any) => sum + (Number(st.amount) || 0), 0);
      const paid = paymentsMap.get(student.id) || 0;
      const balance = Math.max(0, totalFee - paid);
      const percentage = totalFee > 0 ? Number(((paid / totalFee) * 100).toFixed(1)) : (paid > 0 ? 100 : 0);

      return {
        studentId: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className,
        phone: student.user?.phone || student.phone || '-',
        totalFee,
        paid,
        balance,
        percentage,
      };
    });

    // 2. Pre-filter statistics for quick chips
    const stats = {
      total: rawRows.length,
      fullPaid: rawRows.filter(r => r.percentage >= 100).length,
      below50: rawRows.filter(r => r.percentage < 50 && r.percentage > 0).length,
      above75: rawRows.filter(r => r.percentage >= 75 && r.percentage < 100).length,
      zero: rawRows.filter(r => r.paid === 0 || r.percentage === 0).length,
      totalFee: rawRows.reduce((sum, r) => sum + r.totalFee, 0),
      totalPaid: rawRows.reduce((sum, r) => sum + r.paid, 0),
    };

    // 3. Filter by percentage
    let filtered = rawRows.filter(r => {
      // Search term
      if (search) {
        const term = search.toLowerCase();
        const match = r.name.toLowerCase().includes(term) ||
                      r.studentId.toLowerCase().includes(term) ||
                      r.className.toLowerCase().includes(term) ||
                      r.phone.includes(term);
        if (!match) return false;
      }

      // Percentage filters
      if (pctFilter === 'BELOW_25') return r.percentage < 25;
      if (pctFilter === 'BELOW_50') return r.percentage < 50;
      if (pctFilter === 'BETWEEN_50_75') return r.percentage >= 50 && r.percentage <= 75;
      if (pctFilter === 'ABOVE_75') return r.percentage > 75;
      if (pctFilter === 'FULL_100') return r.percentage >= 100;
      if (pctFilter === 'ZERO_UNPAID') return r.paid === 0 || r.percentage === 0;
      if (pctFilter === 'CUSTOM') {
        const minN = minVal !== '' ? Number(minVal) : null;
        const maxN = maxVal !== '' ? Number(maxVal) : null;
        if (minN !== null && r.percentage < minN) return false;
        if (maxN !== null && r.percentage > maxN) return false;
        return true;
      }
      return true;
    });

    // 4. Sort rows
    if (sort === 'PERCENT_DESC') {
      filtered.sort((a, b) => b.percentage - a.percentage);
    } else if (sort === 'PERCENT_ASC') {
      filtered.sort((a, b) => a.percentage - b.percentage);
    } else if (sort === 'PAID_DESC') {
      filtered.sort((a, b) => b.paid - a.paid);
    } else if (sort === 'PAID_ASC') {
      filtered.sort((a, b) => a.paid - b.paid);
    } else if (sort === 'NAME_ASC') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Assign S.No
    const numberedRows = filtered.map((r, idx) => ({ ...r, sno: idx + 1 }));

    return {
      classInfo: isAll ? { name: 'All Classes', section: 'Consolidated' } : classes.find(c => String(c.id) === String(classId)),
      isAll,
      title,
      teacherName,
      teacherPhone,
      rows: numberedRows,
      rawUnfilteredRows: rawRows,
      stats,
    };
  };

  const classData = useMemo(() => {
    if (!selectedClassId) return null;
    return buildRows(selectedClassId, searchTerm, percentFilter, sortOption, customMin, customMax);
  }, [selectedClassId, searchTerm, percentFilter, sortOption, customMin, customMax, allClassData, classes, students]);

  const makePDF = async (data: NonNullable<typeof classData>) => {
    if (!data.classInfo) return null;
    const jspdfModule: any = await import('jspdf');
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
    const autoTableModule: any = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
    doc.text('JY SCHOOL', 105, 14, { align: 'center' });
    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(`Fee Report: ${data.title}`, 105, 21, { align: 'center' });

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Class Teacher / Scope: ${data.teacherName}`, 14, 28);
    const filterDesc = percentFilter !== 'ALL' ? `Filter: ${percentFilter.replace(/_/g, ' ')}` : 'Filter: All Students';
    doc.text(filterDesc, 105, 28, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 28, { align: 'right' });

    autoTable(doc, {
      head: [['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Mobile No.', 'Total Fee', 'Paid', 'Paid %']],
      body: data.rows.map((r: any) => [
        r.sno,
        r.studentId,
        r.name,
        r.className,
        r.phone,
        `Rs. ${r.totalFee.toLocaleString('en-IN')}`,
        `Rs. ${r.paid.toLocaleString('en-IN')}`,
        `${r.percentage}%`
      ]),
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', valign: 'middle' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    return doc;
  };

  const downloadPDF = async (data: NonNullable<typeof classData>) => {
    const doc = await makePDF(data);
    if (doc && data.classInfo) {
      const fileName = data.isAll ? `FeeReport_All_Classes.pdf` : `FeeReport_${data.classInfo.name}_${data.classInfo.section}.pdf`;
      doc.save(fileName);
    }
  };

  const downloadExcel = async (data: NonNullable<typeof classData>) => {
    if (!data.classInfo) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Mobile No.', 'Total Fee', 'Paid', 'Balance', 'Paid %'],
      ...data.rows.map((r: any) => [
        r.sno,
        r.studentId,
        r.name,
        r.className,
        r.phone,
        r.totalFee,
        r.paid,
        r.balance,
        `${r.percentage}%`
      ])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Report');
    const fileName = data.isAll ? `FeeReport_All_Classes.xlsx` : `FeeReport_${data.classInfo.name}_${data.classInfo.section}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const whatsappShare = async (classId: string) => {
    const data = buildRows(classId, '', percentFilter, sortOption, customMin, customMax);
    if (!data.classInfo) return;

    const doc = await makePDF(data as any);
    if (!doc) return;

    const rawFileName = data.isAll ? `FeeReport_All_Classes.pdf` : `FeeReport_${data.classInfo.name}_${data.classInfo.section}.pdf`;
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '');
    const ph = data.teacherPhone ? data.teacherPhone.replace(/\D/g, '') : null;
    const waNum = ph ? (ph.startsWith('91') ? ph : '91' + ph) : '';
    const msg = `Hello,\n\n*${data.title} Fee Report* (${new Date().toLocaleDateString('en-IN')})\nStudents in report: ${data.rows.length}\n\n_JY School Finance Portal_`;

    const toastId = toast.loading('Preparing PDF for WhatsApp...');

    try {
      const blob = doc.output('blob');
      const didShareNatively = await shareFileNatively(blob, fileName, msg);

      if (didShareNatively) {
        toast.dismiss(toastId);
        return;
      }

      toast.dismiss(toastId);
      const fallbackToastId = toast.loading('Preparing PDF...');

      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        toast.success('PDF downloaded! Please ATTACH it in WhatsApp.', { id: fallbackToastId });
      } catch {
        toast.error('Failed to download PDF', { id: fallbackToastId });
      }

      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?phone=${waNum}&text=${encodeURIComponent(msg)}`, '_system');
      }, 1000);

    } catch (err: any) {
      console.error('WhatsApp share error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to prepare PDF for WhatsApp');
    }
  };

  const badge = (p: number) => {
    if (p >= 100) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (p >= 75) return 'bg-blue-100 text-blue-800 border border-blue-300';
    if (p >= 50) return 'bg-amber-100 text-amber-800 border border-amber-300';
    if (p > 0) return 'bg-orange-100 text-orange-800 border border-orange-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  };

  return (
    <div className="animate-fade-in -mx-4 -my-4 md:m-0">

      {/* ── MOBILE VIEW ── */}
      <div className="block md:hidden">
        {!selectedClassId ? (
          <div className="bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {/* Special All Classes option card for Mobile */}
              <div
                className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors cursor-pointer border-b-2 border-indigo-200"
                onClick={() => setSelectedClassId('ALL')}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                  ALL
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-indigo-950 text-base flex items-center gap-1.5">
                    All Classes
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">ALL</span>
                  </div>
                  <div className="text-xs text-indigo-700 font-semibold truncate mt-0.5">
                    Consolidated report for all students ({students.length})
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-400" />
              </div>

              {classes.map(cls => (
                <div key={cls.id} className="flex items-center gap-3 px-4 py-4 hover:bg-emerald-50/50 transition-colors cursor-pointer" onClick={() => setSelectedClassId(cls.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-gray-900 text-base">{cls.name} - {cls.section}</div>
                    <div className="text-sm text-emerald-600 font-bold truncate mt-0.5">{cls.classTeacher?.user?.name || 'Not Assigned'}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); whatsappShare(cls.id); }}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white shadow-sm transition-all cursor-pointer"
                  >
                    <WhatsAppIcon />
                  </button>
                </div>
              ))}
              {classes.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No classes found</div>}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="px-4 py-3 bg-indigo-600 flex items-center gap-3">
              <button onClick={() => { setSelectedClassId(''); setSearchTerm(''); }} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-xl text-white cursor-pointer flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-sm truncate">{classData?.title}</div>
                <div className="text-indigo-100 text-xs truncate">{classData?.teacherName}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => classData && downloadPDF(classData)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-xl text-white cursor-pointer"><FileText className="w-4 h-4" /></button>
                <button onClick={() => whatsappShare(selectedClassId)} className="w-8 h-8 flex items-center justify-center bg-[#25D366] hover:bg-[#1db954] rounded-xl text-white cursor-pointer"><WhatsAppIcon /></button>
              </div>
            </div>

            {/* Quick Filter Chips for Mobile */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto flex gap-1.5 no-scrollbar">
              <button
                onClick={() => setPercentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${percentFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}
              >
                All ({classData?.stats.total || 0})
              </button>
              <button
                onClick={() => setPercentFilter('BELOW_50')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${percentFilter === 'BELOW_50' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
              >
                &lt; 50% Due ({classData?.stats.below50 || 0})
              </button>
              <button
                onClick={() => setPercentFilter('ABOVE_75')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${percentFilter === 'ABOVE_75' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
              >
                &gt; 75% ({classData?.stats.above75 || 0})
              </button>
              <button
                onClick={() => setPercentFilter('FULL_100')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${percentFilter === 'FULL_100' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}
              >
                100% Paid ({classData?.stats.fullPaid || 0})
              </button>
              <button
                onClick={() => setPercentFilter('ZERO_UNPAID')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${percentFilter === 'ZERO_UNPAID' ? 'bg-red-700 text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                0% Unpaid ({classData?.stats.zero || 0})
              </button>
            </div>

            {/* Search and Sort controls */}
            <div className="p-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Showing: <strong className="text-gray-900">{classData?.rows.length || 0}</strong> students</span>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortType)}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                >
                  <option value="DEFAULT">Sort: Default</option>
                  <option value="PERCENT_DESC">Paid % (High ➔ Low)</option>
                  <option value="PERCENT_ASC">Paid % (Low ➔ High)</option>
                  <option value="PAID_DESC">Paid Amount ⬇</option>
                  <option value="NAME_ASC">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Student List */}
            <div className="divide-y divide-gray-100">
              {!classData || classData.rows.length === 0
                ? <div className="py-12 text-center text-gray-400 text-sm">No students found matching this criteria.</div>
                : classData.rows.map((row: any) => (
                  <div key={`${row.studentId}-${row.className}`} className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{row.name}</div>
                      <div className="text-xs text-indigo-600 font-mono font-bold flex items-center gap-1.5 mt-0.5">
                        <span>{row.studentId}</span>
                        {classData.isAll && <span className="bg-gray-100 text-gray-700 font-semibold px-1.5 py-0.2 rounded text-[10px]">{row.className}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{row.phone}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-emerald-600 text-sm">Rs.{row.paid.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-gray-400">of Rs.{row.totalFee.toLocaleString('en-IN')}</div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black mt-1 ${badge(row.percentage)}`}>
                        {row.percentage}%
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:block">
        {/* Top Control Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Class Dropdown */}
            <div className="w-full lg:w-72">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Select Class or Scope
              </label>
              <select
                value={selectedClassId}
                onChange={e => { setSelectedClassId(e.target.value); setSearchTerm(''); }}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-black text-gray-800 cursor-pointer transition-all shadow-sm"
              >
                <option value="" disabled>Select a Class</option>
                <option value="ALL" className="font-black text-indigo-700 bg-indigo-50">
                  🌟 All Classes (Consolidated)
                </option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>

            {/* Percentage Filter Dropdown */}
            {selectedClassId && (
              <div className="w-full lg:w-60">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" />
                  Filter by Paid %
                </label>
                <select
                  value={percentFilter}
                  onChange={e => setPercentFilter(e.target.value as PercentFilterType)}
                  className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-700 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Percentages</option>
                  <option value="BELOW_25">&lt; 25% Paid</option>
                  <option value="BELOW_50">&lt; 50% Paid (Defaulters)</option>
                  <option value="BETWEEN_50_75">50% to 75% Paid</option>
                  <option value="ABOVE_75">&gt; 75% Paid</option>
                  <option value="FULL_100">100% Fully Paid</option>
                  <option value="ZERO_UNPAID">0% Unpaid</option>
                  <option value="CUSTOM">Custom Range %</option>
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            {selectedClassId && (
              <div className="w-full lg:w-56">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortType)}
                  className="w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-700 cursor-pointer shadow-sm"
                >
                  <option value="DEFAULT">Default (Roll No)</option>
                  <option value="PERCENT_DESC">Paid % (High to Low ⬇)</option>
                  <option value="PERCENT_ASC">Paid % (Low to High ⬆)</option>
                  <option value="PAID_DESC">Paid Amount (High to Low)</option>
                  <option value="PAID_ASC">Paid Amount (Low to High)</option>
                  <option value="NAME_ASC">Student Name (A-Z)</option>
                </select>
              </div>
            )}

            {/* Search Input */}
            {selectedClassId && (
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll no, class, or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Percentage Input Range (Shown only when CUSTOM is selected) */}
          {selectedClassId && percentFilter === 'CUSTOM' && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-900">Specify Percentage Range:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min %"
                  value={customMin}
                  onChange={e => setCustomMin(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-gray-800"
                  min="0"
                  max="100"
                />
                <span className="text-gray-500 text-xs font-bold">to</span>
                <input
                  type="number"
                  placeholder="Max %"
                  value={customMax}
                  onChange={e => setCustomMax(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-gray-800"
                  min="0"
                  max="100"
                />
              </div>
              <button
                onClick={() => { setCustomMin(''); setCustomMax(''); }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Clear Range
              </button>
            </div>
          )}

          {/* Quick Filter Chips & Live Counters */}
          {classData && (
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider mr-1">Quick Filters:</span>
                <button
                  onClick={() => setPercentFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${percentFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All ({classData.stats.total})
                </button>
                <button
                  onClick={() => setPercentFilter('BELOW_50')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${percentFilter === 'BELOW_50' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}`}
                >
                  &lt; 50% Defaulters ({classData.stats.below50})
                </button>
                <button
                  onClick={() => setPercentFilter('ABOVE_75')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${percentFilter === 'ABOVE_75' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}
                >
                  &gt; 75% High Paid ({classData.stats.above75})
                </button>
                <button
                  onClick={() => setPercentFilter('FULL_100')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${percentFilter === 'FULL_100' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                >
                  100% Cleared ({classData.stats.fullPaid})
                </button>
                <button
                  onClick={() => setPercentFilter('ZERO_UNPAID')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${percentFilter === 'ZERO_UNPAID' ? 'bg-red-700 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                >
                  0% Unpaid ({classData.stats.zero})
                </button>
              </div>

              {/* Reset filter shortcut */}
              {(percentFilter !== 'ALL' || sortOption !== 'DEFAULT' || searchTerm) && (
                <button
                  onClick={() => { setPercentFilter('ALL'); setSortOption('DEFAULT'); setSearchTerm(''); setCustomMin(''); setCustomMax(''); }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected Class Report Display */}
        {classData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with Title and Action Buttons */}
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 to-indigo-50/30">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {classData.title}
                  {classData.isAll && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                      CONSOLIDATED
                    </span>
                  )}
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Scope / Incharge: <span className="text-indigo-600 font-bold">{classData.teacherName}</span>
                  <span className="mx-2">•</span>
                  Showing: <strong className="text-gray-900">{classData.rows.length}</strong> of {classData.stats.total} students
                </p>
              </div>

              {/* Action Buttons: PDF, Excel, WhatsApp */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadPDF(classData)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100 font-bold text-xs cursor-pointer"
                  title="Download Filtered PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => downloadExcel(classData)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 font-bold text-xs cursor-pointer"
                  title="Download Filtered Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => whatsappShare(selectedClassId)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1db954] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <WhatsAppIcon />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Financial Telemetry Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 border-b border-gray-100 text-center">
              <div className="p-3 bg-white rounded-xl border border-gray-200/60 shadow-xs">
                <div className="text-xs font-bold text-gray-500 uppercase">Total Fee Expected</div>
                <div className="text-base font-black text-gray-900 mt-0.5">
                  ₹{classData.stats.totalFee.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200/60 shadow-xs">
                <div className="text-xs font-bold text-emerald-600 uppercase">Total Collected</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">
                  ₹{classData.stats.totalPaid.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200/60 shadow-xs">
                <div className="text-xs font-bold text-indigo-600 uppercase">Collection Rate</div>
                <div className="text-base font-black text-indigo-600 mt-0.5">
                  {classData.stats.totalFee > 0 ? ((classData.stats.totalPaid / classData.stats.totalFee) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200/60 shadow-xs">
                <div className="text-xs font-bold text-rose-600 uppercase">Total Outstanding Due</div>
                <div className="text-base font-black text-rose-600 mt-0.5">
                  ₹{Math.max(0, classData.stats.totalFee - classData.stats.totalPaid).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-5 py-3.5 font-black uppercase text-xs">S.No</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs">Student ID</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs">Student Name</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs">Class / Section</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs">Mobile No.</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs text-right">Total Fee</th>
                    <th className="px-5 py-3.5 font-black uppercase text-xs text-right">Paid Amount</th>
                    <th
                      className="px-5 py-3.5 font-black uppercase text-xs text-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => setSortOption(sortOption === 'PERCENT_DESC' ? 'PERCENT_ASC' : 'PERCENT_DESC')}
                      title="Click to toggle sorting"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Paid %</span>
                        {sortOption === 'PERCENT_DESC' && <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />}
                        {sortOption === 'PERCENT_ASC' && <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />}
                        {sortOption !== 'PERCENT_DESC' && sortOption !== 'PERCENT_ASC' && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400 font-medium">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        No students found matching this criteria or percentage filter.
                      </td>
                    </tr>
                  ) : (
                    classData.rows.map((row: any) => (
                      <tr key={`${row.studentId}-${row.className}`} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-5 py-3 text-gray-500 font-bold text-xs">{row.sno}</td>
                        <td className="px-5 py-3 font-mono text-xs font-black text-indigo-600">{row.studentId}</td>
                        <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded text-xs">
                            {row.className}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-600 text-xs">{row.phone}</td>
                        <td className="px-5 py-3 text-right font-bold text-gray-700">
                          ₹{row.totalFee.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-right font-black text-emerald-600">
                          ₹{row.paid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black shadow-2xs ${badge(row.percentage)}`}>
                            {row.percentage}%
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state when no class or ALL is selected */}
        {!selectedClassId && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-200 border-dashed shadow-xs">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No Class Selected</h3>
            <p className="text-sm font-medium text-gray-500 text-center max-w-sm mb-4">
              Select an individual class or choose <strong>"All Classes"</strong> from the dropdown above to view fee payment reports.
            </p>
            <button
              onClick={() => setSelectedClassId('ALL')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>View All Classes Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
