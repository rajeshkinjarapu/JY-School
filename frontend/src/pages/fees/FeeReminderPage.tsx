import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, MessageCircle, Download, Users, IndianRupee, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const FeeReminderPage: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/api/classes?limit=5000');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students-fee-reminder', selectedClassId],
    queryFn: async () => {
      const params: any = { limit: 5000 };
      if (selectedClassId !== 'ALL') params.classId = selectedClassId;
      const res = await api.get('/api/students', { params });
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return arr;
    },
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const res = await api.get('/api/fees/structures?limit=5000');
      return res.data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['fee-payments'],
    queryFn: async () => {
      const res = await api.get('/api/fees/payments?limit=5000');
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr;
    },
  });

  const tableData = useMemo(() => {
    let filteredStudents = students;
    if (searchTerm) {
      filteredStudents = filteredStudents.filter((s: any) =>
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredStudents.map((student: any, index: number) => {
      const studentStructures = structures.filter((st: any) =>
        st.studentId === student.id || (st.classId === student.classId && !st.studentId)
      );
      const tuitionStructure = studentStructures.find((st: any) =>
        st.name?.toLowerCase().includes('tuition')
      ) || studentStructures[0];

      const tuitionFeeAmount = tuitionStructure?.amount || 0;

      let paidAmount = 0;
      if (tuitionStructure) {
        const studentPayments = payments.filter((p: any) =>
          p.studentId === student.id &&
          p.feeStructureId === tuitionStructure.id &&
          p.status === 'PAID'
        );
        paidAmount = studentPayments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
      }

      const balance = tuitionFeeAmount - paidAmount;
      const studentClass = classes.find((c: any) => c.id === student.classId);
      const phone = student.user?.phone || student.phone || '';

      return {
        sno: index + 1,
        id: student.rollNo || '-',
        name: student.user?.name || '-',
        className: studentClass ? `${studentClass.name}-${studentClass.section}` : '-',
        tuitionFee: tuitionFeeAmount,
        paidAmount,
        balance,
        phone,
      };
    });
  }, [students, structures, payments, classes, searchTerm]);

  const pendingStudents = tableData.filter(r => r.balance > 0);
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);
  const classLabel = selectedClassId !== 'ALL' && selectedClass
    ? `${selectedClass.name}-${selectedClass.section}`
    : 'All Classes';

  const handleWhatsApp = (phone: string, name: string, balance: number, className: string) => {
    if (!phone) {
      toast.error(`No phone number for ${name}`);
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `Dear Parent of *${name}* (${className}),\n\nThis is a gentle reminder from *SRI VENKATESWARA JY SCHOOL*.\n\nYour child's outstanding fee balance is *₹${balance.toLocaleString('en-IN')}*.\n\nKindly clear the dues at the earliest to avoid any inconvenience.\n\nFor queries, please contact the school office.\n\nThank you,\nJY School Administration`
    );
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  const handleBulkReminder = () => {
    const withBalance = pendingStudents.filter(r => r.phone && r.balance > 0);
    if (withBalance.length === 0) {
      toast.error('No students with phone numbers and pending balance found.');
      return;
    }
    // Open first, then toast
    handleWhatsApp(withBalance[0].phone, withBalance[0].name, withBalance[0].balance, withBalance[0].className);
    toast.success(`Opening WhatsApp for ${withBalance[0].name}. Open each student individually for bulk reminders.`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SRI VENKATESWARA JY SCHOOL', 105, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta', 105, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE REMINDER STATEMENT', 105, 23, { align: 'center' });

    doc.setTextColor(30, 27, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Class: ${classLabel}   |   Pending Students: ${pendingStudents.length}`, 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 35, { align: 'right' });

    autoTable(doc, {
      head: [['S.No', 'Student ID', 'Student Name', 'Class', 'Fee (₹)', 'Paid (₹)', 'Balance (₹)', 'Phone']],
      body: pendingStudents.map(row => [
        row.sno, row.id, row.name, row.className,
        row.tuitionFee.toLocaleString('en-IN'),
        row.paidAmount.toLocaleString('en-IN'),
        row.balance.toLocaleString('en-IN'),
        row.phone || '-'
      ]),
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      },
      alternateRowStyles: { fillColor: [255, 245, 245] },
    });

    doc.save(`Fee_Reminder_${classLabel}_${Date.now()}.pdf`);
    toast.success('PDF exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
                Student Fee Reminder
              </h2>
              <p className="text-white/80 text-sm mt-1">Send WhatsApp fee reminders to parents class-wise</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleBulkReminder}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm rounded-xl transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Send First Reminder
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { label: 'Total Students', value: tableData.length, icon: Users },
              { label: 'Pending Dues', value: pendingStudents.length, icon: AlertCircle },
              { label: 'Total Balance', value: `₹${pendingStudents.reduce((s, r) => s + r.balance, 0).toLocaleString('en-IN')}`, icon: IndianRupee },
            ].map((s, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-white font-black text-lg mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-sm font-medium"
        >
          <option value="ALL">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loadingStudents ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-rose-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase">#</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Student ID</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Student Name</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-right">Fee</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-right">Paid</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-right">Balance</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-center">Remind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr
                      key={row.sno}
                      className={`hover:bg-rose-50/30 transition-colors ${row.balance > 0 ? '' : 'opacity-50'}`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.sno}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{row.id}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{row.className}</td>
                      <td className="px-4 py-3 text-right text-sm">₹{row.tuitionFee.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                      <td className={`px-4 py-3 text-right font-black text-sm ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{row.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.balance > 0 ? (
                          <button
                            onClick={() => handleWhatsApp(row.phone, row.name, row.balance, row.className)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                            title={row.phone ? `Send to ${row.phone}` : 'No phone number'}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">✓ Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeReminderPage;
