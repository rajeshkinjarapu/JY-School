import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';
import { useAcademicYear } from '../../contexts/AcademicYearContext';
import toast from 'react-hot-toast';
import {
  Printer, FileText, FileSpreadsheet,
  ArrowLeft, CheckSquare, RotateCcw, SlidersHorizontal,
  Sparkles, Plus, Trash2, Save, Search, Building,
  AlertCircle, Users, GraduationCap, Eye, HeartPulse,
  MapPin, Check, Maximize2, Palette, ZoomIn, ZoomOut,
  Sliders, Menu, Columns3, LayoutTemplate, Filter as FilterIcon
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
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const printContainerRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { selectedYear } = useAcademicYear();

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Studio UI navigation states (Zero confusion 3-tab control panel + Live A4 Paper)
  const [studioTab, setStudioTab] = useState<'filter' | 'columns' | 'layout'>('filter');
  const [mobilePane, setMobilePane] = useState<'controls' | 'preview'>('preview');
  const [columnSearch, setColumnSearch] = useState('');
  const [previewZoom, setPreviewZoom] = useState<number>(0.78);
  const [autoFitZoom, setAutoFitZoom] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string>('preset_general');
  const [customColWeights, setCustomColWeights] = useState<Record<string, number>>({});
  const [activeResizeColId, setActiveResizeColId] = useState<string | null>(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Row height & spacing controls
  const [rowHeightMm, setRowHeightMm] = useState<number>(9);
  const [cellPadding, setCellPadding] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [reportTitle, setReportTitle] = useState('STUDENT LIST & CONTACT DIRECTORY');
  const [tableTheme, setTableTheme] = useState<'navy' | 'purple' | 'emerald' | 'crimson' | 'charcoal'>('navy');

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
    // Basic & Identity
    { id: 'sno', label: 'S.No', teluguLabel: 'Serial Number', category: 'basic', defaultSelected: true, widthPt: 13, align: 'center', getValue: (_, idx) => String(idx + 1) },
    { id: 'photo', label: 'Photo', teluguLabel: 'Passport Photo', category: 'basic', defaultSelected: false, widthPt: 22, align: 'center', getValue: (s) => s.user?.photoUrl || '' },
    { id: 'rollNo', label: 'Student ID', teluguLabel: 'Roll No / ID', category: 'basic', defaultSelected: true, widthPt: 27, align: 'center', getValue: (s) => s.rollNo || s.studentId || '-' },
    { id: 'admissionNo', label: 'Admission No', teluguLabel: 'Admission Number', category: 'basic', defaultSelected: false, widthPt: 26, align: 'center', getValue: (s) => s.admissionNo || s.rollNo || '-' },
    { id: 'name', label: 'Student Name', teluguLabel: 'Full Student Name', category: 'basic', defaultSelected: true, widthPt: 48, align: 'left', getValue: (s) => s.user?.name || s.name || '-' },
    { id: 'gender', label: 'Gender', teluguLabel: 'Boy / Girl', category: 'basic', defaultSelected: true, widthPt: 18, align: 'center', getValue: (s) => s.gender ? (s.gender.toLowerCase() === 'female' ? 'Girl' : 'Boy') : '-' },
    { id: 'dob', label: 'Date of Birth', teluguLabel: 'Birth Date (DD/MM/YYYY)', category: 'basic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.dob ? new Date(s.dob).toLocaleDateString('en-GB') : '-' },
    { id: 'age', label: 'Age', teluguLabel: 'Calculated Age', category: 'basic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => calculateAge(s.dob) },
    { id: 'bloodGroup', label: 'Blood Group', teluguLabel: 'Blood Type', category: 'basic', defaultSelected: false, widthPt: 20, align: 'center', getValue: (s) => s.bloodGroup || '-' },
    { id: 'aadharNo', label: 'Student Aadhaar', teluguLabel: '12-Digit Aadhaar No', category: 'basic', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.aadharNo) },

    // Government Registrations
    { id: 'penNumber', label: 'PEN Number (UDISE+)', teluguLabel: 'National UDISE+ PEN', category: 'govt', defaultSelected: false, widthPt: 34, align: 'center', getValue: (s) => s.penNumber || '-' },
    { id: 'childId', label: 'Child ID (State)', teluguLabel: 'State Portal Child ID', category: 'govt', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.childId || '-' },
    { id: 'apaarId', label: 'APAAR ID (One Nation)', teluguLabel: 'One Nation One ID', category: 'govt', defaultSelected: false, widthPt: 32, align: 'center', getValue: (s) => s.apaarId || '-' },

    // Academic & Institutional
    { id: 'className', label: 'Class & Section', teluguLabel: 'Grade & Section', category: 'academic', defaultSelected: true, widthPt: 30, align: 'center', getValue: (s) => s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '-' },
    { id: 'academicYear', label: 'Academic Year', teluguLabel: 'Session Year', category: 'academic', defaultSelected: false, widthPt: 24, align: 'center', getValue: (s) => s.class?.academicYear || selectedYear || '2026-2027' },
    { id: 'admissionDate', label: 'Admission Date', teluguLabel: 'Date of Joining', category: 'academic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : '-' },
    { id: 'medium', label: 'Medium', teluguLabel: 'Medium of Instruction', category: 'academic', defaultSelected: false, widthPt: 20, align: 'center', getValue: () => 'English' },
    { id: 'status', label: 'Status', teluguLabel: 'Active / Inactive', category: 'academic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => s.user?.isActive !== false ? 'Active' : 'Inactive' },

    // Parents & Family
    { id: 'fatherName', label: 'Father Name', teluguLabel: "Father's Full Name", category: 'family', defaultSelected: true, widthPt: 44, align: 'left', getValue: (s) => s.fatherName || '-' },
    { id: 'fatherPhone', label: "Father's Phone", teluguLabel: "Father's Mobile No", category: 'family', defaultSelected: true, widthPt: 30, align: 'center', getValue: (s) => s.fatherPhone || s.user?.phone || '-' },
    { id: 'fatherAadhar', label: "Father's Aadhaar", teluguLabel: "Father's Aadhaar No", category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.fatherAadhar) },
    { id: 'motherName', label: 'Mother Name', teluguLabel: "Mother's Full Name", category: 'family', defaultSelected: false, widthPt: 38, align: 'left', getValue: (s) => s.motherName || '-' },
    { id: 'motherPhone', label: "Mother's Phone", teluguLabel: "Mother's Mobile No", category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.motherPhone || '-' },
    { id: 'motherAadhar', label: "Mother's Aadhaar", teluguLabel: "Mother's Aadhaar No", category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.motherAadhar) },
    { id: 'guardianName', label: 'Guardian Name', teluguLabel: "Guardian's Full Name", category: 'family', defaultSelected: false, widthPt: 35, align: 'left', getValue: (s) => s.guardianName || '-' },
    { id: 'guardianPhone', label: 'Guardian Phone', teluguLabel: "Guardian's Contact No", category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.guardianPhone || '-' },

    // Address
    { id: 'address', label: 'Residential Address', teluguLabel: 'Full Address / Village', category: 'address', defaultSelected: false, widthPt: 55, align: 'left', getValue: (s) => s.address || '-' },

    // Physical Blank Columns for Writing / Signatures
    { id: 'parentSignature', label: 'Parent Signature', teluguLabel: 'Parent Sign Box', category: 'custom', defaultSelected: false, widthPt: 45, align: 'center', getValue: () => '' },
    { id: 'studentSignature', label: 'Student Signature', teluguLabel: 'Student Sign Box', category: 'custom', defaultSelected: false, widthPt: 40, align: 'center', getValue: () => '' },
    { id: 'remarks', label: 'Remarks / Feedback', teluguLabel: 'Teacher Notes / Remarks', category: 'custom', defaultSelected: false, widthPt: 45, align: 'left', getValue: () => '' },
    { id: 'attendanceBox', label: 'Attendance Check', teluguLabel: 'Check Box [ ]', category: 'custom', defaultSelected: false, widthPt: 22, align: 'center', getValue: () => '' },
    { id: 'feeAmount', label: 'Amount Paid (₹)', teluguLabel: 'Paid Fee Amount (₹)', category: 'custom', defaultSelected: false, widthPt: 30, align: 'center', getValue: () => '' },
    { id: 'receiptNo', label: 'Receipt No', teluguLabel: 'Fee Receipt Number', category: 'custom', defaultSelected: false, widthPt: 28, align: 'center', getValue: () => '' },
  ], [selectedYear]);

  // Selected column IDs set
  const [selectedColIds, setSelectedColIds] = useState<string[]>(() => {
    return MASTER_COLUMNS.filter(c => c.defaultSelected).map(c => c.id);
  });

  // Presets list
  const BUILT_IN_PRESETS: PresetTemplate[] = useMemo(() => [
    {
      id: 'preset_general',
      name: 'General Student List',
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
      name: 'UDISE+ & Govt Identifiers',
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
      name: 'Parent Signature & PTM Sheet',
      icon: '✍️',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'PARENT SIGNATURE & ACKNOWLEDGEMENT SHEET',
      rowHeightMm: 18,
      cellPadding: 'relaxed',
      fontSize: 'base',
      tableTheme: 'purple',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'parentSignature', 'remarks'],
    },
    {
      id: 'preset_bus_attendance',
      name: 'Bus Transport Attendance',
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
      name: 'Fee Verification & Collection',
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
      name: 'Student Health & Blood Group',
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
      name: 'Address & Family Directory',
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
      name: 'All Columns Master Directory',
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

  // Auto-calculate A4 paper zoom to fit preview panel cleanly without horizontal scrolling
  const pagePixelWidth = orientation === 'landscape' ? 1123 : 794; // 297mm / 210mm @ 96dpi

  useEffect(() => {
    if (!autoFitZoom) return;
    const recalcZoom = () => {
      if (!previewWrapRef.current) return;
      const availableW = previewWrapRef.current.clientWidth - 40;
      if (availableW > 180) {
        const fitted = Math.min(1, Math.max(0.32, availableW / pagePixelWidth));
        setPreviewZoom(Number(fitted.toFixed(2)));
      }
    };
    recalcZoom();
    window.addEventListener('resize', recalcZoom);
    return () => window.removeEventListener('resize', recalcZoom);
  }, [autoFitZoom, pagePixelWidth, mobilePane]);

  // Fetch initial classes and all students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clsRes, stuRes]: any = await Promise.all([
          api.get('/api/classes', { params: { academicYear: selectedYear, limit: 100 } }),
          api.get('/api/students', { params: { academicYear: selectedYear, limit: 10000, page: 1 } })
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
  }, [selectedYear]);

  // Helper for class rank (Nursery -> 10th)
  const getClassRank = (name: string = ''): number => {
    if (!name) return 999;
    const lower = name.toLowerCase().trim();
    if (lower.includes('nursery') || lower.includes('nursary') || lower.includes('nur') || lower.includes('pre-kg') || lower.includes('playgroup')) return 1;
    if (lower.includes('pp1') || lower.includes('pp-1') || lower.includes('lkg') || lower.includes('l.k.g') || lower.includes('pre-primary 1')) return 2;
    if (lower.includes('pp2') || lower.includes('pp-2') || lower.includes('ukg') || lower.includes('u.k.g') || lower.includes('pre-primary 2')) return 3;
    const match = lower.match(/(\d+)/);
    if (match) return 10 + parseInt(match[1], 10);
    return 999;
  };

  // Sorted classes list
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const rankDiff = getClassRank(a.name) - getClassRank(b.name);
      if (rankDiff !== 0) return rankDiff;
      return (a.section || '').localeCompare(b.section || '', undefined, { numeric: true });
    });
  }, [classes]);

  // Filter & sort students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (selectedClassId) {
      result = result.filter(s => s.classId === selectedClassId || s.class?.id === selectedClassId);
    }
    if (genderFilter === 'male') {
      result = result.filter(s => s.gender?.toLowerCase() === 'male');
    } else if (genderFilter === 'female') {
      result = result.filter(s => s.gender?.toLowerCase() === 'female');
    }
    if (statusFilter === 'active') {
      result = result.filter(s => s.user?.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(s => s.user?.isActive === false);
    }
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

    return result.sort((a, b) => {
      const classA = a.class || {};
      const classB = b.class || {};
      const classNameA = classA.name || a.className || '';
      const classNameB = classB.name || b.className || '';

      const rankA = getClassRank(classNameA);
      const rankB = getClassRank(classNameB);
      if (rankA !== rankB) return rankA - rankB;

      const secA = classA.section || (classNameA.includes('-') ? classNameA.split('-')[1]?.trim() : '') || '';
      const secB = classB.section || (classNameB.includes('-') ? classNameB.split('-')[1]?.trim() : '') || '';
      const secComp = secA.localeCompare(secB, undefined, { numeric: true, sensitivity: 'base' });
      if (secComp !== 0) return secComp;

      const nameA = (a.user?.name || a.name || '').trim();
      const nameB = (b.user?.name || b.name || '').trim();
      const nameComp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      if (nameComp !== 0) return nameComp;

      return (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true });
    });
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

  // Resolved normalized percentage widths per active column (always sums to 100%)
  const resolvedWidthsPct = useMemo(() => {
    const raw = activeColumns.map(c => ({
      id: c.id,
      w: customColWeights[c.id] ?? c.widthPt,
    }));
    const totalW = raw.reduce((sum, item) => sum + item.w, 0) || 1;
    const map: Record<string, number> = {};
    raw.forEach(item => {
      map[item.id] = (item.w / totalW) * 100;
    });
    return map;
  }, [activeColumns, customColWeights]);

  // Interactive column boundary drag-to-resize (Print Preview Margin Splitter UX)
  const startColumnResize = (
    e: React.MouseEvent | React.TouchEvent,
    colIdx: number
  ) => {
    if (colIdx < 0 || colIdx >= activeColumns.length - 1) return;
    e.preventDefault();
    e.stopPropagation();

    const startClientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const tableWidthScreenPx = tableRef.current?.getBoundingClientRect().width || (pagePixelWidth - 48);
    const snapshotPcts: Record<string, number> = { ...resolvedWidthsPct };
    const leftId = activeColumns[colIdx].id;
    const rightId = activeColumns[colIdx + 1].id;
    const leftStartPct = snapshotPcts[leftId] ?? 10;
    const rightStartPct = snapshotPcts[rightId] ?? 10;
    const pairTotal = leftStartPct + rightStartPct;
    const minPct = Math.min(4.2, pairTotal * 0.25);

    setActiveResizeColId(leftId);

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaPct = ((currX - startClientX) / tableWidthScreenPx) * 100;
      const newLeft = Math.max(minPct, Math.min(pairTotal - minPct, leftStartPct + deltaPct));
      const newRight = pairTotal - newLeft;

      setCustomColWeights({
        ...snapshotPcts,
        [leftId]: newLeft,
        [rightId]: newRight,
      });
    };

    const onEnd = () => {
      setActiveResizeColId(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const resetColumnWidths = () => {
    setCustomColWeights({});
    toast.success('Column widths reset to default');
  };

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

  const selectAllCategory = (category: string) => {
    const catCols = MASTER_COLUMNS.filter(c => c.category === category).map(c => c.id);
    const allSelected = catCols.every(id => selectedColIds.includes(id));
    if (allSelected) {
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

  const applyPreset = (preset: PresetTemplate) => {
    setActivePresetId(preset.id);
    setOrientation(preset.orientation);
    setReportTitle(preset.customHeading);
    setRowHeightMm(preset.rowHeightMm || 9);
    setCellPadding(preset.cellPadding || 'normal');
    setFontSize(preset.fontSize || 'base');
    setTableTheme(preset.tableTheme || 'navy');
    setSelectedColIds(preset.selectedColumns.filter(id => MASTER_COLUMNS.some(c => c.id === id)));
    setCustomBlankCols(preset.customBlankColumns || []);
    toast.success(`Template applied: ${preset.name}`, { icon: '✨' });
  };

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
    setActivePresetId(newPreset.id);
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

  // Vibrant light-friendly theme swatches (no black/slate-900 classes)
  const THEME_STYLES = {
    navy: {
      id: 'navy',
      name: 'Royal Blue',
      headerBg: 'bg-gradient-to-r from-[#0E2666] via-[#173B99] to-[#1E40AF] text-white',
      headerHex: '#1E3A8A',
      rowAlt: 'bg-blue-50/40',
      hover: 'hover:bg-blue-50/70',
      rgbHeader: [30, 58, 138],
    },
    purple: {
      id: 'purple',
      name: 'Royal Purple',
      headerBg: 'bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] text-white',
      headerHex: '#5B21B6',
      rowAlt: 'bg-purple-50/40',
      hover: 'hover:bg-purple-50/70',
      rgbHeader: [91, 33, 182],
    },
    emerald: {
      id: 'emerald',
      name: 'Emerald Teal',
      headerBg: 'bg-gradient-to-r from-[#065F46] via-[#047857] to-[#0D9488] text-white',
      headerHex: '#047857',
      rowAlt: 'bg-emerald-50/40',
      hover: 'hover:bg-emerald-50/70',
      rgbHeader: [4, 120, 87],
    },
    crimson: {
      id: 'crimson',
      name: 'Crimson Rose',
      headerBg: 'bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] text-white',
      headerHex: '#BE123C',
      rowAlt: 'bg-rose-50/40',
      hover: 'hover:bg-rose-50/70',
      rgbHeader: [190, 18, 60],
    },
    charcoal: {
      id: 'charcoal',
      name: 'Indigo Slate',
      headerBg: 'bg-gradient-to-r from-[#334155] via-[#475569] to-[#3B4B63] text-white',
      headerHex: '#334155',
      rowAlt: 'bg-slate-50/70',
      hover: 'hover:bg-slate-100/70',
      rgbHeader: [51, 65, 85],
    },
  };

  const currentTheme = THEME_STYLES[tableTheme] || THEME_STYLES.navy;

  const selectedClassLabel = useMemo(() => {
    if (!selectedClassId) return 'All Classes';
    const cls = classes.find(c => c.id === selectedClassId);
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Selected Class';
  }, [selectedClassId, classes]);

  // Direct Browser Print (isolated iframe)
  const handlePrint = () => {
    if (!printContainerRef.current) {
      window.print();
      return;
    }

    const toastId = toast.loading('Opening print dialog...');
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      toast.dismiss(toastId);
      window.print();
      return;
    }

    const contentHtml = printContainerRef.current.innerHTML;
    const headerRgb = currentTheme.rgbHeader.join(', ');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @page {
              size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
              margin: 7mm 6mm;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              margin-top: 4px !important;
            }
            .no-print-handle {
              display: none !important;
            }
            thead {
              display: table-header-group !important;
            }
            tbody {
              display: table-row-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .custom-print-row {
              height: ${rowHeightMm}mm !important;
              min-height: ${rowHeightMm}mm !important;
            }
            th {
              background-color: rgb(${headerRgb}) !important;
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              border: 1px solid #334155 !important;
              font-weight: 900 !important;
              font-size: ${fontSize === 'sm' ? '8pt' : fontSize === 'lg' ? '10pt' : '9pt'} !important;
              text-transform: uppercase !important;
              letter-spacing: 0.3px !important;
              padding: 6px 6px !important;
              white-space: nowrap !important;
            }
            th * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              font-weight: 900 !important;
              white-space: nowrap !important;
            }
            td {
              border: 1px solid #cbd5e1 !important;
              color: #0f172a !important;
              font-size: ${fontSize === 'sm' ? '7.5pt' : fontSize === 'lg' ? '9.5pt' : '8.5pt'} !important;
              padding: ${cellPadding === 'compact' ? '2px 4px' : cellPadding === 'relaxed' ? '6px 8px' : '4px 5px'} !important;
              vertical-align: middle !important;
            }
            td.nowrap-cell {
              white-space: nowrap !important;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; padding: 0;">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();
    toast.dismiss(toastId);

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  // PDF Export
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

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist. • Contact: 9441104648', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(currentTheme.rgbHeader[0], currentTheme.rgbHeader[1], currentTheme.rgbHeader[2]);
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(12, 28, pageWidth - 12, 28);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`Class: ${selectedClassLabel}  |  Gender: ${genderFilter.toUpperCase()}  |  Total Students: ${filteredStudents.length}`, 12, 33);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 12, 33, { align: 'right' });

      const headers = activeColumns.map(c => c.label);
      const colStyles: any = {};
      const usablePdfWidthMm = pageWidth - 20;
      activeColumns.forEach((c, idx) => {
        const pct = resolvedWidthsPct[c.id] ?? 10;
        colStyles[idx] = {
          halign: c.align || 'left',
          cellWidth: Number(((pct / 100) * usablePdfWidthMm).toFixed(2)),
          fontSize: fontSize === 'sm' ? 7.5 : fontSize === 'lg' ? 9.5 : 8.5
        };
      });

      const rows = filteredStudents.map((s, idx) => activeColumns.map(c => c.getValue(s, idx)));
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
      const dataRows = filteredStudents.map((s, idx) => activeColumns.map(c => c.getValue(s, idx)));

      const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
      const excelRowHeightPt = Math.max(18, rowHeightMm * 2.83465);
      worksheet['!rows'] = [
        { hpt: 26 },
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

  const categories = [
    { id: 'basic', title: 'Basic & Identity', icon: Users, accent: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'govt', title: 'Government & UDISE+', icon: Building, accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'academic', title: 'Academic Info', icon: GraduationCap, accent: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { id: 'family', title: 'Parents & Family', icon: HeartPulse, accent: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'address', title: 'Address', icon: MapPin, accent: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'custom', title: 'Signatures & Write Boxes', icon: SlidersHorizontal, accent: 'text-purple-700 bg-purple-50 border-purple-200' },
  ];

  const paddingXClass =
    cellPadding === 'compact' ? 'px-1.5' :
      cellPadding === 'relaxed' ? 'px-3.5' : 'px-2';

  const fontSizeClass =
    fontSize === 'sm' ? 'text-[10px]' :
      fontSize === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className={`flex flex-col h-screen bg-[#F1F5F9] text-slate-800 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white ${orientation === 'landscape' ? 'print-landscape' : ''}`}>

      <style>{`
        .custom-report-table thead th,
        .custom-report-table thead th span,
        .custom-report-table thead tr th {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }
        @media print {
          html, body, #root {
            background: #ffffff !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 7mm 6mm;
          }
          .custom-print-row {
            height: ${rowHeightMm}mm !important;
            min-height: ${rowHeightMm}mm !important;
          }
          .custom-report-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .custom-report-table thead th,
          .custom-report-table thead th span {
            background-color: ${currentTheme.headerHex} !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border: 1px solid #334155 !important;
          }
          .custom-report-table td {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          #custom-report-printable-area {
            display: block !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-sheet-scaler {
            zoom: 1 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* ── 1. CLEAN DARK BLUE TOP BAR (NO SUBTITLE, UNIFIED ACTIONS) ── */}
      <header className="shrink-0 bg-gradient-to-r from-[#0E2666] via-[#13338A] to-[#0E2666] text-white px-3 sm:px-5 py-2.5 border-b border-blue-900/60 shadow-md flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                window.dispatchEvent(new CustomEvent('toggleDesktopSidebar'));
              } else {
                window.dispatchEvent(new CustomEvent('toggleSidebar'));
              }
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            aria-label="Toggle menu"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link
            to="/students"
            className="p-2 rounded-xl bg-white/12 hover:bg-white/22 text-white border border-white/20 transition-all shrink-0"
            title="Back to Students"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="p-2 rounded-xl bg-white/12 border border-white/20 hidden sm:flex items-center justify-center shrink-0">
            <Printer className="w-4 h-4 text-sky-200" />
          </div>

          <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
            Student Print Studio
          </h1>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/12 border border-white/20 text-[11px] font-bold text-blue-100 shrink-0">
            <span>{filteredStudents.length} Students</span>
            <span>•</span>
            <span>{activeColumns.length} Cols</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/14 hover:bg-white/24 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-300" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/14 hover:bg-white/24 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </header>

      {/* Mobile View Switcher (Setup vs Live Paper Preview) */}
      <div className="lg:hidden shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setMobilePane('controls')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobilePane === 'controls'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>1. Setup & Columns</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobilePane === 'preview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>2. Live A4 Preview ({filteredStudents.length})</span>
        </button>
      </div>

      {/* ── 2. CLEAN 2-PANE SPLIT STUDIO WORKSPACE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden print:block print:overflow-visible">

        {/* ── LEFT PANE: 3 SIMPLE STEP TABS (ALWAYS CLEAN, ZERO CLUTTER) ── */}
        <aside className={`w-full lg:w-[390px] xl:w-[415px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden print:hidden ${mobilePane === 'controls' ? 'flex-1 flex' : 'hidden lg:flex'}`}>

          {/* 3 Simple Tabs Header */}
          <div className="p-2.5 bg-slate-50/90 border-b border-slate-200 grid grid-cols-3 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setStudioTab('filter')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                studioTab === 'filter'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span>Filter & Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioTab('columns')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                studioTab === 'columns'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Columns ({activeColumns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStudioTab('layout')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                studioTab === 'layout'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Page & Size</span>
            </button>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* TAB 1: FILTER & PRESETS */}
            {studioTab === 'filter' && (
              <>
                {/* Quick Student Filters */}
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Select Class
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">All Classes ({students.length} Students)</option>
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        {(['all', 'male', 'female'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGenderFilter(g)}
                            className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              genderFilter === g ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {g === 'all' ? 'All' : g === 'male' ? 'Boys' : 'Girls'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Status
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        {(['all', 'active', 'inactive'] as const).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                              statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {s === 'inactive' ? 'Inact.' : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, roll no, phone, aadhar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Report Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Sheet Heading / Report Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-950 uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 1-Click Ready Templates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ready Print Templates</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Mine</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {BUILT_IN_PRESETS.map(preset => {
                      const isCurrent = activePresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-50 border-indigo-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0">{preset.icon}</span>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {preset.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {preset.orientation === 'landscape' ? 'Landscape' : 'Portrait'} • {preset.rowHeightMm}mm row • {preset.selectedColumns.length} cols
                              </p>
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {savedPresets.map(preset => (
                      <div
                        key={preset.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          activePresetId === preset.id
                            ? 'bg-amber-50 border-amber-400'
                            : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <span>⭐</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-950 truncate">{preset.name}</p>
                            <p className="text-[10px] text-amber-700/80">
                              {preset.orientation} • {preset.rowHeightMm}mm • {preset.selectedColumns.length} cols
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id, preset.name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 cursor-pointer shrink-0"
                          title="Delete saved template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SELECT COLUMNS */}
            {studioTab === 'columns' && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Find column..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedColIds(MASTER_COLUMNS.map(c => c.id))}
                    className="px-2.5 py-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer shrink-0"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedColIds(['sno', 'rollNo', 'name', 'className'])}
                    className="px-2.5 py-2 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer shrink-0 flex items-center gap-1"
                    title="Reset to 4 basic columns"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>4</span>
                  </button>
                </div>

                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const catCols = MASTER_COLUMNS.filter(c => {
                    if (c.category !== cat.id) return false;
                    if (!columnSearch.trim()) return true;
                    const q = columnSearch.toLowerCase();
                    return c.label.toLowerCase().includes(q) || c.teluguLabel.toLowerCase().includes(q);
                  });

                  if (catCols.length === 0 && cat.id !== 'custom') return null;

                  const allCatCols = MASTER_COLUMNS.filter(c => c.category === cat.id);
                  const isAllSelected = allCatCols.length > 0 && allCatCols.every(c => selectedColIds.includes(c.id));

                  return (
                    <div key={cat.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                      <div className={`px-3 py-2 border-b border-slate-100 flex items-center justify-between ${cat.accent}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs font-black">{cat.title}</span>
                        </div>
                        {cat.id !== 'custom' && (
                          <button
                            type="button"
                            onClick={() => selectAllCategory(cat.id)}
                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white border border-current/20 cursor-pointer"
                          >
                            {isAllSelected ? 'Clear' : 'All'}
                          </button>
                        )}
                      </div>

                      <div className="p-2 grid grid-cols-1 gap-1.5">
                        {catCols.map((col) => {
                          const isChecked = selectedColIds.includes(col.id);
                          return (
                            <label
                              key={col.id}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                                isChecked
                                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
                                  : 'bg-slate-50/60 border-transparent text-slate-600 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleColumn(col.id)}
                                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                                />
                                <span className="truncate">{col.label}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">{col.widthPt}pt</span>
                            </label>
                          );
                        })}

                        {cat.id === 'custom' && customBlankCols.map(col => (
                          <div
                            key={col.id}
                            className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-purple-50 border border-purple-300 text-purple-950"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="truncate">{col.label}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomColumn(col.id)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {cat.id === 'custom' && (
                        <form onSubmit={handleAddCustomColumn} className="p-2.5 bg-slate-50 border-t border-slate-100 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add custom blank column..."
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl flex-1 focus:outline-none focus:border-purple-500 font-medium"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: PAGE & SIZE */}
            {studioTab === 'layout' && (
              <div className="space-y-4">

                {/* Paper Orientation */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-black text-slate-800 block">Paper Orientation</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-6 h-8 rounded border-2 ${orientation === 'portrait' ? 'border-indigo-600 bg-white' : 'border-slate-300 bg-slate-50'}`} />
                      <span className="text-xs font-extrabold">Portrait (A4)</span>
                      <span className="text-[10px] text-slate-400">210 × 297 mm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-8 h-6 mt-1 mb-1 rounded border-2 ${orientation === 'landscape' ? 'border-indigo-600 bg-white' : 'border-slate-300 bg-slate-50'}`} />
                      <span className="text-xs font-extrabold">Landscape (A4)</span>
                      <span className="text-[10px] text-slate-400">297 × 210 mm</span>
                    </button>
                  </div>
                </div>

                {/* Row Height */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Row Height</span>
                    </span>
                    <span className="text-xs font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                      {rowHeightMm} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[6, 9, 13, 18].map(mm => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => setRowHeightMm(mm)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          rowHeightMm === mm
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {mm}mm
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRowHeightMm(prev => Math.max(5, prev - 1))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer"
                    >
                      -
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
                      type="button"
                      onClick={() => setRowHeightMm(prev => Math.min(30, prev + 1))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cell Padding & Font Size */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
                  <div>
                    <span className="text-xs font-black text-slate-800 block mb-1.5">Cell Spacing</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact', label: 'Tight' },
                        { id: 'normal', label: 'Balanced' },
                        { id: 'relaxed', label: 'Wide' },
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCellPadding(p.id as any)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            cellPadding === p.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-black text-slate-800 block mb-1.5">Text Font Size</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'sm', label: 'Small' },
                        { id: 'base', label: 'Medium' },
                        { id: 'lg', label: 'Large' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontSize(f.id as any)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            fontSize === f.id
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table Header Color Theme */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-fuchsia-600" />
                      <span>Table Color</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">{currentTheme.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.values(THEME_STYLES).map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setTableTheme(theme.id as any)}
                        className={`h-9 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow-xs ${theme.headerBg} ${
                          tableTheme === theme.id ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : 'opacity-85 hover:opacity-100'
                        }`}
                        title={theme.name}
                      >
                        {tableTheme === theme.id ? <Check className="w-4 h-4 text-white" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* ── RIGHT PANE: ALWAYS-VISIBLE LIVE A4 PAPER PREVIEW ── */}
        <section
          ref={previewWrapRef}
          className={`flex-1 flex flex-col overflow-hidden bg-[#E8EEF6] print:block print:overflow-visible print:bg-white ${mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'}`}
        >
          {/* Preview Mini-Bar */}
          <div className="shrink-0 bg-white/90 backdrop-blur-xs border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 truncate">
                Live A4 Paper View
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                {orientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait'} • {rowHeightMm}mm • {selectedClassLabel}
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                ↔ Drag column borders to resize
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {Object.keys(customColWeights).length > 0 && (
                <button
                  type="button"
                  onClick={resetColumnWidths}
                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset Column Widths"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Cols</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setAutoFitZoom(false);
                  setPreviewZoom(z => Math.max(0.35, Number((z - 0.1).toFixed(2))));
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-700 w-11 text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  setAutoFitZoom(false);
                  setPreviewZoom(z => Math.min(1.2, Number((z + 0.1).toFixed(2))));
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAutoFitZoom(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  autoFitZoom
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Fit Page
              </button>
            </div>
          </div>

          {/* Scrollable Paper Sheet Canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start print:p-0 print:block print:overflow-visible">
            <div
              className="print-sheet-scaler origin-top transition-all duration-150 print:w-full"
              style={{
                width: `${pagePixelWidth}px`,
                zoom: previewZoom,
              }}
            >
              <div
                id="custom-report-printable-area"
                ref={printContainerRef}
                className="bg-white rounded-xl border border-slate-300/80 shadow-[0_12px_36px_rgba(15,23,42,0.12)] p-5 sm:p-6 print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
                style={{ minHeight: orientation === 'landscape' ? '794px' : '1123px' }}
              >
                {/* School Official Print Header */}
                <div className="pb-4 mb-4 border-b-2 border-slate-800 text-center space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src="/logo.png"
                      alt="JY School Logo"
                      className="w-12 h-12 object-contain"
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
                    <span>Class: <strong className="text-slate-900">{selectedClassLabel}</strong></span>
                    <span>Gender: <strong className="text-slate-900 capitalize">{genderFilter}</strong></span>
                    <span>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                    <span>Total Students: <strong className="text-indigo-900 font-black">{filteredStudents.length}</strong></span>
                  </div>
                </div>

                {/* Table Content */}
                {loading ? (
                  <div className="py-24 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Loading student records...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">No students match the chosen filters</h4>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or selecting another class.</p>
                  </div>
                ) : (
                  <table
                    ref={tableRef}
                    className={`custom-report-table w-full table-fixed border-collapse text-left border border-slate-300 ${activeResizeColId ? 'select-none' : ''}`}
                  >
                    <colgroup>
                      {activeColumns.map((col) => (
                        <col
                          key={col.id}
                          style={{ width: `${(resolvedWidthsPct[col.id] ?? 10).toFixed(2)}%` }}
                        />
                      ))}
                    </colgroup>
                    <thead>
                      <tr
                        className={`${currentTheme.headerBg} border border-slate-400/50 print:text-white`}
                        style={{ backgroundColor: currentTheme.headerHex }}
                      >
                        {activeColumns.map((col, idx) => {
                          const isDraggingThis = activeResizeColId === col.id;
                          return (
                            <th
                              key={col.id || idx}
                              className={`relative ${paddingXClass} py-2.5 font-black border border-slate-400/40 text-white whitespace-nowrap overflow-hidden ${
                                isDraggingThis ? 'border-r-2 border-r-amber-300' : ''
                              } ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              } ${fontSizeClass}`}
                              style={{
                                color: '#ffffff',
                                WebkitTextFillColor: '#ffffff'
                              }}
                            >
                              <span
                                className="block truncate font-black tracking-wider uppercase text-white whitespace-nowrap"
                                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                              >
                                {col.label}
                              </span>
                              {idx < activeColumns.length - 1 && (
                                <div
                                  role="separator"
                                  aria-orientation="vertical"
                                  title="Drag left/right to resize column width (Double-click to reset)"
                                  onMouseDown={(e) => startColumnResize(e, idx)}
                                  onTouchStart={(e) => startColumnResize(e, idx)}
                                  onDoubleClick={resetColumnWidths}
                                  className="no-print-handle print:hidden group/resizer absolute top-0 right-0 bottom-0 w-2.5 cursor-col-resize z-30 flex items-center justify-end select-none"
                                >
                                  <span
                                    className={`w-[3px] rounded-full transition-all duration-150 ${
                                      isDraggingThis
                                        ? 'h-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]'
                                        : 'h-4 bg-white/40 group-hover/resizer:h-full group-hover/resizer:bg-amber-300'
                                    }`}
                                  />
                                </div>
                              )}
                            </th>
                          );
                        })}
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
                              const allowWrap = col.id === 'name' || col.id === 'address' || col.id === 'remarks';
                              const wrapClass = allowWrap ? 'whitespace-normal break-words' : 'whitespace-nowrap nowrap-cell overflow-hidden text-ellipsis';
                              const guideClass = activeResizeColId === col.id ? 'border-r-2 border-r-indigo-500' : '';

                              if (col.id === 'photo') {
                                const photoUrl = getPhotoUrl(student.user?.photoUrl);
                                return (
                                  <td key={colIdx} className={`border border-slate-300 ${guideClass} ${paddingXClass} text-center whitespace-nowrap nowrap-cell overflow-hidden`}>
                                    <div className="w-8 h-9 rounded bg-slate-200 mx-auto overflow-hidden flex items-center justify-center border border-slate-300">
                                      {photoUrl ? (
                                        <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[8px] font-bold text-slate-500">N/A</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }

                              if (col.id === 'gender') {
                                return (
                                  <td key={colIdx} className={`border border-slate-300 ${guideClass} ${paddingXClass} text-center whitespace-nowrap nowrap-cell overflow-hidden ${fontSizeClass}`}>
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

                              if (col.id === 'bloodGroup') {
                                return (
                                  <td key={colIdx} className={`border border-slate-300 ${guideClass} ${paddingXClass} text-center whitespace-nowrap nowrap-cell overflow-hidden ${fontSizeClass}`}>
                                    {val !== '-' ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded font-black text-rose-700 bg-rose-50 border border-rose-200/80 print:border-none print:bg-transparent print:text-slate-900">
                                        {val}
                                      </span>
                                    ) : '-'}
                                  </td>
                                );
                              }

                              if (col.id === 'attendanceBox') {
                                return (
                                  <td key={colIdx} className={`border border-slate-300 ${guideClass} ${paddingXClass} text-center whitespace-nowrap nowrap-cell overflow-hidden`}>
                                    <div className="w-5 h-5 mx-auto border-2 border-slate-400 rounded-md bg-white print:border-slate-800" />
                                  </td>
                                );
                              }

                              if (col.id === 'parentSignature' || col.id === 'studentSignature') {
                                return (
                                  <td key={colIdx} className={`border border-slate-300 ${guideClass} ${paddingXClass} text-center whitespace-nowrap nowrap-cell overflow-hidden`}>
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
                                  className={`border border-slate-300 ${guideClass} font-medium ${paddingXClass} ${fontSizeClass} ${wrapClass} ${
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
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/35 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Save Current Template
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Save these columns, row height ({rowHeightMm}mm), and theme settings as a 1-click template.
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
