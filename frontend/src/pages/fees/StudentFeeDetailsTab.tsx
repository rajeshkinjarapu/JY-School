import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, Users, MessageCircle, X, Share2, Copy, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toBlob } from 'html-to-image';
import toast from 'react-hot-toast';

interface StudentFeeDetailsProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const StudentFeeDetailsTab: React.FC<StudentFeeDetailsProps> = ({ students, structures, payments, classes }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'TEACHER';
  const isAdminOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fee Reminder Modal State
  const [reminderStudent, setReminderStudent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Process data for the table
  const tableData = useMemo(() => {
    // Build lookup dictionaries for O(1) access to avoid O(N*M) slow rendering
    const classStructuresMap = new Map();
    const studentStructuresMap = new Map();
    
    structures.forEach(st => {
      if (st.studentId) {
        if (!studentStructuresMap.has(st.studentId)) studentStructuresMap.set(st.studentId, []);
        studentStructuresMap.get(st.studentId).push(st);
      } else if (st.classId) {
        if (!classStructuresMap.has(st.classId)) classStructuresMap.set(st.classId, []);
        classStructuresMap.get(st.classId).push(st);
      }
    });

    const studentPaymentsMap = new Map();
    payments.forEach(p => {
      if (p.studentId && (p.status === 'PAID' || p.status === 'PARTIAL')) {
        const current = studentPaymentsMap.get(p.studentId) || 0;
        studentPaymentsMap.set(p.studentId, current + (Number(p.amountPaid) || 0));
      }
    });

    const classMap = new Map(classes.map(c => [c.id, c]));

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

    const rawData = filteredStudents.map((student) => {
      const classStructs = classMap.get(student.classId) ? (classStructuresMap.get(student.classId) || []) : [];
      const stdStructs = studentStructuresMap.get(student.id) || [];
      const studentStructures = [...classStructs, ...stdStructs];
      
      const totalFeeAmount = studentStructures.reduce((sum, st) => sum + (Number(st.amount) || 0), 0);
      const paidAmount = studentPaymentsMap.get(student.id) || 0;

      const balance = totalFeeAmount - paidAmount;
      const studentClass = classMap.get(student.classId) || student.class;
      const phone = student.user?.phone || student.phone || '';

      return {
        studentId: student.id,
        id: student.rollNo || student.studentId || '-',
        name: student.user?.name || student.name || '-',
        className: studentClass ? `${studentClass.name}${studentClass.section ? ` - ${studentClass.section}` : ''}` : '-',
        totalFee: totalFeeAmount,
        paidAmount,
        balance,
        phone,
        photo: student.user?.avatar || student.photo || '',
      };
    });

    // Sort class-wise first, then by student name
    rawData.sort((a, b) => {
      if (a.className < b.className) return -1;
      if (a.className > b.className) return 1;
      return a.name.localeCompare(b.name);
    });

    // Assign S.No after sorting
    return rawData.map((row, index) => ({
      ...row,
      sno: index + 1
    }));
  }, [students, structures, payments, classes, selectedClassId, searchTerm]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classLabel = selectedClassId !== 'ALL' && selectedClass
    ? `${selectedClass.name} - ${selectedClass.section}`
    : 'All Classes';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
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
      row.totalFee.toLocaleString('en-IN'),
      row.paidAmount.toLocaleString('en-IN'),
      row.balance.toLocaleString('en-IN')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 46,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 245, 250], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
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

  const handleExportExcel = async () => {
    const excelData = tableData.map(row => ({
      'S.No': row.sno,
      'Student ID': row.id,
      'Student Name': row.name,
      'Class': row.className,
      'Total Fee': row.totalFee,
      'Paid': row.paidAmount,
      'Balance': row.balance
    }));

    const totalFee = tableData.reduce((s, r) => s + (r.totalFee || 0), 0);
    const totalPaid = tableData.reduce((s, r) => s + r.paidAmount, 0);
    const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);
    
    excelData.push({
      'S.No': '' as any,
      'Student ID': '' as any,
      'Student Name': '' as any,
      'Class': 'TOTAL',
      'Total Fee': totalFee,
      'Paid': totalPaid,
      'Balance': totalBalance
    });

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Details');

    XLSX.writeFile(workbook, `Fee_Statement_${classLabel.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`);
  };

  const handleWhatsAppClick = (row: any) => {
    if (!row.phone) {
      toast.error('No phone number registered for this student.');
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-3 mb-4 print:hidden items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
          />
        </div>
        <div className="md:w-56">
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer transition-all"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
            ))}
          </select>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-gray-200">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-indigo-100">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-teal-100">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 print:hidden">
        {[
          { label: 'TOTAL FEE', value: `₹${totalFee.toLocaleString('en-IN')}`, color: 'from-indigo-500 to-purple-600' },
          { label: 'COLLECTED', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'from-emerald-500 to-teal-600' },
          { label: 'BALANCE DUE', value: `₹${totalBalance.toLocaleString('en-IN')}`, color: 'from-rose-500 to-pink-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} px-3 py-2.5 sm:p-4 rounded-xl text-white shadow-sm flex flex-col justify-center`}>
            <p className="text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-tight whitespace-nowrap truncate">{s.label}</p>
            <p className="text-sm sm:text-xl font-black mt-0.5 whitespace-nowrap truncate">{s.value}</p>
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
      <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800 -mx-4 sm:mx-0 sm:border-x shadow-sm print:border-none print:shadow-none print:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse border border-gray-200">
            <thead className="bg-indigo-600 text-white font-semibold">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase border border-indigo-500">S.No</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold uppercase border border-indigo-500">Student ID</th>
                <th className="px-4 py-3 text-xs font-bold uppercase border border-indigo-500">Student Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase border border-indigo-500">Class</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold uppercase text-right border border-indigo-500">Total Fee</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold uppercase text-right border border-indigo-500">Paid</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold uppercase text-right border border-indigo-500">Balance</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold uppercase text-center border border-indigo-500 print:hidden">WhatsApp</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-center border border-indigo-500 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 border border-gray-200">No students found.</td>
                </tr>
              ) : (
                tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row) => (
                  <tr key={row.sno} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 font-medium border border-gray-200">{row.sno}</td>
                    
                    <td className="hidden lg:table-cell px-4 py-3 font-mono text-xs font-bold text-indigo-600 border border-gray-200">{row.id}</td>
                    
                    <td className="px-4 py-3 font-bold text-gray-900 border border-gray-200">{row.name}</td>
                    
                    <td className="px-4 py-3 text-gray-600 text-xs border border-gray-200">{row.className}</td>
                    
                    <td className="hidden lg:table-cell px-4 py-3 text-right font-medium text-gray-900 border border-gray-200">₹{row.totalFee.toLocaleString('en-IN')}</td>
                    
                    <td className="hidden lg:table-cell px-4 py-3 text-right font-medium text-emerald-600 border border-gray-200">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                    
                    <td className={`hidden lg:table-cell px-4 py-3 text-right font-black text-sm border border-gray-200 ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{row.balance.toLocaleString('en-IN')}
                    </td>
                    
                    <td className="hidden lg:table-cell px-4 py-3 text-center border border-gray-200 print:hidden">
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
                    
                    <td className="px-4 py-3 text-center border border-gray-200 print:hidden">
                      <button
                        onClick={() => navigate(`/students/${row.studentId}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        {tableData.length > itemsPerPage && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 print:hidden">
            <span className="text-sm text-gray-600 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(tableData.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(tableData.length / itemsPerPage)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 p-6 text-center relative overflow-hidden flex flex-col items-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
                <div className="relative z-10 flex flex-col items-center w-full">
                  <div className="flex items-center gap-3 w-full justify-center">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-md bg-white rounded-full p-1 shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="text-left">
                      <h1 className="text-base sm:text-lg font-black text-white leading-tight">SRI VENKATESWARA JY SCHOOL</h1>
                      <p className="text-indigo-200 text-[9px] mt-0.5 max-w-[240px] font-medium leading-relaxed">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                    <span className="text-white text-xs font-bold tracking-widest uppercase shadow-sm">Fee Reminder</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="mb-6 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="shrink-0">
                    {reminderStudent.photo ? (
                      <img src={reminderStudent.photo} alt="Student" className="w-16 h-16 rounded-full object-cover border-[3px] border-white shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-md border-[3px] border-white">
                        {reminderStudent.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Student Details</p>
                    <h2 className="text-lg font-black text-gray-900 leading-tight">{reminderStudent.name}</h2>
                    <p className="text-xs font-bold text-indigo-600 mt-1">{reminderStudent.id} • Class: {reminderStudent.className}</p>
                  </div>
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
