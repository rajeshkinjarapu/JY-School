import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { Users, Search, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const downloadPDF = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    doc.setFontSize(16);
    doc.text(`Absentees & Leaves List - ${todayStr}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total Absentees: ${filteredAbsentees.length}`, 14, 26);
    
    const rows = filteredAbsentees.map((s, idx) => [
      idx + 1,
      s.studentId || '-',
      s.studentName || '-',
      s.className || '-',
      s.mobileNumber || '-',
      s.reason || 'Absent'
    ]);

    const remainder = rows.length % 25;
    const padding = remainder === 0 && rows.length > 0 ? 0 : 25 - remainder;
    for (let i = 0; i < padding; i++) {
      rows.push(['', '', '', '', '', '']);
    }

    autoTable(doc, {
      startY: 32,
      head: [['S.No', 'Student ID', 'Student Name', 'Class', 'Mobile', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', minCellHeight: 9, valign: 'middle' },
      bodyStyles: { minCellHeight: 9.6, valign: 'middle' }, 
      styles: { fontSize: 9, cellPadding: 2, overflow: 'hidden' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 55 },
        3: { cellWidth: 20 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30 }
      },
      margin: { top: 32, bottom: 10, left: 14, right: 14 },
      didDrawPage: (data) => {
         doc.setFontSize(8);
         doc.setTextColor(150);
         doc.text(`Date: ${todayStr}`, 14, doc.internal.pageSize.getHeight() - 5);
      }
    });

    doc.save(`Absentees_List_${todayStr.replace(/ /g, '_')}.pdf`);
  };

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
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
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
              <button onClick={downloadPDF} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2.5">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
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
                    <th className="py-4 px-4 font-bold text-slate-600 uppercase tracking-wider text-xs w-16">S.No</th>
                    <th className="py-4 px-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Student ID</th>
                    <th className="py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs">Student Name</th>
                    <th className="py-4 px-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Class</th>
                    <th className="py-4 px-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Mobile Number</th>
                    <th className="py-4 px-6 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAbsentees.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-500 text-sm">{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-indigo-600 text-sm">{student.studentId || '-'}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{student.studentName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-600 text-sm">{student.className}</td>
                      <td className="py-4 px-4 font-semibold text-slate-600 text-sm">{student.mobileNumber || '-'}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${student.reason === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
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
