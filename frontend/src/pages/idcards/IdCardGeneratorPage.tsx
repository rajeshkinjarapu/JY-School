import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  Loader2,
  Search,
  CheckSquare,
  Square,
  GraduationCap,
  Briefcase,
  CreditCard,
  Camera,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';
import {
  TEMPLATES_LIST,
  ID_COLOR_THEMES,
  getTemplateComponent,
  getBacksideComponent,
  type IDCardData,
  type SchoolInfo,
  type IDCardDisplayOptions,
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

// A4 paper size in CSS: 210mm x 297mm. Uses CSS to force clean CR-80 page breaks.
const PrintableContent = React.forwardRef<
  HTMLDivElement,
  {
    cards: IDCardData[];
    school: SchoolInfo;
    templateId: string;
    colorPrimary: string;
    colorSecondary: string;
    options: IDCardDisplayOptions;
  }
>(({ cards, school, templateId, colorPrimary, colorSecondary, options }, ref) => {
  const FrontTemplate = getTemplateComponent(templateId);
  const BackTemplate = getBacksideComponent();
  const templateConfig = TEMPLATES_LIST.find(t => t.id === templateId);
  const isHorizontal = templateConfig?.isHorizontal || false;

  return (
    <div ref={ref} className="print-container hidden print:block bg-white p-4">
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 10mm; }
          .print-container { background: white; }
          .page-break { page-break-after: always; }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(${isHorizontal ? 2 : 3}, 1fr);
            gap: 14px;
            justify-items: center;
            align-content: start;
          }
        `}
      </style>

      {/* Front Sides Page(s) */}
      <div className="card-grid">
        {cards.map(card => (
          <div key={`front-${card.id}`} className="mb-3" style={{ breakInside: 'avoid' }}>
            <FrontTemplate
              data={card}
              school={school}
              colorPrimary={colorPrimary}
              colorSecondary={colorSecondary}
              options={options}
            />
          </div>
        ))}
      </div>

      <div className="page-break" />

      {/* Back Sides Page(s) */}
      <div className="card-grid">
        {cards.map(card => (
          <div key={`back-${card.id}`} className="mb-3" style={{ breakInside: 'avoid' }}>
            <BackTemplate
              data={card}
              school={school}
              colorPrimary={colorPrimary}
              colorSecondary={colorSecondary}
              isHorizontal={isHorizontal}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

const IdCardGeneratorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [templateId, setTemplateId] = useState(searchParams.get('templateId') || 'template_1');
  const [themeId, setThemeId] = useState(searchParams.get('theme') || ID_COLOR_THEMES[0].id);
  const [audienceType, setAudienceType] = useState<'STUDENT' | 'STAFF'>(
    searchParams.get('type') === 'STAFF' ? 'STAFF' : 'STUDENT'
  );
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('classId') || '');
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>('ALL');

  const [settings, setSettings] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [photoOnlyFilter, setPhotoOnlyFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [displayOptions, setDisplayOptions] = useState<IDCardDisplayOptions>({
    showQr: true,
    showBloodGroup: true,
    showFatherName: true,
    showPhone: true,
  });

  const unwrap = (res: any) => (res?.data?.data !== undefined ? res.data.data : res?.data);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [setRes, clsRes] = await Promise.all([
          api.get('/api/settings').catch(() => null),
          api.get('/api/classes').catch(() => null),
        ]);
        const sData = unwrap(setRes);
        if (sData) setSettings(sData);
        const cData = unwrap(clsRes);
        setClasses(Array.isArray(cData) ? cData : []);
      } catch {
        toast.error('Failed to load classes or settings');
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (audienceType === 'STUDENT') {
      if (selectedClass) {
        fetchStudents(selectedClass);
      } else {
        setStudents([]);
        setSelectedIds(new Set());
      }
    } else {
      fetchStaff();
    }
  }, [audienceType, selectedClass]);

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/students?classId=${classId}&limit=1000`);
      const list = unwrap(res) || [];
      setStudents(Array.isArray(list) ? list : []);
      setSelectedIds(new Set((Array.isArray(list) ? list : []).map((s: any) => s.id)));
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users?excludeRole=STUDENT&limit=500');
      const list = unwrap(res) || [];
      setStaff(Array.isArray(list) ? list : []);
      setSelectedIds(new Set((Array.isArray(list) ? list : []).map((u: any) => u.id)));
    } catch {
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  const schoolInfo: SchoolInfo = useMemo(
    () => ({
      schoolName: settings?.schoolName || 'SRI VENKATESWARA JY SCHOOL',
      address: settings?.address || 'School Campus',
      phone: settings?.phone || '+91 9502924437',
      logoUrl: getPhotoUrl(settings?.logoUrl),
      signatureUrl: getPhotoUrl(settings?.principalSignatureUrl),
      academicYear: settings?.currentYear || '2026-2027',
    }),
    [settings]
  );

  const activeTheme = useMemo(
    () => ID_COLOR_THEMES.find(t => t.id === themeId) || ID_COLOR_THEMES[0],
    [themeId]
  );

  const activeTemplateConfig = useMemo(
    () => TEMPLATES_LIST.find(t => t.id === templateId) || TEMPLATES_LIST[0],
    [templateId]
  );

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (audienceType === 'STUDENT') {
      return students.filter(s => {
        const hasPhoto = Boolean(getPhotoUrl(s.user?.photoUrl));
        if (photoOnlyFilter && !hasPhoto) return false;
        if (!q) return true;
        return (
          (s.user?.name || '').toLowerCase().includes(q) ||
          (s.rollNo || '').toLowerCase().includes(q)
        );
      });
    }
    return staff.filter(u => {
      const hasPhoto = Boolean(getPhotoUrl(u.photoUrl));
      if (photoOnlyFilter && !hasPhoto) return false;
      if (selectedStaffRole !== 'ALL' && u.role !== selectedStaffRole) return false;
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.teacher?.employeeId || '').toLowerCase().includes(q)
      );
    });
  }, [audienceType, students, staff, search, photoOnlyFilter, selectedStaffRole]);

  const mappedSelectedCards: IDCardData[] = useMemo(() => {
    if (audienceType === 'STUDENT') {
      return students
        .filter(s => selectedIds.has(s.id))
        .map(s => ({
          id: s.id,
          name: s.user?.name || 'Unknown',
          rollNo: s.rollNo || '-',
          className: s.class?.name || '',
          section: s.class?.section || '',
          bloodGroup: s.bloodGroup || '',
          address: s.address || '',
          phone: s.fatherPhone || s.user?.phone || 'N/A',
          photoUrl: getPhotoUrl(s.user?.photoUrl),
          fatherName: s.fatherName || '',
          dob: formatShortDob(s.dob),
          roleLabel: 'STUDENT',
          academicYear: schoolInfo.academicYear,
        }));
    }

    return staff
      .filter(u => selectedIds.has(u.id))
      .map(u => ({
        id: u.id,
        name: u.name || 'Staff Member',
        rollNo: u.teacher?.employeeId || `STF-${(u.id || '').slice(0, 6).toUpperCase()}`,
        className: u.role || 'STAFF',
        section: '',
        bloodGroup: '',
        address: schoolInfo.address,
        phone: u.phone || 'N/A',
        photoUrl: getPhotoUrl(u.photoUrl),
        roleLabel: (u.role || 'STAFF').replace('_', ' '),
        designation: u.teacher?.specialization || u.teacher?.qualification || (u.role || '').replace('_', ' '),
        academicYear: schoolInfo.academicYear,
      }));
  }, [audienceType, students, staff, selectedIds, schoolInfo]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (filteredList.length > 0 && filteredList.every(item => selectedIds.has(item.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map(item => item.id)));
    }
  };

  const TemplatePreview = getTemplateComponent(templateId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FC]">
      <PageHeader
        title="Batch ID Card Generator"
        icon={<CreditCard className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/id-cards')}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio Home</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={mappedSelectedCards.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Front &amp; Back ({mappedSelectedCards.length})</span>
            </button>
          </div>
        }
      />

      {/* Top Configuration Strip */}
      <div className="bg-white border-b border-indigo-100 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAudienceType('STUDENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              audienceType === 'STUDENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Students</span>
          </button>
          <button
            type="button"
            onClick={() => setAudienceType('STAFF')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              audienceType === 'STAFF'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staff &amp; Faculty</span>
          </button>

          {audienceType === 'STUDENT' ? (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-indigo-200 rounded-xl px-3 py-1.5 bg-[#F8FAFF] text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Select Class &amp; Section --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedStaffRole}
              onChange={e => setSelectedStaffRole(e.target.value)}
              className="border border-violet-200 rounded-xl px-3 py-1.5 bg-[#F8FAFF] text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="ALL">All Staff Roles</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN">Admins</option>
              <option value="ACCOUNTANT">Accountants</option>
              <option value="TRANSPORT_MANAGER">Transport Mgr</option>
              <option value="SECURITY">Security</option>
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-xs font-bold text-slate-800 outline-none"
          >
            {TEMPLATES_LIST.map(t => (
              <option key={t.id} value={t.id}>
                Template: {t.name}
              </option>
            ))}
          </select>

          <select
            value={themeId}
            onChange={e => setThemeId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-xs font-bold text-slate-800 outline-none"
          >
            {ID_COLOR_THEMES.map(th => (
              <option key={th.id} value={th.id}>
                Theme: {th.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Studio */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden print:hidden">
        {/* Left Panel: Selection List */}
        <div className="w-full lg:w-[340px] xl:w-[380px] border-r border-indigo-100 bg-white flex flex-col max-h-[55vh] lg:max-h-[calc(100vh-140px)] shrink-0">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={audienceType === 'STUDENT' ? 'Search name or roll no...' : 'Search staff name or ID...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-indigo-600 font-extrabold hover:text-indigo-800 cursor-pointer"
              >
                {filteredList.length > 0 && filteredList.every(i => selectedIds.has(i.id)) ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Unselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Select All</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPhotoOnlyFilter(v => !v)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 border cursor-pointer transition-colors ${
                  photoOnlyFilter
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Photo Only</span>
              </button>

              <span className="text-slate-600 font-black">{selectedIds.size} selected</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400">
                <Loader2 className="animate-spin mb-2 w-6 h-6 text-indigo-500" />
                <p className="text-xs font-bold">Loading records...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex items-center justify-center h-44 text-center px-4 text-slate-400 text-xs font-bold">
                {audienceType === 'STUDENT' && !selectedClass
                  ? 'Select a Class & Section above to load students.'
                  : 'No matching records found.'}
              </div>
            ) : (
              filteredList.map(item => {
                const isChecked = selectedIds.has(item.id);
                const displayName = audienceType === 'STUDENT' ? item.user?.name : item.name;
                const subId = audienceType === 'STUDENT' ? item.rollNo : item.teacher?.employeeId || item.role;
                const photo = getPhotoUrl(audienceType === 'STUDENT' ? item.user?.photoUrl : item.photoUrl);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border ${
                      isChecked
                        ? 'bg-[#EEF2FF] border-indigo-200'
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-indigo-600 shrink-0">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-slate-400">
                          {(displayName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{subId}</p>
                    </div>
                    {!photo && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        No Pic
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Live Preview + Field Toggles */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Live CR-80 Card Preview ({activeTemplateConfig.name})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Synced with {schoolInfo.schoolName} • {mappedSelectedCards.length} cards queued for print
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                {(
                  [
                    ['showQr', 'QR Code'],
                    ['showBloodGroup', 'Blood Group'],
                    ['showFatherName', 'Father Name'],
                    ['showPhone', 'Phone'],
                  ] as [keyof IDCardDisplayOptions, string][]
                ).map(([key, label]) => {
                  const active = displayOptions[key] !== false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDisplayOptions(prev => ({ ...prev, [key]: !active }))}
                      className={`px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {active ? '✓ ' : ''}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {mappedSelectedCards.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-indigo-100 flex flex-col items-center">
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-4 uppercase tracking-wider">
                    Front Side Preview
                  </span>
                  <div className="shadow-md rounded-xl overflow-hidden transition-transform hover:scale-[1.03]">
                    <TemplatePreview
                      data={mappedSelectedCards[0]}
                      school={schoolInfo}
                      colorPrimary={activeTheme.primary}
                      colorSecondary={activeTheme.secondary}
                      options={displayOptions}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-indigo-100 flex flex-col items-center">
                  <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 mb-4 uppercase tracking-wider">
                    Back Side Preview
                  </span>
                  <div className="shadow-md rounded-xl overflow-hidden transition-transform hover:scale-[1.03]">
                    {React.createElement(getBacksideComponent(), {
                      data: mappedSelectedCards[0],
                      school: schoolInfo,
                      colorPrimary: activeTheme.primary,
                      colorSecondary: activeTheme.secondary,
                      isHorizontal: activeTemplateConfig.isHorizontal,
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[24px] shadow-xs border border-indigo-100 border-dashed">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-500">
                  <Printer className="w-7 h-7" />
                </div>
                <p className="text-slate-700 font-extrabold text-sm">Select students or staff to preview ID cards</p>
                <p className="text-slate-400 text-xs mt-1">Front &amp; Back CR-80 cards render automatically here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden A4 Print Sheet */}
      <PrintableContent
        ref={printRef}
        cards={mappedSelectedCards}
        school={schoolInfo}
        templateId={templateId}
        colorPrimary={activeTheme.primary}
        colorSecondary={activeTheme.secondary}
        options={displayOptions}
      />
    </div>
  );
};

export default IdCardGeneratorPage;
