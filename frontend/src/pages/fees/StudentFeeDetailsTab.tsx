import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, Users, MessageCircle, X, Share2, Copy } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toBlob } from 'html-to-image';
import toast from 'react-hot-toast';

interface StudentFeeDetailsProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const StudentFeeDetailsTab: React.FC<StudentFeeDetailsProps> = ({ students, structures, payments, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fee Reminder Modal State
  const [reminderStudent, setReminderStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Process data for the table
  const tableData = useMemo(() => {
    let filteredStudents = students;
    if (selectedClassId !== 'ALL') {
      filteredStudents = filteredStudents.filter(s => s.classId === selectedClassId);
    }
    if (searchTerm) {
      filteredStudents = filteredStudents.filter(s =>
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredStudents.map((student, index) => {
      const studentStructures = structures.filter(st =>
        st.studentId === student.id || (st.classId === student.classId && !st.studentId)
      );
      
      const totalFeeAmount = studentStructures.reduce((sum, st) => sum + (Number(st.amount) || 0), 0);

      const studentPayments = payments.filter(p =>
        p.studentId === student.id &&
        (p.status === 'PAID' || p.status === 'PARTIAL')
      );
      const paidAmount = studentPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

      const balance = totalFeeAmount - paidAmount;
      const studentClass = classes.find(c => c.id === student.classId);
      const phone = student.user?.phone || student.phone || '';

      return {
        sno: index + 1,
        id: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className: studentClass ? `${studentClass.name} - ${studentClass.section}` : '-',
        totalFee: totalFeeAmount,
        paidAmount,
        balance,
        phone,
      };
    });
  }, [students, structures, payments, classes, selectedClassId, searchTerm]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classLabel = selectedClassId !== 'ALL' && selectedClass
    ? `${selectedClass.name} - ${selectedClass.section}`
    : 'All Classes';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SRI VENKATESWARA JY SCHOOL', 105, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS-WISE FEE STATEMENT', 105, 28, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 33, 196, 33);

    // Class line
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Class: ${classLabel}`, 14, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 41, { align: 'right' });

    const tableColumn = ['S.No', 'Student ID', 'Student Name', 'Class', 'Total Fee', 'Paid', 'Balance'];
    const tableRows = tableData.map(row => [
      row.sno,
      row.id,
      row.name,
      row.className,
      `Rs. ${row.totalFee.toLocaleString('en-IN')}`,
      `Rs. ${row.paidAmount.toLocaleString('en-IN')}`,
      `Rs. ${row.balance.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 46,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 245, 250], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto' }, // Student Name auto width
        3: { cellWidth: 20 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 26 },
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = Number(String(data.cell.raw).replace(/[^0-9.-]+/g,""));
          if (val > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val <= 0 && val !== 0) {
            data.cell.styles.textColor = [5, 150, 105];
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 46;

    // Summary footer
    const totalFee = tableData.reduce((s, r) => s + (r.totalFee || 0), 0);
    const totalPaid = tableData.reduce((s, r) => s + r.paidAmount, 0);
    const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

    // Summary Table at the bottom
    autoTable(doc, {
      startY: finalY + 10,
      head: [['TOTAL FEE (Rs)', 'COLLECTED (Rs)', 'BALANCE DUE (Rs)']],
      body: [[
        totalFee.toLocaleString('en-IN'),
        totalPaid.toLocaleString('en-IN'),
        totalBalance.toLocaleString('en-IN')
      ]],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5, halign: 'center', valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
      bodyStyles: { fontStyle: 'bold', textColor: [20, 20, 20] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Fee_Statement_${classLabel.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  const handleWhatsAppClick = (row: any) => {
    if (!row.phone) {
      toast.error('No phone number available for this student.');
      return;
    }
    setReminderStudent(row);
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

        // Try Native Share (Works on Mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Fee Reminder',
            text: 'Please find your fee reminder attached.',
          });
          toast.success('Shared successfully!');
        } else {
          // Fallback for Desktop: Copy to clipboard and open WA Web
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

  const totalFee = tableData.reduce((s, r) => s + r.totalFee, 0);
  const totalPaid = tableData.reduce((s, r) => s + r.paidAmount, 0);
  const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls — hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 print:hidden">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Student Fee Details
          </h3>
          <p className="text-xs text-gray-400">View total fee, paid amount, and balances class-wise.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
        </div>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="w-full sm:w-48 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
        >
          <option value="ALL">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        {[
          { label: 'Total Fee', value: `₹${totalFee.toLocaleString('en-IN')}`, color: 'from-indigo-500 to-purple-600' },
          { label: 'Collected', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'from-emerald-500 to-teal-600' },
          { label: 'Balance Due', value: `₹${totalBalance.toLocaleString('en-IN')}`, color: 'from-rose-500 to-pink-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} p-4 rounded-2xl text-white shadow-md`}>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Print Header — only visible on print */}
      <div className="hidden print:block print:mb-4">
        <div style={{ background: '#1e1b4b', padding: '12px 16px', borderRadius: '0' }}>
          <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 900, margin: 0, textAlign: 'center' }}>SRI VENKATESWARA JY SCHOOL</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: '4px 0 0', textAlign: 'center' }}>Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 700, margin: '6px 0 0', textAlign: 'center' }}>STUDENT FEE STATEMENT</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', fontWeight: 600 }}>
          <span>Class: {classLabel}</span>
          <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-600 text-white font-semibold">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase">S.No</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Student ID</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Student Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Class</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-right">Total Fee</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-right">Paid</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-right">Balance</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-center print:hidden">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No students found.</td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.sno} className="hover:bg-indigo-50/30 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-medium">{row.sno}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600">{row.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.className}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">₹{row.totalFee.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 text-right font-black text-sm ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{row.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      {row.balance > 0 && row.phone && (
                        <button
                          onClick={() => handleWhatsAppClick(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                          title={`Generate fee reminder for ${row.phone}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Remind
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Fata Reminder Modal */}
      {reminderStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full animate-scale-in relative">
            <button 
              onClick={() => setReminderStudent(null)}
              className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* The actual Card to be captured */}
            <div id="fee-reminder-card" className="bg-white">
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
                <div className="relative z-10">
                  <h1 className="text-xl font-black text-white leading-tight">SRI VENKATESWARA<br/>JY SCHOOL</h1>
                  <p className="text-indigo-200 text-[10px] mt-1.5 max-w-[250px] mx-auto font-medium">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
                  <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                    <span className="text-white text-xs font-bold tracking-widest uppercase">Fee Reminder</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Student Details</p>
                  <h2 className="text-xl font-black text-gray-900 leading-tight">{reminderStudent.name}</h2>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{reminderStudent.id} • Class: {reminderStudent.className}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Fee</span>
                    <span className="text-sm font-black text-gray-800">₹{reminderStudent.totalFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-600 uppercase">Amount Paid</span>
                    <span className="text-sm font-black text-emerald-700">₹{reminderStudent.paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-rose-50 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Balance Due</span>
                    <span className="text-2xl font-black text-rose-600">₹{reminderStudent.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-[11px] font-bold text-gray-400">Please clear the pending dues at the earliest.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
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
              <p className="text-[10px] text-center text-gray-500 font-medium px-4">
                On mobile, this opens WhatsApp directly. On PC, it copies the photo so you can paste it into WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
