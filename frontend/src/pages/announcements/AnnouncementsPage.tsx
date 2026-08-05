import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Megaphone, Trash2, Bell, Users, GraduationCap, ChevronRight, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700 border border-blue-200',
  TEACHER: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  STAFF: 'bg-orange-100 text-orange-700 border border-orange-200',
  ALL: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const ANNOUNCEMENT_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-sky-600',
];

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>(['STUDENT', 'TEACHER']);

  const fetchAnnouncements = async () => {
    try {
      const res: any = await api.get('/api/announcements');
      setAnnouncements(res.data || res || []);
    } catch (e) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleRoleToggle = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRoles.length === 0) {
      toast.error('Please select at least one target audience role');
      return;
    }
    try {
      await api.post('/api/announcements', {
        title,
        content,
        targetRoles: targetRoles,
      });
      toast.success('Announcement broadcast successfully!');
      setShowModal(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Error publishing notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this notice?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      toast.success('Notice removed successfully');
      fetchAnnouncements();
    } catch (e) {
      toast.error('Failed to remove notice');
    }
  };

  const isManagement = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-6 py-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Announcements</h1>

          </div>
        </div>
        {isManagement && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-orange-700 bg-white rounded-xl shadow hover:bg-orange-50 transition-colors w-full md:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600 font-medium">
          <Bell className="w-4 h-4 text-orange-500" />
          <span><strong className="text-gray-900">{announcements.length}</strong> notices</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 font-medium">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span>Students & Teachers</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Megaphone className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-bold">No notices posted yet.</p>
            <p className="text-sm mt-1">Create your first announcement to get started.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {announcements.map((ann, idx) => {
              const gradient = ANNOUNCEMENT_GRADIENTS[idx % ANNOUNCEMENT_GRADIENTS.length];
              const roles = typeof ann.targetRoles === 'string' ? ann.targetRoles.split(',') : ann.targetRoles || [];
              return (
                <div key={ann.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  {/* Colored top bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-sm shrink-0`}>
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-black text-base text-gray-900 leading-tight">
                            {ann.title}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex gap-1.5">
                              {roles.map((r: string) => (
                                <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[r.trim()] || 'bg-gray-100 text-gray-600'}`}>
                                  {r.trim()}
                                </span>
                              ))}
                            </div>
                            {isManagement && (
                              <button
                                onClick={() => handleDelete(ann.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Remove notice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-1 mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Posted on {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {ann.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Publish Notice</h3>
                  <p className="text-xs text-gray-400">Broadcast to selected roles.</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Day Holiday Announcement"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type notice message details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Audience</label>
                <div className="flex gap-3 flex-wrap">
                  {['STUDENT', 'TEACHER'].map((role) => (
                    <label key={role} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold ${
                      targetRoles.includes(role)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="hidden"
                      />
                      {role === 'STUDENT' ? <GraduationCap className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors cursor-pointer shadow-md"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
