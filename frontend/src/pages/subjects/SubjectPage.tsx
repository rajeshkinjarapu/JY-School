import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Plus, Edit, Trash2, BookOpen, ChevronRight, School } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const SUBJECT_COLORS = [
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
  { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', dot: 'bg-cyan-500' },
  { bg: 'from-fuchsia-500 to-purple-600', light: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-100', dot: 'bg-fuchsia-500' },
  { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-100', dot: 'bg-lime-500' },
];

export const SubjectPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
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
    setCode(sub.code);
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
        await api.put(`/api/subjects/${editingSubject.id}`, { name, code });
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        const subRes: any = await api.post('/api/subjects', { name, code, classId });
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
      setCode('');
      setClassId('');
      setTeacherId('');
      setEditingSubject(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving subject details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 md:rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Subjects & Curriculum</h1>
          <p className="text-white/80 text-sm font-medium mt-1">Manage subjects and assign them to specific classes and teachers.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setCode('');
              setClassId('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : uniqueSubjectNames.length === 0 ? (
        <div className="py-16 text-center text-gray-400 font-semibold">
          No subjects configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 px-4 md:px-0">
          {uniqueSubjectNames.map((subjectName, idx) => {
            const entries = groupedSubjects[subjectName];
            const colorIdx = idx % SUBJECT_COLORS.length;
            const color = SUBJECT_COLORS[colorIdx];
            const isExpanded = expandedSubject === subjectName;
            const abbr = subjectName.substring(0, 2).toUpperCase();

            return (
              <div
                key={subjectName}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-br ${color.bg} p-5 relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-3 w-16 h-16 rounded-full bg-white/10" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-xl shadow-inner border border-white/30">
                      {abbr}
                    </div>
                    <span className="text-white/80 text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                      {entries.length} {entries.length === 1 ? 'Class' : 'Classes'}
                    </span>
                  </div>
                  <div className="mt-3 relative z-10">
                    <h3 className="text-white font-black text-lg leading-tight drop-shadow-sm">{subjectName}</h3>
                  </div>
                </div>

                {/* Class List */}
                <div className="p-4">
                  <div className={`space-y-1.5 overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'max-h-[100px]'}`}>
                    {entries.map((sub: any, i: number) => (
                      <div key={sub.id} className="flex items-center justify-between gap-2 group/item">
                        <div className="flex items-center gap-2 min-w-0">
                          <School className={`w-3.5 h-3.5 shrink-0 ${color.text}`} />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                            {sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(sub)}
                            className="p-1 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {entries.length > 3 && (
                    <button
                      onClick={() => setExpandedSubject(isExpanded ? null : subjectName)}
                      className={`mt-2 flex items-center gap-1 text-xs font-bold ${color.text} hover:underline cursor-pointer`}
                    >
                      {isExpanded ? 'Show less' : `+${entries.length - 3} more`}
                      <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Add Class to Subject */}
                <div className={`px-4 pb-4`}>
                  <button
                    onClick={() => {
                      setEditingSubject(null);
                      setName(subjectName);
                      setCode(entries[0]?.code || '');
                      setClassId('');
                      setTeacherId('');
                      setShowModal(true);
                    }}
                    className={`w-full py-1.5 text-xs font-bold ${color.light} ${color.text} ${color.border} border rounded-xl hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to another class
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <p className="text-xs text-gray-400">
                {editingSubject ? 'Modify classroom details and assigned teacher.' : 'Configure a new subject and assign teaching staff.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Subject Code (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MATH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Room</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="input"
                  disabled={!!editingSubject}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}-{c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assign Teacher (Optional)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="input"
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
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
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
