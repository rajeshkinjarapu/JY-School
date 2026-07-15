import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, Users, Eye, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const TeacherStudentsPage: React.FC = () => {
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      setLoading(true);
      try {
        const profileRes: any = await api.get('/api/teachers/my-profile');
        setTeacher(profileRes.data);

        const assignedClassIds = Array.from(new Set(
          (profileRes.data.classSubjectTeachers || []).map((assignment: any) => String(assignment.class.id))
        ));

        if (assignedClassIds.length === 0) {
          setStudents([]);
          return;
        }

        const studentRequests = assignedClassIds.map((classId) =>
          api.get('/api/students', { params: { classId, limit: 5000 } })
        );

        const responses: any = await Promise.all(studentRequests);
        const allStudents = responses.flatMap((response: any) => response.data?.data || response.data || []);
        const uniqueStudents = Array.from(new Map(allStudents.map((student: any) => [student.id, student])).values());
        setStudents(uniqueStudents);
      } catch (error) {
        toast.error('Unable to load assigned students.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const studentName = student.user?.name?.toLowerCase() || '';
      const rollNo = student.rollNo?.toLowerCase() || '';
      const className = `${student.class?.name || ''}-${student.class?.section || ''}`.toLowerCase();
      return studentName.includes(query) || rollNo.includes(query) || className.includes(query);
    });
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">My Students</h2>
          <p className="text-sm text-slate-500 mt-1">View assigned students by class and section.</p>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-[1.75rem] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 grid place-items-center text-indigo-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black">Assigned Student Roster</p>
              <p className="text-xs text-slate-500">{students.length} students across assigned classes</p>
            </div>
          </div>
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no or class"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-[1.75rem] p-5 shadow-sm">
          {students.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No students assigned to your classes yet.
            </div>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 uppercase text-[11px] tracking-[0.24em] font-black border-b border-slate-200">
                  <th className="px-4 py-4">Student</th>
                  <th className="px-4 py-4">Student ID</th>
                  <th className="px-4 py-4">Class</th>
                  <th className="px-4 py-4">Section</th>
                  <th className="px-4 py-4">Roll Number</th>
                  <th className="px-4 py-4">Parent / Contact</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-800">{student.user?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-slate-500">{student.studentId || student.id}</td>
                    <td className="px-4 py-4 text-slate-500">{student.class?.name || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-500">{student.class?.section || 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-500">{student.rollNo || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{student.fatherName || student.parentName || student.user?.phone || '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/students/${student.id}`} className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
