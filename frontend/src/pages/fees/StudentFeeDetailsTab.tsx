import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, Users } from 'lucide-react';
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
      // Find Tuition Fee structure assigned to this student (or their class)
      // Usually fee group or name contains 'Tuition'
      const studentStructures = structures.filter(st => 
        st.studentId === student.id || (st.classId === student.classId && !st.studentId)
      );
      
      const tuitionStructure = studentStructures.find(st => 
        st.name?.toLowerCase().includes('tuition')
      ) || studentStructures[0]; // fallback to first structure if no tuition found

      const tuitionFeeAmount = tuitionStructure?.amount || 0;

      // Find total paid for this structure
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

      return {
        sno: index + 1,
        id: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className: studentClass ? `${studentClass.name} - ${studentClass.section}` : '-',
        tuitionFee: tuitionFeeAmount,
        paidAmount,
        balance
      };
    });
  }, [students, structures, payments, classes, selectedClassId, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["S.No", "Student ID", "Student Name", "Class", "Tuition Fee (Rs)", "Paid (Rs)", "Balance (Rs)"];
    const tableRows = tableData.map(row => [
      row.sno,
      row.id,
      row.name,
      row.className,
      row.tuitionFee,
      row.paidAmount,
      row.balance
    ]);

    doc.setFontSize(16);
    doc.text("Student Fee Details", 14, 15);
    
    if (selectedClassId !== 'ALL') {
      const cls = classes.find(c => c.id === selectedClassId);
      doc.setFontSize(12);
      doc.text(`Class: ${cls ? cls.name + ' - ' + cls.section : 'All'}`, 14, 22);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: selectedClassId !== 'ALL' ? 26 : 20,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    doc.save(`Student_Fee_Details_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 print:hidden">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Student Fee Details
          </h3>
          <p className="text-xs text-gray-400">View tuition fee, paid amount, and balances class-wise.</p>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4 text-right">Tuition Fee</th>
                <th className="px-6 py-4 text-right">Paid Amount</th>
                <th className="px-6 py-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.sno} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{row.sno}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{row.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.className}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">₹{row.tuitionFee.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">₹{row.paidAmount.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-bold ${row.balance > 0 ? 'text-rose-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      ₹{row.balance.toLocaleString()}
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
