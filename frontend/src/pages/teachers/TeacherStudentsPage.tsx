import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, Users, Eye, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const TeacherStudentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const res = await api.get('/api/students', { params: { limit: 5000 } });
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student: any) => {
      const studentName = student.user?.name?.toLowerCase() || '';
      const rollNo = student.rollNo?.toLowerCase() || '';
      const className = `${student.class?.name || ''}-${student.class?.section || ''}`.toLowerCase();
      return studentName.includes(query) || rollNo.includes(query) || className.includes(query);
    });
  }, [students, search]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
  };

  const avatarColors = [
    'from-indigo-500 to-purple-600',
    'from-teal-400 to-emerald-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-cyan-500',
    'from-violet-500 to-fuchsia-600',
  ];

  const getColor = (name: string) => {
    const idx = name ? name.charCodeAt(0) % avatarColors.length : 0;
    return avatarColors[idx];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Total Students</h2>
            <p className="text-xs text-indigo-500 font-semibold">View all students across the school</p>
          </div>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 grid place-items-center text-indigo-700 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 dark:text-white">School Student Roster</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{students.length} Total Students</p>
          </div>
        </div>
        <div className="flex-1 max-w-md relative mt-2 sm:mt-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll no or class..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/25"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">#</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Photo</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student Name</th>
                  <th className="hidden md:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student ID</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Class</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Section</th>
                  <th className="hidden lg:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Parent</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-gray-400 font-semibold text-sm">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student: any, idx: number) => {
                    const name = student.user?.name || 'Unknown';
                    const photoUrl = student.user?.photoUrl;
                    
                    return (
                      <tr key={student.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors group">
                        <td className="px-5 py-4 text-gray-400 font-bold text-xs">{idx + 1}</td>
                        <td className="px-5 py-3">
                          {photoUrl ? (
                            <img src={photoUrl.startsWith('http') ? photoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}`} alt={name} className="w-12 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-gray-200 dark:ring-gray-700" />
                          ) : (
                            <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-black text-lg border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-gray-200 dark:ring-gray-700`}>
                              {getInitials(name)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link to={`/students/${student.id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block">
                            {name}
                            <span className="block sm:hidden text-[10px] text-gray-500 font-semibold mt-1">Class {student.class?.name || 'N/A'}-{student.class?.section || 'N/A'}</span>
                          </Link>
                        </td>
                        <td className="hidden md:table-cell px-5 py-4">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                            {student.rollNo || '—'}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400">
                            {student.class?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                            {student.class?.section || 'N/A'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-5 py-4 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                          {student.fatherName || student.parentName || student.user?.phone || '—'}
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4 text-right">
                          <Link to={`/students/${student.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-lg transition-all" title="View Profile">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">
                Showing <span className="text-gray-700 dark:text-gray-200 font-bold">{filteredStudents.length}</span> students
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
