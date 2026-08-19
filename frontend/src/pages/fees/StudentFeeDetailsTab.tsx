import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Download, Receipt, FileText, CheckCircle, Smartphone, Calculator, Plus, Share2, Upload, Search, Users, MessageCircle, X, Copy, Eye, FileSpreadsheet, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toBlob } from 'html-to-image';
import { shareFileNatively } from '../../utils/nativeShare';
import toast from 'react-hot-toast';

interface StudentFeeDetailsProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

// Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs. Export Dialog Types Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.
interface ExportFilters {
  paymentFilter: 'all' | 'zero' | 'partial' | 'full' | 'custom';
  customMinPaid: number;
  customMaxPaid: number;
  columns: {
    sno: boolean;
    studentId: boolean;
    name: boolean;
    className: boolean;
    phone: boolean;
    totalFee: boolean;
    paidAmount: boolean;
    balance: boolean;
  };
}

const COLUMN_LABELS: Record<string, string> = {
  sno: 'S.No',
  studentId: 'Student ID',
  name: 'Student Name',
  className: 'Class',
  phone: 'Phone Number',
  totalFee: 'Total Fee',
  paidAmount: 'Paid Amount',
  balance: 'Balance Due'
};

const DEFAULT_FILTERS: ExportFilters = {
  paymentFilter: 'all',
  customMinPaid: 0,
  customMaxPaid: 9999999,
  columns: {
    sno: true,
    studentId: true,
    name: true,
    className: true,
    phone: false,
    totalFee: true,
    paidAmount: true,
    balance: true,
  },
};

