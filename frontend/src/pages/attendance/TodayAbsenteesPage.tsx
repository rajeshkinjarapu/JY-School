import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { Users, Search, AlertCircle, ArrowLeft, Download, Printer, Phone, MessageCircle, UserX, Clock } from 'lucide-react';
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
  const [filterTab, setFilterTab] = useState<'all' | 'absent' | 'leave'>('all');

  const fetchAbsentees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/attendance/dashboard-stats');
      const raw = res.data?.data || res.data || {};
      
      const absents = (raw.studentsAbsent || []).map((s: any) => ({
        ...s,
        type: 'ABSENT',
        statusLabel: 'Absent',
        reason: s.reason || 'Absent'
      }));
      
      const leaves = (raw.studentsOnLeave || []).map((s: any) => ({
        ...s,
        type: 'LEAVE',
        statusLabel: 'On Leave',
        reason: s.reason || 'Excused Leave'
      }));

      setAbsentees([...absents, ...leaves]);
    } catch (e: any) {
      toast.error('Failed to load absentees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsentees();
  }, []);

  const absentList = absentees.filter(s => s.type === 'ABSENT');
  const leaveList = absentees.filter(s => s.type === 'LEAVE');

  const filteredAbsentees = absentees.filter((student) => {
    const matchesFilter = 
      filterTab === 'all' ? true : 
      filterTab === 'absent' ? student.type === 'ABSENT' : 
      student.type === 'LEAVE';

    const matchesSearch =
      (student.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.mobileNumber || '').includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Header Branding
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('SRI VENKATESWARA JY SCHOOL', 14, 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Daily Absentees & Leaves Report — ${todayStr}`, 14, 23);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Listed: ${filteredAbsentees.length}  |  Absent Today: ${absentList.length}  |  On Leave: ${leaveList.length}`, 14, 29);

    const rows = filteredAbsentees.map((s, idx) => [
      idx + 1,
      s.studentId || '-',
      s.studentName || '-',
      s.className || '-',
      s.mobileNumber || '-',
      s.statusLabel || (s.type === 'LEAVE' ? 'On Leave' : 'Absent'),
      s.reason || '-'
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['S.No', 'Roll No', 'Student Name', 'Class', 'Phone', 'Status', 'Reason / Remarks']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 8.5, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 50, fontStyle: 'bold' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 25 }
      },
      margin: { top: 34, bottom: 12, left: 14, right: 14 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Printed from JY School ERP • Page ${data.pageNumber}`, 14, doc.internal.pageSize.getHeight() - 6);
      }
    });

    doc.save(`Absentees_Report_${todayStr.replace(/ /g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] w-full animate-fade-in font-sans">
      <PageHeader 
        title="Today's Absentees & Leaves" 
        icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
        action={
          <Link to="/attendance" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance Dashboard
          </Link>
        }
      />

      <div className="p-3 sm:p-6 lg:p-7 space-y-4 max-w-7xl mx-auto w-full">
        
        {/* Top 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div 
            onClick={() => setFilterTab('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${filterTab === 'all' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200/80 hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Not Present</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{absentees.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Absent + Leaves combined</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setFilterTab('absent')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${filterTab === 'absent' ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20' : 'bg-white border-slate-200/80 hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Absent Today</p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">{absentList.length}</p>
                <p className="text-[10px] text-rose-500/80 mt-0.5">Unexcused absentees</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setFilterTab('leave')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${filterTab === 'leave' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200/80 hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">On Leave Today</p>
                <p className="text-2xl font-black text-amber-700 mt-0.5">{leaveList.length}</p>
                <p className="text-[10px] text-amber-600/80 mt-0.5">Excused student leaves</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Card with Filter Tabs & Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          
          {/* Card Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({absentees.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('absent')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'absent' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'}`}
              >
                Absent ({absentList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('leave')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'leave' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-amber-600'}`}
              >
                On Leave ({leaveList.length})
              </button>
            </div>

            {/* Search & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, class, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-xl input w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={downloadPDF} 
                  disabled={filteredAbsentees.length === 0}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  title="Download Clean PDF Report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button 
                  onClick={handlePrint} 
                  disabled={filteredAbsentees.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredAbsentees.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-3 px-4 w-14 text-center">S.No</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Reason / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAbsentees.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-600">{student.studentId || '-'}</td>
                      <td className="py-3.5 px-6 font-extrabold text-slate-900">{student.studentName}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {student.mobileNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-700">{student.mobileNumber}</span>
                            <a 
                              href={`https://wa.me/91${student.mobileNumber.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a 
                              href={`tel:${student.mobileNumber}`} 
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="Call Parent"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${student.type === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {student.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-500 font-medium">
                        {student.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-700">No absentees or leaves found</p>
                <p className="text-xs text-slate-400 mt-1">All students are present or no records match your filter.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
