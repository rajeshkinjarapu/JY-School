import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { School, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeacherClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const profileRes: any = await api.get('/api/teachers/my-profile');
        setTeacher(profileRes.data);

        const assignmentsRes: any = await api.get(`/api/teachers/${profileRes.data.id}/assigned-classes`);
        setClasses(assignmentsRes.data || []);
      } catch (error) {
        toast.error('Unable to load assigned classes.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Assigned Classes</h2>
          <p className="text-sm text-slate-500 mt-1">Subject-wise class assignments you teach.</p>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {classes.length === 0 ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center text-slate-500">
              No assigned classes found.
            </div>
          ) : classes.map((assignment: any) => (
            <div key={assignment.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-black">Class</p>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{assignment.class.name}-{assignment.class.section}</h3>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-700">{assignment.subject.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Subject Code: {assignment.subject.code || 'N/A'}</span>
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-[0.15em] font-black">Class Size: {assignment.class._count?.students ?? 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClassesPage;
