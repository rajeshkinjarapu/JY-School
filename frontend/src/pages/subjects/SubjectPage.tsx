import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Plus, Edit, Trash2, School, BookOpen, Users, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/UI/PageHeader';

const SUBJECT_COLORS = [
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'from-fuchsia-500 to-purple-600', light: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', badge: 'bg-fuchsia-100 text-fuchsia-700' },
  { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', badge: 'bg-lime-100 text-lime-700' },
];

export const SubjectPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async () => {
    try {
      const [subRes, classRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects?limit=5000'),
        api.get('/api/classes?limit=5000'),
        api.get('/api/teachers?limit=5000'),
      ]);
      setSubjects(subRes.data || subRes || []);
      setClasses(classRes.data || classRes || []);
      setTeachers(teachRes.data.data || teachRes.data || []);
    } catch (e) {
      toast.error('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group subjects by name
  const groupedSubjects = subjects.reduce((acc: Record<string, any[]>, sub: any) => {
    const key = sub.name?.trim() || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});

  const uniqueSubjectNames = Object.keys(groupedSubjects).sort();

  const handleEditClick = (sub: any) => {
    setEditingSubject(sub);
    setName(sub.name);
    setClassId(sub.classId);
    setTeacherId(sub.classSubjectTeachers?.[0]?.teacherId || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject entry?')) return;
    try {
      await api.delete(`/api/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/api/subjects/${editingSubject.id}`, { name });
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId: editingSubject.classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        const subRes: any = await api.post('/api/subjects', { name, classId });
        const subject = subRes.data;
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: subject.id,
            teacherId,
          });
        }
        toast.success('Subject created and mapped successfully!');
      }

      setShowModal(false);
      setName('');
      setClassId('');
      setTeacherId('');
      setEditingSubject(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving subject details');
    }
  };

  const toggleExpand = (subjectName: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectName]: !prev[subjectName] }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Subjects & Curriculum"
        icon={<BookOpen className="w-6 h-6" />}
        action={
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setClassId('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Subject
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : uniqueSubjectNames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-bold">No subjects configured yet.</p>
            <p className="text-sm mt-1">Click "New Subject" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {uniqueSubjectNames.map((subjectName, idx) => {
              const entries = groupedSubjects[subjectName];
              const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
              const isExpanded = expandedSubjects[subjectName];
              const abbr = subjectName.substring(0, 2).toUpperCase();
              const displayEntries = isExpanded ? entries : [];

              return (
                <div
                  key={subjectName}
                  className={`bg-white rounded-2xl shadow-sm border ${color.border} overflow-hidden hover:shadow-lg transition-all duration-300`}
                >
                  {/* Card Header */}
                  <div 
                    className={`bg-gradient-to-br ${color.bg} p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
                    onClick={() => navigate('/subjects/' + encodeURIComponent(subjectName))}
                  >
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-3 w-16 h-16 rounded-full bg-white/10" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-xl shadow-inner border border-white/30">
                        {abbr}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5" />
                        {entries.length} {entries.length === 1 ? 'Class' : 'Classes'}
                      </div>
                    </div>
                    <div className="mt-3 relative z-10">
                      <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{subjectName}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-100">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
                <p className="text-xs text-gray-400">
                  {editingSubject ? 'Update subject name and assigned teacher.' : 'Configure a new subject and assign it to a class.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              {!editingSubject && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Class Room</label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}-{c.section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingSubject && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Class Room</label>
                  <input
                    type="text"
                    disabled
                    value={editingSubject.class ? `${editingSubject.class.name}-${editingSubject.class.section}` : 'N/A'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Assign Teacher (Optional)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors cursor-pointer shadow-md"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
