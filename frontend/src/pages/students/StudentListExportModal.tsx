import React, { useState, useEffect } from 'react';
import { 
  X, FileText, FileSpreadsheet, Download, Plus, Trash2, Filter, 
  SlidersHorizontal, RotateCcw, Bookmark, Save, Sparkles, Check, 
  Layers, ArrowUpDown
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'pdf' | 'excel';
  students: any[];
  totalStudents: number;
  classId?: string;
  search?: string;
}

interface ExportPreset {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  orientation: 'portrait' | 'landscape';
  customHeading: string;
  filter: string;
  rowHeight: number;
  cols: {
    sno: boolean;
    studentId: boolean;
    name: boolean;
    className: boolean;
    gender: boolean;
    phone: boolean;
    fatherName: boolean;
    status: boolean;
  };
  colWidths: Record<string, number>;
  customColumns: string[];
  customColWidths: Record<string, number>;
}

const FILTER_OPTIONS = [
  { value: 'all',      label: 'All Students',      desc: 'Export everyone',             icon: '👥' },
  { value: 'boys',     label: 'Boys Only',         desc: 'Male students',               icon: '👦' },
  { value: 'girls',    label: 'Girls Only',        desc: 'Female students',             icon: '👧' },
  { value: 'active',   label: 'Active Students',   desc: 'Currently studying',          icon: '🟢' },
  { value: 'inactive', label: 'Inactive Students', desc: 'Left the school',             icon: '🔴' },
] as const;

// Pre-configured official templates for instant printing
const BUILT_IN_PRESETS: ExportPreset[] = [
  {
    id: 'preset_standard',
    name: '📄 General Student List',
    isBuiltIn: true,
    orientation: 'portrait',
    customHeading: 'STUDENT LIST REPORT',
    filter: 'all',
    rowHeight: 8,
    cols: {
      sno: true,
      studentId: true,
      name: true,
      className: true,
      gender: false,
      phone: true,
      fatherName: false,
      status: true,
    },
    colWidths: { sno: 15, studentId: 26, name: 45, className: 22, gender: 18, phone: 26, fatherName: 32, status: 20 },
    customColumns: [],
    customColWidths: {},
  },
  {
    id: 'preset_parent_sig',
    name: '✍️ Parent Signature Sheet',
    isBuiltIn: true,
    orientation: 'landscape',
    customHeading: 'PARENT SIGNATURE & ACKNOWLEDGEMENT SHEET',
    filter: 'all',
    rowHeight: 14, // Generous height for physical signatures
    cols: {
      sno: true,
      studentId: true,
      name: true,
      className: true,
      gender: false,
      phone: true,
      fatherName: true,
      status: false,
    },
    colWidths: { sno: 15, studentId: 24, name: 45, className: 22, gender: 18, phone: 26, fatherName: 38, status: 20 },
    customColumns: ['PARENT SIGNATURE', 'FEEDBACK / REMARKS'],
    customColWidths: { 'PARENT SIGNATURE': 55, 'FEEDBACK / REMARKS': 45 },
  },
  {
    id: 'preset_bus_attendance',
    name: '🚌 Bus Transport Attendance',
    isBuiltIn: true,
    orientation: 'landscape',
    customHeading: 'BUS TRANSPORT DAILY ATTENDANCE REGISTER',
    filter: 'all',
    rowHeight: 12,
    cols: {
      sno: true,
      studentId: true,
      name: true,
      className: true,
      gender: false,
      phone: true,
      fatherName: false,
      status: false,
    },
    colWidths: { sno: 15, studentId: 24, name: 45, className: 22, gender: 18, phone: 28, fatherName: 32, status: 20 },
    customColumns: ['PICKUP (MORNING)', 'DROP (EVENING)', 'DRIVER INITIALS'],
    customColWidths: { 'PICKUP (MORNING)': 38, 'DROP (EVENING)': 38, 'DRIVER INITIALS': 32 },
  },
  {
    id: 'preset_fee_collection',
    name: '💰 Fee Verification & Collection',
    isBuiltIn: true,
    orientation: 'landscape',
    customHeading: 'STUDENT FEE COLLECTION & RECEIPT LOG',
    filter: 'all',
    rowHeight: 13,
    cols: {
      sno: true,
      studentId: true,
      name: true,
      className: true,
      gender: false,
      phone: true,
      fatherName: true,
      status: false,
    },
    colWidths: { sno: 15, studentId: 24, name: 45, className: 22, gender: 18, phone: 26, fatherName: 35, status: 20 },
    customColumns: ['FEE DUE (₹)', 'PAID AMOUNT (₹)', 'RECEIPT NO', 'SIGNATURE'],
    customColWidths: { 'FEE DUE (₹)': 28, 'PAID AMOUNT (₹)': 32, 'RECEIPT NO': 30, 'SIGNATURE': 35 },
  },
];

