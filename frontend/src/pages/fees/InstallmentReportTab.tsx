import React, { useState, useMemo } from 'react';
import { Search, Users, FileText, FileSpreadsheet, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { shareFileNatively } from '../../utils/nativeShare';

interface InstallmentReportTabProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const InstallmentReportTab: React.FC<InstallmentReportTabProps> = ({
  students,
  structures,
  payments,
  classes,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Process and compute payments chronological sequence per student
  const studentInstallmentData = useMemo(() => {
    if (!selectedClassId) return null;

    let classInfo: any;
    let classStudents: any[];
    let classStructures: any[];

    if (selectedClassId === 'ALL') {
      classInfo = { name: 'All', section: 'Classes' };
      classStudents = students.filter((s) => s.user?.isActive !== false);
      classStructures = structures; // For ALL, use all structures
    } else {
      classInfo = classes.find((c) => String(c.id) === String(selectedClassId));
      if (!classInfo) return null;

      // Filter students belonging to the selected class
      classStudents = students.filter((s) => {
        if (s.user && s.user.isActive === false) return false;
        return String(s.classId || s.class?.id || '') === String(selectedClassId);
      });

      // Filter structures for this class or specific students in this class
      classStructures = structures.filter(
        (st) =>
          String(st.classId) === String(selectedClassId) ||
          classStudents.some((s) => s.id === st.studentId)
      );
    }

    // Compute installment rows
    const rows = classStudents.map((student) => {
      // Calculate Total Expected Fee from structures
      const studentSpecificStructs = classStructures.filter(
        (st) => (!st.studentId && st.classId === student.classId) || st.studentId === student.id
      );
      const totalFee = studentSpecificStructs.reduce(
        (sum, st) => sum + (Number(st.amount) || 0),
        0
      );

      // Get all successful/partial payments for this student sorted by date (first to last)
      const studentPayments = payments
        .filter(
          (p) =>
            p.studentId === student.id &&
            (p.status === 'PAID' || p.status === 'PARTIAL')
        )
        .map((p) => {
          // Resolve date cleanly
          let payDate = new Date(p.paymentDate || p.createdAt || new Date());
          if (payDate.getFullYear() < 2000) {
            payDate = new Date(p.createdAt || new Date());
          }
          return {
            id: p.id,
            amount: Number(p.amountPaid) || 0,
            date: payDate,
            dateStr: payDate.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            }),
            method: p.method || 'CASH',
            receiptNo: p.receiptNo || 'N/A',
          };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Chronological sort (oldest to newest)

      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, totalFee - totalPaid);

      return {
        rollNo: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        phone: student.user?.phone || student.phone || '-',
        totalFee,
        totalPaid,
        remaining,
        payments: studentPayments,
      };
    });

    // Filter by search query
    const filteredRows = rows.filter(
      (r) =>
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      classInfo,
      rows: filteredRows,
    };
  }, [selectedClassId, searchTerm, students, structures, payments, classes]);

  const handleDownloadPDF = async () => {
    if (!studentInstallmentData) return;
    const { classInfo, rows } = studentInstallmentData;

    try {
      const jspdfModule: any = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for rich data rows

      // Header Banner
      doc.setFillColor(30, 27, 75); // Indigo 900
      doc.rect(0, 0, 297, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('SRI VENKATESWARA JY SCHOOL', 148, 10, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Installment Wise Student Payment Logs', 148, 17, { align: 'center' });

      // Info row
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Class: ${classInfo.name} - ${classInfo.section}`, 14, 33);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`, 283, 33, { align: 'right' });

      // Table layout
      const tableHeaders = [
        ['Roll No', 'Student Name', 'Total Fee', 'Total Paid', 'Balance', 'Installments Check (Amount & Date)'],
      ];

      const tableRows = rows.map((r) => {
        const paySequenceStr = r.payments
          .map((p, idx) => `${idx + 1}st: Rs. ${p.amount} (${p.dateStr})`)
          .join('\n');
        return [
          r.rollNo,
          r.name,
          `Rs. ${r.totalFee.toLocaleString('en-IN')}`,
          `Rs. ${r.totalPaid.toLocaleString('en-IN')}`,
          `Rs. ${r.remaining.toLocaleString('en-IN')}`,
          paySequenceStr || 'No payment recorded',
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 38,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 4, valign: 'middle', lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
          1: { cellWidth: 50, fontStyle: 'bold', textColor: [30, 41, 59] },
          2: { cellWidth: 25, halign: 'right', textColor: [30, 41, 59] },
          3: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }, // Emerald green
          4: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }, // Rose red
          5: { cellWidth: 'auto', fontStyle: 'bold', textColor: [67, 56, 202] }, // Indigo
        },
        didParseCell: function(data: any) {
          if (data.section === 'body' && data.column.index === 4) {
            // Make balance green if 0
            if (data.cell.raw === 'Rs. 0') {
              data.cell.styles.textColor = [5, 150, 105];
            }
          }
        }
      });

      doc.save(`FeeInstallments_${classInfo.name}_${classInfo.section}.pdf`);
      toast.success('Installment report downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report PDF');
    }
  };

  const handleDownloadExcel = async () => {
    if (!studentInstallmentData) return;
    const { classInfo, rows } = studentInstallmentData;

    try {
      const XLSX = await import('xlsx');
      
      const tableHeaders = ['Roll No', 'Student Name', 'Total Fee', 'Total Paid', 'Remaining Balance', 'Payment Logs Sequence'];
      const dataRows = rows.map((r) => {
        const paySequenceStr = r.payments
          .map((p, idx) => `[Installment ${idx + 1}: Rs. ${p.amount} on ${p.dateStr}]`)
          .join(', ');
        return [
          r.rollNo,
          r.name,
          r.totalFee,
          r.totalPaid,
          r.remaining,
          paySequenceStr || 'No payment',
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([tableHeaders, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Installment Report');
      
      XLSX.writeFile(wb, `FeeInstallments_${classInfo.name}_${classInfo.section}.xlsx`);
      toast.success('Installment report downloaded as Excel!');
    } catch (error) {
      toast.error('Failed to download Excel file');
    }
  };

  return (
    <div className="animate-fade-in -mx-4 -my-4 md:m-0">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="sm:w-64">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSearchTerm('');
            }}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer shadow-sm"
          >
            <option value="" disabled>
              Select a Class
            </option>
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.section}
              </option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
            />
          </div>
        )}
      </div>

      {studentInstallmentData ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Section Toolbar */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {studentInstallmentData.classInfo.name} -{' '}
                {studentInstallmentData.classInfo.section} Fee Installment Log
              </h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                Tracks chronological payments sequence and logs per student.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-650 hover:text-white text-indigo-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-indigo-100 cursor-pointer"
                title="Download PDF Report"
              >
                <FileText className="w-4 h-4" />
                <span>PDF Report</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-650 hover:text-white text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-emerald-100 cursor-pointer"
                title="Download Excel Report"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="overflow-x-auto p-4">
            {(() => {
              const maxInstallments = Math.max(0, ...studentInstallmentData.rows.map(r => r.payments.length));
              return (
                <table className="w-full text-sm text-left border-collapse border border-black rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-50 border-b border-black text-gray-800">
                    <tr>
                      <th className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50">Roll No</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs border border-black bg-gray-100/50">Student Name</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Total Fee</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Total Paid</th>
                      <th className="px-5 py-4 font-bold uppercase text-xs text-right border border-black bg-gray-100/50">Remaining</th>
                      {maxInstallments > 0 ? (
                        Array.from({ length: maxInstallments }).map((_, i) => (
                          <th key={i} className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50 whitespace-nowrap">
                            Installment {i + 1}
                          </th>
                        ))
                      ) : (
                        <th className="px-5 py-4 font-bold uppercase text-xs border border-black text-center bg-gray-100/50">
                          Payment Installments
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {studentInstallmentData.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={maxInstallments > 0 ? 5 + maxInstallments : 6}
                          className="px-5 py-12 text-center text-gray-400 font-semibold border border-black"
                        >
                          No student records found matching filter constraints.
                        </td>
                      </tr>
                    ) : (
                      studentInstallmentData.rows.map((row) => (
                        <tr
                          key={row.rollNo}
                          className="hover:bg-indigo-50/30 transition-colors bg-white"
                        >
                          <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600 border border-black text-center">
                            {row.rollNo}
                          </td>
                          <td className="px-5 py-4 font-bold text-gray-900 border border-black">
                            {row.name}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900 border border-black bg-gray-50/30">
                            ₹{row.totalFee.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-emerald-600 border border-black bg-emerald-50/10">
                            ₹{row.totalPaid.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`px-5 py-4 text-right font-black border border-black ${
                              row.remaining > 0 ? 'text-rose-600 bg-rose-50/10' : 'text-emerald-600 bg-emerald-50/10'
                            }`}
                          >
                            ₹{row.remaining.toLocaleString('en-IN')}
                          </td>
                          
                          {maxInstallments > 0 ? (
                            Array.from({ length: maxInstallments }).map((_, i) => {
                              const p = row.payments[i];
                              return (
                                <td key={i} className="px-5 py-4 border border-black text-center">
                                  {p ? (
                                    <div className="inline-flex flex-col justify-center gap-0.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-xl text-xs shadow-sm">
                                      <div className="font-extrabold flex justify-center items-center gap-1.5">
                                        ₹{p.amount.toLocaleString('en-IN')}
                                      </div>
                                      <div className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
                                        {p.dateStr} · {p.method}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 font-bold">-</span>
                                  )}
                                </td>
                              );
                            })
                          ) : (
                            <td className="px-5 py-4 border border-black text-center text-xs text-gray-400 font-semibold italic">
                              No payments recorded
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 border-dashed">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            No Class Selected
          </h3>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            Select a class from the dropdown above to view the installment log report.
          </p>
        </div>
      )}
    </div>
  );
};
