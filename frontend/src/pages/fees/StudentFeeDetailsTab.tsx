import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, Users, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentFeeDetailsProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const StudentFeeDetailsTab: React.FC<StudentFeeDetailsProps> = ({ students, structures, payments, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

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
      const tuitionStructure = studentStructures.find(st =>
        st.name?.toLowerCase().includes('tuition')
      ) || studentStructures[0];

      const tuitionFeeAmount = tuitionStructure?.amount || 0;

      let paidAmount = 0;
      if (tuitionStructure) {
        const studentPayments = payments.filter(p =>
          p.studentId === student.id &&
          p.feeStructureId === tuitionStructure.id &&
          p.status === 'PAID'
        );
        paidAmount = studentPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      }

      const balance = tuitionFeeAmount - paidAmount;
      const studentClass = classes.find(c => c.id === student.classId);
      const phone = student.user?.phone || student.phone || '';

      return {
        sno: index + 1,
        id: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className: studentClass ? `${studentClass.name} - ${studentClass.section}` : '-',
        tuitionFee: tuitionFeeAmount,
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
    doc.setFillColor(30, 27, 75); // dark indigo
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
    doc.text('STUDENT FEE STATEMENT', 105, 23, { align: 'center' });

    // Class line
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Class: ${classLabel}`, 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 35, { align: 'right' });

    const tableColumn = ['S.No', 'Student ID', 'Student Name', 'Class', 'Tuition Fee (₹)', 'Paid (₹)', 'Balance (₹)'];
    const tableRows = tableData.map(row => [
      row.sno,
      row.id,
      row.name,
      row.className,
      row.tuitionFee.toLocaleString('en-IN'),
      row.paidAmount.toLocaleString('en-IN'),
      row.balance.toLocaleString('en-IN')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, valign: 'middle' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 22 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const val = Number(String(data.cell.raw).replace(/,/g, ''));
          if (val > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val <= 0 && val !== 0) {
            data.cell.styles.textColor = [5, 150, 105];
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // Summary footer
    const totalFee = tableData.reduce((s, r) => s + r.tuitionFee, 0);
    const totalPaid = tableData.reduce((s, r) => s + r.paidAmount, 0);
    const totalBalance = tableData.reduce((s, r) => s + r.balance, 0);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 27, 75);
    doc.text(`Total Fee: ₹${totalFee.toLocaleString('en-IN')}   |   Collected: ₹${totalPaid.toLocaleString('en-IN')}   |   Balance: ₹${totalBalance.toLocaleString('en-IN')}`, 14, finalY + 8);

    doc.save(`Fee_Statement_${classLabel.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  const handleWhatsApp = (phone: string, name: string, balance: number) => {
    if (!phone) {
      alert('No phone number available for this student.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `Dear Parent of *${name}*,\n\nThis is a reminder from *SRI VENKATESWARA JY SCHOOL*.\n\nYour child's outstanding fee balance is *₹${balance.toLocaleString('en-IN')}*.\n\nKindly clear the dues at the earliest.\n\nThank you,\nJY School Administration`
    );
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  const totalFee = tableData.reduce((s, r) => s + r.tuitionFee, 0);
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
          <p className="text-xs text-gray-400">View tuition fee, paid amount, and balances class-wise.</p>
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
                <th className="px-4 py-3 text-xs font-bold uppercase text-right">Tuition Fee</th>
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
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">₹{row.tuitionFee.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">₹{row.paidAmount.toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 text-right font-black text-sm ${row.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{row.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      {row.balance > 0 && row.phone && (
                        <button
                          onClick={() => handleWhatsApp(row.phone, row.name, row.balance)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                          title={`Send fee reminder to ${row.phone}`}
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
    </div>
  );
};
