import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Camera,
  HeartPulse,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Palette,
  GraduationCap,
  Briefcase,
  Search,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';
import {
  TEMPLATES_LIST,
  getTemplateComponent,
  ID_COLOR_THEMES,
  type IDCardData,
  type SchoolInfo,
} from '../../components/idcards/Templates';

const formatShortDob = (dob?: string | null) => {
  if (!dob) return '';
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const IdCardDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'studio' | 'classes' | 'audit'>('studio');
  const [audienceMode, setAudienceMode] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES_LIST[0].id);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(ID_COLOR_THEMES[0].id);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'NO_PHOTO' | 'NO_BLOOD'>('ALL');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [settingsRes, classesRes, studentsRes, staffRes] = await Promise.all([
        api.get('/api/settings').catch(() => null),
        api.get('/api/classes').catch(() => null),
        api.get('/api/students?limit=1000').catch(() => null),
        api.get('/api/users?excludeRole=STUDENT&limit=500').catch(() => null),
      ]);

      const unwrap = (res: any) => (res?.data?.data !== undefined ? res.data.data : res?.data);

      const sData = unwrap(settingsRes);
      if (sData) setSettings(sData);

      const cData = unwrap(classesRes);
      setClasses(Array.isArray(cData) ? cData : []);

      const stData = unwrap(studentsRes);
      setStudents(Array.isArray(stData) ? stData : []);

      const sfData = unwrap(staffRes);
      setStaff(Array.isArray(sfData) ? sfData : []);
    } catch {
      toast.error('Failed to load ID Card readiness data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const schoolInfo: SchoolInfo = useMemo(() => {
    return {
      schoolName: settings?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
      address: settings?.address || 'School Campus',
      phone: settings?.phone || '+91 9502924437',
      logoUrl: getPhotoUrl(settings?.logoUrl),
      signatureUrl: getPhotoUrl(settings?.principalSignatureUrl),
      academicYear: settings?.currentYear || '2026-2027',
    };
  }, [settings]);

  const activeTheme = useMemo(
    () => ID_COLOR_THEMES.find(t => t.id === selectedThemeId) || ID_COLOR_THEMES[0],
    [selectedThemeId]
  );

  // Sample real student / staff for realistic template previews
  const previewCardData: IDCardData = useMemo(() => {
    if (audienceMode === 'STAFF') {
      const sampleStaff = staff.find(u => u.photoUrl) || staff[0];
      if (sampleStaff) {
        return {
          id: sampleStaff.id,
          name: sampleStaff.name || 'Faculty Member',
          rollNo: sampleStaff.teacher?.employeeId || `STF-${(sampleStaff.id || '').slice(0, 6).toUpperCase()}`,
          className: sampleStaff.role || 'TEACHER',
          section: '',
          bloodGroup: 'O+',
          address: schoolInfo.address,
          phone: sampleStaff.phone || schoolInfo.phone,
          photoUrl: getPhotoUrl(sampleStaff.photoUrl),
          roleLabel: (sampleStaff.role || 'STAFF').replace('_', ' '),
          designation: sampleStaff.teacher?.specialization || sampleStaff.teacher?.qualification || sampleStaff.role,
          academicYear: schoolInfo.academicYear,
        };
      }
      return {
        id: 'sample-staff',
        name: 'Faculty Member',
        rollNo: 'EMP-2026-01',
        className: 'TEACHER',
        section: '',
        bloodGroup: 'B+',
        address: schoolInfo.address,
        phone: schoolInfo.phone,
        roleLabel: 'TEACHER',
        designation: 'Senior Faculty',
        academicYear: schoolInfo.academicYear,
      };
    }

    const sampleStudent = students.find(s => s.user?.photoUrl) || students[0];
    if (sampleStudent) {
      return {
        id: sampleStudent.id,
        name: sampleStudent.user?.name || 'Student Name',
        rollNo: sampleStudent.rollNo || 'JY-0001',
        className: sampleStudent.class?.name || 'Class',
        section: sampleStudent.class?.section || '',
        bloodGroup: sampleStudent.bloodGroup || 'O+',
        address: sampleStudent.address || schoolInfo.address,
        phone: sampleStudent.fatherPhone || sampleStudent.user?.phone || schoolInfo.phone,
        photoUrl: getPhotoUrl(sampleStudent.user?.photoUrl),
        fatherName: sampleStudent.fatherName || '',
        dob: formatShortDob(sampleStudent.dob),
        roleLabel: 'STUDENT',
        academicYear: schoolInfo.academicYear,
      };
    }

    return {
      id: 'preview-student',
      name: 'Student Preview',
      rollNo: 'JY26-0001',
      className: 'Grade 10',
      section: 'A',
      bloodGroup: 'O+',
      address: schoolInfo.address,
      phone: schoolInfo.phone,
      roleLabel: 'STUDENT',
      academicYear: schoolInfo.academicYear,
    };
  }, [audienceMode, students, staff, schoolInfo]);

  // Real KPI metrics
  const kpis = useMemo(() => {
    const totalStudents = students.length;
    const studentsWithPhoto = students.filter(s => Boolean(getPhotoUrl(s.user?.photoUrl))).length;
    const studentPhotoPct = totalStudents > 0 ? Math.round((studentsWithPhoto / totalStudents) * 100) : 0;
    const missingStudentPhotos = totalStudents - studentsWithPhoto;

    const totalStaff = staff.length;
    const staffWithPhoto = staff.filter(u => Boolean(getPhotoUrl(u.photoUrl))).length;

    const withBloodGroup = students.filter(s => Boolean(s.bloodGroup && s.bloodGroup.trim())).length;
    const bloodPct = totalStudents > 0 ? Math.round((withBloodGroup / totalStudents) * 100) : 0;

    const hasLogo = Boolean(schoolInfo.logoUrl);
    const hasSign = Boolean(schoolInfo.signatureUrl);
    const brandingScore = (hasLogo ? 1 : 0) + (hasSign ? 1 : 0) + (settings?.address ? 1 : 0);

    return {
      totalStudents,
      studentsWithPhoto,
      studentPhotoPct,
      missingStudentPhotos,
      totalStaff,
      staffWithPhoto,
      withBloodGroup,
      bloodPct,
      hasLogo,
      hasSign,
      brandingScore,
    };
  }, [students, staff, schoolInfo, settings]);

  // Class-wise readiness matrix
  const classReadiness = useMemo(() => {
    return classes.map(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id || s.class?.id === cls.id);
      const total = clsStudents.length;
      const photoReady = clsStudents.filter(s => Boolean(getPhotoUrl(s.user?.photoUrl))).length;
      const bloodReady = clsStudents.filter(s => Boolean(s.bloodGroup && s.bloodGroup.trim())).length;
      const pct = total > 0 ? Math.round((photoReady / total) * 100) : 0;
      return {
        id: cls.id,
        name: cls.name,
        section: cls.section,
        total,
        photoReady,
        missingPhoto: total - photoReady,
        bloodReady,
        pct,
      };
    });
  }, [classes, students]);

  // Missing photo / blood group audit list
  const auditItems = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return students
      .filter(s => {
        const hasPhoto = Boolean(getPhotoUrl(s.user?.photoUrl));
        const hasBlood = Boolean(s.bloodGroup && s.bloodGroup.trim());
        if (auditFilter === 'NO_PHOTO' && hasPhoto) return false;
        if (auditFilter === 'NO_BLOOD' && hasBlood) return false;
        if (auditFilter === 'ALL' && hasPhoto && hasBlood) return false;
        if (!q) return true;
        return (
          (s.user?.name || '').toLowerCase().includes(q) ||
          (s.rollNo || '').toLowerCase().includes(q) ||
          (s.class?.name || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [students, auditSearch, auditFilter]);

  const handleLaunchGenerator = (classId?: string, overrideType?: 'STUDENT' | 'STAFF') => {
    const params = new URLSearchParams({
      templateId: selectedTemplate,
      theme: selectedThemeId,
      type: overrideType || audienceMode,
    });
    if (classId) params.set('classId', classId);
    navigate(`/id-cards/generate?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-12">
      <PageHeader
        title="ID Card Studio & Identity Center"
        icon={<CreditCard className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchAllData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => handleLaunchGenerator(undefined, 'STAFF')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Staff IDs</span>
            </button>
            <button
              type="button"
              onClick={() => handleLaunchGenerator(undefined, 'STUDENT')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EA580C] hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Student IDs</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TOP 5 LIGHT PASTEL KPI CARDS                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KPI 1 */}
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700/80">Student IDs</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.totalStudents}</h3>
              <p className="text-[11px] font-bold text-indigo-700 mt-1">Across {classes.length} Classes</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700/80">Photo Readiness</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.studentPhotoPct}%</h3>
              <p className="text-[11px] font-bold text-emerald-800 mt-1">
                {kpis.studentsWithPhoto} Ready • {kpis.missingStudentPhotos} Missing
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-violet-700/80">Staff &amp; Faculty</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.totalStaff}</h3>
              <p className="text-[11px] font-bold text-violet-800 mt-1">{kpis.staffWithPhoto} Photo Ready</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] border border-rose-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-700/80">Blood Group Data</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.bloodPct}%</h3>
              <p className="text-[11px] font-bold text-rose-800 mt-1">
                {kpis.withBloodGroup} / {kpis.totalStudents} Filled
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 5 */}
          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/80 rounded-[22px] p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-800/80">Branding Sync</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpis.brandingScore}/3</h3>
              <p className="text-[11px] font-bold text-amber-800 mt-1">
                {kpis.hasLogo && kpis.hasSign ? 'Logo & Sign Ready' : 'Check Settings'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NAVIGATION PILL TABS                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-[20px] border border-indigo-100/80 p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Template Studio &amp; Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Class-Wise Readiness ({classes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Missing Photo &amp; Data Audit ({kpis.missingStudentPhotos})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-slate-500">Session:</span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-black">
              {schoolInfo.academicYear}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: TEMPLATE STUDIO & LIVE PREVIEW                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Live Templates Grid */}
            <div className="lg:col-span-2 space-y-4">
              {/* Audience & Color Theme Bar */}
              <div className="bg-white rounded-[22px] border border-indigo-100/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 mr-1">Preview Mode:</span>
                  <button
                    type="button"
                    onClick={() => setAudienceMode('STUDENT')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      audienceMode === 'STUDENT'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceMode('STAFF')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      audienceMode === 'STAFF'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Staff / Faculty</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-700">Theme:</span>
                  {ID_COLOR_THEMES.map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setSelectedThemeId(th.id)}
                      title={th.name}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedThemeId === th.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: th.primary }} />
                      <span>{th.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Template Cards with Live School & Student Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {TEMPLATES_LIST.map(template => {
                  const TemplateComponent = getTemplateComponent(template.id);
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`bg-white rounded-[24px] border-2 p-4 cursor-pointer transition-all shadow-xs ${
                        isSelected
                          ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-md'
                          : 'border-slate-200/80 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{template.name}</h3>
                          <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {template.badge}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>

                      <div className="flex justify-center items-start bg-gradient-to-br from-[#F8FAFF] to-[#EEF2FF] border border-indigo-100/70 rounded-2xl p-4 overflow-hidden min-h-[275px]">
                        <div className="scale-[0.82] origin-top pointer-events-none">
                          <TemplateComponent
                            data={previewCardData}
                            school={schoolInfo}
                            colorPrimary={activeTheme.primary}
                            colorSecondary={activeTheme.secondary}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Sticky Control & Branding Checklist */}
            <div className="lg:col-span-1 space-y-5 sticky top-6">
              <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#E0F2FE] border-b border-indigo-100">
                  <h2 className="text-base font-black text-slate-900">Print Batch Configuration</h2>
                  <p className="text-xs text-slate-600 font-medium">Real school branding auto-synced from Settings</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="bg-[#F8FAFF] border border-indigo-100 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Selected Template:</span>
                      <span className="font-black text-indigo-700">
                        {TEMPLATES_LIST.find(t => t.id === selectedTemplate)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Target Audience:</span>
                      <span className="font-black text-slate-900">
                        {audienceMode === 'STUDENT' ? 'Students (Class-Wise)' : 'Staff & Faculty'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Color Palette:</span>
                      <span className="font-black text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                        {activeTheme.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Print Standard:</span>
                      <span className="font-bold text-slate-700">CR-80 PVC / A4 Double-Sided</span>
                    </div>
                  </div>

                  {/* School Branding Sync Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Institution Branding Check</span>
                      <Link to="/settings" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        <span>Edit in Settings</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                        kpis.hasLogo ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <span className="font-bold">School Logo</span>
                        <span className="font-black text-[11px]">{kpis.hasLogo ? 'Synced' : 'Missing'}</span>
                      </div>
                      <div className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                        kpis.hasSign ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <span className="font-bold">Principal Signature</span>
                        <span className="font-black text-[11px]">{kpis.hasSign ? 'Synced' : 'Missing'}</span>
                      </div>
                      <div className="px-3 py-2 rounded-xl border bg-sky-50 border-sky-200 text-sky-900 flex items-center justify-between">
                        <span className="font-bold">QR Verification Code</span>
                        <span className="font-black text-[11px]">Enabled</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchGenerator()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:brightness-105 text-white text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Open Batch ID Generator</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CLASS-WISE READINESS MATRIX                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#E0F2FE] border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">Class-Wise ID Card Print Readiness</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Verify student photo &amp; emergency details per class, then launch 1-click batch print
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-black">
                {classes.length} Active Classes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-5">Class &amp; Section</th>
                    <th className="py-3.5 px-4 text-center">Total Students</th>
                    <th className="py-3.5 px-4">Photo Readiness</th>
                    <th className="py-3.5 px-4 text-center">Missing Photos</th>
                    <th className="py-3.5 px-4 text-center">Blood Groups</th>
                    <th className="py-3.5 px-5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classReadiness.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 font-bold">
                        No classes found
                      </td>
                    </tr>
                  ) : (
                    classReadiness.map(cls => (
                      <tr key={cls.id} className="hover:bg-[#FAFBFD] transition-colors">
                        <td className="py-3.5 px-5 font-black text-slate-900">
                          {cls.name} {cls.section ? `- ${cls.section}` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-700">{cls.total}</td>
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cls.pct >= 80 ? 'bg-emerald-500' : cls.pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${cls.pct}%` }}
                              />
                            </div>
                            <span className="font-black text-slate-800 w-10 text-right">{cls.pct}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            cls.missingPhoto === 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {cls.missingPhoto}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {cls.bloodReady} / {cls.total}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleLaunchGenerator(cls.id, 'STUDENT')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-extrabold text-xs transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Print Class IDs</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MISSING PHOTO & DATA AUDIT                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-[24px] border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-[#FFF1F2] via-[#FFFBEB] to-[#FEF2F2] border-b border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Pre-Print Student Data &amp; Photo Audit</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Students missing portrait photos or blood groups — update profiles before bulk PVC card printing
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    placeholder="Search student or roll no..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
                {(['ALL', 'NO_PHOTO', 'NO_BLOOD'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAuditFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                      auditFilter === f
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All Incomplete' : f === 'NO_PHOTO' ? 'Missing Photo' : 'Missing Blood Group'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-5">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-center">Photo Status</th>
                    <th className="py-3 px-4 text-center">Blood Group</th>
                    <th className="py-3 px-5 text-right">Fix Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-emerald-700 font-extrabold">
                        All matched students have photos and blood groups ready!
                      </td>
                    </tr>
                  ) : (
                    auditItems.map(st => {
                      const hasPhoto = Boolean(getPhotoUrl(st.user?.photoUrl));
                      const hasBlood = Boolean(st.bloodGroup && st.bloodGroup.trim());
                      return (
                        <tr key={st.id} className="hover:bg-[#FAFBFD]">
                          <td className="py-3 px-5">
                            <p className="font-black text-slate-900">{st.user?.name || 'Unknown'}</p>
                            <p className="text-[11px] font-bold text-slate-500">{st.rollNo}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            {st.class?.name || 'Unassigned'} {st.class?.section ? `- ${st.class.section}` : ''}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              hasPhoto ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {hasPhoto ? 'Ready' : 'Missing Photo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              hasBlood ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {hasBlood ? st.bloodGroup : 'Not Set'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Link
                              to={`/students/${st.id}/edit`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-extrabold text-[11px] transition-colors"
                            >
                              <span>Update Profile</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdCardDashboard;
