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
  Fingerprint, Phone, Hash, ChevronDown, RefreshCw, X
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
  rowHeight: 'compact' | 'normal' | 'spacious' | 'signature';
  fontSize: 'sm' | 'base' | 'lg';
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

  // Page / Print Configuration
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [rowHeight, setRowHeight] = useState<'compact' | 'normal' | 'spacious' | 'signature'>('normal');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [reportTitle, setReportTitle] = useState('STUDENT MASTER DIRECTORY & REPORT');
  const [showPhoto, setShowPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'templates' | 'settings'>('columns');

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
    { id: 'sno', label: 'S.No', teluguLabel: 'క్రమ సంఖ్య', category: 'basic', defaultSelected: true, widthPt: 14, align: 'center', getValue: (_, idx) => String(idx + 1) },
    { id: 'photo', label: 'Photo', teluguLabel: 'ఫోటో', category: 'basic', defaultSelected: false, widthPt: 22, align: 'center', getValue: (s) => s.user?.photoUrl || '' },
    { id: 'rollNo', label: 'Student ID', teluguLabel: 'రోల్ నంబర్ / ఐడీ', category: 'basic', defaultSelected: true, widthPt: 26, align: 'center', getValue: (s) => s.rollNo || s.studentId || '-' },
    { id: 'admissionNo', label: 'Admission No', teluguLabel: 'అడ్మిషన్ నంబర్', category: 'basic', defaultSelected: false, widthPt: 26, align: 'center', getValue: (s) => s.admissionNo || s.rollNo || '-' },
    { id: 'name', label: 'Student Name', teluguLabel: 'విద్యార్థి పూర్తి పేరు', category: 'basic', defaultSelected: true, widthPt: 45, align: 'left', getValue: (s) => s.user?.name || s.name || '-' },
    { id: 'gender', label: 'Gender', teluguLabel: 'లింగం (బాయ్ / గర్ల్)', category: 'basic', defaultSelected: true, widthPt: 18, align: 'center', getValue: (s) => s.gender ? (s.gender.toLowerCase() === 'female' ? 'Girl' : 'Boy') : '-' },
    { id: 'dob', label: 'Date of Birth', teluguLabel: 'పుట్టిన తేదీ', category: 'basic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.dob ? new Date(s.dob).toLocaleDateString('en-GB') : '-' },
    { id: 'age', label: 'Age', teluguLabel: 'వయస్సు', category: 'basic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => calculateAge(s.dob) },
    { id: 'bloodGroup', label: 'Blood Group', teluguLabel: 'రక్త వర్గం', category: 'basic', defaultSelected: false, widthPt: 20, align: 'center', getValue: (s) => s.bloodGroup || '-' },
    { id: 'aadharNo', label: 'Student Aadhaar', teluguLabel: 'విద్యార్థి ఆధార్ నంబర్', category: 'basic', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.aadharNo) },

    // 🏛️ Government Registrations
    { id: 'penNumber', label: 'PEN Number (UDISE+)', teluguLabel: 'PEN నంబర్ (UDISE+)', category: 'govt', defaultSelected: false, widthPt: 34, align: 'center', getValue: (s) => s.penNumber || '-' },
    { id: 'childId', label: 'Child ID (State)', teluguLabel: 'చైల్డ్ ఐడీ (స్టేట్ పోర్టల్)', category: 'govt', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.childId || '-' },
    { id: 'apaarId', label: 'APAAR ID (One Nation)', teluguLabel: 'APAAR ID (వన్ నేషన్ ఐడీ)', category: 'govt', defaultSelected: false, widthPt: 32, align: 'center', getValue: (s) => s.apaarId || '-' },

    // 🎓 Academic & Institutional
    { id: 'className', label: 'Class & Section', teluguLabel: 'తరగతి & సెక్షన్', category: 'academic', defaultSelected: true, widthPt: 24, align: 'center', getValue: (s) => s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '-' },
    { id: 'academicYear', label: 'Academic Year', teluguLabel: 'విద్యా సంవత్సరం', category: 'academic', defaultSelected: false, widthPt: 24, align: 'center', getValue: (s) => s.class?.academicYear || '2026-2027' },
    { id: 'admissionDate', label: 'Admission Date', teluguLabel: 'చేరిన తేదీ', category: 'academic', defaultSelected: false, widthPt: 25, align: 'center', getValue: (s) => s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : '-' },
    { id: 'medium', label: 'Medium', teluguLabel: 'బోధనా మాధ్యమం', category: 'academic', defaultSelected: false, widthPt: 20, align: 'center', getValue: () => 'English' },
    { id: 'status', label: 'Status', teluguLabel: 'స్థితి (Active/Inactive)', category: 'academic', defaultSelected: false, widthPt: 18, align: 'center', getValue: (s) => s.user?.isActive !== false ? 'Active' : 'Inactive' },

    // 👨‍👩‍👧 Parents & Family
    { id: 'fatherName', label: 'Father Name', teluguLabel: 'తండ్రి పేరు', category: 'family', defaultSelected: true, widthPt: 40, align: 'left', getValue: (s) => s.fatherName || '-' },
    { id: 'fatherPhone', label: "Father's Phone", teluguLabel: 'తండ్రి మొబైల్ నంబర్', category: 'family', defaultSelected: true, widthPt: 28, align: 'center', getValue: (s) => s.fatherPhone || s.user?.phone || '-' },
    { id: 'fatherAadhar', label: "Father's Aadhaar", teluguLabel: 'తండ్రి ఆధార్ నంబర్', category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.fatherAadhar) },
    { id: 'motherName', label: 'Mother Name', teluguLabel: 'తల్లి పేరు', category: 'family', defaultSelected: false, widthPt: 38, align: 'left', getValue: (s) => s.motherName || '-' },
    { id: 'motherPhone', label: "Mother's Phone", teluguLabel: 'తల్లి మొబైల్ నంబర్', category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.motherPhone || '-' },
    { id: 'motherAadhar', label: "Mother's Aadhaar", teluguLabel: 'తల్లి ఆధార్ నంబర్', category: 'family', defaultSelected: false, widthPt: 35, align: 'center', getValue: (s) => formatAadhaar(s.motherAadhar) },
    { id: 'guardianName', label: 'Guardian Name', teluguLabel: 'గార్డియన్ పేరు', category: 'family', defaultSelected: false, widthPt: 35, align: 'left', getValue: (s) => s.guardianName || '-' },
    { id: 'guardianPhone', label: 'Guardian Phone', teluguLabel: 'గార్డియన్ ఫోన్', category: 'family', defaultSelected: false, widthPt: 28, align: 'center', getValue: (s) => s.guardianPhone || '-' },

    // 📍 Address
    { id: 'address', label: 'Residential Address', teluguLabel: 'నివాస చిరునామా / గ్రామం', category: 'address', defaultSelected: false, widthPt: 55, align: 'left', getValue: (s) => s.address || '-' },

    // ✍️ Physical Blank Columns for Writing / Signatures
    { id: 'parentSignature', label: 'Parent Signature', teluguLabel: 'తల్లిదండ్రుల సంతకం బాక్స్', category: 'custom', defaultSelected: false, widthPt: 45, align: 'center', getValue: () => '' },
    { id: 'studentSignature', label: 'Student Signature', teluguLabel: 'విద్యార్థి సంతకం బాక్స్', category: 'custom', defaultSelected: false, widthPt: 40, align: 'center', getValue: () => '' },
    { id: 'remarks', label: 'Remarks / Feedback', teluguLabel: 'రిమార్కులు / సూచనలు', category: 'custom', defaultSelected: false, widthPt: 45, align: 'left', getValue: () => '' },
    { id: 'attendanceBox', label: 'Attendance Check', teluguLabel: 'హాజరు చెక్ బాక్స్ [ ]', category: 'custom', defaultSelected: false, widthPt: 22, align: 'center', getValue: () => '' },
    { id: 'feeAmount', label: 'Amount Paid (₹)', teluguLabel: 'చెల్లించిన మొత్తం (₹)', category: 'custom', defaultSelected: false, widthPt: 30, align: 'center', getValue: () => '' },
    { id: 'receiptNo', label: 'Receipt No', teluguLabel: 'రసీదు నంబర్', category: 'custom', defaultSelected: false, widthPt: 28, align: 'center', getValue: () => '' },
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
      rowHeight: 'normal',
      fontSize: 'base',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'fatherName', 'fatherPhone'],
    },
    {
      id: 'preset_udise',
      name: '🏛️ UDISE+ & Govt Identifiers',
      icon: '🏛️',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'GOVERNMENT UDISE+, PEN & AADHAAR REGISTRY',
      rowHeight: 'normal',
      fontSize: 'base',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'dob', 'aadharNo', 'penNumber', 'childId', 'apaarId'],
    },
    {
      id: 'preset_ptm_sheet',
      name: '✍️ Parent Signature & PTM Sheet',
      icon: '✍️',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'PARENT-TEACHER MEETING ACKNOWLEDGEMENT SHEET',
      rowHeight: 'signature',
      fontSize: 'base',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'parentSignature', 'remarks'],
    },
    {
      id: 'preset_family_directory',
      name: '👨‍👩‍👧 Family & Parents Directory',
      icon: '👨‍👩‍👧',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'PARENTS DETAILED CONTACT & AADHAAR REGISTER',
      rowHeight: 'normal',
      fontSize: 'sm',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'fatherAadhar', 'motherName', 'motherPhone', 'address'],
    },
    {
      id: 'preset_health_registry',
      name: '🩺 Student Health & Blood Group',
      icon: '🩺',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'STUDENT HEALTH, BLOOD GROUP & EMERGENCY ROSTER',
      rowHeight: 'normal',
      fontSize: 'base',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'gender', 'bloodGroup', 'dob', 'age', 'fatherPhone', 'address'],
    },
    {
      id: 'preset_fee_register',
      name: '💰 Fee Collection Register',
      icon: '💰',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'STUDENT FEE COLLECTION & RECEIPT REGISTER',
      rowHeight: 'signature',
      fontSize: 'base',
      selectedColumns: ['sno', 'rollNo', 'name', 'className', 'fatherName', 'fatherPhone', 'feeAmount', 'receiptNo', 'parentSignature'],
    },
    {
      id: 'preset_master_all',
      name: '🌟 Complete Master Dossier (All Columns)',
      icon: '🌟',
      isBuiltIn: true,
      orientation: 'landscape',
      customHeading: 'COMPLETE STUDENT MASTER REPOSITORY',
      rowHeight: 'compact',
      fontSize: 'sm',
      selectedColumns: MASTER_COLUMNS.map(c => c.id),
    },
  ], [MASTER_COLUMNS]);

  // Saved presets from localStorage
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
      teluguLabel: 'కస్టమ్ ఖాళీ కాలమ్',
      category: 'custom',
      defaultSelected: true,
      widthPt: c.widthPt,
      align: 'center',
      getValue: () => '',
    }));
    return [...standardCols, ...customCols];
  }, [MASTER_COLUMNS, selectedColIds, customBlankCols]);

  // Toggle single column
  const toggleColumn = (id: string) => {
    setSelectedColIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.error('At least one column must be selected');
          return prev;
        }
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle Category
  const toggleCategory = (category: string, selectAll: boolean) => {
    const catColIds = MASTER_COLUMNS.filter(c => c.category === category).map(c => c.id);
    setSelectedColIds(prev => {
      if (selectAll) {
        return Array.from(new Set([...prev, ...catColIds]));
      } else {
        const remaining = prev.filter(id => !catColIds.includes(id));
        return remaining.length > 0 ? remaining : [catColIds[0]];
      }
    });
  };

  // Select all columns
  const selectAllColumns = () => {
    setSelectedColIds(MASTER_COLUMNS.map(c => c.id));
    toast.success('All columns selected!');
  };

  // Clear to standard minimal columns
  const clearToMinimal = () => {
    setSelectedColIds(['sno', 'rollNo', 'name', 'className']);
    toast.success('Reset to basic columns');
  };

  // Apply a preset template
  const applyPreset = (preset: PresetTemplate) => {
    setOrientation(preset.orientation);
    setRowHeight(preset.rowHeight);
    setFontSize(preset.fontSize);
    setReportTitle(preset.customHeading);
    setSelectedColIds(preset.selectedColumns);
    if (preset.customBlankColumns) {
      setCustomBlankCols(preset.customBlankColumns);
    }
    toast.success(`Loaded "${preset.name}"`, { icon: '✨' });
  };

  // Save current preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const newPreset: PresetTemplate = {
      id: `custom_preset_${Date.now()}`,
      name: newTemplateName.trim(),
      icon: '⭐',
      isBuiltIn: false,
      orientation,
      customHeading: reportTitle,
      rowHeight,
      fontSize,
      selectedColumns: [...selectedColIds],
      customBlankColumns: [...customBlankCols],
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    try {
      localStorage.setItem('jy_school_custom_report_presets', JSON.stringify(updated));
    } catch {}
    setShowSaveModal(false);
    setNewTemplateName('');
    toast.success('Template saved successfully! You can reuse it anytime.', { icon: '💾' });
  };

  // Delete custom preset
  const handleDeletePreset = (id: string, name: string) => {
    if (!window.confirm(`Delete custom template "${name}"?`)) return;
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem('jy_school_custom_report_presets', JSON.stringify(updated));
    } catch {}
    toast.success(`Template "${name}" deleted`);
  };

  // Add custom blank column
  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newColName.trim();
    if (!name) return;
    const id = `col_custom_${Date.now()}`;
    setCustomBlankCols(prev => [...prev, { id, label: name.toUpperCase(), widthPt: 40 }]);
    setNewColName('');
    toast.success(`Added blank column: "${name}"`);
  };

  // Remove custom blank column
  const handleRemoveCustomColumn = (id: string) => {
    setCustomBlankCols(prev => prev.filter(c => c.id !== id));
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = async () => {
    const toastId = toast.loading('Generating high-resolution PDF report...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top School Brand Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
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

      const rowPadding = rowHeight === 'compact' ? 1.5 : rowHeight === 'spacious' ? 4.5 : rowHeight === 'signature' ? 7 : 2.8;

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
          cellPadding: { top: rowPadding, bottom: rowPadding, left: 1.8, right: 1.8 },
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 2.5, bottom: 2.5, left: 1.8, right: 1.8 },
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
      const excelRows = filteredStudents.map((s, idx) => {
        const rowObj: any = {};
        activeColumns.forEach(c => {
          rowObj[c.label] = c.getValue(s, idx);
        });
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
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

  // Grouped columns for selector UI
  const categories = [
    { id: 'basic', title: 'Basic & Identity', telugu: 'ప్రాథమిక & గుర్తింపు వివరాలు', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'govt', title: 'Government & UDISE+', telugu: 'ప్రభుత్వ రిజిస్ట్రీ వివరాలు', icon: Building, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'academic', title: 'Academic & Institutional', telugu: 'విద్యా & తరగతి వివరాలు', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'family', title: 'Parents & Family', telugu: 'తల్లిదండ్రుల వివరాలు', icon: HeartPulse, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { id: 'address', title: 'Address & Residence', telugu: 'నివాస చిరునామా', icon: MapPin, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'custom', title: 'Physical Blank & Signature Columns', telugu: 'సంతకాలు & బాక్స్‌లు', icon: SlidersHorizontal, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/90 text-slate-800 font-sans print:bg-white print:p-0 print:m-0">
      
      {/* ============================================================ */}
      {/* ── TOP CONTROL BAR (HIDDEN IN PRINT) ──                      */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Back Button & Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/students"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Back to Students List"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Student Custom Report & Print Studio
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Full Page Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ఏ వివరాలు కావాలో టిక్ చేసుకుని, అనుకూలమైన రో-సైజుతో ప్రింట్ లేదా పిడిఎఫ్ డౌన్‌లోడ్ చేయండి
              </p>
            </div>
          </div>

          {/* Quick Actions (Print, PDF, Excel) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print (డైరెక్ట్ ప్రింట్)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* ── MAIN CONFIGURATION & LIVE PREVIEW WORKSPACE ──             */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4 print:p-0 print:m-0 print:max-w-none">

        {/* ── FILTER & LIVE STATS STRIP (HIDDEN IN PRINT) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 print:hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Class & Filter Selectors */}
            <div className="flex items-center gap-2.5 flex-wrap">
              
              {/* Class Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">All Classes ({students.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Gender Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                {(['all', 'male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
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
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
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

            {/* Live Search & Count Badge */}
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student or parent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-48 sm:w-56 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-black text-blue-900 shrink-0">
                <span>{filteredStudents.length} Students</span>
                <span className="text-blue-500 mx-1.5">•</span>
                <span>{activeColumns.length} Cols</span>
              </div>

            </div>

          </div>

          {/* Quick Presets Strip (1-Click Setup) */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets:
            </span>
            {BUILT_IN_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{preset.icon}</span>
                <span>{preset.name.replace(/^[^\s]+\s*/, '')}</span>
              </button>
            ))}
            {savedPresets.map(preset => (
              <div key={preset.id} className="relative group shrink-0">
                <button
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
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
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Save Current as Preset</span>
            </button>
          </div>

        </div>

        {/* ── TABS FOR CONTROLS (COLUMNS PICKER / PAGE SETTINGS) (HIDDEN IN PRINT) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden print:hidden">
          
          {/* Tab Selector */}
          <div className="p-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {[
                { id: 'columns', label: '1. Select Columns (వివరాలు ఎంచుకోండి)', icon: CheckSquare, count: activeColumns.length },
                { id: 'settings', label: '2. Page Setup & Heights (పేజీ అమరిక)', icon: SlidersHorizontal, count: null },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/90'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Select All / Reset Actions */}
            {activeTab === 'columns' && (
              <div className="flex items-center gap-2 pr-2">
                <button
                  onClick={selectAllColumns}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearToMinimal}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Minimal
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Column Checkboxes Grid */}
          {activeTab === 'columns' && (
            <div className="p-4 sm:p-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const catCols = MASTER_COLUMNS.filter(c => c.category === cat.id);
                  if (catCols.length === 0 && cat.id !== 'custom') return null;
                  const allSelected = catCols.every(c => selectedColIds.includes(c.id));
                  const Icon = cat.icon;

                  return (
                    <div key={cat.id} className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between">
                      <div>
                        {/* Category Header */}
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{cat.title}</p>
                              <p className="text-[10px] text-slate-400">{cat.telugu}</p>
                            </div>
                          </div>
                          {catCols.length > 0 && (
                            <button
                              onClick={() => toggleCategory(cat.id, !allSelected)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              {allSelected ? 'Deselect' : 'Select All'}
                            </button>
                          )}
                        </div>

                        {/* Column Checkboxes */}
                        <div className="space-y-1.5">
                          {catCols.map(col => {
                            const isSelected = selectedColIds.includes(col.id);
                            return (
                              <label
                                key={col.id}
                                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-white border-blue-200 text-blue-950 shadow-2xs'
                                    : 'bg-white/50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleColumn(col.id)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div className="truncate">
                                    <span className="block truncate">{col.label}</span>
                                    <span className="block text-[9px] font-normal text-slate-400 truncate">{col.teluguLabel}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
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
                              className="flex items-center justify-between p-2 rounded-xl text-xs font-bold bg-purple-50/80 border border-purple-200 text-purple-950 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                <span className="truncate">{col.label} (Custom)</span>
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
                        <form onSubmit={handleAddCustomColumn} className="mt-3 pt-2 border-t border-slate-200/70 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add Custom Box..."
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg flex-1 focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Tab 2: Settings (Orientation, Heights, Heading) */}
          {activeTab === 'settings' && (
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Orientation Box */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">1. Page Orientation (పేజీ అమరిక)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`p-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Portrait (నిలువు)</span>
                    <span className="text-[10px] opacity-80">Best for 4-7 cols</span>
                  </button>

                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`p-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="rotate-90">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span>Landscape (అడ్డంగా)</span>
                    <span className="text-[10px] opacity-80">Best for 8+ cols</span>
                  </button>
                </div>
              </div>

              {/* Row Height & Font Size */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">2. Row Height & Spacing (వరుస ఎత్తు)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'compact', label: 'Compact (6mm)', desc: 'Max students/page' },
                    { id: 'normal', label: 'Normal (9mm)', desc: 'Standard clean ERP' },
                    { id: 'spacious', label: 'Spacious (13mm)', desc: 'Clear reading view' },
                    { id: 'signature', label: 'Signature (18mm)', desc: 'Pen signatures box' },
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setRowHeight(h.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                        rowHeight === h.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="block font-black">{h.label}</span>
                      <span className="block text-[10px] text-slate-400">{h.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Heading Title */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">3. Custom Heading (రిపోర్ట్ శీర్షిక)</p>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 uppercase"
                />
                <p className="text-[11px] text-slate-400">
                  ఈ టైటిల్ ప్రింట్ తీసినప్పుడు మరియు పిడిఎఫ్ డౌన్‌లోడ్ చేసినప్పుడు టాప్‌లో ప్రముఖంగా కనిపిస్తుంది.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* ── LIVE INTERACTIVE A4 SHEET PREVIEW (EXACT PRINT VIEW) ──  */}
        {/* ============================================================ */}
        <div className="space-y-2">
          
          <div className="flex items-center justify-between px-1 print:hidden">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Live A4 Print Preview (రియల్-టైమ్ ప్రింట్ ప్రివ్యూ)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {orientation === 'landscape' ? 'A4 Landscape (అడ్డంగా)' : 'A4 Portrait (నిలువు)'} • {activeColumns.length} Columns Active
            </span>
          </div>

          {/* The Actual Printable Sheet Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 overflow-x-auto print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
            
            {/* School Official Print Header */}
            <div className="pb-4 mb-4 border-b-2 border-slate-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-3">
                <img src="/logo.png" alt="JY School Logo" className="w-10 h-10 object-contain hidden sm:block print:block" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
                <h3 className="text-sm sm:text-base font-black text-blue-900 tracking-wider uppercase inline-block border-b-2 border-blue-600 pb-0.5">
                  {reportTitle}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-2 px-1">
                <span>Class: <strong className="text-slate-900">{selectedClassId ? classes.find(c => c.id === selectedClassId)?.name || 'Class' : 'All Classes'}</strong></span>
                <span>Gender: <strong className="text-slate-900 capitalize">{genderFilter}</strong></span>
                <span>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                <span>Total Students: <strong className="text-blue-900 font-black">{filteredStudents.length}</strong></span>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading student records...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No students match the chosen filters</h4>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or selecting another class.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white border border-slate-900 print:bg-slate-900 print:text-white">
                    {activeColumns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`px-2.5 py-2 font-black border border-slate-300 text-white ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${
                          fontSize === 'sm' ? 'text-[9px]' : fontSize === 'lg' ? 'text-xs' : 'text-[11px]'
                        }`}
                        style={{ width: `${col.widthPt * 3}px` }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, rowIdx) => {
                    const rowClass = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 print:bg-slate-50/50';
                    const padClass = 
                      rowHeight === 'compact' ? 'py-1 px-2' :
                      rowHeight === 'spacious' ? 'py-3.5 px-2.5' :
                      rowHeight === 'signature' ? 'py-5 px-3' : 'py-2 px-2.5';
                    
                    const fontClass = 
                      fontSize === 'sm' ? 'text-[10px]' : 
                      fontSize === 'lg' ? 'text-sm' : 'text-xs';

                    return (
                      <tr key={student.id || rowIdx} className={`${rowClass} border-b border-slate-200 hover:bg-blue-50/40 transition-colors`}>
                        {activeColumns.map((col, colIdx) => {
                          const val = col.getValue(student, rowIdx);

                          // Photo special render
                          if (col.id === 'photo') {
                            const photoUrl = getPhotoUrl(student.user?.photoUrl);
                            return (
                              <td key={colIdx} className={`border border-slate-300 ${padClass} text-center`}>
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

                          return (
                            <td
                              key={colIdx}
                              className={`border border-slate-300 font-medium ${padClass} ${fontClass} ${
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
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span>Class Teacher Signature</span>
              </div>

              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span>Verified By / Office Incharge</span>
              </div>

              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span>Principal / Headmaster Stamp</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* ── SAVE AS PRESET MODAL POPUP ──                             */}
      {/* ============================================================ */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Save Custom Template</h3>
                  <p className="text-xs text-slate-400">Reuse these exact columns & layout anytime</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Template Name (టెంప్లేట్ పేరు)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Term 1 Exam Parent Sheet"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                <p className="font-bold">Summary:</p>
                <p className="text-[11px] mt-0.5">
                  {activeColumns.length} columns selected • Orientation: {orientation.toUpperCase()} • Row height: {rowHeight}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
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

