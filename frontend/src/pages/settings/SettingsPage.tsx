import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Trash2, Shield, Save, Settings as SettingsIcon, Users, UserX,
  Eye, EyeOff, School, CalendarDays, Search, Plus, Edit, Key,
  FileText, Globe, Phone, Mail, MapPin, Award, CheckCircle2,
  LayoutGrid, ArrowUpRight, CreditCard, RefreshCw, Image as ImageIcon,
  ClipboardCheck, Clock, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Link, useOutletContext } from 'react-router-dom';
import { DeleteRecordsTab } from './DeleteRecordsTab';
import { PaymentSettingsTab } from './PaymentSettingsTab';

type SettingsSection = 'system' | 'exams' | 'users' | 'payments' | 'modules' | 'delete';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsSection>('system');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { setDynamicTitle } = (useOutletContext() as { setDynamicTitle?: (title: string) => void }) || {};

  useEffect(() => {
    if (setDynamicTitle) {
      const titles: Record<SettingsSection, string> = {
        system: 'School Branding & System Config',
        exams: 'Examination & Admit Policies',
        users: 'Roles & User Access',
        payments: 'Payment & Bank Setup',
        modules: 'ERP Modules Control Hub',
        delete: 'Danger Zone & Record Deletion',
      };
      setDynamicTitle(titles[activeTab]);
    }
  }, [activeTab, setDynamicTitle]);

  // System & Branding Settings States
  const [schoolName, setSchoolName] = useState('');
  const [schoolSubtitle, setSchoolSubtitle] = useState('(IIT-JEE / NEET Foundation – Olympiads)');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [realWebsite, setRealWebsite] = useState('');
  const [currentYear, setCurrentYear] = useState('2026-2027');
  const [academicYearsList, setAcademicYearsList] = useState<string[]>([
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
  ]);
  const [logoUrl, setLogoUrl] = useState('');
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
  const [upiSummary, setUpiSummary] = useState('');

  // Exam & Admit Card Policy States (Backed by SchoolSettings)
  const [examGradingSystem, setExamGradingSystem] = useState('PERCENTAGE');
  const [examPassMarks, setExamPassMarks] = useState<number>(35);
  const [examGraceMarks, setExamGraceMarks] = useState<number>(5);
  const [examDefaultTiming, setExamDefaultTiming] = useState('09:30 AM - 12:30 PM');
  const [examAutoPublish, setExamAutoPublish] = useState(false);
  const [examSendSms, setExamSendSms] = useState(true);
  const [examShowRank, setExamShowRank] = useState(true);
  const [examStrictModeration, setExamStrictModeration] = useState(false);
  const [examShowGradesOnAdmitCard, setExamShowGradesOnAdmitCard] = useState(false);
  const [examShowStudentPhoto, setExamShowStudentPhoto] = useState(true);
  const [examAdmitCardInstructions, setExamAdmitCardInstructions] = useState('');

  // Users Management States
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // User Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('ADMIN');
  const [formPhone, setFormPhone] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showFormPasswordText, setShowFormPasswordText] = useState(false);

  const fetchSettings = async () => {
    try {
      const [settingsRes, yearsRes]: any[] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/settings/academic-years').catch(() => ({ data: [] })),
      ]);

      const settings = settingsRes.data;
      if (settings) {
        setSchoolName(settings.schoolName || '');
        setSchoolSubtitle(settings.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)');
        setAddress(settings.address || '');
        setPhone(settings.phone || '');
        setEmail(settings.email || '');
        // Fix raw JSON leak: always prefer clean realWebsite, never display serialized JSON string
        const rawWeb = settings.realWebsite || (settings.website && !String(settings.website).startsWith('{') ? settings.website : '');
        setRealWebsite(rawWeb || '');
        setCurrentYear(settings.currentYear || '2026-2027');
        setLogoUrl(settings.logoUrl || '');
        setPrincipalSignatureUrl(settings.principalSignatureUrl || '');
        setTeacherSignatureUrl(settings.teacherSignatureUrl || '');
        setUpiSummary(settings.upiId || settings.bankName || '');

        setExamGradingSystem(settings.examGradingSystem || 'PERCENTAGE');
        setExamPassMarks(Number(settings.examPassMarks ?? 35));
        setExamGraceMarks(Number(settings.examGraceMarks ?? 5));
        setExamDefaultTiming(settings.examDefaultTiming || '09:30 AM - 12:30 PM');
        setExamAutoPublish(Boolean(settings.examAutoPublish));
        setExamSendSms(settings.examSendSms !== undefined ? Boolean(settings.examSendSms) : true);
        setExamShowRank(settings.examShowRank !== undefined ? Boolean(settings.examShowRank) : true);
        setExamStrictModeration(Boolean(settings.examStrictModeration));
        setExamShowGradesOnAdmitCard(Boolean(settings.examShowGradesOnAdmitCard));
        setExamShowStudentPhoto(settings.examShowStudentPhoto !== undefined ? Boolean(settings.examShowStudentPhoto) : true);
        setExamAdmitCardInstructions(settings.examAdmitCardInstructions || '');
      }

      const dbYears = Array.isArray(yearsRes?.data) ? yearsRes.data : (yearsRes?.data?.data || []);
      const combined = Array.from(
        new Set([
          '2024-2025',
          '2025-2026',
          '2026-2027',
          '2027-2028',
          '2028-2029',
          ...(Array.isArray(dbYears) ? dbYears : []),
          settings?.currentYear,
        ].filter(Boolean))
      ).sort();
      setAcademicYearsList(combined as string[]);
    } catch (e) {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res: any = await api.get('/api/users', {
        params: {
          page: usersPage,
          limit: 8,
          search: userSearch,
          role: userRoleFilter,
        },
      });
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      setTotalUsers((res.data as any)?.meta?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users directory');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, usersPage, userRoleFilter]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = setTimeout(() => {
      setUsersPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const buildSettingsPayload = () => ({
    schoolName,
    schoolSubtitle,
    address,
    phone,
    email,
    website: realWebsite,
    currentYear,
    logoUrl,
    principalSignatureUrl,
    teacherSignatureUrl,
    examGradingSystem,
    examPassMarks,
    examGraceMarks,
    examDefaultTiming,
    examAutoPublish,
    examSendSms,
    examShowRank,
    examStrictModeration,
    examShowGradesOnAdmitCard,
    examShowStudentPhoto,
    examAdmitCardInstructions,
  });

  const handleSaveSettings = async (e: React.FormEvent, successMsg: string) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/api/settings', buildSettingsPayload());
      toast.success(successMsg);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('ADMIN');
    setFormPhone('');
    setShowFormPasswordText(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.plainPassword || (user.role === 'STUDENT' ? 'Student2026' : ''));
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setShowFormPasswordText(true);
    setShowModal(true);
  };

  const handleExportPasswordsPDF = async () => {
    setIsExportingPDF(true);
    try {
      const res: any = await api.get('/api/students/export-credentials');
      const students: any[] = res.data?.data || res.data || [];
      if (!students.length) {
        toast.error('No student credentials found to export');
        return;
      }

      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF();
      const title = schoolName || 'JY School';

      doc.setFontSize(18);
      doc.setTextColor(30, 27, 75);
      doc.text(title, 14, 15);

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('Student Login Credentials Report (Class-wise)', 14, 23);
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

      const grouped: { [key: string]: any[] } = {};
      students.forEach(st => {
        const cls = st.className || 'Unassigned';
        if (!grouped[cls]) grouped[cls] = [];
        grouped[cls].push(st);
      });

      let startY = 35;

      Object.keys(grouped).forEach((className) => {
        if (startY > 250) {
          doc.addPage();
          startY = 15;
        }

        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.text(`Class: ${className}`, 14, startY);
        startY += 4;

        const tableData = grouped[className].map((st, idx) => [
          idx + 1,
          st.name,
          st.loginId,
          st.password,
        ]);

        autoTable(doc, {
          startY: startY,
          head: [['S.No', 'Student Name', 'Login Details (ID)', 'Password']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable.finalY + 10;
      });

      doc.save(`Student_Passwords_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Students credentials PDF downloaded successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        role: formRole,
        phone: formPhone || null,
      };
      if (formPassword) payload.password = formPassword;

      if (selectedUser) {
        await api.put(`/api/users/${selectedUser.id}`, payload);
        toast.success('User updated successfully!');
      } else {
        if (!formPassword) {
          toast.error('Password is required for new user account');
          setIsSavingUser(false);
          return;
        }
        await api.post('/api/users', payload);
        toast.success('New user account registered successfully!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error saving user details');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User account deactivated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  const handleHardDeleteUser = async (userId: string) => {
    if (!window.confirm('WARNING: Are you sure you want to PERMANENTLY DELETE this user? This cannot be undone!')) return;
    try {
      await api.delete(`/api/users/${userId}?hard=true`);
      toast.success('User permanently deleted');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const navItems = useMemo(() => [
    { id: 'system' as const, label: 'Branding & Session', desc: 'School identity, contact & assets', icon: SettingsIcon, badge: currentYear },
    { id: 'exams' as const, label: 'Exams & Admit Rules', desc: 'Grading, pass marks & hall tickets', icon: ClipboardCheck, badge: `${examPassMarks}%` },
    { id: 'users' as const, label: 'Roles & User Access', desc: 'Accounts, logins & PDF passwords', icon: Users, badge: totalUsers ? `${totalUsers}` : null },
    { id: 'payments' as const, label: 'Payment & Bank Setup', desc: 'Bank details, UPI ID & QR code', icon: CreditCard, badge: null },
    { id: 'modules' as const, label: 'ERP Module Hub', desc: 'Shortcuts to other system controls', icon: LayoutGrid, badge: '8' },
    { id: 'delete' as const, label: 'Danger Zone', desc: 'Permanent record cleanup', icon: Trash2, badge: null },
  ], [currentYear, examPassMarks, totalUsers]);

  const erpControlModules = [
    { title: 'Website Admin CMS', desc: 'Manage public website hero, stats, programs, news & reviews', to: '/settings/website', color: 'from-[#EBF3FF] to-[#D6E6FF] border-[#C5DBFF] text-blue-800', icon: Globe },
    { title: 'Staff Roles & Access', desc: 'Configure teacher permissions & role privileges', to: '/staff-management', color: 'from-[#F1EDFF] to-[#DFD5FF] border-[#D0C2FF] text-violet-800', icon: ShieldAlert },
    { title: 'Academic Promotion', desc: 'Promote students, clone classes & track audit history', to: '/students/promotion', color: 'from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] text-emerald-800', icon: Award },
    { title: 'Finance & Fee Rules', desc: 'Fee structures, pending approvals & fee collections', to: '/finance', color: 'from-[#FFF4E0] to-[#FFE1B3] border-[#FAD496] text-amber-800', icon: CreditCard },
    { title: 'Classes & Subjects', desc: 'Manage grades, sections, capacities & subject codes', to: '/classes', color: 'from-[#FCE7F3] to-[#FBCFE8] border-[#F9A8D4] text-pink-800', icon: School },
    { title: 'Holiday Calendar', desc: 'Configure school holidays and academic calendar events', to: '/attendance/holidays', color: 'from-[#E0F2FE] to-[#BAE6FD] border-[#7DD3FC] text-sky-800', icon: CalendarDays },
    { title: 'ID Cards & Print Studio', desc: 'Customize & bulk print student and staff ID cards', to: '/id-cards', color: 'from-[#F3E8FF] to-[#E9D5FF] border-[#D8B4FE] text-purple-800', icon: Users },
    { title: 'Mobile App Monitoring', desc: 'Track Android/iOS app installs and login activity', to: '/app-installs', color: 'from-[#ECFDF5] to-[#D1FAE5] border-[#A7F3D0] text-teal-800', icon: CheckCircle2 },
  ];

  if (loadingSettings) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="flex flex-col min-h-full bg-[#F5F7FB] text-slate-800 font-sans">

      {/* Unified Top Bar */}
      <PageHeader
        title="Settings & Administration"
        icon={<Shield className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/settings/website"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website CMS</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                fetchSettings();
                fetchUsers();
                toast.success('Settings refreshed');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* ── 4 PASTEL KPI EXECUTIVE OVERVIEW CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#EBF3FF] to-[#D6E6FF] border-[#C5DBFF] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-800">Active Institution</p>
              <p className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">{schoolName || 'JY School'}</p>
              <p className="text-[11px] font-bold text-blue-700 mt-0.5">Session: {currentYear}</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <School className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#F1EDFF] to-[#DFD5FF] border-[#D0C2FF] shadow-[0_6px_18px_-6px_rgba(109,40,217,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-800">Exam Policies</p>
              <p className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">Pass: {examPassMarks}%</p>
              <p className="text-[11px] font-bold text-violet-700 mt-0.5">Grace: +{examGraceMarks} • {examGradingSystem}</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Fee Gateway &amp; UPI</p>
              <p className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">{upiSummary ? 'Configured' : 'Setup Needed'}</p>
              <p className="text-[11px] font-bold text-emerald-700 truncate mt-0.5">{upiSummary || 'Bank & QR Code'}</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FFF4E0] to-[#FFE1B3] border-[#FAD496] shadow-[0_6px_18px_-6px_rgba(217,119,6,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3"
          >
            <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">System Users</p>
              <p className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">{totalUsers || users.length} Accounts</p>
              <p className="text-[11px] font-bold text-amber-800 mt-0.5">Manage Roles &amp; Logins</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* ── 2-COLUMN SETTINGS ARCHITECTURE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT STICKY NAVIGATION RAIL */}
          <div className="lg:col-span-3 lg:sticky lg:top-5 bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-2.5 space-y-1">
            <div className="px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuration Sections</p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDanger = item.id === 'delete';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    isActive
                      ? isDanger
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                        : 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                      : isDanger
                      ? 'text-rose-700 hover:bg-rose-50'
                      : 'text-slate-700 hover:bg-[#F4F6FD]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDanger
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold truncate">{item.label}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                      isActive ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT SETTINGS WORKSPACE */}
          <div className="lg:col-span-9 min-w-0 space-y-5">

            {/* ── TAB 1: BRANDING, CONTACT & ASSETS ── */}
            {activeTab === 'system' && (
              <form
                onSubmit={(e) => handleSaveSettings(e, 'Branding & system settings saved!')}
                className="space-y-5 animate-fade-in"
              >
                {/* School Branding & Session Card */}
                <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-6 py-4 border-b border-indigo-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900">School Identity &amp; Academic Session</h2>
                        <p className="text-xs text-slate-500 font-medium">Appears across Report Cards, Admit Cards, Receipts &amp; Certificates</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        School Branding Name *
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. SRI VENKATESWARA JY SCHOOL"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Academic Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. (IIT-JEE / NEET Foundation – Olympiads)"
                        value={schoolSubtitle}
                        onChange={(e) => setSchoolSubtitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Active Academic Session
                      </label>
                      <div className="relative">
                        <CalendarDays className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={currentYear}
                          onChange={(e) => setCurrentYear(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                          {academicYearsList.map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Official Website URL
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="https://svjyschool.edu.in"
                          value={realWebsite}
                          onChange={(e) => setRealWebsite(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Office Telephone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="+91-9502924437"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Office Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="admin@jyschool.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Campus Physical Address
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3" />
                        <textarea
                          rows={2}
                          placeholder="Full campus address..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institution Logo & Signatures Card */}
                <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Official Logo &amp; Signature URLs</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Printed on Admit Cards, ID Cards &amp; Official Progress Reports</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        School Logo URL
                      </label>
                      <input
                        type="text"
                        placeholder="/uploads/logo.png or https://..."
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Principal Signature URL
                      </label>
                      <input
                        type="text"
                        placeholder="/uploads/principal-sign.png"
                        value={principalSignatureUrl}
                        onChange={(e) => setPrincipalSignatureUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Class Teacher Signature URL
                      </label>
                      <input
                        type="text"
                        placeholder="/uploads/teacher-sign.png"
                        value={teacherSignatureUrl}
                        onChange={(e) => setTeacherSignatureUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Branding & System Config'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ── TAB 2: EXAMINATION, GRADING & HALL TICKET POLICIES ── */}
            {activeTab === 'exams' && (
              <form
                onSubmit={(e) => handleSaveSettings(e, 'Examination & admit card policies saved!')}
                className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden animate-fade-in"
              >
                <div className="bg-gradient-to-r from-[#F1EDFF] via-[#EEF2FF] to-[#FCE7F3] px-6 py-4 border-b border-indigo-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">Examination, Grading &amp; Hall Ticket Rules</h2>
                      <p className="text-xs text-slate-500 font-medium">Global evaluation defaults for exams, progress cards &amp; admit cards</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Core Numeric & Grading Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Grading System
                      </label>
                      <select
                        value={examGradingSystem}
                        onChange={(e) => setExamGradingSystem(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="GRADE">Letter Grades (A1–E)</option>
                        <option value="CGPA">CGPA Scale (10.0)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Default Pass Marks (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={examPassMarks}
                        onChange={(e) => setExamPassMarks(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Grace Marks Cap
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={25}
                        value={examGraceMarks}
                        onChange={(e) => setExamGraceMarks(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-black text-emerald-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                        Default Exam Timing
                      </label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={examDefaultTiming}
                          onChange={(e) => setExamDefaultTiming(e.target.value)}
                          placeholder="09:30 AM - 12:30 PM"
                          className="w-full pl-8 pr-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Boolean Toggles */}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">
                      Result Publication &amp; Admit Card Visibility Toggles
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'Auto-Publish Exam Results', desc: 'Make results visible right after marks entry freeze', val: examAutoPublish, set: setExamAutoPublish },
                        { label: 'Send Result SMS / Alerts', desc: 'Trigger parent alerts when progress cards publish', val: examSendSms, set: setExamSendSms },
                        { label: 'Show Class Rank on Report Card', desc: 'Display computed rank badge on printed progress cards', val: examShowRank, set: setExamShowRank },
                        { label: 'Strict Marks Moderation', desc: 'Require admin approval before editing locked marks', val: examStrictModeration, set: setExamStrictModeration },
                        { label: 'Show Grades on Admit Card', desc: 'Display previous term grade indicator on hall ticket', val: examShowGradesOnAdmitCard, set: setExamShowGradesOnAdmitCard },
                        { label: 'Print Student Photo on Admit Card', desc: 'Include verified student portrait on hall tickets', val: examShowStudentPhoto, set: setExamShowStudentPhoto },
                      ].map((tog, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => tog.set(!tog.val)}
                          className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            tog.val
                              ? 'bg-[#F4F6FF] border-indigo-200 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900">{tog.label}</p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{tog.desc}</p>
                          </div>
                          <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${tog.val ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${tog.val ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admit Card Instructions */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                      Admit Card / Hall Ticket Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="1. Bring your school ID card and hall ticket daily. 2. Report 15 minutes before exam start..."
                      value={examAdmitCardInstructions}
                      onChange={(e) => setExamAdmitCardInstructions(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Exam Policies'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ── TAB 3: ROLES, USERS & CREDENTIALS ── */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fade-in">
                {/* Action Header */}
                <div className="bg-white p-4 rounded-[22px] border border-indigo-100/90 shadow-sm flex flex-col lg:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full lg:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, email or ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUsersPage(1);
                        setUserRoleFilter(e.target.value);
                      }}
                      className="bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="STUDENT">Student</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleExportPasswordsPDF}
                      disabled={isExportingPDF}
                      className="bg-[#ECFDF5] hover:bg-[#D1FAE5] text-emerald-700 border border-emerald-200 font-extrabold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{isExportingPDF ? 'Exporting PDF...' : 'Export Passwords PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] hover:opacity-95 text-white font-extrabold py-2 px-4 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create User</span>
                    </button>
                  </div>
                </div>

                {/* User Table list */}
                {loadingUsers ? (
                  <div className="flex justify-center items-center h-64 bg-white rounded-[24px] border border-slate-200/80">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="bg-white border border-indigo-100/90 rounded-[24px] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] text-white font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="px-5 py-3.5">Name</th>
                            <th className="px-5 py-3.5">Login Details</th>
                            <th className="px-5 py-3.5">Password</th>
                            <th className="px-5 py-3.5">Role</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                                No matching users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-[#F8FAFF] transition-colors">
                                <td className="px-5 py-3.5 font-extrabold text-slate-900">{user.name}</td>
                                <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{user.email}</td>
                                <td className="px-5 py-3.5">
                                  <span className="font-mono font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                                    {user.plainPassword || (user.role === 'STUDENT' ? 'Student2026' : '••••••••')}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                    user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    user.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    user.role === 'ACCOUNTANT' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${user.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(user)}
                                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                      title="Edit User"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={!user.isActive}
                                      className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-30"
                                      title="Deactivate User"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleHardDeleteUser(user.id)}
                                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                      title="Permanent Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalUsers > 8 && (
                      <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8FAFF] border-t border-indigo-100">
                        <button
                          type="button"
                          disabled={usersPage === 1}
                          onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                          className="px-3.5 py-1.5 bg-white border border-indigo-100 rounded-xl text-xs font-extrabold text-slate-700 disabled:opacity-50 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-xs font-extrabold text-slate-500">
                          Page {usersPage} of {Math.ceil(totalUsers / 8)} ({totalUsers} Total)
                        </span>
                        <button
                          type="button"
                          disabled={usersPage * 8 >= totalUsers}
                          onClick={() => setUsersPage(p => p + 1)}
                          className="px-3.5 py-1.5 bg-white border border-indigo-100 rounded-xl text-xs font-extrabold text-slate-700 disabled:opacity-50 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: PAYMENT & UPI SETUP ── */}
            {activeTab === 'payments' && (
              <div className="animate-fade-in">
                <PaymentSettingsTab />
              </div>
            )}

            {/* ── TAB 5: ERP MODULE CONTROL CENTER ── */}
            {activeTab === 'modules' && (
              <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-6 space-y-5 animate-fade-in">
                <div className="pb-3.5 border-b border-slate-100">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-indigo-600" />
                    <span>ERP Module Control Hub</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Quickly jump to specialized system configuration centers across the platform
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {erpControlModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <Link
                        key={mod.to}
                        to={mod.to}
                        className={`p-4 rounded-2xl border bg-gradient-to-br ${mod.color} hover:-translate-y-0.5 hover:shadow-md transition-all flex items-start justify-between gap-3 group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/85 flex items-center justify-center shrink-0 shadow-2xs">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{mod.title}</h3>
                            <p className="text-[11px] font-medium text-slate-700/85 mt-0.5">{mod.desc}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 6: DANGER ZONE ── */}
            {activeTab === 'delete' && (
              <div className="animate-fade-in">
                <DeleteRecordsTab />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── USER FORM MODAL (LIGHT THEME) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/35 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-indigo-100 z-10">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>{selectedUser ? 'Edit User Account' : 'Create User Account'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Configure profile details, login ID, and role access
              </p>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="e.g. Principal John Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Login ID (Email / Student ID)
                </label>
                <input
                  type="text"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="e.g. principal@jyschool.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Password {selectedUser && <span className="text-slate-400 font-normal normal-case">(Leave blank to keep existing)</span>}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showFormPasswordText ? 'text' : 'password'}
                    required={!selectedUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="e.g. Student2026"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPasswordText(!showFormPasswordText)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    {showFormPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    Security Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingUser ? 'Saving...' : 'Save User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
