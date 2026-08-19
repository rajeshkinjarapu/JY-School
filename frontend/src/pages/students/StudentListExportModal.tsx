import React, { useState, useEffect } from 'react';
import { X, FileText, FileSpreadsheet, Download, Plus, Trash2, Filter } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'pdf' | 'excel';
  students: any[];
  totalStudents: number;
}

const FILTER_OPTIONS = [
  { value: 'all',      label: 'All Students',      desc: 'Export everyone',             icon: '👥' },
  { value: 'boys',     label: 'Boys Only',         desc: 'Male students',               icon: '👦' },
  { value: 'girls',    label: 'Girls Only',        desc: 'Female students',             icon: '👧' },
  { value: 'active',   label: 'Active Students',   desc: 'Currently studying',          icon: '🟢' },
  { value: 'inactive', label: 'Inactive Students', desc: 'Left the school',             icon: '🔴' },
] as const;

export const StudentListExportModal: React.FC<ExportDialogProps> = ({ isOpen, onClose, exportType, students, totalStudents }) => {
  const [filter, setFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [cols, setCols] = useState({
    sno: true,
    studentId: true,
    name: true,
    className: true,
    gender: false,
    phone: true,
    fatherName: false,
    status: false,
  });

  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newCustomCol, setNewCustomCol] = useState('');

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsReady(true), 50);
    } else {
      setIsReady(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddCustomCol = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newCustomCol.trim() && !customColumns.includes(newCustomCol.trim())) {
      setCustomColumns([...customColumns, newCustomCol.trim()]);
      setNewCustomCol('');
    }
  };

  const handleRemoveCustomCol = (colName: string) => {
    setCustomColumns(customColumns.filter(c => c !== colName));
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      // 1. Filter students
      let exportRows = [...students];
      if (filter === 'boys') exportRows = exportRows.filter(s => s.gender === 'Male');
      if (filter === 'girls') exportRows = exportRows.filter(s => s.gender === 'Female');
      if (filter === 'active') exportRows = exportRows.filter(s => s.user?.isActive);
      if (filter === 'inactive') exportRows = exportRows.filter(s => !s.user?.isActive);

      // Extract raw data
      const dataRows = exportRows.map((s: any, i: number) => ({
        sno: i + 1,
        studentId: s.rollNo || s.studentId || '-',
        name: s.user?.name || s.name || '-',
        className: s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '-',
        gender: s.gender || '-',
        phone: s.user?.phone || s.phone || '-',
        fatherName: s.fatherName || '-',
        status: s.user?.isActive ? 'Active' : 'Inactive',
      }));

      const numCols = Object.values(cols).filter(Boolean).length + customColumns.length;
      const orientation = numCols > 7 ? 'landscape' : 'portrait';

      if (exportType === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const autoTableModule: any = await import('jspdf-autotable');
        const autoTable = autoTableModule.default || autoTableModule;

        const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text('SRI VENKATESWARA JY SCHOOL', pageWidth / 2, 14, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('STUDENT LIST REPORT', pageWidth / 2, 28, { align: 'center' });

        doc.setDrawColor(220, 220, 220);
        doc.line(14, 33, pageWidth - 14, 33);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        const filterLabel = FILTER_OPTIONS.find(o => o.value === filter)?.label;
        doc.text(`Filter: ${filterLabel}  |  Students: ${exportRows.length}`, 14, 41);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 41, { align: 'right' });

        const headerRow: string[] = [];
        const colStyles: any = {};
        let ci = 0;
        
        if (cols.sno) { headerRow.push('S.No'); colStyles[ci++] = { halign: 'center', cellWidth: 12 }; }
        if (cols.studentId) { headerRow.push('Student ID'); colStyles[ci++] = { cellWidth: 26, fontStyle: 'bold', textColor: [100, 116, 139] }; }
        if (cols.name) { headerRow.push('Student Name'); colStyles[ci++] = { cellWidth: 'auto', fontStyle: 'bold' }; }
        if (cols.className) { headerRow.push('Class'); colStyles[ci++] = { cellWidth: 20 }; }
        if (cols.gender) { headerRow.push('Gender'); colStyles[ci++] = { cellWidth: 16 }; }
        if (cols.phone) { headerRow.push('Phone'); colStyles[ci++] = { cellWidth: 24 }; }
        if (cols.fatherName) { headerRow.push('Father Name'); colStyles[ci++] = { cellWidth: 30 }; }
        if (cols.status) { headerRow.push('Status'); colStyles[ci++] = { cellWidth: 18 }; }

        customColumns.forEach(cc => {
          headerRow.push(cc);
          colStyles[ci++] = { cellWidth: 'auto' };
        });

        const exportTableRows = dataRows.map((r, i) => {
          const row: any[] = [];
          if (cols.sno) row.push(r.sno);
          if (cols.studentId) row.push(r.studentId);
          if (cols.name) row.push(r.name);
          if (cols.className) row.push(r.className);
          if (cols.gender) row.push(r.gender);
          if (cols.phone) row.push(r.phone);
          if (cols.fatherName) row.push(r.fatherName);
          if (cols.status) row.push(r.status);
          customColumns.forEach(() => row.push('')); // empty custom cols
          return row;
        });

        autoTable(doc, {
          head: [headerRow],
          body: exportTableRows,
          startY: 46,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
          headStyles: { fillColor: [240, 245, 250], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 9, halign: 'center' },
          columnStyles: colStyles,
          alternateRowStyles: { fillColor: [250, 250, 250] },
          didDrawPage: (data: any) => {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            const pageText = `Page ${data.pageNumber} of ${pageCount}  |  JY School Reports`;
            doc.text(pageText, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
          }
        });

        doc.save(`Student_List_${new Date().getTime()}.pdf`);
      } else {
        // Excel Export
        const XLSX = await import('xlsx');
        const headerRow: string[] = [];
        if (cols.sno) headerRow.push('S.No');
        if (cols.studentId) headerRow.push('Student ID');
        if (cols.name) headerRow.push('Student Name');
        if (cols.className) headerRow.push('Class');
        if (cols.gender) headerRow.push('Gender');
        if (cols.phone) headerRow.push('Phone');
        if (cols.fatherName) headerRow.push('Father Name');
        if (cols.status) headerRow.push('Status');
        customColumns.forEach(cc => headerRow.push(cc));

        const exportTableRows = dataRows.map((r, i) => {
          const row: any[] = [];
          if (cols.sno) row.push(r.sno);
          if (cols.studentId) row.push(r.studentId);
          if (cols.name) row.push(r.name);
          if (cols.className) row.push(r.className);
          if (cols.gender) row.push(r.gender);
          if (cols.phone) row.push(r.phone);
          if (cols.fatherName) row.push(r.fatherName);
          if (cols.status) row.push(r.status);
          customColumns.forEach(() => row.push('')); // empty custom cols
          return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...exportTableRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `Student_List_${new Date().getTime()}.xlsx`);
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = Object.values(cols).filter(Boolean).length + customColumns.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        {/* Header */}
        <div className={`px-6 py-5 ${exportType === 'pdf' ? 'bg-indigo-600' : 'bg-emerald-600'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${exportType === 'pdf' ? 'bg-indigo-500/50' : 'bg-emerald-500/50'}`}>
              {exportType === 'pdf' ? <FileText className="w-5 h-5 text-white" /> : <FileSpreadsheet className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Export Options</h2>
              <p className="text-white/80 text-xs font-medium">{totalStudents} students in current view</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Filters */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className={`w-4 h-4 ${exportType === 'pdf' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              <h3 className="text-sm font-black text-gray-900">Filter Students</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = filter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? (exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/50' : 'border-emerald-600 bg-emerald-50/50')
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl leading-none mt-1">{opt.icon}</span>
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{opt.label}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plus className={`w-4 h-4 ${exportType === 'pdf' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              <h3 className="text-sm font-black text-gray-900">Select Columns to Export</h3>
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg ${exportType === 'pdf' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {selectedCount} selected
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {Object.entries({
                sno: 'S.No',
                studentId: 'Student ID',
                name: 'Student Name',
                className: 'Class',
                gender: 'Gender',
                phone: 'Phone Number',
                fatherName: 'Father Name',
                status: 'Status',
              }).map(([key, label]) => {
                const isChecked = cols[key as keyof typeof cols];
                return (
                  <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked 
                      ? (exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/50' : 'border-emerald-600 bg-emerald-50/50')
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setCols(c => ({ ...c, [key]: e.target.checked }))}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked 
                        ? (exportType === 'pdf' ? 'bg-indigo-600 border-indigo-600' : 'bg-emerald-600 border-emerald-600')
                        : 'border-gray-300'
                    }`}>
                      {isChecked && <Plus className="w-3 h-3 text-white rotate-45" />}
                    </div>
                    <span className={`text-sm font-bold ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
                  </label>
                );
              })}

              {/* Custom Columns rendering */}
              {customColumns.map((col, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/50' : 'border-emerald-600 bg-emerald-50/50'}`}>
                   <div className="flex items-center gap-2">
                     <div className={`w-4 h-4 rounded flex items-center justify-center ${exportType === 'pdf' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                        <Plus className="w-3 h-3 text-white rotate-45" />
                     </div>
                     <span className="text-sm font-bold text-gray-900 truncate max-w-[100px]" title={col}>{col}</span>
                   </div>
                   <button onClick={() => handleRemoveCustomCol(col)} className="text-gray-400 hover:text-red-500 transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>

            {/* Add Custom Column Input */}
            <form onSubmit={handleAddCustomCol} className="flex gap-2">
              <input
                type="text"
                value={newCustomCol}
                onChange={e => setNewCustomCol(e.target.value)}
                placeholder="Type a custom column name (e.g. Signatures)..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!newCustomCol.trim() || customColumns.includes(newCustomCol.trim())}
                className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            {customColumns.length > 0 && (
              <p className="text-xs text-gray-500 font-medium mt-2">
                Custom columns will appear as empty columns in the exported file.
              </p>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating || selectedCount === 0}
            className={`flex-1 px-4 py-3 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${
              exportType === 'pdf' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {isGenerating ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {exportType.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
