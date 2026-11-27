import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import {
  Globe,
  Sparkles,
  BarChart3,
  BookOpen,
  MessageSquareQuote,
  Newspaper,
  Phone,
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  Star,
  CheckCircle2,
  LayoutDashboard,
  Award,
  Megaphone,
  Video,
  FileText,
  Link2,
  Trophy,
  Download,
  Users,
  ExternalLink,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

type WebsiteTab =
  | 'overview'
  | 'hero'
  | 'results'
  | 'navigation'
  | 'pages'
  | 'media'
  | 'downloads'
  | 'stats'
  | 'programs'
  | 'news'
  | 'testimonials'
  | 'contact';

const STAT_ICON_OPTIONS = [
  { label: 'Graduation Cap', value: 'fa-graduation-cap' },
  { label: 'Users / Students', value: 'fa-users' },
  { label: 'Teachers', value: 'fa-chalkboard-user' },
  { label: 'Trophy / Awards', value: 'fa-trophy' },
  { label: 'Heart / Satisfaction', value: 'fa-heart' },
  { label: 'Star / Rank', value: 'fa-star' },
];

const COLOR_PRESETS = [
  { label: 'Royal Blue', value: 'blue', swatch: 'bg-blue-600' },
  { label: 'Saffron Orange', value: 'orange', swatch: 'bg-orange-500' },
  { label: 'Emerald Green', value: 'green', swatch: 'bg-emerald-600' },
  { label: 'Violet Purple', value: 'purple', swatch: 'bg-purple-600' },
  { label: 'Cyan Teal', value: 'cyan', swatch: 'bg-cyan-600' },
  { label: 'Rose Red', value: 'rose', swatch: 'bg-rose-600' },
];

const PROGRAM_ICON_OPTIONS = [
  { label: 'STEM / Lab Flask', value: 'fa-flask' },
  { label: 'Robotics / AI', value: 'fa-robot' },
  { label: 'Sports & Athletics', value: 'fa-futbol' },
  { label: 'Arts & Creativity', value: 'fa-palette' },
  { label: 'Languages', value: 'fa-language' },
  { label: 'IIT / JEE Math', value: 'fa-square-root-variable' },
  { label: 'NEET / Biology', value: 'fa-dna' },
  { label: 'Books & Olympiad', value: 'fa-book-open' },
];

const DEFAULT_SETTINGS = {
  heroTitle: 'Shaping Brilliant Minds, Building Futures',
  heroSubtitle: 'EXCELLENCE IN EDUCATION SINCE 2005',
  heroDescription:
    'At Sri Venkateswara JY School, we empower students with knowledge, values, and skills — nurturing every child to become a confident, responsible global citizen.',
  heroImageUrl: '',
  heroVideoUrl: '',
  admissionsBannerTitle: 'ADMISSIONS OPEN FOR',
  admissionsYear: '2027 – 2028',
  missionText:
    'To provide a nurturing and inclusive environment that encourages academic excellence, creativity, and character development.',
  visionText:
    'To be a leading institution recognized for delivering quality education and inspiring students to achieve their full potential.',
  principalName: 'Principal',
  principalMessage: '',
  principalPhotoUrl: '',
  contactPhone: '+91 98765 43210',
  contactEmail: 'info@svjyschool.edu.in',
  contactAddress: 'Opposite Hero Showroom, SVL Paradise, Narasannapeta',
  whatsappNumber: '',
  googleMapEmbedUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  showFacultySection: true,
};

const unwrap = (res: any) => (res?.data?.data !== undefined ? res.data.data : res?.data);

export const WebsiteManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WebsiteTab>('overview');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [navLinks, setNavLinks] = useState<any[]>([]);
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [toppers, setToppers] = useState<any[]>([]);
  const [adminExams, setAdminExams] = useState<any[]>([]);
  const [erpCounts, setErpCounts] = useState({ studentsCount: 0, teachersCount: 0, classesCount: 0 });

  // Forms
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [statForm, setStatForm] = useState({ value: '', label: '', color: 'blue', icon: 'fa-graduation-cap', order: 0 });

  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState({ title: '', description: '', icon: 'fa-flask', color: 'blue', order: 0 });

  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', text: '', rating: 5, order: 0 });

  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    tag: 'Announcement',
    date: new Date().toISOString().slice(0, 10),
    order: 0,
  });

  const [navForm, setNavForm] = useState({ label: '', url: '', group: 'HEADER', badgeText: '', openInNewTab: false, order: 0 });
  const [pageForm, setPageForm] = useState({ id: '', slug: '', title: '', subtitle: '', category: 'Academics', content: '', bannerUrl: '', pdfUrl: '' });
  const [mediaForm, setMediaForm] = useState({ mediaType: 'VIDEO', title: '', category: 'Campus Tour', url: '', thumbnailUrl: '', description: '', isFeatured: false });
  const [downloadForm, setDownloadForm] = useState({ title: '', category: 'CIRCULAR', fileUrl: '', isTicker: true, publishDate: new Date().toISOString().slice(0, 10) });
  const [topperForm, setTopperForm] = useState({ studentName: '', className: '', examTitle: 'Annual Merit', scoreOrRank: '', photoUrl: '', academicYear: '2026-2027' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dataRes, examsRes] = await Promise.all([
        api.get('/api/website/data'),
        api.get('/api/website/admin/exams').catch(() => null),
      ]);
      const payload = unwrap(dataRes);
      if (payload) {
        if (payload.settings) {
          setSettings(prev => ({
            ...prev,
            ...payload.settings,
            heroImageUrl: payload.settings.heroImageUrl || '',
            heroVideoUrl: payload.settings.heroVideoUrl || '',
            principalName: payload.settings.principalName || 'Principal',
            principalMessage: payload.settings.principalMessage || '',
            principalPhotoUrl: payload.settings.principalPhotoUrl || '',
            whatsappNumber: payload.settings.whatsappNumber || '',
            googleMapEmbedUrl: payload.settings.googleMapEmbedUrl || '',
            facebookUrl: payload.settings.facebookUrl || '',
            instagramUrl: payload.settings.instagramUrl || '',
            youtubeUrl: payload.settings.youtubeUrl || '',
          }));
        }
        setStats(payload.stats || []);
        setPrograms(payload.programs || []);
        setTestimonials(payload.testimonials || []);
        setNews(payload.news || []);
        setNavLinks(payload.navLinks || []);
        setCustomPages(payload.customPages || []);
        setMedia(payload.media || []);
        setDownloads(payload.downloads || []);
        setToppers(payload.toppers || []);
        if (payload.erpCounts) setErpCounts(payload.erpCounts);
      }
      const exList = unwrap(examsRes);
      setAdminExams(Array.isArray(exList) ? exList : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load Website CMS data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      const res: any = await api.put('/api/website/settings', settings);
      const saved = unwrap(res);
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
      toast.success('Website settings saved & published live!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update website settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleExamPublish = async (examId: string, field: 'publicResultPublished' | 'admitCardPublished', nextVal: boolean) => {
    setAdminExams(prev => prev.map(ex => (ex.id === examId ? { ...ex, [field]: nextVal } : ex)));
    try {
      await api.put(`/api/website/admin/exams/${examId}/publish`, { [field]: nextVal });
      toast.success(
        field === 'publicResultPublished'
          ? nextVal
            ? 'Exam results published to website!'
            : 'Exam results hidden from website'
          : nextVal
          ? 'Hall Ticket downloads enabled on website!'
          : 'Hall Ticket downloads disabled'
      );
    } catch {
      toast.error('Failed to update exam publish visibility');
      fetchData();
    }
  };

  // STATS CRUD + Live Sync
  const syncErpCountsToStats = async () => {
    try {
      await Promise.all([
        api.post('/api/website/stats', { value: `${erpCounts.studentsCount}+`, label: 'Students Enrolled', color: 'blue', icon: 'fa-users', order: stats.length + 1 }),
        api.post('/api/website/stats', { value: `${erpCounts.teachersCount}+`, label: 'Qualified Faculty', color: 'green', icon: 'fa-chalkboard-user', order: stats.length + 2 }),
      ]);
      toast.success('Synced live Students & Faculty counts to Website Counters!');
      fetchData();
    } catch {
      toast.error('Failed syncing counts');
    }
  };

  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statForm.value.trim() || !statForm.label.trim()) return;
    try {
      if (editingStatId) {
        const res: any = await api.put(`/api/website/stats/${editingStatId}`, { ...statForm, order: Number(statForm.order) });
        setStats(prev => prev.map(s => (s.id === editingStatId ? unwrap(res) : s)));
        toast.success('Stat updated!');
      } else {
        const res: any = await api.post('/api/website/stats', { ...statForm, order: stats.length + 1 });
        setStats(prev => [...prev, unwrap(res)]);
        toast.success('Stat added!');
      }
      setEditingStatId(null);
      setStatForm({ value: '', label: '', color: 'blue', icon: 'fa-graduation-cap', order: 0 });
    } catch {
      toast.error('Failed to save stat');
    }
  };

  const handleDeleteStat = async (id: string) => {
    await api.delete(`/api/website/stats/${id}`);
    setStats(prev => prev.filter(s => s.id !== id));
    toast.success('Deleted');
  };

  // PROGRAMS CRUD
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim() || !programForm.description.trim()) return;
    try {
      if (editingProgramId) {
        const res: any = await api.put(`/api/website/programs/${editingProgramId}`, { ...programForm, order: Number(programForm.order) });
        setPrograms(prev => prev.map(p => (p.id === editingProgramId ? unwrap(res) : p)));
        toast.success('Program updated!');
      } else {
        const res: any = await api.post('/api/website/programs', { ...programForm, order: programs.length + 1 });
        setPrograms(prev => [...prev, unwrap(res)]);
        toast.success('Program added!');
      }
      setEditingProgramId(null);
      setProgramForm({ title: '', description: '', icon: 'fa-flask', color: 'blue', order: 0 });
    } catch {
      toast.error('Failed to save program');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    await api.delete(`/api/website/programs/${id}`);
    setPrograms(prev => prev.filter(p => p.id !== id));
    toast.success('Removed');
  };

  // TESTIMONIALS CRUD
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || !testimonialForm.text.trim()) return;
    try {
      if (editingTestimonialId) {
        const res: any = await api.put(`/api/website/testimonials/${editingTestimonialId}`, testimonialForm);
        setTestimonials(prev => prev.map(t => (t.id === editingTestimonialId ? unwrap(res) : t)));
        toast.success('Testimonial updated!');
      } else {
        const res: any = await api.post('/api/website/testimonials', { ...testimonialForm, order: testimonials.length + 1 });
        setTestimonials(prev => [...prev, unwrap(res)]);
        toast.success('Testimonial added!');
      }
      setEditingTestimonialId(null);
      setTestimonialForm({ name: '', role: '', text: '', rating: 5, order: 0 });
    } catch {
      toast.error('Failed to save testimonial');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    await api.delete(`/api/website/testimonials/${id}`);
    setTestimonials(prev => prev.filter(t => t.id !== id));
    toast.success('Deleted');
  };

  // NEWS CRUD
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim() || !newsForm.description.trim()) return;
    try {
      if (editingNewsId) {
        const res: any = await api.put(`/api/website/news/${editingNewsId}`, newsForm);
        setNews(prev => prev.map(n => (n.id === editingNewsId ? unwrap(res) : n)));
        toast.success('News updated!');
      } else {
        const res: any = await api.post('/api/website/news', { ...newsForm, order: news.length + 1 });
        setNews(prev => [...prev, unwrap(res)]);
        toast.success('News published!');
      }
      setEditingNewsId(null);
      setNewsForm({ title: '', description: '', tag: 'Announcement', date: new Date().toISOString().slice(0, 10), order: 0 });
    } catch {
      toast.error('Failed to save news');
    }
  };

  const handleDeleteNews = async (id: string) => {
    await api.delete(`/api/website/news/${id}`);
    setNews(prev => prev.filter(n => n.id !== id));
    toast.success('Deleted');
  };

  // NAV LINKS CRUD
  const handleAddNavLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navForm.label.trim() || !navForm.url.trim()) return;
    try {
      await api.post('/api/website/nav-links', { ...navForm, order: navLinks.length + 1 });
      toast.success('Menu link added live!');
      setNavForm({ label: '', url: '', group: 'HEADER', badgeText: '', openInNewTab: false, order: 0 });
      fetchData();
    } catch {
      toast.error('Failed to add nav link');
    }
  };

  const handleDeleteNavLink = async (id: string) => {
    await api.delete(`/api/website/nav-links/${id}`);
    setNavLinks(prev => prev.filter(n => n.id !== id));
    toast.success('Link removed');
  };

  // CUSTOM PAGES CRUD
  const handleSaveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.title.trim() || !pageForm.content.trim()) return;
    try {
      await api.post('/api/website/custom-pages', pageForm);
      toast.success('Custom page published!');
      setPageForm({ id: '', slug: '', title: '', subtitle: '', category: 'Academics', content: '', bannerUrl: '', pdfUrl: '' });
      fetchData();
    } catch {
      toast.error('Failed to save custom page');
    }
  };

  const handleDeleteCustomPage = async (id: string) => {
    await api.delete(`/api/website/custom-pages/${id}`);
    setCustomPages(prev => prev.filter(p => p.id !== id));
    toast.success('Page deleted');
  };

  // MEDIA (VIDEO / PHOTO) CRUD
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.title.trim() || !mediaForm.url.trim()) return;
    try {
      await api.post('/api/website/media', { ...mediaForm, order: media.length + 1 });
      toast.success(`${mediaForm.mediaType === 'VIDEO' ? 'Video' : 'Photo'} added to gallery!`);
      setMediaForm({ mediaType: 'VIDEO', title: '', category: 'Campus Tour', url: '', thumbnailUrl: '', description: '', isFeatured: false });
      fetchData();
    } catch {
      toast.error('Failed to add media');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    await api.delete(`/api/website/media/${id}`);
    setMedia(prev => prev.filter(m => m.id !== id));
    toast.success('Media removed');
  };

  // DOWNLOADS & TICKER CRUD
  const handleAddDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadForm.title.trim() || !downloadForm.fileUrl.trim()) return;
    try {
      await api.post('/api/website/downloads', downloadForm);
      toast.success('Circular / Download published!');
      setDownloadForm({ title: '', category: 'CIRCULAR', fileUrl: '', isTicker: true, publishDate: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch {
      toast.error('Failed to publish circular');
    }
  };

  const handleDeleteDownload = async (id: string) => {
    await api.delete(`/api/website/downloads/${id}`);
    setDownloads(prev => prev.filter(d => d.id !== id));
    toast.success('Removed');
  };

  // TOPPERS CRUD
  const handleAddTopper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topperForm.studentName.trim() || !topperForm.scoreOrRank.trim()) return;
    try {
      await api.post('/api/website/toppers', { ...topperForm, order: toppers.length + 1 });
      toast.success('Topper added to Hall of Fame!');
      setTopperForm({ studentName: '', className: '', examTitle: 'Annual Merit', scoreOrRank: '', photoUrl: '', academicYear: '2026-2027' });
      fetchData();
    } catch {
      toast.error('Failed to add topper');
    }
  };

  const handleDeleteTopper = async (id: string) => {
    await api.delete(`/api/website/toppers/${id}`);
    setToppers(prev => prev.filter(t => t.id !== id));
    toast.success('Removed');
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  const publicResultCount = adminExams.filter(e => e.publicResultPublished).length;
  const admitCardCount = adminExams.filter(e => e.admitCardPublished).length;
  const videoCount = media.filter(m => m.mediaType === 'VIDEO').length;

  const tabs: { id: WebsiteTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'hero', label: 'Hero & Principal', icon: Sparkles },
    { id: 'results', label: `Results & Hall Tickets (${publicResultCount + admitCardCount})`, icon: Award },
    { id: 'navigation', label: `Menus & Links (${navLinks.length})`, icon: Link2 },
    { id: 'pages', label: `Custom Pages (${customPages.length})`, icon: FileText },
    { id: 'media', label: `Videos & Gallery (${media.length})`, icon: Video },
    { id: 'downloads', label: `Circulars & Ticker (${downloads.length})`, icon: Download },
    { id: 'stats', label: `Stats (${stats.length})`, icon: BarChart3 },
    { id: 'programs', label: `Programs (${programs.length})`, icon: BookOpen },
    { id: 'news', label: `News (${news.length})`, icon: Newspaper },
    { id: 'testimonials', label: `Reviews (${testimonials.length})`, icon: MessageSquareQuote },
    { id: 'contact', label: 'Contact & Map', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-14">
      <PageHeader
        title="University-Grade Website & Public Portal CMS"
        icon={<Globe className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 text-xs font-extrabold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live ERP Sync Active</span>
            </span>
            <button
              type="button"
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top 5 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-700/80">Results &amp; Hall Tickets</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{publicResultCount} / {admitCardCount}</h3>
              <p className="text-[11px] font-bold text-indigo-700">Published Exams</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Award className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-700/80">Menus &amp; Pages</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{navLinks.length} / {customPages.length}</h3>
              <p className="text-[11px] font-bold text-emerald-800">Links &amp; Edu Pages</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><FileText className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-700/80">Videos &amp; Photos</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{videoCount} / {media.length - videoCount}</h3>
              <p className="text-[11px] font-bold text-violet-800">Campus Gallery</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center"><Video className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-800/80">Ticker &amp; Toppers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{downloads.length} / {toppers.length}</h3>
              <p className="text-[11px] font-bold text-amber-800">Bulletins &amp; Merit</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
          </div>

          <div className="bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border border-sky-200 rounded-[22px] p-4 flex items-center justify-between col-span-2 lg:col-span-1">
            <div>
              <p className="text-[10px] font-black uppercase text-sky-800/80">ERP Live Sync</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{erpCounts.studentsCount}</h3>
              <p className="text-[11px] font-bold text-sky-800">{erpCounts.teachersCount} Faculty Synced</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center"><Users className="w-5 h-5" /></div>
          </div>
        </div>

        {/* Scrollable Tabs Bar */}
        <div className="bg-white rounded-[20px] border border-indigo-100 p-2 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Live University Website Hero Preview</span>
                </h3>
                <button type="button" onClick={() => setActiveTab('hero')} className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">
                  Edit Hero &amp; Principal →
                </button>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F0F7FF] via-[#FFFBEB] to-[#F0FDF4] border border-indigo-100 space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                  {settings.heroSubtitle}
                </span>
                <h2 className="text-2xl font-black text-slate-900">{settings.heroTitle}</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{settings.heroDescription}</p>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
                  <span className="text-xs font-black uppercase">
                    <Megaphone className="w-4 h-4 inline mr-1.5" />
                    {settings.admissionsBannerTitle} {settings.admissionsYear}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white text-orange-600 text-[11px] font-black">Apply Now →</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-indigo-100 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Portal Quick Actions</h3>
              <button type="button" onClick={() => setActiveTab('results')} className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-extrabold flex items-center justify-between cursor-pointer">
                <span>Publish Exam Results &amp; Hall Tickets</span>
                <Award className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setActiveTab('navigation')} className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-between cursor-pointer">
                <span>Add Custom Navbar / Footer Links</span>
                <Link2 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setActiveTab('media')} className="w-full p-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 text-xs font-extrabold flex items-center justify-between cursor-pointer">
                <span>Add Campus Tour / Class Videos</span>
                <Video className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setActiveTab('downloads')} className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-between cursor-pointer">
                <span>Publish Circular / Ticker Alert</span>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: HERO, VIDEO INTRO & PRINCIPAL */}
        {activeTab === 'hero' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-[24px] border border-indigo-100 p-6 shadow-xs space-y-5 text-xs">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">Hero Banner, Intro Video &amp; Principal Message</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Hero Badge / Subtitle</label>
                <input type="text" value={settings.heroSubtitle} onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Hero Main Headline</label>
                <input type="text" value={settings.heroTitle} onChange={e => setSettings({ ...settings, heroTitle: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div>
              <label className="block font-black text-slate-500 uppercase mb-1">Hero Description</label>
              <textarea rows={2} value={settings.heroDescription} onChange={e => setSettings({ ...settings, heroDescription: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Hero Image URL</label>
                <input type="text" value={settings.heroImageUrl} onChange={e => setSettings({ ...settings, heroImageUrl: e.target.value })} placeholder="https://..." className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Featured Campus Video URL (YouTube)</label>
                <input type="text" value={settings.heroVideoUrl} onChange={e => setSettings({ ...settings, heroVideoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Admissions Banner Heading</label>
                <input type="text" value={settings.admissionsBannerTitle} onChange={e => setSettings({ ...settings, admissionsBannerTitle: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Admissions Session Year</label>
                <input type="text" value={settings.admissionsYear} onChange={e => setSettings({ ...settings, admissionsYear: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">School Mission</label>
                <textarea rows={3} value={settings.missionText} onChange={e => setSettings({ ...settings, missionText: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">School Vision</label>
                <textarea rows={3} value={settings.visionText} onChange={e => setSettings({ ...settings, visionText: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Principal Name</label>
                <input type="text" value={settings.principalName} onChange={e => setSettings({ ...settings, principalName: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Principal Photo URL</label>
                <input type="text" value={settings.principalPhotoUrl} onChange={e => setSettings({ ...settings, principalPhotoUrl: e.target.value })} placeholder="https://..." className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 font-black text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={settings.showFacultySection} onChange={e => setSettings({ ...settings, showFacultySection: e.target.checked })} className="w-4 h-4 rounded text-indigo-600" />
                  <span>Show ERP Faculty Directory on Website</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block font-black text-slate-500 uppercase mb-1">Principal's Desk Message</label>
              <textarea rows={3} value={settings.principalMessage} onChange={e => setSettings({ ...settings, principalMessage: e.target.value })} placeholder="Welcome note from the Principal..." className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
            </div>
            <button type="submit" disabled={savingSettings} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Hero & Principal Settings'}</span>
            </button>
          </form>
        )}

        {/* TAB: RESULTS, HALL TICKETS & TOPPERS */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] border border-indigo-100 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] border-b border-indigo-100">
                <h3 className="text-base font-black text-slate-900">Public Exam Results &amp; Hall Ticket Controls</h3>
                <p className="text-xs font-medium text-slate-600">
                  Toggle which ERP examinations students/parents can verify via Roll No + DOB on the public school website
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-600 font-black uppercase text-[10px]">
                      <th className="py-3.5 px-5">Examination</th>
                      <th className="py-3.5 px-4">Term</th>
                      <th className="py-3.5 px-4 text-center">Entered Marks</th>
                      <th className="py-3.5 px-4 text-center">Public Results Portal</th>
                      <th className="py-3.5 px-5 text-center">Hall Ticket Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminExams.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-bold">No exams found in ERP.</td></tr>
                    ) : (
                      adminExams.map(ex => (
                        <tr key={ex.id} className="hover:bg-[#FAFBFD]">
                          <td className="py-3.5 px-5 font-black text-slate-900">{ex.name}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-600">{ex.term}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-indigo-700">{ex.marksCount} entries</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleExamPublish(ex.id, 'publicResultPublished', !ex.publicResultPublished)}
                              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black border cursor-pointer transition-all ${
                                ex.publicResultPublished
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {ex.publicResultPublished ? 'Published Live ✓' : 'Hidden (Click to Publish)'}
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleExamPublish(ex.id, 'admitCardPublished', !ex.admitCardPublished)}
                              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black border cursor-pointer transition-all ${
                                ex.admitCardPublished
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {ex.admitCardPublished ? 'Admit Card Open ✓' : 'Closed (Click to Open)'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toppers & Merit Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleAddTopper} className="bg-white rounded-[24px] border border-amber-100 p-5 shadow-xs space-y-3 text-xs">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Add School Topper</h3>
                <input required type="text" placeholder="Student Name" value={topperForm.studentName} onChange={e => setTopperForm({ ...topperForm, studentName: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                <input required type="text" placeholder="Class (e.g. Grade 10)" value={topperForm.className} onChange={e => setTopperForm({ ...topperForm, className: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                <input required type="text" placeholder="Score / Rank (e.g. 98.4% • State Rank #3)" value={topperForm.scoreOrRank} onChange={e => setTopperForm({ ...topperForm, scoreOrRank: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                <input type="text" placeholder="Exam (e.g. IIT-JEE Foundation / SSC)" value={topperForm.examTitle} onChange={e => setTopperForm({ ...topperForm, examTitle: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                <input type="text" placeholder="Photo URL (optional)" value={topperForm.photoUrl} onChange={e => setTopperForm({ ...topperForm, photoUrl: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl font-bold outline-none" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-black cursor-pointer">Add Topper</button>
              </form>

              <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-slate-900">Published Toppers &amp; Rank Holders ({toppers.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toppers.map(tp => (
                    <div key={tp.id} className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-amber-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{tp.studentName}</p>
                        <p className="text-[11px] font-bold text-amber-800">{tp.scoreOrRank}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{tp.className} • {tp.examTitle}</p>
                      </div>
                      <button type="button" onClick={() => handleDeleteTopper(tp.id)} className="p-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: NAVIGATION MENU & CUSTOM LINKS BUILDER */}
        {activeTab === 'navigation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleAddNavLink} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">Add Website Menu / Link Option</h3>
              <input required type="text" placeholder="Label (e.g. Fee Structure / Results)" value={navForm.label} onChange={e => setNavForm({ ...navForm, label: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input required type="text" placeholder="URL (e.g. #page/curriculum or https://...)" value={navForm.url} onChange={e => setNavForm({ ...navForm, url: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <select value={navForm.group} onChange={e => setNavForm({ ...navForm, group: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                <option value="HEADER">Top Navigation Bar</option>
                <option value="ACADEMICS">Academics Dropdown</option>
                <option value="FOOTER">Footer Quick Links</option>
              </select>
              <input type="text" placeholder="Optional Badge (e.g. NEW / LIVE)" value={navForm.badgeText} onChange={e => setNavForm({ ...navForm, badgeText: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <label className="inline-flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={navForm.openInNewTab} onChange={e => setNavForm({ ...navForm, openInNewTab: e.target.checked })} />
                <span>Open in New Tab</span>
              </label>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black cursor-pointer">Add Menu Link</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Active Custom Links ({navLinks.length})</h3>
              <div className="space-y-2">
                {navLinks.map(nl => (
                  <div key={nl.id} className="p-3 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] mr-2">{nl.group}</span>
                      <strong className="text-slate-900">{nl.label}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">{nl.url}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteNavLink(nl.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUSTOM PAGES BUILDER */}
        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveCustomPage} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">{pageForm.id ? 'Edit Educational Page' : 'Create Educational / Policy Page'}</h3>
              <input required type="text" placeholder="Page Title (e.g. Curriculum & Syllabus)" value={pageForm.title} onChange={e => setPageForm({ ...pageForm, title: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="URL Slug (e.g. curriculum)" value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="Subtitle" value={pageForm.subtitle} onChange={e => setPageForm({ ...pageForm, subtitle: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="Category (Academics / Policies / Facilities)" value={pageForm.category} onChange={e => setPageForm({ ...pageForm, category: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <textarea required rows={5} placeholder="Full page content..." value={pageForm.content} onChange={e => setPageForm({ ...pageForm, content: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              <input type="text" placeholder="Optional PDF Brochure / Document URL" value={pageForm.pdfUrl} onChange={e => setPageForm({ ...pageForm, pdfUrl: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <div className="flex gap-2">
                {pageForm.id && (
                  <button type="button" onClick={() => setPageForm({ id: '', slug: '', title: '', subtitle: '', category: 'Academics', content: '', bannerUrl: '', pdfUrl: '' })} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"><X className="w-4 h-4" /></button>
                )}
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-black cursor-pointer">Save &amp; Publish Page</button>
              </div>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Published Custom Pages ({customPages.length})</h3>
              <div className="space-y-2.5">
                {customPages.map(pg => (
                  <div key={pg.id} className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] mr-2">{pg.category}</span>
                      <strong className="text-sm text-slate-900">{pg.title}</strong>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">Link: #page/{pg.slug}</p>
                      <p className="text-slate-600 mt-1 line-clamp-2">{pg.content}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={() => setPageForm({ id: pg.id, slug: pg.slug, title: pg.title, subtitle: pg.subtitle || '', category: pg.category, content: pg.content, bannerUrl: pg.bannerUrl || '', pdfUrl: pg.pdfUrl || '' })} className="p-2 rounded-xl bg-indigo-50 text-indigo-700 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleDeleteCustomPage(pg.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: VIDEOS & PHOTO GALLERY */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleAddMedia} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Video className="w-4 h-4 text-violet-600" /> Add Video or Photo</h3>
              <select value={mediaForm.mediaType} onChange={e => setMediaForm({ ...mediaForm, mediaType: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                <option value="VIDEO">Video (YouTube / MP4 Link)</option>
                <option value="PHOTO">Photo (Campus Gallery Image)</option>
              </select>
              <input required type="text" placeholder="Title (e.g. Annual Day Celebration)" value={mediaForm.title} onChange={e => setMediaForm({ ...mediaForm, title: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="text" placeholder="Category (Campus Tour / Labs / Events / Sports)" value={mediaForm.category} onChange={e => setMediaForm({ ...mediaForm, category: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input required type="url" placeholder="Video or Image URL (https://...)" value={mediaForm.url} onChange={e => setMediaForm({ ...mediaForm, url: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="url" placeholder="Custom Thumbnail URL (optional for YouTube)" value={mediaForm.thumbnailUrl} onChange={e => setMediaForm({ ...mediaForm, thumbnailUrl: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-black cursor-pointer">Publish to Gallery</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Campus Videos &amp; Photos ({media.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {media.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black mr-2 ${m.mediaType === 'VIDEO' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                        {m.mediaType}
                      </span>
                      <span className="font-black text-slate-900">{m.title}</span>
                      <p className="text-[11px] text-slate-500 truncate mt-1">{m.category} • {m.url}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteMedia(m.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CIRCULARS, DOWNLOADS & NOTICE TICKER */}
        {activeTab === 'downloads' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleAddDownload} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">Add Circular / Syllabus PDF / Ticker</h3>
              <input required type="text" placeholder="Title (e.g. SA-2 Exam Time Table PDF)" value={downloadForm.title} onChange={e => setDownloadForm({ ...downloadForm, title: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <select value={downloadForm.category} onChange={e => setDownloadForm({ ...downloadForm, category: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                <option value="CIRCULAR">Official Circular</option>
                <option value="SYLLABUS">Academic Syllabus</option>
                <option value="TIMETABLE">Exam Timetable</option>
                <option value="BROCHURE">Admissions Brochure</option>
                <option value="RESULTS_NOTICE">Results Notification</option>
              </select>
              <input required type="url" placeholder="PDF / Link URL (https://...)" value={downloadForm.fileUrl} onChange={e => setDownloadForm({ ...downloadForm, fileUrl: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input type="date" value={downloadForm.publishDate} onChange={e => setDownloadForm({ ...downloadForm, publishDate: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={downloadForm.isTicker} onChange={e => setDownloadForm({ ...downloadForm, isTicker: e.target.checked })} />
                <span>Show in Top Scrolling Notice Ticker</span>
              </label>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black cursor-pointer">Publish Circular</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Published Circulars &amp; Downloads ({downloads.length})</h3>
              <div className="space-y-2">
                {downloads.map(d => (
                  <div key={d.id} className="p-3 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black text-[10px] mr-2">{d.category}</span>
                      {d.isTicker && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-black text-[10px] mr-2">TICKER</span>}
                      <strong className="text-slate-900">{d.title}</strong>
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-indigo-600 hover:underline mt-0.5">
                        {d.fileUrl} <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </div>
                    <button type="button" onClick={() => handleDeleteDownload(d.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: STATS + LIVE ERP SYNC */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveStat} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">{editingStatId ? 'Edit Stat Counter' : 'Add Stat Counter'}</h3>
                <button type="button" onClick={syncErpCountsToStats} className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer">
                  Sync ERP ({erpCounts.studentsCount})
                </button>
              </div>
              <input required type="text" placeholder="Value (e.g. 1500+)" value={statForm.value} onChange={e => setStatForm({ ...statForm, value: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input required type="text" placeholder="Label (e.g. Students Enrolled)" value={statForm.label} onChange={e => setStatForm({ ...statForm, label: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <select value={statForm.icon} onChange={e => setStatForm({ ...statForm, icon: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                {STAT_ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map(c => (
                  <button key={c.value} type="button" onClick={() => setStatForm({ ...statForm, color: c.value })} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${statForm.color === c.value ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${c.swatch}`} />{c.label}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black cursor-pointer">{editingStatId ? 'Update Stat' : 'Add Stat'}</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Website Counters ({stats.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.map(st => (
                  <div key={st.id} className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-indigo-700">{st.value}</h4>
                      <p className="text-xs font-bold text-slate-700">{st.label}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => { setEditingStatId(st.id); setStatForm(st); }} className="p-2 rounded-xl bg-indigo-50 text-indigo-700 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => handleDeleteStat(st.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROGRAMS */}
        {activeTab === 'programs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveProgram} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">{editingProgramId ? 'Edit Program' : 'Add Academic Program'}</h3>
              <input required type="text" placeholder="Title (e.g. IIT-JEE / NEET Wing)" value={programForm.title} onChange={e => setProgramForm({ ...programForm, title: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <textarea required rows={3} placeholder="Description" value={programForm.description} onChange={e => setProgramForm({ ...programForm, description: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              <select value={programForm.icon} onChange={e => setProgramForm({ ...programForm, icon: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                {PROGRAM_ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black cursor-pointer">{editingProgramId ? 'Update' : 'Add Program'}</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Academic Programs ({programs.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {programs.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <h4 className="font-black text-slate-900">{p.title}</h4>
                      <p className="text-slate-600 mt-1">{p.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { setEditingProgramId(p.id); setProgramForm(p); }} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleDeleteProgram(p.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: NEWS */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveNews} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">{editingNewsId ? 'Edit News' : 'Add News / Event'}</h3>
              <input required type="text" placeholder="Headline" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <textarea required rows={3} placeholder="Details" value={newsForm.description} onChange={e => setNewsForm({ ...newsForm, description: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Tag (Science / Sports)" value={newsForm.tag} onChange={e => setNewsForm({ ...newsForm, tag: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
                <input type="date" value={newsForm.date} onChange={e => setNewsForm({ ...newsForm, date: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black cursor-pointer">Publish News</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-2.5">
              <h3 className="text-sm font-black text-slate-900">Campus Bulletins ({news.length})</h3>
              {news.map(n => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-start justify-between text-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black text-[10px] mr-2">{n.tag}</span>
                    <strong className="text-slate-900">{n.title}</strong>
                    <p className="text-slate-600 mt-1">{n.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setEditingNewsId(n.id); setNewsForm({ title: n.title, description: n.description, tag: n.tag, date: String(n.date).slice(0, 10), order: n.order || 0 }); }} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => handleDeleteNews(n.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleSaveTestimonial} className="bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="text-sm font-black text-slate-900">{editingTestimonialId ? 'Edit Review' : 'Add Parent / Alumni Review'}</h3>
              <input required type="text" placeholder="Name" value={testimonialForm.name} onChange={e => setTestimonialForm({ ...testimonialForm, name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <input required type="text" placeholder="Role (e.g. Parent of Grade 9)" value={testimonialForm.role} onChange={e => setTestimonialForm({ ...testimonialForm, role: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              <textarea required rows={3} placeholder="Review Quote" value={testimonialForm.text} onChange={e => setTestimonialForm({ ...testimonialForm, text: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-medium outline-none" />
              <select value={testimonialForm.rating} onChange={e => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none">
                {[5, 4, 3].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-black cursor-pointer">Save Review</button>
            </form>

            <div className="lg:col-span-2 bg-white rounded-[24px] border border-indigo-100 p-5 shadow-xs space-y-2.5">
              <h3 className="text-sm font-black text-slate-900">Parent &amp; Alumni Reviews ({testimonials.length})</h3>
              {testimonials.map(t => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-slate-200 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                    <strong className="text-slate-900">{t.name}</strong> <span className="text-slate-500">({t.role})</span>
                    <p className="text-slate-600 mt-1 italic">"{t.text}"</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setEditingTestimonialId(t.id); setTestimonialForm(t); }} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => handleDeleteTestimonial(t.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CONTACT, WHATSAPP, MAP & SOCIALS */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-[24px] border border-indigo-100 p-6 shadow-xs space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">Contact Info, WhatsApp, Google Maps &amp; Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Public Phone</label>
                <input type="text" value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Public Email</label>
                <input type="email" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">WhatsApp Helpline (e.g. 919876543210)</label>
                <input type="text" value={settings.whatsappNumber} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <div>
              <label className="block font-black text-slate-500 uppercase mb-1">Campus Address</label>
              <textarea rows={2} value={settings.contactAddress} onChange={e => setSettings({ ...settings, contactAddress: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
            </div>
            <div>
              <label className="block font-black text-slate-500 uppercase mb-1">Google Maps Embed URL (src URL)</label>
              <input type="url" value={settings.googleMapEmbedUrl} onChange={e => setSettings({ ...settings, googleMapEmbedUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?..." className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Facebook URL</label>
                <input type="url" value={settings.facebookUrl} onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">Instagram URL</label>
                <input type="url" value={settings.instagramUrl} onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
              <div>
                <label className="block font-black text-slate-500 uppercase mb-1">YouTube Channel URL</label>
                <input type="url" value={settings.youtubeUrl} onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })} className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none" />
              </div>
            </div>
            <button type="submit" disabled={savingSettings} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Contact, Map & Socials'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WebsiteManagerPage;
