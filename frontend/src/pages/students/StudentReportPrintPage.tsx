import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import toast from 'react-hot-toast';
import { 
  Printer, Download, FileText, FileSpreadsheet, Filter, 
  ArrowLeft, CheckSquare, Square, RotateCcw, SlidersHorizontal, 
  Layers, Sparkles, Plus, Trash2, Save, Search, Building, 
  CheckCircle2, AlertCircle, Calendar, Users, GraduationCap, 
  Eye, Settings2, HeartPulse, ShieldCheck, MapPin, Check, 
  Fingerprint, Phone, Hash, ChevronDown, RefreshCw, X,
  Maximize2, Minimize2, Palette, ChevronUp, ChevronRight,
  ZoomIn, ZoomOut, CheckCircle, Sliders, Type
} from 'lucide-react';

interface ColumnDef {
  id: string;
  label: string;
  teluguLabel: string;
  category: 'basic' | 'govt' | 'academic' | 'family' | 'address' | 'custom';
  defaultSelected: boolean;
  widthPt: number;
  align?: 'left' | 'center' | 'right';
  getValue: (s: any, idx: number) => string;
}

interface PresetTemplate {
  id: string;
  name: string;
  icon: string;
  isBuiltIn: boolean;
  orientation: 'portrait' | 'landscape';
  customHeading: string;
  rowHeightMm: number;
  cellPadding: 'compact' | 'normal' | 'relaxed';
  fontSize: 'sm' | 'base' | 'lg';
  tableTheme: 'navy' | 'purple' | 'emerald' | 'crimson' | 'charcoal';
  selectedColumns: string[];
  customBlankColumns?: { id: string; label: string; widthPt: number }[];
}