const PAYMENT_FILTER_OPTIONS = [
  { value: 'all',     label: 'All Students',           desc: 'Export everyone',                 icon: 'Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.' },
  { value: 'zero',    label: 'Rs.Rs.Rs.0 Paid (No Payment)',   desc: 'Students who paid nothing',       icon: 'Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.' },
  { value: 'partial', label: 'Partial Payments',       desc: 'Paid some but not full amount',   icon: 'Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.' },
  { value: 'full',    label: 'Fully Paid',             desc: 'Balance = Rs.Rs.Rs.0',                   icon: 'Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.' },
  { value: 'custom',  label: 'Custom Amount Range',    desc: 'Set minRs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.max paid amount',         icon: 'Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.Rs.' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: isPdf ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
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
                  <button key={opt.value} onClick={() => setFilters(f => ({ ...f, paymentFilter: opt.value as any }))}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
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
                  <label className="text-xs font-bold text-indigo-700 block mb-1">Min Paid (Rs.)</label>
                  <input type="number" value={filters.customMinPaid} onChange={e => setFilters(f => ({ ...f, customMinPaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-white" placeholder="0" min="0" />
                </div>
                <div className="text-gray-400 font-black text-lg pb-1.5">to</div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-indigo-700 block mb-1">Max Paid (Rs.)</label>
                  <input type="number" value={filters.customMaxPaid} onChange={e => setFilters(f => ({ ...f, customMaxPaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-400 outline-none bg-white" placeholder="99999" min="0" />
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
          <button onClick={() => { onExport(filters); onClose(); }} disabled={selectedColCount === 0}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isPdf ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
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
      case 'zero':    return r.paidAmount === 0;
      case 'partial': return r.paidAmount > 0 && r.balance > 0;
      case 'full':    return r.balance === 0 && r.totalFee > 0;
      case 'custom':  return r.paidAmount >= filters.customMinPaid && r.paidAmount <= filters.customMaxPaid;
      default:        return true;
    }
  });


export const StudentFeeDetailsTab: React.FC<StudentFeeDetailsProps> = ({ students, structures, payments, classes }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  const isAdminOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [reminderStudent, setReminderStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportDialog, setExportDialog] = useState<{ open: boolean; type: 'pdf' | 'excel' }>({ open: false, type: 'pdf' });

  const tableData = useMemo(() => {
    const classStructuresMap = new Map();
    const studentStructuresMap = new Map();
    
    structures.forEach(st => {
      if (st.studentId) {
        if (!studentStructuresMap.has(st.studentId)) studentStructuresMap.set(st.studentId, []);
        studentStructuresMap.get(st.studentId).push(st);
      } else if (st.classId) {
        if (!classStructuresMap.has(st.classId)) classStructuresMap.set(st.classId, []);
        classStructuresMap.get(st.classId).push(st);
      }
    });

    const studentPaymentsMap = new Map();
    payments.forEach(p => {
      if (p.studentId && (p.status === 'PAID' || p.status === 'PARTIAL')) {
        const current = studentPaymentsMap.get(p.studentId) || 0;
        studentPaymentsMap.set(p.studentId, current + (Number(p.amountPaid) || 0));
      }
    });

    const classMap = new Map(classes.map(c => [c.id, c]));

    let filteredStudents = students;
    if (selectedClassId !== 'ALL') {
      filteredStudents = filteredStudents.filter(s => s.classId === selectedClassId);
    }
    if (searchTerm) {
      filteredStudents = filteredStudents.filter(s =>
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const rawData = filteredStudents.map((student) => {
      const classStructs = classMap.get(student.classId) ? (classStructuresMap.get(student.classId) || []) : [];
      const stdStructs = studentStructuresMap.get(student.id) || [];
      const studentStructures = [...classStructs, ...stdStructs];
      
      const totalFeeAmount = studentStructures.reduce((sum, st) => sum + (Number(st.amount) || 0), 0);
      const paidAmount = studentPaymentsMap.get(student.id) || 0;

      const balance = totalFeeAmount - paidAmount;
      const studentClass = classMap.get(student.classId) || student.class;
      const phone = student.user?.phone || student.phone || '';

      return {
        studentId: student.id,
        id: student.rollNo || student.studentId || '-',
        name: student.user?.name || student.name || '-',
        className: studentClass ? `${studentClass.name}${studentClass.section ? ` - ${studentClass.section}` : ''}` : '-',
        totalFee: totalFeeAmount,
        paidAmount,
        balance,
        phone,
        photo: student.user?.avatar || student.photo || '',
      };
    });

    rawData.sort((a, b) => {
      if (a.className < b.className) return -1;
      if (a.className > b.className) return 1;
      return a.name.localeCompare(b.name);
    });

    return rawData.map((row, index) => ({
      ...row,
      sno: index + 1
    }));
  }, [students, structures, payments, classes, selectedClassId, searchTerm]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classLabel = selectedClassId !== 'ALL' && selectedClass
    ? `${selectedClass.name} - ${selectedClass.section}`
    : 'All Classes';

  const handlePrint = () => window.print();

  const handleExport = async (filters: ExportFilters) => {
    const exportRows = applyPaymentFilter(tableData, filters);
    const cols = filters.columns;

    if (exportRows.length === 0) {
      toast.error('No students match the selected filter!');
      return;
    }

    const filterSuffix = filters.paymentFilter === 'zero' ? '_ZeroPaid' : filters.paymentFilter === 'partial' ? '_PartialPaid' : filters.paymentFilter === 'full' ? '_FullyPaid' : filters.paymentFilter === 'custom' ? `_Paid${filters.customMinPaid}to${filters.customMaxPaid}` : '';
    const fileName = `Fee_Statement_${classLabel.replace(/\s+/g, '_')}${filterSuffix}`;

    if (exportDialog.type === 'pdf') {
      try {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const numCols = Object.values(cols).filter(Boolean).length;
        const orientation = numCols > 6 ? 'landscape' : 'portrait';
        const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

        doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text('SRI VENKATESWARA JY SCHOOL', pageWidth / 2, 14, { align: 'center' });
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('STUDENT FEE DETAILS REPORT', pageWidth / 2, 28, { align: 'center' });
        
        doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5); doc.line(14, 33, pageWidth - 14, 33);
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(`Class: ${classLabel}   |   Filter: ${PAYMENT_FILTER_OPTIONS.find(o => o.value === filters.paymentFilter)?.label}`, 14, 41);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.text(`Students: ${exportRows.length}  |  Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 41, { align: 'right' });

        const headerRow: string[] = [];
        const colStyles: any = {};
        let ci = 0;
        
        if (cols.sno) { headerRow.push('S.No'); colStyles[ci++] = { halign: 'center', cellWidth: 14 }; }
        if (cols.studentId) { headerRow.push('Student ID'); colStyles[ci++] = { cellWidth: 26 }; }
        if (cols.name) { headerRow.push('Student Name'); colStyles[ci++] = { cellWidth: 'auto' }; }
        if (cols.className) { headerRow.push('Class'); colStyles[ci++] = { cellWidth: 20 }; }
        if (cols.phone) { headerRow.push('Phone'); colStyles[ci++] = { cellWidth: 25 }; }
        if (cols.totalFee) { headerRow.push('Total Fee'); colStyles[ci++] = { halign: 'right', cellWidth: 26 }; }
        if (cols.paidAmount) { headerRow.push('Paid'); colStyles[ci++] = { halign: 'right', cellWidth: 26 }; }
        if (cols.balance) { headerRow.push('Balance'); colStyles[ci++] = { halign: 'right', cellWidth: 26 }; }

        const exportTableRows = exportRows.map((r, i) => {
          const row: any[] = [];
          if (cols.sno) row.push(i + 1);
          if (cols.studentId) row.push(r.id);
          if (cols.name) row.push(r.name);
          if (cols.className) row.push(r.className);
          if (cols.phone) row.push(r.phone || '-');
          if (cols.totalFee) row.push(r.totalFee.toLocaleString('en-IN'));
          if (cols.paidAmount) row.push(r.paidAmount.toLocaleString('en-IN'));
          if (cols.balance) row.push(r.balance.toLocaleString('en-IN'));
          return row;
        });

        let balanceColIdx = -1;
        if (cols.balance) {
          balanceColIdx = headerRow.indexOf('Balance');
        }

        autoTable(doc, {
          head: [headerRow],
          body: exportTableRows,
          startY: 46,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
          headStyles: { fillColor: [240, 245, 250], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 9, halign: 'center' },
          columnStyles: colStyles,
          alternateRowStyles: { fillColor: [250, 250, 250] },
          didParseCell: (data: any) => {
            if (balanceColIdx !== -1 && data.column.index === balanceColIdx && data.section === 'body') {
              const val = Number(String(data.cell.raw).replace(/[^0-9.-]+/g,""));
              if (val > 0) {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (val <= 0 && val !== 0) {
                data.cell.styles.textColor = [5, 150, 105];
              }
            }
          },
        });

        const finalY = (doc as any).lastAutoTable.finalY || 46;
        const totalFee = exportRows.reduce((s, r) => s + (r.totalFee || 0), 0);
        const totalPaid = exportRows.reduce((s, r) => s + r.paidAmount, 0);
        const totalBalance = exportRows.reduce((s, r) => s + r.balance, 0);

        autoTable(doc, {
          startY: finalY + 10,
          head: [['TOTAL FEE (Rs)', 'COLLECTED (Rs)', 'BALANCE DUE (Rs)']],
          body: [[totalFee.toLocaleString('en-IN'), totalPaid.toLocaleString('en-IN'), totalBalance.toLocaleString('en-IN')]],
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 5, halign: 'center', valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
          headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { fontStyle: 'bold', textColor: [20, 20, 20] },
          margin: { left: 14, right: 14 },
        });

        doc.save(`${fileName}.pdf`);
        toast.success(`PDF exported! (${exportRows.length} students)`);
      } catch (e) {
        console.error(e);
        toast.error('Failed to generate PDF');
      }
    } else {
      try {
        const XLSX = await import('xlsx');
        const headerRow: string[] = [];
        if (cols.sno) headerRow.push('S.No');
        if (cols.studentId) headerRow.push('Student ID');
        if (cols.name) headerRow.push('Student Name');
        if (cols.className) headerRow.push('Class');
        if (cols.phone) headerRow.push('Phone');
        if (cols.totalFee) headerRow.push('Total Fee');
        if (cols.paidAmount) headerRow.push('Paid');
        if (cols.balance) headerRow.push('Balance');

        const exportTableRows = exportRows.map((r, i) => {
          const row: any[] = [];
          if (cols.sno) row.push(i + 1);
          if (cols.studentId) row.push(r.id);
          if (cols.name) row.push(r.name);
          if (cols.className) row.push(r.className);
          if (cols.phone) row.push(r.phone || '-');
          if (cols.totalFee) row.push(r.totalFee);
          if (cols.paidAmount) row.push(r.paidAmount);
          if (cols.balance) row.push(r.balance);
          return row;
        });

        const totalFee = exportRows.reduce((s, r) => s + (r.totalFee || 0), 0);
        const totalPaid = exportRows.reduce((s, r) => s + r.paidAmount, 0);
        const totalBalance = exportRows.reduce((s, r) => s + r.balance, 0);

        const summaryRow = [];
        for (let i = 0; i < headerRow.length; i++) {
          if (headerRow[i] === 'Class' || headerRow[i] === 'Student Name') summaryRow.push('TOTAL');
          else if (headerRow[i] === 'Total Fee') summaryRow.push(totalFee);
          else if (headerRow[i] === 'Paid') summaryRow.push(totalPaid);
          else if (headerRow[i] === 'Balance') summaryRow.push(totalBalance);
          else summaryRow.push('');
        }
        exportTableRows.push(summaryRow);

        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...exportTableRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fee Details');
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        toast.success(`Excel exported! (${exportRows.length} students)`);
      } catch (e) {
        toast.error('Failed to generate Excel');
      }
    }
  };

  const handleWhatsAppClick = (row: any) => {
    if (!row.phone) { toast.error('No phone number registered for this student.'); return; }
    setReminderStudent(row);
  };

  const handleShareReminder = async () => {
    if (!reminderStudent) return;
    setIsGenerating(true);
    const node = document.getElementById('fee-reminder-card');
    
    try {
      if (node) {
        const blob = await toBlob(node, { quality: 1, backgroundColor: '#ffffff' });
        if (!blob) throw new Error('Failed to generate image');

        const cleanPhone = reminderStudent.phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const textMessage = `Dear Parent of *${reminderStudent.name}*,\nThis is a reminder from *SRI VENKATESWARA JY SCHOOL*.\nPlease find the fee reminder attached.\nKindly clear the dues at the earliest.`;
        
        const fileName = `Fee_Reminder_${reminderStudent.id}.png`;
        const didShare = await shareFileNatively(blob, fileName, textMessage);

        if (!didShare) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success('Photo copied to clipboard! Paste it in the WhatsApp chat.', { duration: 5000 });
          } catch (e) {
            toast.error('Could not copy image automatically. Please screenshot the card.');
          }
          window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(textMessage)}`, '_blank');
        }
      }
    } catch (err) {
      toast.error('Error generating fee reminder photo.');
    } finally {
      setIsGenerating(false);
      setReminderStudent(null);
    }
  };

  const totalFee = tableData.reduce((s, r) => s + r.totalFee, 0);
  const totalPaid = tableData.reduce((s, r) => s + r.paidAmount, 0);
  const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const currentData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in -mx-4 -my-4 md:m-0">
      <ExportDialog
        open={exportDialog.open}
        onClose={() => setExportDialog(d => ({ ...d, open: false }))}
        onExport={handleExport}
        exportType={exportDialog.type}
        totalRows={tableData.length}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="sm:w-64">
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer shadow-sm"
            >
              <option value="ALL">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-all shadow-sm">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => setExportDialog({ open: true, type: 'pdf' })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100 text-sm font-bold rounded-xl transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => setExportDialog({ open: true, type: 'excel' })} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100 text-sm font-bold rounded-xl transition-all shadow-sm">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-lg border border-indigo-400">
          <p className="text-indigo-100 text-xs font-black uppercase tracking-wider mb-1">Total Fee</p>
          <p className="text-2xl md:text-3xl font-black text-white">Rs.Rs.Rs.{totalFee.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg border border-emerald-400">
          <p className="text-emerald-100 text-xs font-black uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl md:text-3xl font-black text-white">Rs.Rs.Rs.{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-5 rounded-2xl shadow-lg border border-rose-400">
          <p className="text-rose-100 text-xs font-black uppercase tracking-wider mb-1">Balance Due</p>
          <p className="text-2xl md:text-3xl font-black text-white">Rs.Rs.Rs.{totalBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200 text-indigo-900">
              <tr>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 w-16 text-center">S.No</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200">Student ID</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 min-w-[200px]">Student Name</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200">Class</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 text-right">Total Fee</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 text-right">Paid</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 text-right">Balance</th>
                {isAdminOrSuper && (
                  <>
                    <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider border-r border-gray-200 text-center">WhatsApp</th>
                    <th className="px-4 py-4 font-black uppercase text-[10px] tracking-wider text-center">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrSuper ? 9 : 7} className="px-6 py-12 text-center text-gray-400 font-medium bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-10 h-10 mb-3 text-gray-300" />
                      <p>No student records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((row) => (
                  <tr key={row.studentId} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-4 border-r border-gray-100 text-center font-medium text-gray-500">{row.sno}</td>
                    <td className="px-4 py-4 border-r border-gray-100 font-bold text-gray-700 text-xs font-mono">{row.id}</td>
                    <td className="px-4 py-4 border-r border-gray-100 font-bold text-gray-900">{row.name}</td>
                    <td className="px-4 py-4 border-r border-gray-100 text-gray-600 text-xs font-bold">{row.className}</td>
                    <td className="px-4 py-4 border-r border-gray-100 text-right font-medium text-gray-600">Rs.Rs.Rs.{row.totalFee.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 border-r border-gray-100 text-right font-bold text-emerald-600">Rs.Rs.Rs.{row.paidAmount.toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-4 border-r border-gray-100 text-right font-black ${row.balance > 0 ? 'text-rose-600' : row.balance < 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                      Rs.Rs.Rs.{row.balance.toLocaleString('en-IN')}
                    </td>
                    {isAdminOrSuper && (
                      <>
                        <td className="px-4 py-3 border-r border-gray-100 text-center">
                          <button
                            onClick={() => handleWhatsAppClick(row)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            REMIND
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/student/${row.studentId}`)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-[10px] font-bold rounded-lg transition-colors border border-indigo-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-500">
              Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, tableData.length)}</span> of <span className="font-bold text-gray-900">{tableData.length}</span> students
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-indigo-200 border-none'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {reminderStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Send WhatsApp Reminder</h3>
              <button onClick={() => setReminderStudent(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div id="fee-reminder-card" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden" style={{ minHeight: '300px' }}>
                <div className="absolute top-0 inset-x-0 h-2 bg-rose-500" />
                <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain rounded-full border-2 border-gray-100 shadow-sm" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=JY&background=6366f1&color=fff'; }} />
                <h4 className="text-lg font-black text-gray-900 mb-1">SRI VENKATESWARA JY SCHOOL</h4>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-6 px-3 py-1 bg-rose-50 inline-block rounded-full">FEE DUE REMINDER</p>
                <div className="space-y-4 mb-6 text-left border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500">Student Name</span>
                    <span className="text-sm font-bold text-gray-900">{reminderStudent.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-500">Class</span>
                    <span className="text-sm font-bold text-gray-900">{reminderStudent.className}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-rose-600">Total Pending Balance</span>
                    <span className="text-xl font-black text-rose-600">Rs.Rs.Rs.{reminderStudent.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Dear Parent, kindly clear the pending dues at the earliest. Please ignore if already paid.</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button onClick={handleShareReminder} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all">
                {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Share2 className="w-5 h-5" />}
                {isGenerating ? 'Generating Photo...' : 'Send via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};






