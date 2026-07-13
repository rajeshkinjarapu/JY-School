import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { FileDown, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const AttendanceReportPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data || res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const loadReport = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res: any = await api.get('/api/attendance/report', {
        params: { classId },
      });
      setReport(res.data || []);
    } catch (e) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [classId]);

  const handleExport = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get(`/api/reports/attendance?classId=${classId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Attendance_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export attendance registry.', { id: importToast });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Attendance Analytics</h3>
          <p className="text-xs text-gray-400">View attendance rates and breakdown.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}-{c.section}
              </option>
            ))}
          </select>
          {classId && (
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
              <FileDown className="w-4.5 h-4.5" />
              <span>Export</span>
            </button>
          )}
          <Link to="/attendance" className="btn-primary text-sm">
            Mark Daily
          </Link>
        </div>
      </div>

      {classId ? (
        loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Total Days</th>
                  <th className="px-6 py-4">Present</th>
                  <th className="px-6 py-4">Absent</th>
                  <th className="px-6 py-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-semibold">{item.studentName}</td>
                    <td className="px-6 py-4 font-mono text-xs">{item.rollNo}</td>
                    <td className="px-6 py-4">{item.totalDays}</td>
                    <td className="px-6 py-4 text-green-600">{item.present}</td>
                    <td className="px-6 py-4 text-red-500">{item.absent}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      <span className={item.rate >= 75 ? 'text-green-600' : 'text-red-500'}>
                        {item.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-450">
                      No records configured for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>Please select a class to view attendance analytics.</p>
        </div>
      )}
    </div>
  );
};
export default AttendanceReportPage;
