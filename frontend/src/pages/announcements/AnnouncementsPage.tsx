import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Megaphone, Trash2, Bell, Users, GraduationCap, X, Pin, PinOff,
  Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Eye,
  Calendar, Flag, Edit3, Search, Filter, Archive, Zap, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AnnouncementReadersModal } from './AnnouncementReadersModal';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; dot: string }> = {
  HIGH:   { label: 'Urgent',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200',    icon: Zap,          dot: 'bg-red-500' },
  NORMAL: { label: 'Normal',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',  icon: Bell,         dot: 'bg-blue-500' },
  LOW:    { label: 'General', color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',  icon: Archive,      dot: 'bg-gray-400' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED:  { label: 'Published',  color: 'text-emerald-700', bg: 'bg-emerald-100' },
  DRAFT:      { label: 'Draft',      color: 'text-amber-700',   bg: 'bg-amber-100' },
  SCHEDULED:  { label: 'Scheduled',  color: 'text-purple-700',  bg: 'bg-purple-100' },
  EXPIRED:    { label: 'Expired',    color: 'text-gray-500',    bg: 'bg-gray-100' },
};

const GRADIENT_BANDS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-sky-600',
];

const defaultForm = {
  title: '', content: '', targetRoles: ['STUDENT', 'TEACHER'],
  targetClass: '', priority: 'NORMAL', status: 'PUBLISHED',
  expiresAt: '', scheduledAt: '', image: '',
};

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewReadersAnnId, setViewReadersAnnId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const isManagement = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const canCreate = isManagement || isTeacher;

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/announcements?limit=100');
      const data = res.data?.data || res.data || [];
      setAnnouncements(Array.isArray(data) ? data : data.items || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleRoleToggle = (role: string) => {
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));
  };

  const openCreate = () => {
    setEditItem(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (ann: any) => {
    setEditItem(ann);
    setForm({
      title: ann.title || '',
      content: ann.content || '',
      targetRoles: typeof ann.targetRoles === 'string' ? ann.targetRoles.split(',').filter(Boolean) : (ann.targetRoles || []),
      targetClass: ann.targetClass || '',
      priority: ann.priority || 'NORMAL',
      status: ann.status || 'PUBLISHED',
      expiresAt: ann.expiresAt ? ann.expiresAt.substring(0, 16) : '',
      scheduledAt: ann.scheduledAt ? ann.scheduledAt.substring(0, 16) : '',
      image: ann.image || '',
    });
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.targetRoles.length === 0) { toast.error('Select at least one target audience'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null,
        scheduledAt: form.scheduledAt || null,
        targetClass: form.targetClass || null,
      };
      if (editItem) {
        await api.put(`/api/announcements/${editItem.id}`, payload);
        toast.success('Announcement updated!');
      } else {
        await api.post('/api/announcements', payload);
        toast.success('Announcement published!');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch { toast.error('Failed to delete'); }
  };

  const handlePin = async (id: string) => {
    try {
      await api.patch(`/api/announcements/${id}/pin`);
      fetchAnnouncements();
    } catch { toast.error('Failed to pin'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/api/announcements/${id}/read`);
      fetchAnnouncements();
    } catch {}
  };

  const filtered = announcements.filter(a => {
    if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !a.content?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterPriority !== 'ALL' && a.priority !== filterPriority) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const pinned = filtered.filter(a => a.isPinned);
  const regular = filtered.filter(a => !a.isPinned);

  // Stats
  const totalPublished = announcements.filter(a => a.status === 'PUBLISHED').length;
  const totalUrgent = announcements.filter(a => a.priority === 'HIGH').length;
  const totalDraft = announcements.filter(a => a.status === 'DRAFT').length;

  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Announcements" 
        icon={<Megaphone className="w-5 h-5" />}
        action={
          canCreate ? (
            <button onClick={openCreate} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold">
              <Plus className="w-5 h-5" /> Create Announcement
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Published</p>
                <h3 className="text-3xl font-black text-gray-800">{totalPublished}</h3>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Urgent</p>
                <h3 className="text-3xl font-black text-gray-800">{totalUrgent}</h3>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Drafts</p>
                <h3 className="text-3xl font-black text-gray-800">{totalDraft}</h3>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search announcements..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shrink-0">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                  value={filterPriority} 
                  onChange={e => setFilterPriority(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer py-1"
                >
                  <option value="ALL">All Priority</option>
                  <option value="HIGH">Urgent</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">General</option>
                </select>
              </div>
              {isManagement && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shrink-0">
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer py-1"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-24"><LoadingSpinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-24 text-gray-400">
                <div className="p-6 bg-gray-50 rounded-full mb-4">
                  <Megaphone className="w-12 h-12 text-gray-300" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-1">No announcements found</p>
                <p className="text-sm text-gray-500">Try adjusting filters or create a new announcement.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pinned Section */}
                {pinned.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Pin className="w-5 h-5 text-amber-500" />
                      <h2 className="text-lg font-black text-gray-800">Pinned Announcements</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pinned.map((ann, idx) => (
                        <AnnouncementCard key={ann.id} ann={ann} idx={idx} isManagement={isManagement}
                          expandedId={expandedId} setExpandedId={setExpandedId}
                          onDelete={handleDelete} onPin={handlePin} onEdit={openEdit}
                          onMarkRead={handleMarkRead} onViewReaders={setViewReadersAnnId} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Section */}
                {regular.length > 0 && (
                  <div className="space-y-4">
                    {pinned.length > 0 && (
                      <div className="flex items-center gap-2 px-2 mt-4">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-black text-gray-800">Recent Announcements</h2>
                      </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {regular.map((ann, idx) => (
                        <AnnouncementCard key={ann.id} ann={ann} idx={idx + pinned.length} isManagement={isManagement}
                          expandedId={expandedId} setExpandedId={setExpandedId}
                          onDelete={handleDelete} onPin={handlePin} onEdit={openEdit}
                          onMarkRead={handleMarkRead} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{editItem ? 'Edit Announcement' : 'Create Announcement'}</h3>
                  <p className="text-sm text-gray-500 font-medium">Broadcast a message to your school community</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Title *</label>
                <input type="text" required placeholder="e.g. Annual Sports Meet 2026"
                  value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium" />
              </div>

              {/* Image Upload (Optional) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Image (Optional)</label>
                <div className="flex items-center gap-4">
                  {form.image && (
                    <img src={form.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer" />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Message *</label>
                <textarea required rows={6} placeholder="Write your announcement details here..."
                  value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Priority Level</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { val: 'HIGH', label: 'Urgent', color: 'red' },
                      { val: 'NORMAL', label: 'Normal', color: 'blue' },
                      { val: 'LOW', label: 'General', color: 'gray' }
                    ].map(p => (
                      <label key={p.val} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${form.priority === p.val ? `border-${p.color}-500 bg-white shadow-sm ring-1 ring-${p.color}-500` : 'border-gray-200 hover:border-gray-300 bg-transparent'}`}>
                        <input type="radio" name="priority" value={p.val} checked={form.priority === p.val} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="hidden" />
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${form.priority === p.val ? `border-${p.color}-500` : 'border-gray-300'}`}>
                          {form.priority === p.val && <div className={`w-2 h-2 rounded-full bg-${p.color}-500`} />}
                        </div>
                        <span className={`font-bold ${form.priority === p.val ? `text-${p.color}-700` : 'text-gray-600'}`}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Target Audience</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['STUDENT', 'TEACHER', 'STAFF'].map(role => (
                        <label key={role} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                          form.targetRoles.includes(role)
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}>
                          <input type="checkbox" checked={form.targetRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)} className="hidden" />
                          {role === 'STUDENT' ? <GraduationCap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Specific Class (Optional)</label>
                    <input type="text" placeholder="e.g. 10-A"
                      value={form.targetClass} onChange={e => setForm(f => ({...f, targetClass: e.target.value}))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Publish Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="PUBLISHED">Publish Immediately</option>
                    <option value="DRAFT">Save as Draft</option>
                    <option value="SCHEDULED">Schedule for Later</option>
                  </select>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Expires At (Optional)</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Schedule Date */}
              {form.status === 'SCHEDULED' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />Scheduled Publish Date & Time
                  </label>
                  <input type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-8 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50">
                  {saving ? 'Processing...' : (editItem ? 'Save Changes' : 'Publish Announcement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Readers Modal */}
      {viewReadersAnnId && (
        <AnnouncementReadersModal 
          announcementId={viewReadersAnnId} 
          onClose={() => setViewReadersAnnId(null)} 
        />
      )}
    </div>
  );
};

// Announcement Card Component
const AnnouncementCard: React.FC<{
  ann: any; idx: number; isManagement: boolean; expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDelete: (id: string) => void; onPin: (id: string) => void;
  onEdit: (ann: any) => void; onMarkRead: (id: string) => void;
  onViewReaders: (id: string) => void;
}> = ({ ann, idx, isManagement, expandedId, setExpandedId, onDelete, onPin, onEdit, onMarkRead, onViewReaders }) => {
  const isExpanded = expandedId === ann.id;
  const priorityCfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL;
  const statusCfg = STATUS_CONFIG[ann.status] || STATUS_CONFIG.PUBLISHED;
  const roles = typeof ann.targetRoles === 'string' ? ann.targetRoles.split(',').filter(Boolean) : (ann.targetRoles || []);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg ${ann.isPinned ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 hover:border-indigo-200'}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          
          {/* Status/Priority Indicator Bar */}
          <div className={`w-1.5 h-full absolute left-0 top-0 bottom-0 ${priorityCfg.dot}`} />

          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.isPinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                  <h4 className="font-black text-lg text-gray-900 leading-tight tracking-tight">{ann.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${priorityCfg.bg} ${priorityCfg.color}`}>
                    <priorityCfg.icon className="w-3.5 h-3.5" />
                    {priorityCfg.label}
                  </span>
                </div>
              </div>
              
              {/* Management Actions */}
              {isManagement && (
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
                  <button onClick={() => onPin(ann.id)} title={ann.isPinned ? 'Unpin' : 'Pin to top'}
                    className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-white hover:shadow-sm transition-all">
                    {ann.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button onClick={() => onEdit(ann)} title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-white hover:shadow-sm transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button onClick={() => onDelete(ann.id)} title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Target Audience Tags */}
            <div className="flex items-center gap-2 mb-4 mt-3">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visible To:</span>
              <div className="flex flex-wrap gap-1.5">
                {roles.length === 0 ? <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-center">ALL</span> : roles.map((r: string) => (
                  <span key={r} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{r}</span>
                ))}
                {ann.targetClass && <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Class: {ann.targetClass}</span>}
              </div>
            </div>

            {/* Content Preview */}
            <div className={`bg-gray-50 rounded-xl p-4 border border-gray-100 ${isExpanded ? '' : 'max-h-32 overflow-hidden relative'}`}>
              {ann.image && (
                <img src={ann.image} alt={ann.title} className="w-full max-h-64 object-contain rounded-xl mb-4 bg-white border border-gray-200" />
              )}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                {ann.content}
              </p>
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
              <button 
                onClick={() => {
                  setExpandedId(isExpanded ? null : ann.id);
                  if (!ann.hasRead) onMarkRead(ann.id);
                }}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg"
              >
                {isExpanded ? <><ChevronUp className="w-4 h-4" /> Collapse</> : <><ChevronDown className="w-4 h-4" /> Read Full Announcement</>}
              </button>

              <div className="flex items-center gap-4">
                {isManagement && (
                  <button onClick={() => onViewReaders(ann.id)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <Eye className="w-4 h-4" />
                    {ann.readCount || 0} Views
                  </button>
                )}
                {ann.hasRead && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <CheckCircle className="w-4 h-4" /> Read
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
