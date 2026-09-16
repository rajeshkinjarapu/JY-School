import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { Users, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function TodayAbsenteesPage() {
  const [loading, setLoading] = useState(true);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAbsentees = async () => {
    try {
      const res = await api.get('/api/attendance/dashboard-stats');
      setAbsentees(res.data?.studentsOnLeave || []);
    } catch (e: any) {
      toast.error('Failed to load absentees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsentees();
  }, []);

  const filteredAbsentees = absentees.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full animate-fade-in">
      <PageHeader 
        title="Today's Absentees & Leaves" 
        icon={<AlertCircle className="w-6 h-6" />}
        action={
          <Link to="/attendance" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Users className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Absentees List</h3>
                <p className="text-sm text-slate-500">Total {filteredAbsentees.length} students on leave/absent today</p>
              </div>
            </div>
            
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input w-full bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredAbsentees.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs">Student Name</th>
                    <th className="py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs">Class</th>
                    <th className="py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs">Status / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAbsentees.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{student.studentName}</td>
                      <td className="py-4 px-6 font-semibold text-slate-600">{student.className}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${student.reason === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {student.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Users className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-bold text-slate-500">No absentees found for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