export const StudentListExportModal: React.FC<ExportDialogProps> = ({ 
  isOpen, 
  onClose, 
  exportType, 
  students, 
  totalStudents,
  classId,
  search
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [customHeading, setCustomHeading] = useState<string>('STUDENT LIST REPORT');
  const [rowHeight, setRowHeight] = useState<number>(9); // Row Height in mm (default 9mm)

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

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    sno: 15,          // 15mm ensures S.No NEVER wraps into two lines!
    studentId: 26,
    name: 38,
    className: 22,
    gender: 18,
    phone: 26,
    fatherName: 32,
    status: 20,
  });

  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [customColWidths, setCustomColWidths] = useState<Record<string, number>>({});
  const [newCustomCol, setNewCustomCol] = useState('');

  // Presets State
  const [savedPresets, setSavedPresets] = useState<ExportPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const [isReady, setIsReady] = useState(false);

  // Load custom saved presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jy_school_export_presets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedPresets(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load export presets:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsReady(true), 50);
    } else {
      setIsReady(false);
      setShowSavePresetInput(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Apply a selected template
  const handleApplyPreset = (preset: ExportPreset) => {
    setActivePresetId(preset.id);
    setOrientation(preset.orientation);
    setCustomHeading(preset.customHeading);
    setFilter(preset.filter || 'all');
    setRowHeight(preset.rowHeight || 9);
    setCols({ ...preset.cols });
    setColWidths({ ...preset.colWidths });
    setCustomColumns([...preset.customColumns]);
    setCustomColWidths({ ...preset.customColWidths });
    toast.success(`Loaded template: "${preset.name}"`, { icon: '✨', duration: 2500 });
  };

  // Save current settings as a new template
  const handleSaveCurrentPreset = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newPresetName.trim();
    if (!name) {
      toast.error('Please enter a template name');
      return;
    }

    const newPreset: ExportPreset = {
      id: `preset_custom_${Date.now()}`,
      name,
      isBuiltIn: false,
      orientation,
      customHeading: customHeading.trim() || 'STUDENT LIST REPORT',
      filter,
      rowHeight,
      cols: { ...cols },
      colWidths: { ...colWidths },
      customColumns: [...customColumns],
      customColWidths: { ...customColWidths },
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    setActivePresetId(newPreset.id);
    try {
      localStorage.setItem('jy_school_export_presets', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewPresetName('');
    setShowSavePresetInput(false);
    toast.success(`Template "${name}" saved successfully!`, { icon: '💾' });
  };

  // Delete a custom preset
  const handleDeletePreset = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete template "${name}"?`)) return;
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
    try {
      localStorage.setItem('jy_school_export_presets', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    toast.success(`Template "${name}" removed`);
  };

  const handleAddCustomCol = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newCustomCol.trim();
    if (trimmed && !customColumns.includes(trimmed)) {
      setCustomColumns([...customColumns, trimmed]);
      setCustomColWidths(prev => ({ ...prev, [trimmed]: 40 }));
      setNewCustomCol('');
      setActivePresetId(null); // Settings customized
    }
  };

  const handleRemoveCustomCol = (colName: string) => {
    setCustomColumns(customColumns.filter(c => c !== colName));
    setCustomColWidths(prev => {
      const copy = { ...prev };
      delete copy[colName];
      return copy;
    });
    setActivePresetId(null);
  };

  const handleExport = async () => {
    setIsGenerating(true);
    const toastId = toast.loading(`Preparing ${exportType.toUpperCase()} export for all students...`);
    try {
      // 1. Fetch ALL matching students from server (bypasses 50-item page limit)
      let allStudents = students;
      try {
        const res: any = await api.get('/api/students', {
          params: {
            search: search || undefined,
            classId: classId || undefined,
            limit: 10000,
            page: 1,
          }
        });
        if (res.data?.data && Array.isArray(res.data.data)) {
          allStudents = res.data.data;
        }
      } catch (fetchErr) {
        console.warn("Failed to fetch all students for export, falling back to current page:", fetchErr);
      }

      // 2. Filter students
      let exportRows = [...allStudents];
      if (filter === 'boys') exportRows = exportRows.filter(s => s.gender === 'Male');
      if (filter === 'girls') exportRows = exportRows.filter(s => s.gender === 'Female');
      if (filter === 'active') exportRows = exportRows.filter(s => s.user?.isActive !== false);
      if (filter === 'inactive') exportRows = exportRows.filter(s => s.user?.isActive === false);

      if (exportRows.length === 0) {
        toast.error('No students found to export with the selected filter.', { id: toastId });
        setIsGenerating(false);
        return;
      }

      // Extract raw data
      const dataRows = exportRows.map((s: any, i: number) => ({
        sno: i + 1,
        studentId: s.rollNo || s.studentId || '-',
        name: s.user?.name || s.name || '-',
        className: s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '-',
        gender: s.gender || '-',
        phone: s.user?.phone || s.phone || '-',
        fatherName: s.fatherName || '-',
        status: s.user?.isActive !== false ? 'Active' : 'Inactive',
      }));

      if (exportType === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const autoTableModule: any = await import('jspdf-autotable');
        const autoTable = autoTableModule.default || autoTableModule;

        const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text('SRI VENKATESWARA JY SCHOOL', pageWidth / 2, 14, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta', pageWidth / 2, 20, { align: 'center' });

        // Custom Report Title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        const headingText = (customHeading.trim() || 'STUDENT LIST REPORT').toUpperCase();
        doc.text(headingText, pageWidth / 2, 28, { align: 'center' });

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
        
        // Single line S.No guaranteed with cellWidth: colWidths.sno || 15
        if (cols.sno) { 
          headerRow.push('S.No'); 
          colStyles[ci++] = { halign: 'center', cellWidth: colWidths.sno || 15 }; 
        }
        if (cols.studentId) { 
          headerRow.push('Student ID'); 
          colStyles[ci++] = { cellWidth: colWidths.studentId || 26, fontStyle: 'bold', textColor: [100, 116, 139] }; 
        }
        if (cols.name) { 
          headerRow.push('Student Name'); 
          colStyles[ci++] = { cellWidth: colWidths.name || 38, fontStyle: 'bold' }; 
        }
        if (cols.className) { 
          headerRow.push('Class'); 
          colStyles[ci++] = { cellWidth: colWidths.className || 22, halign: 'center' }; 
        }
        if (cols.gender) { 
          headerRow.push('Gender'); 
          colStyles[ci++] = { cellWidth: colWidths.gender || 18, halign: 'center' }; 
        }
        if (cols.phone) { 
          headerRow.push('Phone'); 
          colStyles[ci++] = { cellWidth: colWidths.phone || 26, halign: 'center' }; 
        }
        if (cols.fatherName) { 
          headerRow.push('Father Name'); 
          colStyles[ci++] = { cellWidth: colWidths.fatherName || 32 }; 
        }
        if (cols.status) { 
          headerRow.push('Status'); 
          colStyles[ci++] = { cellWidth: colWidths.status || 20, halign: 'center' }; 
        }

        customColumns.forEach(cc => {
          headerRow.push(cc);
          colStyles[ci++] = { cellWidth: customColWidths[cc] || 40 };
        });

        const exportTableRows = dataRows.map((r) => {
          const row: any[] = [];
          if (cols.sno) row.push(r.sno);
          if (cols.studentId) row.push(r.studentId);
          if (cols.name) row.push(r.name);
          if (cols.className) row.push(r.className);
          if (cols.gender) row.push(r.gender);
          if (cols.phone) row.push(r.phone);
          if (cols.fatherName) row.push(r.fatherName);
          if (cols.status) row.push(r.status);
          customColumns.forEach(() => row.push('')); // empty custom cols for handwriting / signatures
          return row;
        });

        // Calculate dynamic vertical cell padding based on row height
        const verticalPadding = Math.max(2, (rowHeight - 4) / 2);

        autoTable(doc, {
          head: [headerRow],
          body: exportTableRows,
          startY: 46,
          theme: 'grid',
          styles: { 
            fontSize: 8, 
            minCellHeight: rowHeight, // Controls the exact row height in mm!
            cellPadding: { top: verticalPadding, bottom: verticalPadding, left: 1.5, right: 1.5 }, 
            valign: 'middle', 
            lineColor: [200, 200, 200], 
            lineWidth: 0.1,
            overflow: 'linebreak'
          },
          headStyles: { 
            fillColor: [240, 245, 250], 
            textColor: [20, 20, 20], 
            fontStyle: 'bold', 
            fontSize: 8.5, 
            minCellHeight: 9,
            halign: 'center',
            valign: 'middle',
            cellPadding: { top: 3, bottom: 3, left: 1, right: 1 } 
          },
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

        const exportTableRows = dataRows.map((r) => {
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
        // Set row heights in Excel (hpt is points; 1mm ≈ 2.83 pt)
        ws['!rows'] = [{ hpt: 26 }, ...exportTableRows.map(() => ({ hpt: Math.max(18, rowHeight * 2.83) }))];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, `Student_List_${new Date().getTime()}.xlsx`);
      }
      toast.success(`Exported ${exportRows.length} students to ${exportType.toUpperCase()}!`, { id: toastId });
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(`Export failed: ${e?.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = Object.values(cols).filter(Boolean).length + customColumns.length;
  const allTemplates = [...BUILT_IN_PRESETS, ...savedPresets];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      <div className={`relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        {/* Header */}
        <div className={`px-6 py-4 ${exportType === 'pdf' ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700' : 'bg-gradient-to-r from-emerald-600 to-teal-700'} flex items-center justify-between text-white`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              {exportType === 'pdf' ? <FileText className="w-5 h-5 text-white" /> : <FileSpreadsheet className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg tracking-wide">Export & Print Options</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                  {totalStudents} students
                </span>
              </div>
              <p className="text-white/80 text-xs font-medium">Customizable columns, row height & saved print templates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-6">
          
          {/* SECTION 1: SAVED TEMPLATES / PRESETS (టెంప్లేట్లు) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Saved Print Templates (సేవ్ చేసిన టెంప్లేట్లు)
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-md">
                  1-Click Setup
                </span>
              </div>

              {!showSavePresetInput ? (
                <button
                  type="button"
                  onClick={() => setShowSavePresetInput(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Current Settings as Template
                </button>
              ) : null}
            </div>

            {/* Inline Save Template Form */}
            {showSavePresetInput && (
              <form onSubmit={handleSaveCurrentPreset} className="mb-3.5 p-3 bg-white border border-indigo-200 rounded-xl shadow-sm flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Enter template name (e.g., Parent Signature Sheet)..."
                  autoFocus
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSavePresetInput(false); setNewPresetName(''); }}
                  className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Template Chips */}
            <div className="flex flex-wrap gap-2">
              {allTemplates.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                      {preset.orientation === 'landscape' ? 'Land' : 'Port'} • {preset.rowHeight || 9}mm
                    </span>
                    {!preset.isBuiltIn && (
                      <button
                        type="button"
                        onClick={(e) => handleDeletePreset(preset.id, preset.name, e)}
                        title="Delete custom template"
                        className={`p-1 rounded-md hover:bg-red-500 hover:text-white transition-colors ${isActive ? 'text-white/80' : 'text-slate-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: ROW HEIGHT ADJUSTER & HEADING (PDF specific) */}
          {exportType === 'pdf' && (
            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100/80 space-y-4">
              
              {/* Row 1: Orientation & Custom Heading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Page Orientation */}
                <div>
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider block mb-2">
                    Page Orientation (పేజీ అమరిక)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setOrientation('portrait'); setActivePresetId(null); }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-102'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-white/80'
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="12" height="18" x="6" y="3" rx="2"/></svg>
                      Portrait (నిలువు)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrientation('landscape'); setActivePresetId(null); }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-102'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-white/80'
                      }`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="12" x="3" y="6" rx="2"/></svg>
                      Landscape (అడ్డంగా)
                    </button>
                  </div>
                </div>

                {/* Custom Heading Input */}
                <div>
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wider block mb-2">
                    Report Heading (రిపోర్ట్ శీర్షిక)
                  </label>
                  <input
                    type="text"
                    value={customHeading}
                    onChange={(e) => { setCustomHeading(e.target.value); setActivePresetId(null); }}
                    placeholder="e.g. STUDENT LIST REPORT, 10TH FEE SHEET"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Row 2: ROW HEIGHT ADJUSTER (వరుస ఎత్తు) */}
              <div className="pt-3 border-t border-indigo-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                    <label className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                      Row Height (వరుస ఎత్తు - mm లో)
                    </label>
                  </div>
                  
                  {/* Row Height Quick Presets */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Compact', val: 6, desc: 'చిన్నది' },
                      { label: 'Normal', val: 9, desc: 'సాధారణం' },
                      { label: 'Spacious', val: 14, desc: 'పెద్దది' },
                      { label: 'Signature', val: 18, desc: 'సంతకాల కోసం' },
                    ].map((h) => (
                      <button
                        key={h.val}
                        type="button"
                        onClick={() => { setRowHeight(h.val); setActivePresetId(null); }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          rowHeight === h.val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                        }`}
                        title={h.desc}
                      >
                        {h.label} ({h.val}mm)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stepper with visual indicator */}
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-200/80 shadow-sm">
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">Current Row Height: </span>
                    {rowHeight >= 14 ? '✍️ Perfect for Physical Signatures & Remarks' : rowHeight <= 7 ? '📄 Fits maximum students per page' : 'Standard Clean View'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setRowHeight(h => Math.max(6, h - 1)); setActivePresetId(null); }}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 flex items-center justify-center font-black text-slate-700 text-sm transition-colors cursor-pointer"
                      title="Decrease Row Height"
                    >
                      -
                    </button>
                    <span className="w-16 text-center text-sm font-mono font-black text-indigo-600 bg-indigo-50/60 py-1 rounded-lg border border-indigo-100">
                      {rowHeight} mm
                    </span>
                    <button
                      type="button"
                      onClick={() => { setRowHeight(h => Math.min(35, h + 1)); setActivePresetId(null); }}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 flex items-center justify-center font-black text-slate-700 text-sm transition-colors cursor-pointer"
                      title="Increase Row Height"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 3: FILTER STUDENTS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className={`w-4 h-4 ${exportType === 'pdf' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Filter Students</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = filter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setActivePresetId(null); }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected 
                        ? (exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/80 shadow-sm text-indigo-950 font-bold' : 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold')
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{opt.icon}</span>
                    <div className="text-xs">{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: SELECT COLUMNS & CUSTOM COLUMNS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className={`w-4 h-4 ${exportType === 'pdf' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Select Columns to Export</h3>
              <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-lg ${exportType === 'pdf' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {selectedCount} selected
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
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
                  <label key={key} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked 
                      ? (exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-emerald-600 bg-emerald-50/60')
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setCols(c => ({ ...c, [key]: e.target.checked }));
                        setActivePresetId(null);
                      }}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked 
                        ? (exportType === 'pdf' ? 'bg-indigo-600 border-indigo-600' : 'bg-emerald-600 border-emerald-600')
                        : 'border-gray-300'
                    }`}>
                      {isChecked && <Plus className="w-3 h-3 text-white rotate-45" />}
                    </div>
                    <span className={`text-xs font-bold ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
                  </label>
                );
              })}

              {/* Custom Columns rendering */}
              {customColumns.map((col, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border ${exportType === 'pdf' ? 'border-indigo-600 bg-indigo-50/60' : 'border-emerald-600 bg-emerald-50/60'}`}>
                   <div className="flex items-center gap-1.5 min-w-0">
                     <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${exportType === 'pdf' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                        <Plus className="w-2.5 h-2.5 text-white rotate-45" />
                     </div>
                     <span className="text-xs font-bold text-gray-900 truncate" title={col}>{col}</span>
                   </div>
                   <button onClick={() => handleRemoveCustomCol(col)} className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0 cursor-pointer">
                     <Trash2 className="w-3.5 h-3.5" />
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
                placeholder="Type a custom column name (e.g. Parent Signature, Remarks)..."
                className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!newCustomCol.trim() || customColumns.includes(newCustomCol.trim())}
                className="px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Column
              </button>
            </form>
            {customColumns.length > 0 && (
              <p className="text-[11px] text-gray-500 font-medium mt-2">
                Custom columns appear with empty rows for handwriting notes or physical signatures.
              </p>
            )}
          </div>

          {/* SECTION 5: COLUMN WIDTH ADJUSTMENTS (PDF only) */}
          {exportType === 'pdf' && selectedCount > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Adjust Column Sizes (కాలమ్ వెడల్పులు mm లో)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setColWidths({
                      sno: 15,
                      studentId: 26,
                      name: 38,
                      className: 22,
                      gender: 18,
                      phone: 26,
                      fatherName: 32,
                      status: 20,
                    });
                    const resetted: Record<string, number> = {};
                    customColumns.forEach(c => { resetted[c] = 40; });
                    setCustomColWidths(resetted);
                    setActivePresetId(null);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Widths
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mb-3">
                S.No is locked to single-line (15mm+). Adjust other column widths to fit your A4 page layout.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {cols.sno && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">S.No (Single Line)</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, sno: Math.max(14, (w.sno || 15) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.sno || 15} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, sno: (w.sno || 15) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.studentId && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Student ID</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, studentId: Math.max(16, (w.studentId || 26) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.studentId || 26} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, studentId: (w.studentId || 26) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.name && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Student Name</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, name: Math.max(20, (w.name || 38) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.name || 38} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, name: (w.name || 38) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.className && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Class</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, className: Math.max(14, (w.className || 22) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.className || 22} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, className: (w.className || 22) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.gender && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Gender</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, gender: Math.max(12, (w.gender || 18) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.gender || 18} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, gender: (w.gender || 18) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.phone && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Phone</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, phone: Math.max(18, (w.phone || 26) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.phone || 26} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, phone: (w.phone || 26) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.fatherName && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Father Name</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, fatherName: Math.max(20, (w.fatherName || 32) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.fatherName || 32} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, fatherName: (w.fatherName || 32) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}
                {cols.status && (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                    <span className="text-gray-700">Status</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, status: Math.max(14, (w.status || 20) - 2) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{colWidths.status || 20} mm</span>
                      <button type="button" onClick={() => { setColWidths(w => ({ ...w, status: (w.status || 20) + 2 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                )}

                {/* Custom Columns */}
                {customColumns.map(col => (
                  <div key={col} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-200 shadow-sm text-xs font-bold">
                    <span className="text-indigo-950 truncate max-w-[120px]" title={col}>{col}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => { setCustomColWidths(w => ({ ...w, [col]: Math.max(20, (w[col] || 40) - 4) })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">-</button>
                      <span className="w-12 text-center text-indigo-600 font-mono font-black">{customColWidths[col] || 40} mm</span>
                      <button type="button" onClick={() => { setCustomColWidths(w => ({ ...w, [col]: (w[col] || 40) + 4 })); setActivePresetId(null); }} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black cursor-pointer">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isGenerating || selectedCount === 0}
            className={`flex-1 px-4 py-3 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer ${
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

export default StudentListExportModal;