export const StudentReportPrintPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── ROW HEIGHT & SPACING CONTROLS (DIRECTLY EDITABLE) ──
  const [rowHeightMm, setRowHeightMm] = useState<number>(9); // 5mm to 30mm
  const [cellPadding, setCellPadding] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [reportTitle, setReportTitle] = useState('STUDENT MASTER DIRECTORY & REPORT');
  const [tableTheme, setTableTheme] = useState<'navy' | 'purple' | 'emerald' | 'crimson' | 'charcoal'>('navy');
  const [showColumnsSelector, setShowColumnsSelector] = useState(true);

  // Custom added blank columns for handwriting/signatures
  const [customBlankCols, setCustomBlankCols] = useState<{ id: string; label: string; widthPt: number }[]>([]);
  const [newColName, setNewColName] = useState('');

  // Helper for Aadhaar format
  const formatAadhaar = (val?: string | null) => {
    if (!val) return '-';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
    }
    return String(val).trim();
  };

  // Helper for age
  const calculateAge = (dobString?: string) => {
    if (!dobString) return '-';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return '-';
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const yrs = Math.abs(ageDt.getUTCFullYear() - 1970);
    return `${yrs} Yrs`;
  };

  // Master column definitions list
  const MASTER_COLUMNS: ColumnDef[] = useMemo(() => [
    // 🪪 Basic & Identity
    { id: 'sno', label: 'S.No', teluguLabel: 'Serial Number', category: 'basic', defaultSelected: true, widthPt: 14, align: 'center', getValue: (_, idx) => String(idx + 1) },
    { id: 'photo', label: 'Photo', teluguLabel: 'Passport Photo', category: 'basic', defaultSelected: false, widthPt: 22, align: 'center', getValue: (s) => s.user?.photoUrl || '' },
    { id: 'rollNo', label: 'Student ID', teluguLabel: 'Roll No / ID', category: 'basic', defaultSelected: true, widthPt: 26, align: 'center', getValue: (s) => s.rollNo || s.studentId || '-' },
    { id: 'admissionNo', label: 'Admission No', teluguLabel: 'Admission Number', category: 'basic', defaultSelected: false, widthPt: 26, align: 'center', getValue: (s) => s.admissionNo || s.rollNo || '-' },
    { id: 'name', label: 'Student Name', teluguLabel: 'Full Student Name', category: 'basic', defaultSelected: true, widthPt: 45, align: 'left', getValue: (s) => s.user?.name || s.name || '-' },
    { id: 'gender', label: 'Gender', teluguLabel: 'Boy / Girl', category: 'basic', defaultSelected: true, widthPt: 18, align: 'center', getValue: (s) => s.gender ? (s.gender.toLowerCase() === 'female' ? 'Girl' : 'Boy') : '-' },
    { id: 'dob', label: 'Date of Birth', teluguLabel: 'Birth Date (DD/MM/YYYY)', category: 'basic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.dob ? new Date(s.dob).toLocaleDateString('en-GB') : '-' },
    { id: 'age', label: 'Age', teluguLabel: 'Calculated Age', category: 'basic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => calculateAge(s.dob) },
    { id: 'bloodGroup', label: 'Blood Group', teluguLabel: 'Blood Type', category: 'basic', defaultSelected: false, widthPt: 20, align: 'center', getValue: (s) => s.bloodGroup || '-' },
    { id: 'aadharNo', label: 'Student Aadhaar', teluguLabel: '12-Digit Aadhaar No', category: 'basic', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.aadharNo) },

    // 🏛️ Government Registrations
    { id: 'penNumber', label: 'PEN Number (UDISE+)', teluguLabel: 'National UDISE+ PEN', category: 'govt', defaultSelected: false, widthPt: 34, align: 'center', getValue: (s) => s.penNumber || '-' },
    { id: 'childId', label: 'Child ID (State)', teluguLabel: 'State Portal Child ID', category: 'govt', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.childId || '-' },
    { id: 'apaarId', label: 'APAAR ID (One Nation)', teluguLabel: 'One Nation One ID', category: 'govt', defaultSelected: false, widthPt: 32, align: 'center', getValue: (s) => s.apaarId || '-' },

    // 🎓 Academic & Institutional
    { id: 'className', label: 'Class & Section', teluguLabel: 'Grade & Section', category: 'academic', defaultSelected: true, widthPt: 24, align: 'center', getValue: (s) => s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '-' },
    { id: 'academicYear', label: 'Academic Year', teluguLabel: 'Session Year', category: 'academic', defaultSelected: false, widthPt: 24, align: 'center', getValue: (s) => s.class?.academicYear || '2026-2027' },
    { id: 'admissionDate', label: 'Admission Date', teluguLabel: 'Date of Joining', category: 'academic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : '-' },
    { id: 'medium', label: 'Medium', teluguLabel: 'Medium of Instruction', category: 'academic', defaultSelected: false, widthPt: 20, align: 'center', getValue: () => 'English' },
    { id: 'status', label: 'Status', teluguLabel: 'Active / Inactive', category: 'academic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => s.user?.isActive !== false ? 'Active' : 'Inactive' },

    // 👨‍👩‍👧 Parents & Family
    { id: 'fatherName', label: 'Father Name', teluguLabel: "Father's Full Name", category: 'family', defaultSelected: true, widthPt: 40, align: 'left', getValue: (s) => s.fatherName || '-' },
    { id: 'fatherPhone', label: "Father's Phone", teluguLabel: "Father's Mobile No", category: 'family', defaultSelected: true, widthPt: 28, align: 'center', getValue: (s) => s.fatherPhone || s.user?.phone || '-' },
    { id: 'fatherAadhar', label: "Father's Aadhaar", teluguLabel: "Father's Aadhaar No", category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.fatherAadhar) },
    { id: 'motherName', label: 'Mother Name', teluguLabel: "Mother's Full Name", category: 'family', defaultSelected: false, widthPt: 38, align: 'left', getValue: (s) => s.motherName || '-' },
    { id: 'motherPhone', label: "Mother's Phone", teluguLabel: "Mother's Mobile No", category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.motherPhone || '-' },
    { id: 'motherAadhar', label: "Mother's Aadhaar", teluguLabel: "Mother's Aadhaar No", category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.motherAadhar) },
    { id: 'guardianName', label: 'Guardian Name', teluguLabel: "Guardian's Full Name", category: 'family', defaultSelected: false, widthPt: 35, align: 'left', getValue: (s) => s.guardianName || '-' },
    { id: 'guardianPhone', label: 'Guardian Phone', teluguLabel: "Guardian's Contact No", category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.guardianPhone || '-' },

    // 📍 Address
    { id: 'address', label: 'Residential Address', teluguLabel: 'Full Address / Village', category: 'address', defaultSelected: false, widthPt: 55, align: 'left', getValue: (s) => s.address || '-' },

    // ✍️ Physical Blank Columns for Writing / Signatures
    { id: 'parentSignature', label: 'Parent Signature', teluguLabel: 'Parent Sign Box', category: 'custom', defaultSelected: false, widthPt: 45, align: 'center', getValue: () => '' },
    { id: 'studentSignature', label: 'Student Signature', teluguLabel: 'Student Sign Box', category: 'custom', defaultSelected: false, widthPt: 40, align: 'center', getValue: () => '' },
    { id: 'remarks', label: 'Remarks / Feedback', teluguLabel: 'Teacher Notes / Remarks', category: 'custom', defaultSelected: false, widthPt: 45, align: 'left', getValue: () => '' },
    { id: 'attendanceBox', label: 'Attendance Check', teluguLabel: 'Check Box [ ]', category: 'custom', defaultSelected: false, widthPt: 22, align: 'center', getValue: () => '' },
    { id: 'feeAmount', label: 'Amount Paid (₹)', teluguLabel: 'Paid Fee Amount (₹)', category: 'custom', defaultSelected: false, widthPt: 30, align: 'center', getValue: () => '' },
    { id: 'receiptNo', label: 'Receipt No', teluguLabel: 'Fee Receipt Number', category: 'custom', defaultSelected: false, widthPt: 28, align: 'center', getValue: () => '' },
  ], []);

  // Selected column IDs set
  const [selectedColIds, setSelectedColIds] = useState<string[]>(() => {
    return MASTER_COLUMNS.filter(c => c.defaultSelected).map(c => c.id);
  });

  // Presets list
  const BUILT_IN_PRESETS: PresetTemplate[] = useMemo(() => [
    {
      id: 'preset_general',
      name: '📄 General Student List',
      icon: '📄',
      isBuiltIn: true,
      orientation: 'portrait',
      customHeading: 'STUDENT LIST & CONTACT DIRECTORY',
      rowHeightMm: 8,
      cellPadding: 'normal',
      fontSize: 'base',
      tableTheme: 'navy',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'fatherName', 'fatherPhone'],
    },
    {
      id: 'preset_udise',
      name: '🏛️ UDISE+ & Govt Identifiers',
      icon: '🏛️',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'GOVERNMENT UDISE+, PEN & AADHAAR REGISTRY',
      rowHeightMm: 9,
      cellPadding: 'normal',
      fontSize: 'base',
      tableTheme: 'emerald',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'aadharNo', 'penNumber', 'childId', 'apaarId'],
    },
    {
      id: 'preset_parent_sig',
      name: '✍️ Parent Signature & PTM Sheet',
      icon: '✍️',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'PARENT SIGNATURE & ACKNOWLEDGEMENT SHEET',
      rowHeightMm: 18, // Generous signature box height
      cellPadding: 'relaxed',
      fontSize: 'base',
      tableTheme: 'purple',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'parentSignature', 'remarks'],
    },
    {
      id: 'preset_bus_attendance',
      name: '🚌 Bus Transport Attendance',
      icon: '🚌',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'BUS TRANSPORT DAILY ATTENDANCE & ROUTE SHEET',
      rowHeightMm: 10,
      cellPadding: 'compact',
      fontSize: 'sm',
      tableTheme: 'crimson',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherPhone', 'address', 'attendanceBox'],
    },
    {
      id: 'preset_fees',
      name: '💰 Fee Verification & Collection',
      icon: '💰',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'STUDENT TERM FEE VERIFICATION & COLLECTION REGISTER',
      rowHeightMm: 12,
      cellPadding: 'normal',
      fontSize: 'base',
      tableTheme: 'navy',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'feeAmount', 'receiptNo', 'parentSignature'],
    },
    {
      id: 'preset_blood_group',
      name: '🩸 Student Health & Blood Group',
      icon: '🩸',
      isBuiltIn: true,
      orientation: 'portrait',
      customHeading: 'STUDENT BLOOD GROUP & EMERGENCY CARE DIRECTORY',
      rowHeightMm: 9,
      cellPadding: 'normal',
      fontSize: 'base',
      tableTheme: 'crimson',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'dob', 'age', 'bloodGroup', 'fatherPhone'],
    },
    {
      id: 'preset_family_address',
      name: '📍 Address & Family Directory',
      icon: '📍',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'STUDENT RESIDENTIAL ADDRESS & FAMILY ENROLMENT',
      rowHeightMm: 10,
      cellPadding: 'normal',
      fontSize: 'base',
      tableTheme: 'charcoal',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'motherName', 'motherPhone', 'address'],
    },
    {
      id: 'preset_master_all',
      name: '📑 All Columns Master Directory',
      icon: '📑',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'STUDENTS ALL RECORDS OFFICIAL MASTER DIRECTORY',
      rowHeightMm: 10,
      cellPadding: 'compact',
      fontSize: 'sm',
      tableTheme: 'navy',
      selectedColumns: MASTER_COLUMNS.map(c => c.id),
    },
  ], [MASTER_COLUMNS]);

  // Saved user presets in localStorage
  const [savedPresets, setSavedPresets] = useState<PresetTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('jy_school_custom_report_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Fetch initial classes and all students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clsRes, stuRes]: any = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/students', { params: { limit: 10000, page: 1 } })
        ]);
        const clsData = clsRes.data?.data || clsRes.data || [];
        const stuData = stuRes.data?.data || stuRes.data || [];
        setClasses(clsData);
        setStudents(stuData);
      } catch (err: any) {
        console.error('Failed to load students data for report:', err);
        toast.error('Failed to load students data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Filter by Class
    if (selectedClassId) {
      result = result.filter(s => s.classId === selectedClassId || s.class?.id === selectedClassId);
    }

    // Filter by Gender
    if (genderFilter === 'male') {
      result = result.filter(s => s.gender?.toLowerCase() === 'male');
    } else if (genderFilter === 'female') {
      result = result.filter(s => s.gender?.toLowerCase() === 'female');
    }

    // Filter by Status
    if (statusFilter === 'active') {
      result = result.filter(s => s.user?.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(s => s.user?.isActive === false);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.user?.name || s.name || '').toLowerCase().includes(q) ||
        (s.rollNo || s.studentId || '').toLowerCase().includes(q) ||
        (s.fatherName || '').toLowerCase().includes(q) ||
        (s.fatherPhone || '').includes(q) ||
        (s.aadharNo || '').includes(q) ||
        (s.penNumber || '').includes(q)
      );
    }

    return result;
  }, [students, selectedClassId, genderFilter, statusFilter, searchQuery]);

  // Active columns in display order
  const activeColumns = useMemo(() => {
    const standardCols = MASTER_COLUMNS.filter(c => selectedColIds.includes(c.id));
    const customCols: ColumnDef[] = customBlankCols.map(c => ({
      id: c.id,
      label: c.label,
      teluguLabel: c.label,
      category: 'custom',
      defaultSelected: true,
      widthPt: c.widthPt,
      align: 'center',
      getValue: () => '',
    }));
    return [...standardCols, ...customCols];
  }, [MASTER_COLUMNS, selectedColIds, customBlankCols]);

  // Toggle Column Selection
  const toggleColumn = (colId: string) => {
    if (selectedColIds.includes(colId)) {
      if (selectedColIds.length === 1 && customBlankCols.length === 0) {
        toast.error('At least one column must be selected');
        return;
      }
      setSelectedColIds(prev => prev.filter(id => id !== colId));
    } else {
      setSelectedColIds(prev => [...prev, colId]);
    }
  };

  // Select all or deselect category
  const selectAllCategory = (category: string) => {
    const catCols = MASTER_COLUMNS.filter(c => c.category === category).map(c => c.id);
    const allSelected = catCols.every(id => selectedColIds.includes(id));
    if (allSelected) {
      // Remove all except don't allow 0 columns
      const remaining = selectedColIds.filter(id => !catCols.includes(id));
      if (remaining.length === 0 && customBlankCols.length === 0) {
        toast.error('At least one column must remain active');
        return;
      }
      setSelectedColIds(remaining);
    } else {
      setSelectedColIds(prev => Array.from(new Set([...prev, ...catCols])));
    }
  };

  // Add custom column
  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newColName.trim();
    if (!name) return;
    const newId = `custom_col_${Date.now()}`;
    setCustomBlankCols(prev => [...prev, { id: newId, label: name.toUpperCase(), widthPt: 40 }]);
    setNewColName('');
    toast.success(`Custom column "${name}" added!`, { icon: '✍️' });
  };

  const handleRemoveCustomColumn = (id: string) => {
    setCustomBlankCols(prev => prev.filter(c => c.id !== id));
  };

  // Apply Preset
  const applyPreset = (preset: PresetTemplate) => {
    setOrientation(preset.orientation);
    setReportTitle(preset.customHeading);
    setRowHeightMm(preset.rowHeightMm || 9);
    setCellPadding(preset.cellPadding || 'normal');
    setFontSize(preset.fontSize || 'base');
    setTableTheme(preset.tableTheme || 'navy');
    setSelectedColIds(preset.selectedColumns.filter(id => MASTER_COLUMNS.some(c => c.id === id)));
    if (preset.customBlankColumns) {
      setCustomBlankCols(preset.customBlankColumns);
    }
    toast.success(`Template applied: ${preset.name}`, { icon: '✨' });
  };

  // Save Current Preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const newPreset: PresetTemplate = {
      id: `saved_preset_${Date.now()}`,
      name: newTemplateName.trim(),
      icon: '⭐',
      isBuiltIn: false,
      orientation,
      customHeading: reportTitle,
      rowHeightMm,
      cellPadding,
      fontSize,
      tableTheme,
      selectedColumns: [...selectedColIds],
      customBlankColumns: [...customBlankCols],
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    try {
      localStorage.setItem('jy_school_custom_report_presets', JSON.stringify(updated));
    } catch {}
    setNewTemplateName('');
    setShowSaveModal(false);
    toast.success('Custom preset template saved!', { icon: '💾' });
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (!window.confirm(`Delete preset "${name}"?`)) return;
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem('jy_school_custom_report_presets', JSON.stringify(updated));
    } catch {}
    toast.success(`Template "${name}" deleted`);
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Color theme definition map
  const THEME_STYLES = {
    navy: {
      id: 'navy',
      name: 'Royal Navy',
      headerBg: 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white',
      border: 'border-blue-900',
      accentText: 'text-blue-950',
      rowAlt: 'bg-blue-50/20',
      hover: 'hover:bg-blue-50/40',
      rgbHeader: [30, 58, 138],
    },
    purple: {
      id: 'purple',
      name: 'Imperial Purple',
      headerBg: 'bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white',
      border: 'border-purple-900',
      accentText: 'text-purple-950',
      rowAlt: 'bg-purple-50/20',
      hover: 'hover:bg-purple-50/40',
      rgbHeader: [88, 28, 135],
    },
    emerald: {
      id: 'emerald',
      name: 'Emerald Green',
      headerBg: 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white',
      border: 'border-emerald-900',
      accentText: 'text-emerald-950',
      rowAlt: 'bg-emerald-50/20',
      hover: 'hover:bg-emerald-50/40',
      rgbHeader: [6, 95, 70],
    },
    crimson: {
      id: 'crimson',
      name: 'Crimson Maroon',
      headerBg: 'bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white',
      border: 'border-rose-900',
      accentText: 'text-rose-950',
      rowAlt: 'bg-rose-50/20',
      hover: 'hover:bg-rose-50/40',
      rgbHeader: [159, 18, 57],
    },
    charcoal: {
      id: 'charcoal',
      name: 'Classic Charcoal',
      headerBg: 'bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 text-white',
      border: 'border-slate-800',
      accentText: 'text-slate-950',
      rowAlt: 'bg-slate-50/50',
      hover: 'hover:bg-slate-100/50',
      rgbHeader: [15, 23, 42],
    },
  };

  const currentTheme = THEME_STYLES[tableTheme];

  // PDF Export using jsPDF and autoTable
  const handleExportPDF = async () => {
    const toastId = toast.loading('Generating PDF report...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Official School Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist. • Contact: 9441104648', pageWidth / 2, 18, { align: 'center' });

      // Custom Report Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(currentTheme.rgbHeader[0], currentTheme.rgbHeader[1], currentTheme.rgbHeader[2]);
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(12, 28, pageWidth - 12, 28);

      // Meta Sub-header
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      const classText = selectedClassId 
        ? classes.find(c => c.id === selectedClassId)?.name || 'Class' 
        : 'All Classes';
      doc.text(`Class: ${classText}  |  Gender: ${genderFilter.toUpperCase()}  |  Total Students: ${filteredStudents.length}`, 12, 33);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 12, 33, { align: 'right' });

      // Build Headers & Data
      const headers = activeColumns.map(c => c.label);
      const colStyles: any = {};
      activeColumns.forEach((c, idx) => {
        colStyles[idx] = { 
          halign: c.align || 'left',
          cellWidth: c.widthPt || 'auto',
          fontSize: fontSize === 'sm' ? 7.5 : fontSize === 'lg' ? 9.5 : 8.5
        };
      });

      const rows = filteredStudents.map((s, idx) => {
        return activeColumns.map(c => c.getValue(s, idx));
      });

      // Calculate exact row height and padding for jsPDF
      const verticalPad = Math.max(1, (rowHeightMm - 5) / 2);
      const horizontalPad = cellPadding === 'compact' ? 1.2 : cellPadding === 'relaxed' ? 3.0 : 2.0;

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 36,
        theme: 'grid',
        margin: { left: 10, right: 10, bottom: 20 },
        styles: {
          font: 'helvetica',
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          minCellHeight: rowHeightMm,
          cellPadding: { top: verticalPad, bottom: verticalPad, left: horizontalPad, right: horizontalPad },
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: currentTheme.rgbHeader,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: horizontalPad, right: horizontalPad },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: colStyles,
        didDrawPage: (data: any) => {
          // Bottom Page Footer
          const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, pageWidth - 12, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
          doc.text('Sri Venkateswara JY High School • Confidential Student Record', 12, doc.internal.pageSize.getHeight() - 8);
        }
      });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`JY_School_Students_Report_${dateStr}.pdf`);
      toast.success('PDF report downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF: ' + err.message, { id: toastId });
    }
  };

  // Excel Export
  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing Excel spreadsheet...');
    try {
      const XLSX = await import('xlsx');
      const headerRow: string[] = activeColumns.map(c => c.label);
      const dataRows = filteredStudents.map((s, idx) => {
        return activeColumns.map(c => c.getValue(s, idx));
      });

      const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
      
      // Set precise row height in Excel points (1 mm ≈ 2.83465 pt)
      const excelRowHeightPt = Math.max(18, rowHeightMm * 2.83465);
      worksheet['!rows'] = [
        { hpt: 26 }, // Header row height
        ...dataRows.map(() => ({ hpt: excelRowHeightPt }))
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Report');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `JY_School_Students_${dateStr}.xlsx`);
      toast.success('Excel downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to export Excel: ' + err.message, { id: toastId });
    }
  };

  // Vibrant Category definitions with distinct colorful gradients
  const categories = [
    { 
      id: 'basic', 
      title: 'Basic & Identity', 
      telugu: 'Primary Demographics & Identifiers', 
      icon: Users, 
      gradient: 'from-blue-600 via-indigo-600 to-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      borderHover: 'hover:border-blue-400',
      cardBg: 'bg-blue-50/30'
    },
    { 
      id: 'govt', 
      title: 'Government & UDISE+', 
      telugu: 'Official Portal IDs & Registry', 
      icon: Building, 
      gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      borderHover: 'hover:border-emerald-400',
      cardBg: 'bg-emerald-50/30'
    },
    { 
      id: 'academic', 
      title: 'Academic & Institutional', 
      telugu: 'Grade, Section & Enrollment Info', 
      icon: GraduationCap, 
      gradient: 'from-indigo-600 via-purple-600 to-indigo-700',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      borderHover: 'hover:border-indigo-400',
      cardBg: 'bg-indigo-50/30'
    },
    { 
      id: 'family', 
      title: 'Parents & Family', 
      telugu: 'Parent Names & Mobile Numbers', 
      icon: HeartPulse, 
      gradient: 'from-amber-500 via-orange-600 to-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800',
      borderHover: 'hover:border-amber-400',
      cardBg: 'bg-amber-50/30'
    },
    { 
      id: 'address', 
      title: 'Address & Residence', 
      telugu: 'Residential Address & Village', 
      icon: MapPin, 
      gradient: 'from-rose-500 via-pink-600 to-rose-600',
      badgeBg: 'bg-rose-100 text-rose-800',
      borderHover: 'hover:border-rose-400',
      cardBg: 'bg-rose-50/30'
    },
    { 
      id: 'custom', 
      title: 'Signatures & Physical Boxes', 
      telugu: 'Physical Handwriting & Sign Boxes', 
      icon: SlidersHorizontal, 
      gradient: 'from-purple-600 via-fuchsia-600 to-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800',
      borderHover: 'hover:border-purple-400',
      cardBg: 'bg-purple-50/30'
    },
  ];

  // Cell padding classes
  const paddingXClass = 
    cellPadding === 'compact' ? 'px-2' : 
    cellPadding === 'relaxed' ? 'px-4' : 'px-3';

  // Font size classes for table cells
  const fontSizeClass = 
    fontSize === 'sm' ? 'text-[10px]' : 
    fontSize === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] text-slate-800 font-sans print:bg-white print:p-0 print:m-0">
      
      {/* Dynamic Print CSS to enforce exact row height in printing */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm 6mm 8mm 6mm;
          }
          .custom-print-row {
            height: ${rowHeightMm}mm !important;
            min-height: ${rowHeightMm}mm !important;
          }
        }
      `}</style>

      {/* ============================================================ */}
      {/* ── 1. ULTRA-PREMIUM COLORFUL HERO TOP BANNER (HIDDEN IN PRINT) ── */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white p-4 sm:p-6 shadow-xl border-b border-indigo-950 print:hidden">
        
        {/* Glow ambient lights */}
        <div className="absolute -top-10 right-1/4 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 top-0 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Navigation */}
          <div className="flex items-center gap-3.5">
            <Link
              to="/students"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10 shadow-sm"
              title="Back to Students List"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Custom Student Report & Print Studio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-sm uppercase tracking-wider">
                    PRO STUDIO
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/90 font-medium mt-0.5">
                Customize student columns • Adjust row height, spacing & theme colors for clean printing
              </p>
            </div>
          </div>

          {/* Master Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* ── MAIN CONTENT WORKSPACE ──                                 */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 space-y-5 print:p-0 print:m-0 print:max-w-none">
        
        {/* ── SECTION A: PRESETS & LIVE FILTER BAR (HIDDEN IN PRINT) ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3.5 print:hidden">
          
          {/* Row 1: Filters & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            <div className="flex items-center gap-2.5 flex-wrap">
              
              {/* Class Dropdown */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl px-3.5 py-2 shadow-2xs">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-black text-indigo-900 uppercase">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="">All Classes ({students.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Gender Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                {(['all', 'male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                      genderFilter === g
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g === 'all' ? 'All Genders' : g === 'male' ? 'Boys Only' : 'Girls Only'}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                      statusFilter === s
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

            </div>

            {/* Search & Active Stats */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search student, roll, phone, aadhar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xs font-black shadow-sm shrink-0">
                <span>{filteredStudents.length} Students</span>
                <span>•</span>
                <span>{activeColumns.length} Columns</span>
              </div>
            </div>

          </div>

          {/* Row 2: 1-Click Saved & Built-in Presets */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets:
            </span>
            {BUILT_IN_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <span>{preset.icon}</span>
                <span>{preset.name.replace(/^[^\s]+\s*/, '')}</span>
              </button>
            ))}
            {savedPresets.map(preset => (
              <div key={preset.id} className="relative group shrink-0">
                <button
                  onClick={() => applyPreset(preset)}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>⭐</span>
                  <span>{preset.name}</span>
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id, preset.name)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete Template"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Current Setup</span>
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ── SECTION B: DEDICATED ROW HEIGHT, SPACING & COLOR CONTROLS ── */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4 print:hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Row Height, Spacing & Layout Studio
                </h3>
                <p className="text-[11px] text-slate-500">
                  Fine-tune row height in millimeters • Customize table padding, fonts & theme colors
                </p>
              </div>
            </div>

            {/* Quick Status Tag */}
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-700">
              Current: {rowHeightMm} mm Height • {orientation.toUpperCase()}
            </span>
          </div>

          {/* 4 Interactive Control Clusters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Control 1: Row Height (Quick presets + Stepper) */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Row Height</span>
                </span>
                <span className="text-xs font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                  {rowHeightMm} mm
                </span>
              </div>

              {/* Quick Pills */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { mm: 6, label: '6mm', title: 'Compact' },
                  { mm: 9, label: '9mm', title: 'Normal' },
                  { mm: 13, label: '13mm', title: 'Spacious' },
                  { mm: 18, label: '18mm', title: 'Signature' },
                ].map(item => (
                  <button
                    key={item.mm}
                    onClick={() => setRowHeightMm(item.mm)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rowHeightMm === item.mm
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                    }`}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Live Increment / Decrement Stepper */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setRowHeightMm(prev => Math.max(5, prev - 1))}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-colors cursor-pointer"
                  title="Decrease row height"
                >
                  - 1mm
                </button>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={rowHeightMm}
                  onChange={(e) => setRowHeightMm(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <button
                  onClick={() => setRowHeightMm(prev => Math.min(30, prev + 1))}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-colors cursor-pointer"
                  title="Increase row height"
                >
                  + 1mm
                </button>
              </div>
            </div>

            {/* Control 2: Cell Spacing & Padding */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Cell Spacing / Padding</span>
              </span>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { id: 'compact', label: 'Tight', desc: 'Compact' },
                  { id: 'normal', label: 'Balanced', desc: 'Standard' },
                  { id: 'relaxed', label: 'Wide', desc: 'Spacious' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setCellPadding(p.id as any)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      cellPadding === p.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="block font-black">{p.label}</span>
                    <span className={`block text-[10px] ${cellPadding === p.id ? 'text-blue-100' : 'text-slate-400'}`}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Page Orientation & Font Size */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Orientation & Font</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Orientation Buttons */}
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`p-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>

                <button
                  onClick={() => setOrientation('landscape')}
                  className={`p-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="rotate-90">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span>Landscape</span>
                </button>
              </div>

              {/* Font Size Pills */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[
                  { id: 'sm', label: 'Small (A-)' },
                  { id: 'base', label: 'Medium (A)' },
                  { id: 'lg', label: 'Large (A+)' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id as any)}
                    className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      fontSize === f.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 4: Table Color Themes */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-fuchsia-600" />
                <span>Table Color Theme</span>
              </span>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {Object.values(THEME_STYLES).map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setTableTheme(theme.id as any)}
                    className={`h-9 rounded-xl flex items-center justify-center text-white transition-all transform hover:scale-105 cursor-pointer shadow-xs ${
                      theme.headerBg
                    } ${tableTheme === theme.id ? 'ring-2 ring-indigo-500 ring-offset-2' : 'opacity-85'}`}
                    title={theme.name}
                  >
                    {tableTheme === theme.id ? <Check className="w-4 h-4 text-white" /> : null}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 font-medium text-center">
                Selected: <strong className="text-slate-800">{currentTheme.name}</strong>
              </p>
            </div>

          </div>

          {/* Heading Edit Box */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-xs font-black text-slate-700 whitespace-nowrap">
              Report Title:
            </span>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter Custom Report Heading..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-950 uppercase tracking-wide focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* ── SECTION C: COLORFUL CHECKBOX SELECTION CARDS ──           */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden print:hidden">
          
          {/* Collapsible Header */}
          <div 
            onClick={() => setShowColumnsSelector(!showColumnsSelector)}
            className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                  <span>Select Columns & Student Details</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/30">
                    {activeColumns.length} Selected
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Choose columns to include • Changes reflect instantly in live preview below
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 hidden sm:inline">
                {showColumnsSelector ? 'Collapse Options' : 'Expand Options'}
              </span>
              <div className="p-1.5 rounded-lg bg-white/10">
                {showColumnsSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Expanded Columns Grid */}
          {showColumnsSelector && (
            <div className="p-5 space-y-5 animate-fade-in">
              
              {/* Quick Actions (Select All / Minimal) */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-500">
                  Select Columns to display on report:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedColIds(MASTER_COLUMNS.map(c => c.id))}
                    className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Select All ({MASTER_COLUMNS.length})
                  </button>
                  <button
                    onClick={() => setSelectedColIds(['sno', 'rollNo', 'name', 'className'])}
                    className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset to Minimal (4)
                  </button>
                </div>
              </div>

              {/* 6 Category Cards with Distinct Colorful Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const catCols = MASTER_COLUMNS.filter(c => c.category === cat.id);
                  const isAllSelected = catCols.length > 0 && catCols.every(c => selectedColIds.includes(c.id));
                  const selectedInCat = catCols.filter(c => selectedColIds.includes(c.id)).length;

                  return (
                    <div
                      key={cat.id}
                      className={`rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${cat.cardBg}`}
                    >
                      {/* Colorful Category Header */}
                      <div className={`p-3.5 bg-gradient-to-r ${cat.gradient} text-white flex items-center justify-between`}>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs tracking-wide">{cat.title}</h4>
                            <p className="text-[10px] text-white/80">{cat.telugu}</p>
                          </div>
                        </div>

                        {cat.id !== 'custom' && (
                          <button
                            type="button"
                            onClick={() => selectAllCategory(cat.id)}
                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                          >
                            {isAllSelected ? 'Deselect' : 'Select All'}
                          </button>
                        )}
                      </div>

                      {/* Checkbox Options Grid */}
                      <div className="p-3.5 space-y-2 flex-1">
                        <div className="space-y-1.5">
                          {catCols.map((col) => {
                            const isChecked = selectedColIds.includes(col.id);
                            return (
                              <label
                                key={col.id}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                                  isChecked
                                    ? 'bg-white border-indigo-400 text-slate-900 shadow-2xs ring-1 ring-indigo-400/20'
                                    : 'bg-white/60 border-slate-200/80 text-slate-600 hover:bg-white hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate pr-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleColumn(col.id)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                                  />
                                  <div className="truncate">
                                    <span className="block truncate text-slate-900">{col.label}</span>
                                    <span className="block text-[10px] text-slate-400 truncate">{col.teluguLabel}</span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isChecked ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {col.widthPt}pt
                                </span>
                              </label>
                            );
                          })}

                          {/* Extra Custom Blank Columns Added by User */}
                          {cat.id === 'custom' && customBlankCols.map(col => (
                            <div
                              key={col.id}
                              className="flex items-center justify-between p-2 rounded-xl text-xs font-bold bg-white border border-purple-400 text-purple-950 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="truncate">{col.label} (Custom Box)</span>
                              </div>
                              <button
                                onClick={() => handleRemoveCustomColumn(col.id)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-100 cursor-pointer"
                                title="Remove column"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add new custom blank column button in custom category */}
                      {cat.id === 'custom' && (
                        <form onSubmit={handleAddCustomColumn} className="p-3 bg-white border-t border-purple-100 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add Custom Box (e.g. Marks, Kit)..."
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl flex-1 focus:outline-none focus:border-purple-500 font-medium"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-xs"
                          >
                            + Add
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* ── SECTION D: LIVE A4 SHEET PREVIEW & EXACT PRINT SHEET ──   */}
        {/* ============================================================ */}
        <div className="space-y-3">
          
          <div className="flex items-center justify-between px-1 print:hidden">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Live A4 Print Preview
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span>{orientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait'}</span>
              <span>•</span>
              <span className="text-indigo-600 font-extrabold">{rowHeightMm} mm Row Height</span>
              <span>•</span>
              <span className="text-slate-700">{activeColumns.length} Columns</span>
            </div>
          </div>

          {/* The Actual Printable Sheet Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 overflow-x-auto print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
            
            {/* School Official Print Header */}
            <div className="pb-4 mb-4 border-b-2 border-slate-900 text-center space-y-1">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="JY School Logo" 
                  className="w-12 h-12 object-contain hidden sm:block print:block" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide uppercase">
                    SRI VENKATESWARA JY HIGH SCHOOL
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist. • Contact: 9441104648
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm sm:text-base font-black text-indigo-900 tracking-wider uppercase inline-block border-b-2 border-indigo-600 pb-0.5">
                  {reportTitle}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-2 px-1">
                <span>Class: <strong className="text-slate-900">{selectedClassId ? classes.find(c => c.id === selectedClassId)?.name || 'Class' : 'All Classes'}</strong></span>
                <span>Gender: <strong className="text-slate-900 capitalize">{genderFilter}</strong></span>
                <span>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                <span>Total Students: <strong className="text-indigo-900 font-black">{filteredStudents.length}</strong></span>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading student records...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No students match the chosen filters</h4>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or selecting another class.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left border border-slate-300">
                <thead>
                  <tr className={`${currentTheme.headerBg} border border-slate-300 print:text-white`}>
                    {activeColumns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`${paddingXClass} py-2 font-black border border-slate-300 text-white ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${fontSizeClass}`}
                        style={{ width: `${col.widthPt * 3}px` }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, rowIdx) => {
                    const rowClass = rowIdx % 2 === 0 ? 'bg-white' : `${currentTheme.rowAlt} print:bg-slate-50/50`;
                    
                    return (
                      <tr 
                        key={student.id || rowIdx} 
                        className={`custom-print-row ${rowClass} ${currentTheme.hover} border-b border-slate-200 transition-colors`}
                        style={{ height: `${rowHeightMm * 3.78}px`, minHeight: `${rowHeightMm * 3.78}px` }}
                      >
                        {activeColumns.map((col, colIdx) => {
                          const val = col.getValue(student, rowIdx);

                          // Photo special render
                          if (col.id === 'photo') {
                            const photoUrl = getPhotoUrl(student.user?.photoUrl);
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${paddingXClass} text-center`}>
                                <div className="w-8 h-9 rounded bg-slate-200 mx-auto overflow-hidden flex items-center justify-center border border-slate-300 shadow-2xs">
                                  {photoUrl ? (
                                    <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[8px] font-bold text-slate-500">N/A</span>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          // Gender Badge
                          if (col.id === 'gender') {
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${paddingXClass} text-center ${fontSizeClass}`}>
                                {val === 'Boy' ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100/90 text-blue-800 print:bg-transparent print:text-slate-900">
                                    Boy
                                  </span>
                                ) : val === 'Girl' ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-pink-100/90 text-pink-800 print:bg-transparent print:text-slate-900">
                                    Girl
                                  </span>
                                ) : (
                                  val
                                )}
                              </td>
                            );
                          }

                          // Blood Group Badge
                          if (col.id === 'bloodGroup') {
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${paddingXClass} text-center ${fontSizeClass}`}>
                                {val !== '-' ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded font-black text-rose-700 bg-rose-50 border border-rose-200/80 print:border-none print:bg-transparent print:text-slate-900">
                                    {val}
                                  </span>
                                ) : '-'}
                              </td>
                            );
                          }

                          // Attendance Box check
                          if (col.id === 'attendanceBox') {
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${paddingXClass} text-center`}>
                                <div className="w-5 h-5 mx-auto border-2 border-slate-400 rounded-md bg-white print:border-slate-800" />
                              </td>
                            );
                          }

                          // Signatures or blank boxes
                          if (col.id === 'parentSignature' || col.id === 'studentSignature') {
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${paddingXClass} text-center`}>
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-[10px] text-slate-300 font-mono tracking-widest hidden print:inline">
                                    . . . . . . . . . .
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={colIdx}
                              className={`border border-slate-300 font-medium ${paddingXClass} ${fontSizeClass} ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              } ${col.id === 'rollNo' || col.id === 'sno' ? 'font-mono font-bold text-slate-900' : 'text-slate-800'}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Print Official Footer (Signature row) */}
            <div className="pt-12 mt-8 flex items-center justify-between text-xs font-bold text-slate-800 border-t border-slate-300">
              <div className="text-center">
                <div className="w-36 border-b border-slate-800 mb-1 mx-auto" />
                <p>Class Teacher Signature</p>
                <p className="text-[10px] text-slate-400 font-normal">Authorized Class Teacher</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 border border-dashed border-slate-300 rounded-full mx-auto flex items-center justify-center text-[10px] text-slate-400 font-medium mb-1">
                  School Seal
                </div>
              </div>

              <div className="text-center">
                <div className="w-36 border-b border-slate-800 mb-1 mx-auto" />
                <p>Headmaster / Principal</p>
                <p className="text-[10px] text-slate-400 font-normal">Sri Venkateswara JY High School</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Save Current Template
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Save these columns, row height ({rowHeightMm}mm), and theme settings as a 1-click template for future reports.
            </p>
            <form onSubmit={handleSavePreset} className="space-y-4">
              <input
                type="text"
                placeholder="Template Name (e.g. Monthly Attendance Sheet)..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentReportPrintPage;
