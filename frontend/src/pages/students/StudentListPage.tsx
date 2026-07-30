import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Search,
  Plus,
  Upload,
  Download,
  Image as ImageIcon,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  User,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Student {
  id: string;
  rollNo: string;
  fatherName: string;
  user: {
    id: string;
    name: string;
    phone: string;
    photoUrl: string | null;
    isActive: boolean;
  };
  class: {
    name: string;
    section: string;
  };
}

export default function StudentListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/students?page=${page}&limit=10&search=${searchTerm}`);
      if (res.data.success) {
        setStudents(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, selectedClass]);

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {total} Records
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage student records, view profiles, and update details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>Bulk Photos</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Upload</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Enrolled</p>
            <p className="text-xl font-bold text-slate-900">{total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Classes</p>
            <p className="text-xl font-bold text-slate-900">14</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">New Admissions</p>
            <p className="text-xl font-bold text-slate-900">28</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pre-Primary (PP1)</p>
            <p className="text-xl font-bold text-slate-900">42</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or Student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
              >
                <option value="ALL">All Classes</option>
                <option value="PP1">PP1</option>
                <option value="PP2">PP2</option>
                <option value="Class 1">Class 1</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Student Info</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Class & Sec</th>
                <th className="py-3.5 px-4">Father Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>Loading students...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : students.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {student.user.photoUrl ? (
                        <img
                          src={student.user.photoUrl}
                          alt={student.user.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs ring-2 ring-slate-100">
                          {student.user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {student.user.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {student.rollNo}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {student.class?.name || 'N/A'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                        {student.class?.section || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {student.fatherName || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{student.user.phone || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {student.user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="View Profile">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{(page - 1) * 10 + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * 10, total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm">
              {page}
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}