import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import {
  Globe, Sparkles, BarChart3, BookOpen, MessageSquareQuote, Newspaper,
  Phone, Mail, MapPin, Save, Plus, Trash2, Edit2, RefreshCw, Eye, Star,
  CheckCircle2, Calendar, ExternalLink, Image as ImageIcon, LayoutDashboard,
  Award, Target, Megaphone, X
} from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

type WebsiteTab = 'overview' | 'hero' | 'stats' | 'programs' | 'testimonials' | 'news' | 'contact';

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
  heroDescription: 'At Sri Venkateswara JY School, we empower students with knowledge, values, and skills — nurturing every child to become a confident, responsible global citizen.',
  heroImageUrl: '',
  admissionsBannerTitle: 'ADMISSIONS OPEN FOR',
  admissionsYear: '2027 – 2028',
  missionText: 'To provide a nurturing and inclusive environment that encourages academic excellence, creativity, and character development — preparing students for a successful, meaningful future.',
  visionText: 'To be a leading school recognized for delivering quality education and inspiring students to achieve their full potential and make a positive impact on the world.',
  contactPhone: '+91 98765 43210',
  contactEmail: 'info@svjyschool.edu.in',
  contactAddress: '123 Education Street, Knowledge City, Narasannapeta',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
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

  // Stat Form
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [statForm, setStatForm] = useState({ value: '', label: '', color: 'blue', icon: 'fa-graduation-cap', order: 0 });

  // Program Form
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState({ title: '', description: '', icon: 'fa-flask', color: 'blue', order: 0 });

  // Testimonial Form
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', text: '', rating: 5, order: 0 });

  // News Form
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    tag: 'Announcement',
    date: new Date().toISOString().slice(0, 10),
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/website/data');
      const payload = unwrap(res);
      if (payload) {
        if (payload.settings) {
          setSettings(prev => ({
            ...prev,
            ...payload.settings,
            heroImageUrl: payload.settings.heroImageUrl || '',
            facebookUrl: payload.settings.facebookUrl || '',
            instagramUrl: payload.settings.instagramUrl || '',
            youtubeUrl: payload.settings.youtubeUrl || '',
          }));
        }
        setStats(payload.stats || []);
        setPrograms(payload.programs || []);
        setTestimonials(payload.testimonials || []);
        setNews(payload.news || []);
      }
    } catch (err) {
      toast.error('Failed to load Website CMS data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res: any = await api.put('/api/website/settings', settings);
      const saved = unwrap(res);
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
      toast.success('Website settings saved & synced!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update website settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── STATS CRUD ──
  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statForm.value.trim() || !statForm.label.trim()) return;
    try {
      if (editingStatId) {
        const res: any = await api.put(`/api/website/stats/${editingStatId}`, { ...statForm, order: Number(statForm.order) });
        const updated = unwrap(res);
        setStats(prev => prev.map(s => (s.id === editingStatId ? updated : s)));
        toast.success('Stat counter updated!');
      } else {
        const res: any = await api.post('/api/website/stats', { ...statForm, order: stats.length + 1 });
        setStats(prev => [...prev, unwrap(res)]);
        toast.success('Stat counter added!');
      }
      setEditingStatId(null);
      setStatForm({ value: '', label: '', color: 'blue', icon: 'fa-graduation-cap', order: 0 });
    } catch {
      toast.error('Failed to save stat counter');
    }
  };

  const handleDeleteStat = async (id: string) => {
    if (!window.confirm('Delete this stat card?')) return;
    try {
      await api.delete(`/api/website/stats/${id}`);
      setStats(prev => prev.filter(s => s.id !== id));
      toast.success('Stat deleted');
    } catch {
      toast.error('Error deleting stat');
    }
  };

  // ── PROGRAMS CRUD ──
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim() || !programForm.description.trim()) return;
    try {
      if (editingProgramId) {
        const res: any = await api.put(`/api/website/programs/${editingProgramId}`, { ...programForm, order: Number(programForm.order) });
        const updated = unwrap(res);
        setPrograms(prev => prev.map(p => (p.id === editingProgramId ? updated : p)));
        toast.success('Program updated!');
      } else {
        const res: any = await api.post('/api/website/programs', { ...programForm, order: programs.length + 1 });
        setPrograms(prev => [...prev, unwrap(res)]);
        toast.success('Program published!');
      }
      setEditingProgramId(null);
      setProgramForm({ title: '', description: '', icon: 'fa-flask', color: 'blue', order: 0 });
    } catch {
      toast.error('Failed to save program');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!window.confirm('Delete this academic program?')) return;
    try {
      await api.delete(`/api/website/programs/${id}`);
      setPrograms(prev => prev.filter(p => p.id !== id));
      toast.success('Program removed');
    } catch {
      toast.error('Error deleting program');
    }
  };

  // ── TESTIMONIALS CRUD ──
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name.trim() || !testimonialForm.text.trim()) return;
    try {
      if (editingTestimonialId) {
        const res: any = await api.put(`/api/website/testimonials/${editingTestimonialId}`, {
          ...testimonialForm,
          rating: Number(testimonialForm.rating),
          order: Number(testimonialForm.order),
        });
        const updated = unwrap(res);
        setTestimonials(prev => prev.map(t => (t.id === editingTestimonialId ? updated : t)));
        toast.success('Testimonial updated!');
      } else {
        const res: any = await api.post('/api/website/testimonials', {
          ...testimonialForm,
          rating: Number(testimonialForm.rating),
          order: testimonials.length + 1,
        });
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
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await api.delete(`/api/website/testimonials/${id}`);
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Error deleting testimonial');
    }
  };

  // ── NEWS CRUD ──
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim() || !newsForm.description.trim()) return;
    try {
      const payload = {
        ...newsForm,
        date: new Date(newsForm.date || Date.now()).toISOString(),
        order: editingNewsId ? Number(newsForm.order) : news.length + 1,
      };
      if (editingNewsId) {
        const res: any = await api.put(`/api/website/news/${editingNewsId}`, payload);
        const updated = unwrap(res);
        setNews(prev => prev.map(n => (n.id === editingNewsId ? updated : n)));
        toast.success('News item updated!');
      } else {
        const res: any = await api.post('/api/website/news', payload);
        setNews(prev => [...prev, unwrap(res)]);
        toast.success('News & event published!');
      }
      setEditingNewsId(null);
      setNewsForm({ title: '', description: '', tag: 'Announcement', date: new Date().toISOString().slice(0, 10), order: 0 });
    } catch {
      toast.error('Failed to save news item');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Delete this news article?')) return;
    try {
      await api.delete(`/api/website/news/${id}`);
      setNews(prev => prev.filter(n => n.id !== id));
      toast.success('News deleted');
    } catch {
      toast.error('Error deleting news');
    }
  };

  const navTabs: { id: WebsiteTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview & Preview', icon: LayoutDashboard },
    { id: 'hero', label: 'Hero, Admissions & Vision', icon: Sparkles },
    { id: 'stats', label: 'Stats Counters', icon: BarChart3, count: stats.length },
    { id: 'programs', label: 'Programs', icon: BookOpen, count: programs.length },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, count: testimonials.length },
    { id: 'news', label: 'News & Events', icon: Newspaper, count: news.length },
    { id: 'contact', label: 'Contact & Socials', icon: Phone },
  ];

  if (loading) return <LoadingSpinner size="lg" className="h-[55vh]" />;

  return (
    <div className="min-h-full bg-[#F5F7FB] text-slate-800 flex flex-col font-sans">

      {/* Unified Top Bar */}
      <PageHeader
        title="Website Admin & Public CMS"
        icon={<Globe className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CMS Live Sync Active</span>
            </span>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* ── 4 PASTEL KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#EBF3FF] to-[#D6E6FF] border-[#C5DBFF] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-800">Website Counters</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.length}</p>
              <p className="text-[11px] font-bold text-blue-700 mt-0.5">Live Stat Cards</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('programs')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#F1EDFF] to-[#DFD5FF] border-[#D0C2FF] shadow-[0_6px_18px_-6px_rgba(109,40,217,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-800">Programs Offered</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{programs.length}</p>
              <p className="text-[11px] font-bold text-violet-700 mt-0.5">Curriculum Cards</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testimonials')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FFF4E0] to-[#FFE1B3] border-[#FAD496] shadow-[0_6px_18px_-6px_rgba(217,119,6,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Testimonials</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{testimonials.length}</p>
              <p className="text-[11px] font-bold text-amber-800 mt-0.5">Parent &amp; Alumni Reviews</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(16,185,129,0.14)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">News &amp; Events</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{news.length}</p>
              <p className="text-[11px] font-bold text-emerald-800 mt-0.5">Campus Bulletins</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <Newspaper className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* ── PILL TAB SWITCHER ── */}
        <div className="bg-white rounded-[22px] p-1.5 shadow-sm border border-indigo-100/90 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & LIVE MINI WEBSITE PREVIEW                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Live Hero & Admissions Preview */}
            <div className="lg:col-span-8 bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FFF0F6] border-b border-indigo-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">Live Public Website Hero Preview</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('hero')}
                  className="text-xs font-extrabold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit Content
                </button>
              </div>

              <div className="p-6 space-y-5 bg-gradient-to-br from-[#F7FAFF] via-[#FFF9F2] to-[#F3FCF7]">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  {settings.heroSubtitle || DEFAULT_SETTINGS.heroSubtitle}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {settings.heroTitle || DEFAULT_SETTINGS.heroTitle}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {settings.heroDescription || DEFAULT_SETTINGS.heroDescription}
                </p>

                {/* Admissions CTA Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/85">Admissions Banner Preview</p>
                      <p className="text-sm sm:text-base font-black">
                        {settings.admissionsBannerTitle} {settings.admissionsYear}
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-white text-orange-600 text-xs font-black self-start sm:self-center">
                    Apply Now →
                  </span>
                </div>

                {/* Contact Footer Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                    <p className="font-extrabold text-slate-800 mt-0.5 truncate">{settings.contactPhone}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                    <p className="font-extrabold text-slate-800 mt-0.5 truncate">{settings.contactEmail}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                    <p className="font-extrabold text-slate-800 mt-0.5 truncate">{settings.contactAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CMS Completeness & Checklist */}
            <div className="lg:col-span-4 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Website Sync Checklist</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Public site dynamic readiness</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Hero & Admissions Banner', done: Boolean(settings.heroTitle && settings.admissionsYear), tab: 'hero' as WebsiteTab },
                  { label: 'Mission & Vision Copy', done: Boolean(settings.missionText && settings.visionText), tab: 'hero' as WebsiteTab },
                  { label: `Stats Cards (${stats.length} added)`, done: stats.length > 0, tab: 'stats' as WebsiteTab },
                  { label: `Programs (${programs.length} added)`, done: programs.length > 0, tab: 'programs' as WebsiteTab },
                  { label: `Testimonials (${testimonials.length} added)`, done: testimonials.length > 0, tab: 'testimonials' as WebsiteTab },
                  { label: `News & Events (${news.length} added)`, done: news.length > 0, tab: 'news' as WebsiteTab },
                  { label: 'Contact & Social Links', done: Boolean(settings.contactPhone && settings.contactEmail), tab: 'contact' as WebsiteTab },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      item.done
                        ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-900'
                        : 'bg-[#FFF8EB] border-amber-200 text-amber-900 hover:bg-amber-50'
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/80">
                      {item.done ? 'Synced' : 'Using Default'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: HERO, ADMISSIONS BANNER & MISSION / VISION              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'hero' && (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-6 py-4 border-b border-indigo-100/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">Hero Banner &amp; Admissions CTA</h2>
                    <p className="text-xs text-slate-500 font-medium">Main headline, badge, admissions notice &amp; school hero photo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, ...DEFAULT_SETTINGS }))}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold cursor-pointer"
                >
                  Load School Defaults
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Hero Top Badge / Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.heroSubtitle}
                    onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    placeholder="e.g. EXCELLENCE IN EDUCATION SINCE 2005"
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Hero Image URL (Optional)
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.heroImageUrl}
                      onChange={e => setSettings({ ...settings, heroImageUrl: e.target.value })}
                      placeholder="./image.png or https://..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                    placeholder="Shaping Brilliant Minds, Building Futures"
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Hero Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.heroDescription}
                    onChange={e => setSettings({ ...settings, heroDescription: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Admissions CTA Heading
                  </label>
                  <input
                    type="text"
                    value={settings.admissionsBannerTitle}
                    onChange={e => setSettings({ ...settings, admissionsBannerTitle: e.target.value })}
                    placeholder="ADMISSIONS OPEN FOR"
                    className="w-full px-4 py-2.5 bg-[#FFF8EB] border border-amber-200 rounded-xl text-sm font-extrabold text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Admissions Session Year
                  </label>
                  <input
                    type="text"
                    value={settings.admissionsYear}
                    onChange={e => setSettings({ ...settings, admissionsYear: e.target.value })}
                    placeholder="2027 – 2028"
                    className="w-full px-4 py-2.5 bg-[#FFF8EB] border border-amber-200 rounded-xl text-sm font-black text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mission & Vision Section */}
            <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Our Mission &amp; Vision Statements</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Displayed in the About Us section on the school website</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Our Mission
                  </label>
                  <textarea
                    rows={4}
                    value={settings.missionText}
                    onChange={e => setSettings({ ...settings, missionText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                    Our Vision
                  </label>
                  <textarea
                    rows={4}
                    value={settings.visionText}
                    onChange={e => setSettings({ ...settings, visionText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Publishing...' : 'Save & Sync Hero / Mission'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: WEBSITE STATISTICS COUNTERS (ADD / EDIT / DELETE)       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSaveStat} className="lg:col-span-5 bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  {editingStatId ? 'Edit Stat Counter' : 'Add Website Stat Counter'}
                </h3>
                {editingStatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStatId(null);
                      setStatForm({ value: '', label: '', color: 'blue', icon: 'fa-graduation-cap', order: 0 });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Display Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1500+"
                    value={statForm.value}
                    onChange={e => setStatForm({ ...statForm, value: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-black text-indigo-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={statForm.order}
                    onChange={e => setStatForm({ ...statForm, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Students Enrolled"
                  value={statForm.label}
                  onChange={e => setStatForm({ ...statForm, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Icon</label>
                <select
                  value={statForm.icon}
                  onChange={e => setStatForm({ ...statForm, icon: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none cursor-pointer"
                >
                  {STAT_ICON_OPTIONS.map(ic => (
                    <option key={ic.value} value={ic.value}>{ic.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Card Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setStatForm({ ...statForm, color: c.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer ${
                        statForm.color === c.value ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.swatch}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingStatId ? 'Update Stat Counter' : 'Add Stat Counter'}</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Active Counter Cards ({stats.length})
              </h3>
              {stats.length === 0 ? (
                <div className="py-12 text-center bg-[#F8FAFF] rounded-2xl border border-dashed border-indigo-200 text-xs font-bold text-slate-500">
                  No custom stats saved yet — the public website displays default counters until you add custom ones here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.map(s => (
                    <div key={s.id} className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-black text-slate-900">{s.value}</p>
                        <p className="text-xs font-bold text-slate-600">{s.label}</p>
                        <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                          {s.color} • {s.icon}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStatId(s.id);
                            setStatForm({ value: s.value, label: s.label, color: s.color || 'blue', icon: s.icon || 'fa-graduation-cap', order: s.order || 0 });
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStat(s.id)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: PROGRAMS & FOUNDATION (ADD / EDIT / DELETE)             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'programs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSaveProgram} className="lg:col-span-5 bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  {editingProgramId ? 'Edit Academic Program' : 'Add Academic Program'}
                </h3>
                {editingProgramId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProgramId(null);
                      setProgramForm({ title: '', description: '', icon: 'fa-flask', color: 'blue', order: 0 });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Program Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT-JEE & NEET Foundation"
                  value={programForm.title}
                  onChange={e => setProgramForm({ ...programForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Short description shown on the public website program card..."
                  value={programForm.description}
                  onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Icon</label>
                  <select
                    value={programForm.icon}
                    onChange={e => setProgramForm({ ...programForm, icon: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none cursor-pointer"
                  >
                    {PROGRAM_ICON_OPTIONS.map(ic => (
                      <option key={ic.value} value={ic.value}>{ic.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Order</label>
                  <input
                    type="number"
                    value={programForm.order}
                    onChange={e => setProgramForm({ ...programForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Theme Accent</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setProgramForm({ ...programForm, color: c.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer ${
                        programForm.color === c.value ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.swatch}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingProgramId ? 'Update Program' : 'Add Program'}</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Published Programs ({programs.length})
              </h3>
              {programs.length === 0 ? (
                <div className="py-12 text-center bg-[#F8FAFF] rounded-2xl border border-dashed border-indigo-200 text-xs font-bold text-slate-500">
                  No custom programs saved yet — default STEM/Robotics/Sports cards remain active until you publish custom programs.
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.map(p => (
                    <div key={p.id} className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-sm">{p.title}</h4>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-600">
                            {p.color}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProgramId(p.id);
                            setProgramForm({ title: p.title, description: p.description, icon: p.icon || 'fa-flask', color: p.color || 'blue', order: p.order || 0 });
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProgram(p.id)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 5: TESTIMONIALS MANAGER (NEWLY ACTIVATED!)                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'testimonials' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSaveTestimonial} className="lg:col-span-5 bg-white rounded-[24px] border border-amber-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  {editingTestimonialId ? 'Edit Testimonial' : 'Add Parent / Alumni Testimonial'}
                </h3>
                {editingTestimonialId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTestimonialId(null);
                      setTestimonialForm({ name: '', role: '', text: '', rating: 5, order: 0 });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={testimonialForm.name}
                  onChange={e => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Role / Context *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent of Grade 8 Student / Alumni JEE Ranker"
                  value={testimonialForm.role}
                  onChange={e => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Quote / Feedback *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share their experience at Sri Venkateswara JY School..."
                  value={testimonialForm.text}
                  onChange={e => setTestimonialForm({ ...testimonialForm, text: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTestimonialForm({ ...testimonialForm, rating: num })}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        num <= testimonialForm.rating
                          ? 'bg-amber-50 border-amber-300 text-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${num <= testimonialForm.rating ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingTestimonialId ? 'Update Testimonial' : 'Publish Testimonial'}</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Parent &amp; Student Stories ({testimonials.length})
              </h3>
              {testimonials.length === 0 ? (
                <div className="py-12 text-center bg-[#FFF8EB] rounded-2xl border border-dashed border-amber-200 text-xs font-bold text-amber-800">
                  No custom testimonials yet — add reviews here to showcase real parent stories on the school website.
                </div>
              ) : (
                <div className="space-y-3">
                  {testimonials.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl bg-[#FFFDF7] border border-amber-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{t.name}</span>
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {t.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 italic">&ldquo;{t.text}&rdquo;</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTestimonialId(t.id);
                            setTestimonialForm({ name: t.name, role: t.role, text: t.text, rating: t.rating || 5, order: t.order || 0 });
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 6: LATEST NEWS & EVENTS (ADD / EDIT / DELETE)              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form onSubmit={handleSaveNews} className="lg:col-span-5 bg-white rounded-[24px] border border-emerald-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">
                  {editingNewsId ? 'Edit News / Event' : 'Publish News & Event'}
                </h3>
                {editingNewsId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNewsId(null);
                      setNewsForm({ title: '', description: '', tag: 'Announcement', date: new Date().toISOString().slice(0, 10), order: 0 });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Science Exhibition 2026"
                  value={newsForm.title}
                  onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Tag</label>
                  <select
                    value={newsForm.tag}
                    onChange={e => setNewsForm({ ...newsForm, tag: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Event">Event</option>
                    <option value="Science">Science</option>
                    <option value="Sports">Sports</option>
                    <option value="Awards">Awards</option>
                    <option value="Admissions">Admissions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={newsForm.date}
                    onChange={e => setNewsForm({ ...newsForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Summary *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the campus update or achievement..."
                  value={newsForm.description}
                  onChange={e => setNewsForm({ ...newsForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingNewsId ? 'Update Article' : 'Publish News / Event'}</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Latest News &amp; Events ({news.length})
              </h3>
              {news.length === 0 ? (
                <div className="py-12 text-center bg-[#ECFDF5] rounded-2xl border border-dashed border-emerald-200 text-xs font-bold text-emerald-800">
                  No custom news articles yet — publish updates here to show live announcements on the public school website.
                </div>
              ) : (
                <div className="space-y-3">
                  {news.map(n => (
                    <div key={n.id} className="p-4 rounded-2xl bg-[#F8FAFF] border border-emerald-100 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            {n.tag}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm">{n.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{n.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewsId(n.id);
                            setNewsForm({
                              title: n.title,
                              description: n.description,
                              tag: n.tag || 'Announcement',
                              date: n.date ? new Date(n.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                              order: n.order || 0,
                            });
                          }}
                          className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNews(n.id)}
                          className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 7: CONTACT INFO & SOCIAL MEDIA LINKS                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] px-6 py-4 border-b border-indigo-100/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">Contact Details &amp; Social Media Links</h2>
                <p className="text-xs text-slate-500 font-medium">Synced directly with Top Bar, Contact Section &amp; Website Footer</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Public Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Public Support Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Campus Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      value={settings.contactAddress}
                      onChange={e => setSettings({ ...settings, contactAddress: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Facebook URL</label>
                  <div className="relative">
                    <ExternalLink className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://facebook.com/..."
                      value={settings.facebookUrl}
                      onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Instagram URL</label>
                  <div className="relative">
                    <ExternalLink className="w-4 h-4 text-pink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://instagram.com/..."
                      value={settings.instagramUrl}
                      onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">YouTube Channel URL</label>
                  <div className="relative">
                    <ExternalLink className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="https://youtube.com/@..."
                      value={settings.youtubeUrl}
                      onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving...' : 'Save Contact & Social Links'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default WebsiteManagerPage;
