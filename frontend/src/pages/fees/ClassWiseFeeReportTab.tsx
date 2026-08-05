import React, { useState, useMemo } from 'react';
import { Search, Download, Users, MessageCircle, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ClassWiseFeeReportTabProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const ClassWiseFeeReportTab: React.FC<ClassWiseFeeReportTabProps> = ({ students, structures, payments, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Process data for the selected class
  const classData = useMemo(() => {
    if (!selectedClassId) return null;

    const classInfo = classes.find(c => c.id === selectedClassId);
    if (!classInfo) return null;

    const classStudents = students.filter(s => (s.classId === selectedClassId || s.class?.id === selectedClassId) && s.user?.isActive !== false);

    // Filter payments and structures for optimization
    const classStudentIds = new Set(classStudents.map(s => s.id));
    const relevantPayments = payments.filter(p => classStudentIds.has(p.studentId) && p.status === 'PAID');
    const relevantStructures = structures.filter(st => (st.classId === selectedClassId || st.class?.id === selectedClassId) || classStudentIds.has(st.studentId));

    // Create maps
    const paymentsMap = new Map();
    relevantPayments.forEach(p => {
      const current = paymentsMap.get(p.studentId) || 0;
      paymentsMap.set(p.studentId, current + (Number(p.amount) || 0));
    });

    const classStructures = relevantStructures.filter(st => st.classId === selectedClassId || st.class?.id === selectedClassId);
    const studentStructuresMap = new Map();
    relevantStructures.filter(st => st.studentId).forEach(st => {
      const existing = studentStructuresMap.get(st.studentId) || [];
      existing.push(st);
      studentStructuresMap.set(st.studentId, existing);
    });

    const reportRows = classStudents.map((student, idx) => {
      const stdStructs = studentStructuresMap.get(student.id) || [];
      const allStructs = [...classStructures, ...stdStructs];
      
      const totalFee = allStructs.reduce((sum, st) => sum + (Number(st.amount) || 0), 0);
      const paid = paymentsMap.get(student.id) || 0;
      const percentage = totalFee > 0 ? ((paid / totalFee) * 100).toFixed(1) : '100.0';

      return {
        sno: idx + 1,
        studentId: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className: `${classInfo.name} - ${classInfo.section}`,
        totalFee,
        paid,
        percentage: Number(percentage)
      };
    });

    return {
      classInfo,
      teacherName: classInfo.classTeacher?.user?.name || 'Not Assigned',
      teacherPhone: classInfo.classTeacher?.user?.phone || null,
      rows: reportRows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    };
  }, [selectedClassId, classes, students, payments, structures, searchTerm]);

  const generatePDF = (data: any, downloadOnly = true) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("JY SCHOOL", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Class Wise Fee Report: ${data.classInfo.name} - ${data.classInfo.section}`, 105, 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Class Teacher: ${data.teacherName}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 30, { align: 'right' });

    autoTable(doc, {
      head: [['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Total Fee', 'Paid', 'Paid %']],
      body: data.rows.map((row: any) => [
        row.sno,
        row.studentId,
        row.name,
        row.className,
        `Rs. ${row.totalFee.toLocaleString('en-IN')}`,
        `Rs. ${row.paid.toLocaleString('en-IN')}`,
        `${row.percentage}%`
      ]),
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    const fileName = `FeeReport_${data.classInfo.name}_${data.classInfo.section}.pdf`;
    
    if (downloadOnly) {
      doc.save(fileName);
    } else {
      doc.save(fileName); // Always download it so they can attach it
      return fileName;
    }
  };

  const generateExcel = (data: any, downloadOnly = true) => {
    const wsData = [
      ['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Total Fee', 'Paid', 'Paid Percentage (%)'],
      ...data.rows.map((row: any) => [
        row.sno,
        row.studentId,
        row.name,
        row.className,
        row.totalFee,
        row.paid,
        row.percentage
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Report');
    const fileName = `FeeReport_${data.classInfo.name}_${data.classInfo.section}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    if (!downloadOnly) return fileName;
  };

  const handleWhatsAppShare = (type: 'pdf' | 'excel') => {
    if (!classData || !classData.teacherPhone) return;

    let fileName = '';
    if (type === 'pdf') fileName = generatePDF(classData, false) as string;
    if (type === 'excel') fileName = generateExcel(classData, false) as string;

    const message = `Hello ${classData.teacherName},\n\nPlease find the attached Class Wise Fee Report (${type.toUpperCase()}) for ${classData.classInfo.name} - ${classData.classInfo.section}.\n\n*Note:* The file has been downloaded to my device. I will attach it to this chat momentarily.`;
    
    const whatsappUrl = `https://wa.me/91${classData.teacherPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="sm:w-64">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer transition-all shadow-sm"
          >
            <option value="" disabled>Select a Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
            ))}
          </select>
        </div>
        
        {selectedClassId && (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {classData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Class Header */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                {classData.classInfo.name} - {classData.classInfo.section} Fee Report
              </h3>
              <p className="text-sm font-medium text-gray-500 mt-1">
                Class Teacher: <span className="text-indigo-600 font-bold">{classData.teacherName}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => generatePDF(classData)}
                className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100 cursor-pointer" 
                title="Download PDF"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button 
                onClick={() => generateExcel(classData)}
                className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 cursor-pointer" 
                title="Download Excel"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </button>
              
              {classData.teacherPhone && (
                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Share:</span>
                  <button 
                    onClick={() => handleWhatsAppShare('pdf')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                    title={`Send PDF to ${classData.teacherPhone}`}
                  >
                    <MessageCircle className="w-4 h-4" /> PDF
                  </button>
                  <button 
                    onClick={() => handleWhatsAppShare('excel')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                    title={`Send Excel to ${classData.teacherPhone}`}
                  >
                    <MessageCircle className="w-4 h-4" /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-white border-b-2 border-indigo-100 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-bold uppercase text-xs">S.No</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs">Student ID</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs">Student Name</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs">Class/Section</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs text-right">Total Fee</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs text-right">Paid</th>
                  <th className="px-5 py-4 font-bold uppercase text-xs text-center">Paid %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">No students found.</td>
                  </tr>
                ) : (
                  classData.rows.map((row: any) => (
                    <tr key={row.studentId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3 text-gray-500 font-medium">{row.sno}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold text-indigo-600">{row.studentId}</td>
                      <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{row.className}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-600">₹{row.totalFee.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600">₹{row.paid.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black
                          ${row.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 
                            row.percentage >= 50 ? 'bg-amber-100 text-amber-700' : 
                            'bg-rose-100 text-rose-700'}">
                          {row.percentage}%
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Class Selected</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">Please select a class from the dropdown above to view its fee report and share it with the class teacher.</p>
        </div>
      )}
    </div>
  );
};
