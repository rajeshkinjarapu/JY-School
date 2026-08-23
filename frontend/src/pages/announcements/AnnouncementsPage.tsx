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
  expiresAt: '', scheduledAt: '',
};

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    });
    setShowModal(true);
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
    <div className="flex flex-col h-full bg-slate-50/60" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Announcements</h1>
              <p className="text-xs text-white/70">School-wide broadcast system</p>
            </div>
          </div>
          {canCreate && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 font-bold text-sm rounded-xl shadow hover:bg-indigo-50 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Published', value: totalPublished, icon: CheckCircle, color: 'text-emerald-300' },
            { label: 'Urgent', value: totalUrgent, icon: Zap, color: 'text-red-300' },
            { label: 'Drafts', value: totalDraft, icon: Edit3, color: 'text-amber-300' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <div className="text-xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] text-white/70 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input placeholder="Search announcements…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
            <option value="ALL">All Priority</option>
            <option value="HIGH">🔴 Urgent</option>
            <option value="NORMAL">🔵 Normal</option>
            <option value="LOW">⚪ Low</option>
          </select>
          {isManagement && (
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Megaphone className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-bold text-gray-500">No announcements found</p>
            <p className="text-sm mt-1 text-gray-400">Try adjusting filters or create a new one</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Pinned</span>
                </div>
                <div className="space-y-3">
                  {pinned.map((ann, idx) => (
                    <AnnouncementCard key={ann.id} ann={ann} idx={idx} isManagement={isManagement}
                      expandedId={expandedId} setExpandedId={setExpandedId}
                      onDelete={handleDelete} onPin={handlePin} onEdit={openEdit}
                      onMarkRead={handleMarkRead} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular list */}
            <div className="space-y-3">
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-white" />
                <h3 className="text-lg font-black text-white">{editItem ? 'Edit Announcement' : 'Create Announcement'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Title *</label>
                <input type="text" required placeholder="e.g. Unit Test Schedule - Class 10"
                  value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Message *</label>
                <textarea required rows={5} placeholder="Type announcement details here..."
                  value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>

              {/* Row: Priority + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    <Flag className="w-3 h-3 inline mr-1" />Priority
                  </label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="HIGH">🔴 Urgent / High</option>
                    <option value="NORMAL">🔵 Normal</option>
                    <option value="LOW">⚪ Low / General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="PUBLISHED">✅ Publish Now</option>
                    <option value="DRAFT">📝 Save as Draft</option>
                    <option value="SCHEDULED">⏰ Schedule</option>
                  </select>
                </div>
              </div>

              {/* Schedule Date */}
              {form.status === 'SCHEDULED' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />Publish Date & Time
                  </label>
                  <input type="datetime-local" value={form.scheduledAt}
                    onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <Users className="w-3 h-3 inline mr-1" />Target Audience
                </label>
                <div className="flex gap-3 flex-wrap mb-2">
                  {['STUDENT', 'TEACHER', 'STAFF'].map(role => (
                    <label key={role} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                      form.targetRoles.includes(role)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input type="checkbox" checked={form.targetRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)} className="hidden" />
                      {role === 'STUDENT' ? <GraduationCap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {role}
                    </label>
                  ))}
                </div>
                <input type="text" placeholder="Specific Class (optional) e.g. 10-A, 9-B"
                  value={form.targetClass} onChange={e => setForm(f => ({...f, targetClass: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" />Expires At (optional)
                </label>
                <input type="datetime-local" value={form.expiresAt}
                  onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors cursor-pointer shadow-md disabled:opacity-50">
                  {saving ? 'Saving…' : (editItem ? 'Update' : 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
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
}> = ({ ann, idx, isManagement, expandedId, setExpandedId, onDelete, onPin, onEdit, onMarkRead }) => {
  const isExpanded = expandedId === ann.id;
  const priorityCfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.NORMAL;
  const statusCfg = STATUS_CONFIG[ann.status] || STATUS_CONFIG.PUBLISHED;
  const gradient = GRADIENT_BANDS[idx % GRADIENT_BANDS.length];
  const roles = typeof ann.targetRoles === 'string' ? ann.targetRoles.split(',').filter(Boolean) : (ann.targetRoles || []);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${ann.isPinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>
      {/* Top colored band */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow shrink-0 relative`}>
            <priorityCfg.icon className="w-5 h-5" />
            {ann.priority === 'HIGH' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {ann.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <h4 className="font-black text-base text-gray-900 leading-tight">{ann.title}</h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {/* Priority Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityCfg.bg} ${priorityCfg.color}`}>
                  {priorityCfg.label}
                </span>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 font-medium mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {roles.join(', ') || 'All'}
                {ann.targetClass && <span className="text-indigo-500 font-bold"> · {ann.targetClass}</span>}
              </span>
              {isManagement && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {ann.readCount || 0} read
                </span>
              )}
              {ann.hasRead && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle className="w-3 h-3" />Read
                </span>
              )}
            </div>

            {/* Content preview */}
            {!isExpanded && (
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{ann.content}</p>
            )}
            {isExpanded && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => {
                setExpandedId(isExpanded ? null : ann.id);
                if (!ann.hasRead) onMarkRead(ann.id);
              }}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">
                {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Read more</>}
              </button>

              {isManagement && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onPin(ann.id)} title={ann.isPinned ? 'Unpin' : 'Pin to top'}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer">
                    {ann.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => onEdit(ann)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(ann.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
