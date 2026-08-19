import React, { useState, useMemo } from 'react';
import { Search, Users, FileText, FileSpreadsheet, SlidersHorizontal, X, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';

interface InstallmentReportTabProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

interface ExportFilters {
  paymentFilter: 'all' | 'zero' | 'partial' | 'full' | 'custom';
  customMinPaid: number;
  customMaxPaid: number;
  columns: {
    sno: boolean;
    rollNo: boolean;
    name: boolean;
    phone: boolean;
    totalFee: boolean;
    totalPaid: boolean;
    remaining: boolean;
    installments: boolean;
  };
}

const COLUMN_LABELS: Record<string, string> = {
  sno: 'S.No',
  rollNo: 'Student ID',
  name: 'Student Name',
  phone: 'Phone Number',
  totalFee: 'Total Fee',
  totalPaid: 'Total Paid',
  remaining: 'Remaining Balance',
  installments: 'Installment Dates',
};

const DEFAULT_FILTERS: ExportFilters = {
  paymentFilter: 'all',
  customMinPaid: 0,
  customMaxPaid: 9999999,
  columns: {
    sno: true,
    rollNo: true,
    name: true,
    phone: false,
    totalFee: true,
    totalPaid: true,
    remaining: true,
    installments: true,
  },
};

const PAYMENT_FILTER_OPTIONS = [
  { value: 'all',     label: 'All Students',           desc: 'Export everyone',              icon: '👥' },
  { value: 'zero',    label: '₹0 Paid (No Payment)',   desc: 'Students who paid nothing',    icon: '💸' },
  { value: 'partial', label: 'Partial Payments',       desc: 'Paid some but not full',       icon: '💳' },
  { value: 'full',    label: 'Fully Paid',             desc: 'Balance = ₹0',                 icon: '✅' },
  { value: 'custom',  label: 'Custom Amount Range',    desc: 'Set min - max paid amount',    icon: '⚙️' },
] as const;

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters) => void;
  exportType: 'pdf' | 'excel';
  totalRows: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, onExport, exportType, totalRows }) => {
  const [filters, setFilters] = useState<ExportFilters>(DEFAULT_FILTERS);
  if (!open) return null;

  const toggleColumn = (col: keyof ExportFilters['columns']) =>
    setFilters(f => ({ ...f, columns: { ...f.columns, [col]: !f.columns[col] } }));

  const selectedColCount = Object.values(filters.columns).filter(Boolean).length;
  const isPdf = exportType === 'pdf';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{
            background: isPdf
              ? 'linear-gradient(135deg,#6366f1,#4f46e5)'
              : 'linear-gradient(135deg,#10b981,#059669)',
          }}
        >
          <div className="flex items-center gap-3">
            {isPdf ? <FileText className="w-5 h-5 text-white" /> : <FileSpreadsheet className="w-5 h-5 text-white" />}
            <div>
              <h2 className="text-white font-black text-base">Export Options</h2>
              <p className="text-white/75 text-xs font-medium">{totalRows} students in current view</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-black text-gray-900">Payment Status Filter</h3>
              <span className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {PAYMENT_FILTER_OPTIONS.find(o => o.value === filters.paymentFilter)?.label}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_FILTER_OPTIONS.map((opt) => {
                const isSelected = filters.paymentFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilters(f => ({ ...f, paymentFilter: opt.value as any }))}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>{opt.label}</div>
                      <div className="text-xs text-gray-400">{opt.desc}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {filters.paymentFilter === 'custom' && (
              <div className="mt-3 flex gap-3 items-end bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex-1">
                  <label className="text-xs font-bold text-indigo-700 block mb-1">Min Paid (₹)</label>
                  <input type="number" value={filters.customMinPaid}
                    onChange={e => setFilters(f => ({ ...f, customMinPaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
                    placeholder="e.g. 1000" min="0" />
                </div>
                <div className="text-gray-400 font-black text-lg pb-1.5">to</div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-indigo-700 block mb-1">Max Paid (₹)</label>
                  <input type="number" value={filters.customMaxPaid}
                    onChange={e => setFilters(f => ({ ...f, customMaxPaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
                    placeholder="e.g. 50000" min="0" />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-black text-gray-900">Select Columns to Export</h3>
              <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {selectedColCount} of {Object.keys(filters.columns).length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(filters.columns) as Array<keyof ExportFilters['columns']>).map((col) => {
                const active = filters.columns[col];
                return (
                  <button key={col} onClick={() => toggleColumn(col)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${active ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                    {active ? <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" /> : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
                    <span className={`text-xs font-bold truncate ${active ? 'text-emerald-700' : 'text-gray-500'}`}>{COLUMN_LABELS[col]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={() => { onExport(filters); onClose(); }}
            disabled={selectedColCount === 0}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isPdf ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isPdf ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export {exportType.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

const applyPaymentFilter = (rows: any[], filters: ExportFilters) =>
  rows.filter((r) => {
    switch (filters.paymentFilter) {
      case 'zero':    return r.totalPaid === 0;
      case 'partial': return r.totalPaid > 0 && r.remaining > 0;
      case 'full':    return r.remaining === 0 && r.totalFee > 0;
      case 'custom':  return r.totalPaid >= filters.customMinPaid && r.totalPaid <= filters.customMaxPaid;
      default:        return true;
    }
  });

export const InstallmentReportTab: React.FC<InstallmentReportTabProps> = ({
  students, structures, payments, classes,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportDialog, setExportDialog] = useState<{ open: boolean; type: 'pdf' | 'excel' }>({ open: false, type: 'pdf' });

  const studentInstallmentData = useMemo(() => {
    if (!selectedClassId) return null;
    let classInfo: any;
    let classStudents: any[];
    let classStructures: any[];

    if (selectedClassId === 'ALL') {
      classInfo = { name: 'All', section: 'Classes' };
      classStudents = students.filter((s) => s.user?.isActive !== false);
      classStructures = structures;
    } else {
      classInfo = classes.find((c) => String(c.id) === String(selectedClassId));
      if (!classInfo) return null;
      classStudents = students.filter((s) => {
        if (s.user && s.user.isActive === false) return false;
        return String(s.classId || s.class?.id || '') === String(selectedClassId);
      });
      classStructures = structures.filter(
        (st) => String(st.classId) === String(selectedClassId) || classStudents.some((s) => s.id === st.studentId)
      );
    }

    const rows = classStudents.map((student) => {
      const studentSpecificStructs = classStructures.filter(
        (st) => (!st.studentId && st.classId === student.classId) || st.studentId === student.id
      );
      const totalFee = studentSpecificStructs.reduce((sum, st) => sum + (Number(st.amount) || 0), 0);
      const studentPayments = payments
        .filter((p) => p.studentId === student.id && (p.status === 'PAID' || p.status === 'PARTIAL'))
        .map((p) => {
          let payDate = new Date(p.paymentDate || p.createdAt || new Date());
          if (payDate.getFullYear() < 2000) payDate = new Date(p.createdAt || new Date());
          return {
            id: p.id, amount: Number(p.amountPaid) || 0, date: payDate,
            dateStr: payDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            method: p.method || 'CASH', receiptNo: p.receiptNo || 'N/A',
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, totalFee - totalPaid);
      return {
        rollNo: student.rollNo || '-', name: student.user?.name || student.name || '-',
        phone: student.user?.phone || student.phone || '-',
        totalFee, totalPaid, remaining, payments: studentPayments,
      };
    });

    const mappedRows = rows.map((r: any, i: number) => ({ ...r, sno: i + 1 }));
    const filteredRows = mappedRows.filter(
      (r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { classInfo, rows: filteredRows };
  }, [selectedClassId, searchTerm, students, structures, payments, classes]);

  const handleExport = async (filters: ExportFilters) => {
    if (!studentInstallmentData) return;
    const { classInfo, rows } = studentInstallmentData;
    const exportRows = applyPaymentFilter(rows, filters);
    const cols = filters.columns;

    if (exportRows.length === 0) { toast.error('No students match the selected filter!'); return; }

    const filterSuffix = filters.paymentFilter === 'zero' ? '_ZeroPaid' : filters.paymentFilter === 'partial' ? '_PartialPaid' : filters.paymentFilter === 'full' ? '_FullyPaid' : filters.paymentFilter === 'custom' ? `_Paid${filters.customMinPaid}to${filters.customMaxPaid}` : '';
    const fileName = `FeeInstallments_${classInfo.name}_${classInfo.section}${filterSuffix}`;

    if (exportDialog.type === 'pdf') {
      try {
        const jspdfModule: any = await import('jspdf');
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
        const autoTableModule: any = await import('jspdf-autotable');
        const autoTable = autoTableModule.default || autoTableModule;
        
        // Force landscape to give more width for columns
        const orientation = 'landscape';
        const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

        doc.setFontSize(16); doc.setTextColor(30, 41, 59); doc.setFont('helvetica', 'bold');
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text('SRI VENKATESWARA JY SCHOOL', pageWidth / 2, 14, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Installment Wise Student Payment Report', pageWidth / 2, 21, { align: 'center' });
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(`Class: ${classInfo.name}-${classInfo.section}  |  Filter: ${PAYMENT_FILTER_OPTIONS.find(o => o.value === filters.paymentFilter)?.label}  |  Students: ${exportRows.length}`, 10, 30);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 10, 30, { align: 'right' });

        const maxInstallments = cols.installments ? Math.max(0, ...exportRows.map((r: any) => r.payments.length)) : 0;

        const headerRow1: any[] = [];
        const headerRow2: any[] = [];
        const colStyles: any = {};
        let ci = 0;
        
        if (cols.sno) { headerRow1.push({ content: 'S.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'center' }; }
        if (cols.rollNo) { headerRow1.push({ content: 'Student ID', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] }; }
        if (cols.name) { headerRow1.push({ content: 'Student Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { fontStyle: 'bold' }; }
        if (cols.phone) { headerRow1.push({ content: 'Phone', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'center' }; }
        if (cols.totalFee) { headerRow1.push({ content: 'Total Fee', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'right' }; }
        if (cols.totalPaid) { headerRow1.push({ content: 'Total Paid', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }; }
        if (cols.remaining) { headerRow1.push({ content: 'Balance', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }); colStyles[ci++] = { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }; }
        
        for (let i = 0; i < maxInstallments; i++) { 
          headerRow1.push({ content: `Inst-${i+1}`, colSpan: 2, styles: { halign: 'center' } }); 
          headerRow2.push({ content: 'Amt', styles: { halign: 'center' } });
          headerRow2.push({ content: 'Date', styles: { halign: 'center' } });
          colStyles[ci++] = { halign: 'right', textColor: [67, 56, 202] }; // Amount
          colStyles[ci++] = { halign: 'center', textColor: [67, 56, 202] }; // Date
        }

        const head = maxInstallments > 0 ? [headerRow1, headerRow2] : [headerRow1];

        const tableRows = exportRows.map((r: any) => {
          const row: any[] = [];
          if (cols.sno) row.push(r.sno);
          if (cols.rollNo) row.push(r.rollNo);
          if (cols.name) row.push(r.name);
          if (cols.phone) row.push(r.phone || '-');
          if (cols.totalFee) row.push(r.totalFee.toLocaleString('en-IN'));
          if (cols.totalPaid) row.push(r.totalPaid.toLocaleString('en-IN'));
          if (cols.remaining) row.push(r.remaining.toLocaleString('en-IN'));
          for (let i = 0; i < maxInstallments; i++) {
            const p = r.payments[i];
            if (p) {
              row.push(p.amount.toLocaleString('en-IN'));
              row.push(p.dateStr);
            } else {
              row.push('-');
              row.push('-');
            }
          }
          return row;
        });

        autoTable(doc, {
          head: head, 
          body: tableRows, 
          startY: 35, 
          theme: 'grid',
          margin: { top: 35, right: 10, bottom: 15, left: 10 },
          styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
          headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
          alternateRowStyles: { fillColor: [248, 250, 252] }, 
          columnStyles: colStyles,
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
          doc.text(`Page ${i} of ${pageCount}  |  JY School Fee Report`, 148, doc.internal.pageSize.height - 7, { align: 'center' });
        }
        doc.save(`${fileName}.pdf`);
        toast.success(`PDF exported! (${exportRows.length} students)`);
      } catch (err) { console.error(err); toast.error('Failed to generate PDF'); }
    } else {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const headerRow: string[] = [];
        if (cols.sno) headerRow.push('S.No');
        if (cols.rollNo) headerRow.push('Student ID');
        if (cols.name) headerRow.push('Student Name');
        if (cols.phone) headerRow.push('Phone');
        if (cols.totalFee) headerRow.push('Total Fee (₹)');
        if (cols.totalPaid) headerRow.push('Total Paid (₹)');
        if (cols.remaining) headerRow.push('Remaining Balance (₹)');

        for (let i = 0; i < maxInstallments; i++) {
          headerRow.push(`Inst-${i+1} Amount`); headerRow.push(`Inst-${i+1} Date`); headerRow.push(`Inst-${i+1} Method`);
        }

        const dataRows = exportRows.map((r: any) => {
          const row: any[] = [];
          if (cols.sno) row.push(r.sno);
          if (cols.rollNo) row.push(r.rollNo);
          if (cols.name) row.push(r.name);
          if (cols.phone) row.push(r.phone || '-');
          if (cols.totalFee) row.push(r.totalFee);
          if (cols.totalPaid) row.push(r.totalPaid);
          if (cols.remaining) row.push(r.remaining);
          for (let i = 0; i < maxInstallments; i++) {
            const p = r.payments[i];
            row.push(p ? p.amount : ''); row.push(p ? p.dateStr : ''); row.push(p ? p.method : '');
          }
          return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
        ws['!cols'] = headerRow.map((h) => ({ wch: h.includes('Name') ? 30 : h.includes('Phone') ? 16 : 16 }));
        XLSX.utils.book_append_sheet(wb, ws, 'Installment Report');

        const totalCollected = exportRows.reduce((s: number, r: any) => s + r.totalPaid, 0);
        const totalPending = exportRows.reduce((s: number, r: any) => s + r.remaining, 0);
        const summaryWs = XLSX.utils.aoa_to_sheet([
          ['JY School - Fee Installment Summary', ''], [''],
          ['Class', `${classInfo.name} - ${classInfo.section}`],
          ['Filter Applied', PAYMENT_FILTER_OPTIONS.find(o => o.value === filters.paymentFilter)?.label ?? 'All'],
          ['Total Students Exported', exportRows.length],
          ['Total Fee Collected (₹)', totalCollected],
          ['Total Pending Balance (₹)', totalPending],
          ['Generated On', new Date().toLocaleString('en-IN')],
        ]);
        summaryWs['!cols'] = [{ wch: 28 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        XLSX.writeFile(wb, `${fileName}.xlsx`);
        toast.success(`Excel exported! (${exportRows.length} students)`);
      } catch (err) { toast.error('Failed to export Excel'); }
    }
  };

  const openExportDialog = (type: 'pdf' | 'excel') => {
    if (!studentInstallmentData) { toast.error('Please select a class first!'); return; }
    setExportDialog({ open: true, type });
  };

  return (
    <div className="animate-fade-in -mx-4 -my-4 md:m-0">
      <ExportDialog
        open={exportDialog.open}
        onClose={() => setExportDialog(d => ({ ...d, open: false }))}
        onExport={handleExport}
        exportType={exportDialog.type}
        totalRows={studentInstallmentData?.rows.length ?? 0}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="sm:w-64">
          <select value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value); setSearchTerm(''); }}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer shadow-sm">
            <option value="" disabled>Select a Class</option>
            <option value="ALL">All Classes</option>
            {classes.map((c) => (<option key={c.id} value={c.id}>{c.name} - {c.section}</option>))}
          </select>
        </div>
        {selectedClassId && (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search student name or ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm" />
          </div>
        )}
      </div>

      {studentInstallmentData ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {studentInstallmentData.classInfo.name} - {studentInstallmentData.classInfo.section} Fee Installment Log
              </h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {studentInstallmentData.rows.length} students ₹₹ Tracks chronological payments sequence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openExportDialog('pdf')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-indigo-100 cursor-pointer group">
                <FileText className="w-4 h-4" />
                <span>PDF Export</span>
                <SlidersHorizontal className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </button>
              <button onClick={() => openExportDialog('excel')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-emerald-100 cursor-pointer group">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Export</span>
                <SlidersHorizontal className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            {(() => {
              const maxInstallments = Math.max(0, ...studentInstallmentData.rows.map(r => r.payments.length));
              return (
                <table className="w-full text-sm text-left border-collapse border border-black rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-50 border-b border-black text-gray-800">
                    <tr>
                      <th className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50">Roll No</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs border border-black bg-gray-100/50">Student Name</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Total Fee</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Total Paid</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Remaining</th>
                      {maxInstallments > 0 ? (
                        Array.from({ length: maxInstallments }).map((_, i) => (
                          <th key={i} className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50 whitespace-nowrap">Installment {i + 1}</th>
                        ))
                      ) : (
                        <th className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50">Payment Installments</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {studentInstallmentData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={maxInstallments > 0 ? 5 + maxInstallments : 6} className="px-5 py-12 text-center text-gray-400 font-semibold border border-black">No student records found matching filter constraints.</td>
                      </tr>
                    ) : (
                      studentInstallmentData.rows.map((row) => (
                        <tr key={row.rollNo} className="hover:bg-indigo-50/30 transition-colors bg-white">
                          <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600 border border-black text-center">{row.rollNo}</td>
                          <td className="px-5 py-4 font-bold text-gray-900 border border-black">{row.name}</td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900 border border-black bg-gray-50/30">₹{row.totalFee.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-4 text-right font-black text-emerald-600 border border-black bg-emerald-50/10">₹{row.totalPaid.toLocaleString('en-IN')}</td>
                          <td className={`px-5 py-4 text-right font-black border border-black ${row.remaining > 0 ? 'text-rose-600 bg-rose-50/10' : 'text-emerald-600 bg-emerald-50/10'}`}>₹{row.remaining.toLocaleString('en-IN')}</td>
                          {maxInstallments > 0 ? (
                            Array.from({ length: maxInstallments }).map((_, i) => {
                              const p = row.payments[i];
                              return (
                                <td key={i} className="px-5 py-4 border border-black text-center">
                                  {p ? (
                                    <div className="inline-flex flex-col justify-center gap-0.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs shadow-sm">
                                      <div className="font-extrabold">₹{p.amount.toLocaleString('en-IN')}</div>
                                      <div className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">{p.dateStr} - {p.method}</div>
                                    </div>
                                  ) : (<span className="text-gray-400 font-bold">-</span>)}
                                </td>
                              );
                            })
                          ) : (
                            <td className="px-5 py-4 border border-black text-center text-xs text-gray-400 font-semibold italic">No payments recorded</td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 border-dashed">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">No Class Selected</h3>
          <p className="text-xs text-gray-400 text-center max-w-sm">Select a class from the dropdown above to view the installment log report.</p>
        </div>
      )}
    </div>
  );
};




