import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, MessageCircle, Download, Users, IndianRupee, AlertCircle, ChevronLeft, ChevronRight, X, Share2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/UI/PageHeader';
import { toBlob } from 'html-to-image';

export const FeeReminderPage: React.FC = () => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const defaultClassId = isTeacher && user?.teacher?.homeRoomClass?.id ? user.teacher.homeRoomClass.id : 'ALL';
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fee Reminder Modal State
  const [reminderStudent, setReminderStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isTeacher && user?.teacher?.homeRoomClass?.id) {
      setSelectedClassId(user.teacher.homeRoomClass.id);
    }
  }, [user, isTeacher]);

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

  const handleWhatsAppClick = (row: any) => {
    if (!row.phone) {
      toast.error(`No phone number registered for ${row.name}`);
      return;
    }
    setReminderStudent({
      id: row.id,
      name: row.name,
      className: row.className,
      totalFee: row.tuitionFee || row.totalFee || 0,
      paidAmount: row.paidAmount || 0,
      balance: row.balance || 0,
      phone: row.phone,
      photo: row.photo || row.photoUrl || ''
    });
  };

  const handleShareReminder = async () => {
    if (!reminderStudent) return;
    setIsGenerating(true);
    const node = document.getElementById('fee-reminder-card');
    
    try {
      if (node) {
        const blob = await toBlob(node, { quality: 1, backgroundColor: '#ffffff' });
        if (!blob) throw new Error('Failed to generate image');

        const cleanPhone = reminderStudent.phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const textMessage = encodeURIComponent(
          `Dear Parent of *${reminderStudent.name}*,\nThis is a reminder from *SRI VENKATESWARA JY SCHOOL*.\nPlease find the fee reminder attached.\nKindly clear the dues at the earliest.`
        );
        const waUrl = `https://wa.me/${fullPhone}?text=${textMessage}`;

        const file = new File([blob], `Fee_Reminder_${reminderStudent.id}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Fee Reminder',
            text: 'Please find your fee reminder attached.',
          });
          toast.success('Shared successfully!');
        } else {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Photo copied to clipboard! Paste it in the WhatsApp chat.', { duration: 5000 });
          } catch (e) {
            toast.error('Could not copy image automatically. Please screenshot the card.');
          }
          window.open(waUrl, '_blank');
        }
      }
    } catch (err) {
      toast.error('Error generating fee reminder photo.');
      console.error(err);
    } finally {
      setIsGenerating(false);
      setReminderStudent(null);
    }
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

      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
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
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen animate-fade" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Fee Reminder"
        icon={<IndianRupee className="w-5 h-5" />}
        action={!isTeacher ? (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const withBalance = tableData.filter((r: any) => r.phone && r.balance > 0);
                if (withBalance.length === 0) {
                  toast.error('No students with phone numbers and pending balance found on this page.');
                  return;
                }
                handleWhatsApp(withBalance[0].phone, withBalance[0].name, withBalance[0].balance, withBalance[0].className);
                toast.success(`Opening WhatsApp for ${withBalance[0].name}.`);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Send First Reminder
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 font-bold text-xs rounded-lg hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        ) : undefined}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

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
        {!isTeacher && (
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
        )}
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
                  {!isTeacher && <th className="px-4 py-3 text-xs font-bold uppercase">Student ID</th>}
                  <th className="px-4 py-3 text-xs font-bold uppercase">Student Name</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Class</th>
                  {!isTeacher && <th className="px-4 py-3 text-xs font-bold uppercase text-right">Fee</th>}
                  {!isTeacher && <th className="px-4 py-3 text-xs font-bold uppercase text-right">Paid</th>}
                  {!isTeacher && <th className="px-4 py-3 text-xs font-bold uppercase text-right">Balance</th>}
                  <th className="px-4 py-3 text-xs font-bold uppercase text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={isTeacher ? 4 : 8} className="px-6 py-10 text-center text-gray-500">
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
                      {!isTeacher && <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{row.id}</td>}
                      <td className="px-4 py-3 font-bold text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{row.className}</td>
                      {!isTeacher && <td className="px-4 py-3 text-right text-sm">₹{row.tuitionFee.toLocaleString('en-IN')}</td>}
                      {!isTeacher && <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>}
                      {!isTeacher && (
                        <td className="px-4 py-3 text-right font-black text-sm text-rose-600">
                          ₹{row.balance.toLocaleString('en-IN')}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleWhatsAppClick(row)}
                          className="inline-flex items-center justify-center p-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl transition-all shadow-sm cursor-pointer"
                          title={row.phone ? `Send to ${row.phone}` : 'No phone number'}
                        >
                          <MessageCircle className="w-4 h-4" />
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
      </div>

      {/* Fee Reminder Modal */}
      {reminderStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-in">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-800">Fee Reminder Card</h3>
              <button onClick={() => setReminderStudent(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Template wrapper */}
            <div className="p-6 bg-gray-50/50">
              <div id="fee-reminder-card" className="bg-white p-6 rounded-2xl border border-gray-200 max-w-sm mx-auto shadow-sm text-center font-sans">
                {/* Header */}
                <div className="flex items-center justify-center gap-3 border-b border-gray-150 pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-sm font-black text-slate-800 leading-tight">SRI VENKATESWARA JY SCHOOL</h1>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">IIT-JEE / NEET Foundation · Olympiads</p>
                  </div>
                </div>

                {/* Body */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  {reminderStudent.photo ? (
                    <img src={reminderStudent.photo} alt="Student" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm border-2 border-white">
                      {reminderStudent.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <h2 className="text-sm font-black text-gray-900 leading-tight truncate">{reminderStudent.name}</h2>
                    <p className="text-[10px] font-bold text-indigo-600 mt-1 truncate">{reminderStudent.id} • Class: {reminderStudent.className}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Total Fee</span>
                    <span className="text-xs font-black text-gray-800">₹{reminderStudent.totalFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Amount Paid</span>
                    <span className="text-xs font-black text-emerald-700">₹{reminderStudent.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Balance Due</span>
                    <span className="text-lg font-black text-rose-600">₹{reminderStudent.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[10px] font-bold text-gray-400">Please clear the pending dues at the earliest.</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
              <button
                onClick={handleShareReminder}
                disabled={isGenerating}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors cursor-pointer shadow-md shadow-green-500/25 disabled:opacity-70"
              >
                {isGenerating ? (
                  <span className="animate-pulse">Generating Photo...</span>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" /> 
                    <span>Share Photo on WhatsApp</span>
                  </>
                )}
              </button>
              <p className="text-[9px] text-center text-gray-500 font-medium px-4">
                On mobile, this opens WhatsApp directly. On PC, it copies the photo to clipboard so you can paste it into WhatsApp chat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeReminderPage;
