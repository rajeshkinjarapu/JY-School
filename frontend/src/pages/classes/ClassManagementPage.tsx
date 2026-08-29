import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { School, User, Users, Plus, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DataCache } from '../../services/dataCache';

const MobileClassAccordion: React.FC<{ cls: any, idx: number, isSuperAdmin: boolean, openEditModal: (cls: any) => void, handleDelete: (id: string) => void }> = ({ cls, idx, isSuperAdmin, openEditModal, handleDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
      {/* Header (Always Visible) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
            {idx + 1}
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-[15px]">
              Class {cls.name}-{cls.section}
            </h4>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              {cls._count?.students || 0} Students
            </p>
          </div>
        </div>
        <div className={`p-2 rounded-full transition-transform ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/30">
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Academic Year</p>
              <p className="text-xs font-black text-fuchsia-700 truncate">{cls.academicYear}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Class Teacher</p>
              <p className="text-xs font-black text-gray-800 truncate">{cls.classTeacher?.user?.name || 'Not Assigned'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <Link 
              to={`/classes/${cls.id}`}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl text-center shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              View Full Details
            </Link>
            <button
              onClick={() => openEditModal(cls)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => handleDelete(cls.id)}
                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl shadow-sm hover:bg-red-100 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ClassManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [capacity, setCapacity] = useState(40);

  const fetchInitialData = async (forceRefresh = false) => {
    try {
      const [cachedClasses, cachedTeachers] = await Promise.all([
        DataCache.get('classes', forceRefresh),
        DataCache.get('teachers')
      ]);
      if (cachedClasses) setClasses(cachedClasses);
      if (cachedTeachers) setTeachers(cachedTeachers);
    } catch (e) {
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setEditingClassId(null);
    setName('');
    setSection('');
    setAcademicYear('2024-2025');
    setClassTeacherId('');
    setCapacity(40);
    setShowModal(true);
  };

  const openEditModal = (cls: any) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setSection(cls.section);
    setAcademicYear(cls.academicYear || '2024-2025');
    setClassTeacherId(cls.classTeacherId || '');
    setCapacity(cls.capacity || 40);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassId) {
        await api.put(`/api/classes/${editingClassId}`, {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class updated successfully!');
      } else {
        await api.post('/api/classes', {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class created successfully!');
      }
      setShowModal(false);
      setName('');
      setSection('');
      setEditingClassId(null);
      DataCache.invalidate('classes');
      fetchInitialData(true);
    } catch (error: any) {
      toast.error(error.message || 'Error saving class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This will delete all course metadata.')) return;
    try {
      await api.delete(`/api/classes/${id}`);
      toast.success('Class deleted successfully');
      DataCache.invalidate('classes');
      fetchInitialData(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Classes Directory"
        icon={<School className="w-6 h-6" />}
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Class
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-3 md:p-4">
        {/* Desktop Table */}
        <div className="hidden md:block min-w-[800px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                <th className="px-5 py-4 text-center w-12 border-r border-gray-100">#</th>
                <th className="px-5 py-4 border-r border-gray-100">Class Info</th>
                <th className="px-5 py-4 border-r border-gray-100">Academic Year</th>
                <th className="px-5 py-4 border-r border-gray-100">Students</th>
                <th className="px-5 py-4 border-r border-gray-100">Class Teacher</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                    No classes configured yet. Create your first class!
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-indigo-50/50 transition-colors bg-white">
                    <td className="px-5 py-4 text-center text-sm font-bold text-gray-500 border-r border-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <Link to={`/classes/${cls.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white shadow-sm shrink-0">
                          <School className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {cls.name}-{cls.section}
                          </h4>
                          <span className="text-xs text-gray-500">View details</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <span className="text-xs font-bold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-3 py-1.5 rounded uppercase shadow-sm">
                        {cls.academicYear}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        {cls._count?.students || 0} Students
                      </div>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {cls.classTeacher?.user?.name || 'No Teacher'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit class"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(cls.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden">
          {loading ? (
             <LoadingSpinner size="lg" className="py-12" />
          ) : classes.length === 0 ? (
             <p className="text-center text-gray-400 font-bold py-12">No classes found.</p>
          ) : (
            classes.map((cls, idx) => (
              <MobileClassAccordion key={cls.id} cls={cls} idx={idx} isSuperAdmin={isSuperAdmin} openEditModal={openEditModal} handleDelete={handleDelete} />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">
                {editingClassId ? 'Edit Class Details' : 'Add New Class'}
              </h3>
              <p className="text-xs text-gray-400">Configure class details and assignments.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Class/Grade Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Section (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Teacher</label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Class Teacher</option>
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
                  {editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassManagementPage;

