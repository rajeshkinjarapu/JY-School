import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatExamOptionLabel } from '../../utils/formatters';
import { Award, Medal, Printer, Download, Star, TrendingUp, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const ResultsTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const [searchParams] = useSearchParams();
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedExamId || !selectedClassId) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        setResults(res.data?.data || res.data || []);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    const printContent = document.getElementById('results-print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Results - ${selectedExam?.name}</title>
          ${styles}
          <style>
            @media print {
              @page { margin: 10mm; size: A4 portrait; }
              html, body { height: auto !important; overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
              table { width: 100% !important; border-collapse: collapse !important; table-layout: auto; margin-top: 10px; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              th, td { padding: 4px 6px !important; font-size: 11px !important; border: 1px solid #d1d5db !important; text-align: center; white-space: nowrap !important; color: #000 !important; }
              th { font-size: 12px !important; font-weight: 800 !important; background-color: #f3f4f6 !important; }
              th:nth-child(2), td:nth-child(2) { text-align: left; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
              /* Override overflow for printing so it spans multiple pages */
              .overflow-x-auto, .overflow-hidden, #results-print-area { overflow: visible !important; height: auto !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; display: block !important; }
              /* Shrink the big header box */
              .print-header-box { padding: 18px 24px !important; background: linear-gradient(to right, #7c3aed, #ea580c) !important; border-radius: 12px !important; margin-bottom: 15px !important; }
              .print-title { font-size: 26px !important; margin-bottom: 8px !important; color: white !important; font-weight: 900 !important; }
              .print-subtitle span { padding: 4px 12px !important; font-size: 15px !important; border: 1px solid rgba(255,255,255,0.3) !important; border-radius: 6px !important; color: white !important; background: rgba(255,255,255,0.15) !important; font-weight: bold !important; }
              .print-roll-no { font-size: 13px !important; font-weight: 800 !important; color: #111827 !important; }
              /* Simplify rank badge to save space */
              .rank-badge { width: auto !important; height: auto !important; background: transparent !important; color: #000 !important; box-shadow: none !important; border: none !important; display: inline !important; padding: 0 !important; font-size: 10px !important; }
              .rank-badge svg { display: none !important; }
              .rank-num { display: inline !important; }
              /* Hide specific columns/elements */
              .hide-in-print { display: none !important; }
              svg { stroke: currentColor !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white p-4">
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Generating Professional PDF...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

      // Header Card / School Name Banner (Super Compact)
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(203, 213, 225); // #CBD5E1
      doc.setLineWidth(0.5);
      doc.roundedRect(12, 12, pageWidth - 24, 14, 2, 2, 'FD'); // Reduced height from 18 to 14

      // Title & Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // #0F172A - Very Dark Slate
      doc.text('JY SCHOOL', 16, 18);

      doc.setFontSize(10);
      doc.setTextColor(67, 56, 202); // #4338CA - Dark Indigo
      doc.text('EXAMINATION RESULTS SUMMARY', 16, 24);

      // Metadata info on top right of banner
      const examNameStr = selectedExam?.name || 'Examination';
      const classNameStr = results[0]?.className || 'Class';
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); 
      doc.text(`Exam: ${examNameStr}`, pageWidth - 16, 18, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); 
      doc.text(`Class: ${classNameStr}   |   Date: ${dateStr}   |   Total: ${results.length} Students`, pageWidth - 16, 24, { align: 'right' });

      // Table Headers
      const subjectsList = results[0]?.marks || [];
      const head = [[
        'Rank',
        'Student Name',
        'Roll No',
        ...subjectsList.map((m: any) => {
          const sub = String(m.subject).toUpperCase();
          if (sub.includes('MATH')) return 'MAT';
          if (sub.includes('PHYS')) return 'PHY';
          if (sub.includes('CHEM')) return 'CHE';
          if (sub.includes('BIOL')) return 'BIO';
          if (sub.includes('ENG')) return 'ENG';
          return sub.length > 4 ? sub.substring(0, 4) : sub;
        }),
        'Total',
        '%'
      ]];

      const body = results.map((student) => [
        student.rank,
        student.name,
        student.rollNo || '-',
        ...student.marks.map((m: any) => m.obtained),
        student.total,
        `${student.percentage}%`
      ]);

      // Stretch the rows to fill the entire A4 page vertically.
      const totalRows = results.length || 1;
      // Page height is 297mm. StartY is 29mm. Bottom margin is 16mm. Head is ~9mm.
      // Available height for body = 297 - 29 - 16 - 9 = 243mm.
      const dynamicRowHeight = 243 / totalRows;
      
      let dynamicFontSize = 9.0;
      if (totalRows >= 30) dynamicFontSize = 7.0;
      else if (totalRows >= 20) dynamicFontSize = 8.0;

      autoTable(doc, {
        startY: 29,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo #4F46E5
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          minCellHeight: 8.5,
          fontSize: 8.5
        },
        bodyStyles: {
          halign: 'center',
          valign: 'middle',
          textColor: 30,
          fontSize: dynamicFontSize,
          minCellHeight: dynamicRowHeight
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Zebra striping
        },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' }, // Rank
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 52 }, // Student Name
          2: { cellWidth: 22, halign: 'center' }, // Roll No
        },
        didParseCell: (data) => {
          // Highlight Total & Percentage
          if (data.section === 'body' && data.column.index === head[0].length - 2) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [67, 56, 202]; // Indigo-700
          }
          if (data.section === 'body' && data.column.index === head[0].length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [22, 101, 52]; // Green-800
          }
        },
        margin: { left: 12, right: 12, top: 42, bottom: 16 },
        didDrawPage: (data) => {
          const totalPages = (doc as any).internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          
          doc.setDrawColor(226, 232, 240);
          doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // #94A3B8
          doc.text('JY School Management System • Exam Results Report', 12, pageHeight - 7);
          doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 12, pageHeight - 7, { align: 'right' });
        }
      });

      const selectedClass = selectedExam?.classes?.find((c: any) => c.id === selectedClassId);
      const classNameClean = selectedClass ? `${selectedClass.name}${selectedClass.section || ''}` : `Class`;
      const fileName = `${classNameClean}_Results_${(selectedExam?.name || 'Exam').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      doc.save(fileName);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to generate PDF: ${e.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white rank-badge"><span className="no-print"><Trophy className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    if (rank === 2) return <div className="bg-gray-300 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white rank-badge"><span className="no-print"><Medal className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    if (rank === 3) return <div className="bg-amber-600 text-amber-100 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white rank-badge"><span className="no-print"><Medal className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    return <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white rank-badge">{rank}</div>;
  };

  return (
    <div className="space-y-6">
      {/* We use window.open for printing, so no global @media print needed here anymore */}

      {/* Header Selection */}
      {!isTeacher && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:hidden gap-4 no-print animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 text-white shrink-0 hidden sm:block">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                Examination Result
              </h2>
              {selectedExam && (
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedExam.name} {selectedClassId ? `· Class ${selectedExam.classes?.find((c: any) => c.id === selectedClassId)?.name || ''}-${selectedExam.classes?.find((c: any) => c.id === selectedClassId)?.section || ''}` : ''}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-2 sm:mt-0">
              <select 
                value={selectedExamId} 
                onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
                className="appearance-none bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[180px] truncate"
              >
                <option value="" className="text-xs font-medium">-- Choose Exam --</option>
                {exams.map(e => <option key={e.id} value={e.id} className="text-xs font-medium">{formatExamOptionLabel(e.name)}</option>)}
              </select>
              
              {selectedExam && (
                <select 
                  value={selectedClassId} 
                  onChange={e => setSelectedClassId(e.target.value)} 
                  className="appearance-none bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-4 py-2.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[160px]"
                >
                  <option value="">-- Choose Class --</option>
                  {(selectedExam.classes || []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Desktop Only Print & Export PDF buttons (Single Instance) */}
          {results.length > 0 && (
            <div className="hidden md:flex items-center gap-3 shrink-0 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {loading && <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>}

      {!loading && selectedExamId && selectedClassId && results.length === 0 && (
        <div className="p-12 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100">
          No results found. Please ensure marks are entered and frozen.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div id="results-print-area" className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-indigo-50">
          {/* Colorful Header */}
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 p-8 text-white relative overflow-hidden print-header-box">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 no-print" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 no-print" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 flex items-center gap-2 sm:gap-3 print-title whitespace-nowrap">
                  <Award className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300 no-print shrink-0" />
                  Examination Results
                </h2>
                <div className="flex gap-2 sm:gap-4 text-white/90 font-medium print-subtitle text-xs sm:text-base">
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 whitespace-nowrap">{selectedExam?.name}</span>
                  <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10 whitespace-nowrap">{results[0]?.className}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/50">
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider rounded-tl-xl w-16 text-center">Rank</th>
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider whitespace-nowrap">Student Name</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider w-28">Roll No</th>
                    {results[0]?.marks.map((m: any, i: number) => (
                      <th key={i} className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center">{m.subject}</th>
                    ))}
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center w-20">Total</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center w-24">Percentage</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center rounded-tr-xl w-20 hide-in-print">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((student, idx) => (
                    <React.Fragment key={student.studentId || idx}>
                      <tr 
                        onClick={() => toggleRow(student.studentId || String(idx))}
                        className="hover:bg-indigo-50/50 transition-colors group cursor-pointer bg-white"
                      >
                        <td className="p-4">
                          <div className="flex justify-center">
                            {getRankBadge(student.rank)}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-indigo-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[200px]">
                            <span className="hidden md:inline">{student.name}</span>
                            <span className="md:hidden">
                              {(() => {
                                if (!student.name) return '';
                                const parts = student.name.trim().split(' ');
                                if (parts.length > 1) {
                                  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
                                }
                                return student.name;
                              })()}
                            </span>
                          </p>
                        </td>
                        <td className="hidden md:table-cell p-4">
                          <p className="text-xs text-gray-500 font-semibold print-roll-no">{student.rollNo || '-'}</p>
                        </td>
                        {student.marks.map((m: any, i: number) => (
                          <td key={i} className="hidden md:table-cell p-4 text-center">
                            <span className="font-bold text-gray-700">{m.obtained}</span>
                          </td>
                        ))}
                        <td className="p-4 text-center font-black text-indigo-600">
                          {student.total}
                        </td>
                        <td className="hidden md:table-cell p-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-100">
                            {student.percentage}%
                          </div>
                        </td>
                        <td className="hidden md:table-cell p-4 text-center hide-in-print">
                          <span className="inline-block px-3 py-1 rounded-full font-black text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200">
                            {student.grade || '-'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Mobile Details */}
                      {expandedRow === (student.studentId || String(idx)) && (
                        <tr className="md:hidden bg-gradient-to-r from-indigo-50/50 to-fuchsia-50/50 border-b border-gray-100">
                          <td colSpan={3} className="p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Roll No:</span>
                                <span className="font-bold text-gray-900">{student.rollNo || '-'}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Percentage:</span>
                                <span className="font-bold text-green-600">{student.percentage}%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Grade:</span>
                                <span className="font-bold text-fuchsia-600">{student.grade || '-'}</span>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-200/60">
                                <p className="text-xs font-bold text-indigo-500 uppercase mb-2">Subject Marks</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {student.marks.map((m: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white shadow-sm">
                                      <span className="text-xs font-semibold text-gray-500 truncate mr-2">{m.subject}</span>
                                      <span className="text-sm font-bold text-indigo-700">{m.obtained}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

