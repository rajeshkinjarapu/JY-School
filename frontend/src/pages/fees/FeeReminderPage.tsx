import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, MessageCircle, Download, Users, IndianRupee, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const FeeReminderPage: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Use a debounced search term if possible, otherwise we just use the raw search term. 
  // To avoid missing dependency errors, I'll just use the raw search term, react-query will handle caching.
  
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-dropdown'],
    queryFn: async () => {
      const res = await api.get('/api/classes?limit=750'); // Reduced to 750
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['pending-balances', selectedClassId, searchTerm, page],
    queryFn: async () => {
      const params: any = { limit, page };
      if (selectedClassId !== 'ALL') params.classId = selectedClassId;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/api/fees/pending-balances', { params });
      return res.data || { data: [], total: 0 };
    },
  });

  const tableData = pendingData?.data || [];
  const totalRecords = pendingData?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit);

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
    const withBalance = tableData.filter((r: any) => r.phone && r.balance > 0);
    if (withBalance.length === 0) {
      toast.error('No students with phone numbers and pending balance found on this page.');
      return;
    }
    handleWhatsApp(withBalance[0].phone, withBalance[0].name, withBalance[0].balance, withBalance[0].className);
    toast.success(`Opening WhatsApp for ${withBalance[0].name}. Open each student individually for bulk reminders.`);
  };

  const handleExportPDF = async () => {
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    try {
      // Fetch all for PDF export
      const params: any = { limit: 5000, page: 1 };
      if (selectedClassId !== 'ALL') params.classId = selectedClassId;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/api/fees/pending-balances', { params });
      const allPending = res.data?.data || [];

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
      doc.text(`Class: ${classLabel}   |   Pending Students: ${allPending.length}`, 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 35, { align: 'right' });

      autoTable(doc, {
        head: [['S.No', 'Student ID', 'Student Name', 'Class', 'Fee (₹)', 'Paid (₹)', 'Balance (₹)', 'Phone']],
        body: allPending.map((row: any, i: number) => [
          i + 1, row.id, row.name, row.className,
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
      toast.success('PDF exported successfully!', { id: 'pdf-toast' });
    } catch (e) {
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
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

          <div className="grid grid-cols-2 gap-4 mt-5">
            {[
              { label: 'Pending Dues (Total)', value: totalRecords, icon: AlertCircle },
              { label: 'Classes Loaded', value: classes.length, icon: Users },
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
            placeholder="Search student name or ID... (Press Enter to apply)"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>
        <select
          value={selectedClassId}
          onChange={e => {
            setSelectedClassId(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-sm font-medium"
        >
          <option value="ALL">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
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
                  tableData.map((row: any, i: number) => (
                    <tr
                      key={row.id + i}
                      className="hover:bg-rose-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{(page - 1) * limit + i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{row.id}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{row.className}</td>
                      <td className="px-4 py-3 text-right text-sm">₹{row.tuitionFee.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-black text-sm text-rose-600">
                        ₹{row.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleWhatsApp(row.phone, row.name, row.balance, row.className)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                          title={row.phone ? `Send to ${row.phone}` : 'No phone number'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of <span className="font-medium">{totalRecords}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeeReminderPage;
