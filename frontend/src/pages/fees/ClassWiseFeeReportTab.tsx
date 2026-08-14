import React, { useState, useMemo } from 'react';
import { Search, Users, FileText, FileSpreadsheet, ArrowLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface ClassWiseFeeReportTabProps {
  students: any[];
  structures: any[];
  payments: any[];
  classes: any[];
}

export const ClassWiseFeeReportTab: React.FC<ClassWiseFeeReportTabProps> = ({ students, structures, payments, classes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pre-compute maps once for fast lookup
  const allClassData = useMemo(() => {
    const paymentsMap = new Map<string, number>();
    const classStructuresMap = new Map<string, any[]>();
    const studentStructuresMap = new Map<string, any[]>();

    payments.forEach(p => {
      if (p.status === 'PAID' || p.status === 'PARTIAL') {
        const cur = paymentsMap.get(p.studentId) || 0;
        paymentsMap.set(p.studentId, cur + (Number(p.amountPaid) || 0));
      }
    });
    structures.forEach(st => {
      if (st.classId) {
        const arr = classStructuresMap.get(st.classId) || [];
        arr.push(st);
        classStructuresMap.set(st.classId, arr);
      }
      if (st.studentId) {
        const arr = studentStructuresMap.get(st.studentId) || [];
        arr.push(st);
        studentStructuresMap.set(st.studentId, arr);
      }
    });
    return { paymentsMap, classStructuresMap, studentStructuresMap };
  }, [payments, structures]);

  const buildRows = (classId: string, search = '') => {
    const classInfo = classes.find(c => String(c.id) === String(classId));
    if (!classInfo) return { classInfo: null, teacherName: '', teacherPhone: null as string | null, rows: [] as any[] };
    
    const classStudents = students.filter(s => {
      if (s.user && s.user.isActive === false) return false;
      
      const sClassId = String(s.classId || s.class?.id || '');
      const targetClassId = String(classId || '');
      
      if (sClassId && targetClassId && sClassId === targetClassId) return true;
      
      if (classInfo) {
        const cName = String(classInfo.name || '').trim().toLowerCase();
        const cSec = String(classInfo.section || '').trim().toLowerCase();
        
        if (s.class && typeof s.class === 'object') {
          const scName = String(s.class.name || '').trim().toLowerCase();
          const scSec = String(s.class.section || '').trim().toLowerCase();
          if (scName === cName && (!cSec || scSec === cSec)) return true;
        }
        
        const rawClassStr = String(s.className || (typeof s.class === 'string' ? s.class : '')).trim().toLowerCase();
        if (rawClassStr) {
          if (
            rawClassStr === `${cName}-${cSec}` || 
            rawClassStr === `${cName} - ${cSec}` || 
            rawClassStr === `${cName} ${cSec}` ||
            (rawClassStr.includes(cName) && (cSec ? rawClassStr.includes(cSec) : true))
          ) {
            return true;
          }
        }
      }
      return false;
    });

    const { paymentsMap, classStructuresMap, studentStructuresMap } = allClassData;
    const classStructures = classStructuresMap.get(classId) || classStructuresMap.get(classInfo.id) || [];

    const rows = classStudents.map((student, idx) => {
      const stdStructs = studentStructuresMap.get(student.id) || [];
      const allStructs = [...classStructures, ...stdStructs];
      const totalFee = allStructs.reduce((sum: number, st: any) => sum + (Number(st.amount) || 0), 0);
      const paid = paymentsMap.get(student.id) || 0;
      const percentage = totalFee > 0 ? ((paid / totalFee) * 100).toFixed(1) : '0.0';
      return {
        sno: idx + 1,
        studentId: student.rollNo || '-',
        name: student.user?.name || student.name || '-',
        className: `${classInfo.name} - ${classInfo.section}`,
        phone: student.user?.phone || student.phone || '-',
        paid,
        percentage: Number(percentage)
      };
    }).filter((r: any) =>
      !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.studentId.toLowerCase().includes(search.toLowerCase())
    );

    return {
      classInfo,
      teacherName: classInfo.classTeacher?.user?.name || classInfo.classTeacher?.name || 'Not Assigned',
      teacherPhone: (classInfo.classTeacher?.user?.phone || classInfo.classTeacher?.phone || null) as string | null,
      rows
    };
  };

  const classData = useMemo(() => {
    if (!selectedClassId) return null;
    return buildRows(selectedClassId, searchTerm);
  }, [selectedClassId, searchTerm, allClassData, classes, students]);

  const makePDF = async (data: ReturnType<typeof buildRows>) => {
    if (!data.classInfo) return null;
    const jspdfModule: any = await import('jspdf');
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
    const autoTableModule: any = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18); doc.setTextColor(79, 70, 229); doc.setFont('helvetica', 'bold');
    doc.text('JY SCHOOL', 105, 15, { align: 'center' });
    doc.setFontSize(12); doc.setTextColor(50, 50, 50);
    doc.text(`Class Wise Fee Report: ${data.classInfo.name} - ${data.classInfo.section}`, 105, 22, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Class Teacher: ${data.teacherName}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 196, 30, { align: 'right' });
    autoTable(doc, {
      head: [['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Mobile No.', 'Paid', 'Paid %']],
      body: data.rows.map((r: any) => [r.sno, r.studentId, r.name, r.className, r.phone, `Rs. ${r.paid.toLocaleString('en-IN')}`, `${r.percentage}%`]),
      startY: 35, theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, valign: 'middle', minCellHeight: data.rows.length > 0 ? 245 / (data.rows.length + 1) : 10 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', valign: 'middle' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    return doc;
  };

  const downloadPDF = async (data: ReturnType<typeof buildRows>) => {
    const doc = await makePDF(data);
    if (doc && data.classInfo) doc.save(`FeeReport_${data.classInfo.name}_${data.classInfo.section}.pdf`);
  };

  const downloadExcel = async (data: ReturnType<typeof buildRows>) => {
    if (!data.classInfo) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['S.No', 'Student ID', 'Student Name', 'Class/Section', 'Mobile No.', 'Paid', 'Paid %'],
      ...data.rows.map((r: any) => [r.sno, r.studentId, r.name, r.className, r.phone, r.paid, `${r.percentage}%`])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Report');
    XLSX.writeFile(wb, `FeeReport_${data.classInfo.name}_${data.classInfo.section}.xlsx`);
  };

  const whatsappShare = async (classId: string) => {
    const data = buildRows(classId, '');
    if (!data.classInfo) return;
    
    const doc = await makePDF(data);
    if (!doc) return;

    const rawFileName = `FeeReport_${data.classInfo.name}_${data.classInfo.section}.pdf`;
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '');
    const ph = data.teacherPhone ? data.teacherPhone.replace(/\D/g, '') : null;
    const waNum = ph ? (ph.startsWith('91') ? ph : '91' + ph) : '';
    const msg = `Hello ${data.teacherName},\n\n*${data.classInfo.name} - ${data.classInfo.section} Fee Report* (${new Date().toLocaleDateString('en-IN')})\nStudents: ${data.rows.length}\n\n_JY School Finance_`;

    const toastId = toast.loading('Preparing PDF for WhatsApp...');
    
    try {
      const blob = doc.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // 📱 MOBILE: Try Web Share API first
      if (isMobileDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          // Android WhatsApp Bug: If both 'text' and 'files' are provided, WhatsApp ONLY shares the text and drops the file.
          // Solution: Only pass 'files' and 'title'.
          await navigator.share({
            files: [file],
            title: `${data.classInfo.name} - ${data.classInfo.section} Fee Report`
          });
          toast.dismiss(toastId);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') { toast.dismiss(toastId); return; }
          console.warn('Native share failed, falling back to server upload...', shareErr);
        }
      }

      // 💻 DESKTOP or FALLBACK: Upload PDF to server and send link via WhatsApp
      const formData = new FormData();
      formData.append('file', blob, fileName);
      
      const uploadRes = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const pdfUrl = uploadRes.data.url || (uploadRes.data.data && uploadRes.data.data.url);
      
      if (!pdfUrl) throw new Error('Failed to get PDF URL from server');
      
      const linkMsg = `${msg}\n\n*Fee Report PDF Link:*\n${pdfUrl}`;
      
      toast.dismiss(toastId);
      toast.success('Opening WhatsApp with PDF link...');
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(linkMsg)}`, '_system');

    } catch (err: any) {
      console.error('WhatsApp share error:', err);
      // Final fallback: download PDF + open WhatsApp
      toast.dismiss(toastId);
      toast.success('Downloading PDF and opening WhatsApp...');
      doc.save(fileName);
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_system');
    }
  };

  const badge = (p: number) => p >= 100 ? 'bg-emerald-100 text-emerald-700' : p >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';

  return (
    <div className="animate-fade-in -mx-4 -my-4 md:m-0">

      {/* ── MOBILE VIEW ── */}
      <div className="block md:hidden">
        {!selectedClassId ? (
          <div className="bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {classes.map(cls => {
                const hasPhone = !!(cls.classTeacher?.user?.phone || cls.classTeacher?.phone);
                return (
                  <div key={cls.id} className="flex items-center gap-3 px-4 py-4 hover:bg-emerald-50/50 transition-colors cursor-pointer" onClick={() => setSelectedClassId(cls.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-gray-900 text-base">{cls.name} - {cls.section}</div>
                      <div className="text-sm text-emerald-600 font-bold truncate mt-0.5">{cls.classTeacher?.user?.name || 'Not Assigned'}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); whatsappShare(cls.id); }}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1db954] text-white shadow-sm transition-all cursor-pointer"
                    >
                      <WhatsAppIcon />
                    </button>
                  </div>
                );
              })}
              {classes.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No classes found</div>}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-emerald-500 flex items-center gap-3">
              <button onClick={() => { setSelectedClassId(''); setSearchTerm(''); }} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-xl text-white cursor-pointer flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-sm">{classData?.classInfo?.name} - {classData?.classInfo?.section}</div>
                <div className="text-emerald-50 text-xs truncate">{classData?.teacherName}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => classData && downloadPDF(classData)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-xl text-white cursor-pointer"><FileText className="w-4 h-4" /></button>
                <button onClick={() => whatsappShare(selectedClassId)} className="w-8 h-8 flex items-center justify-center bg-[#25D366] hover:bg-[#1db954] rounded-xl text-white cursor-pointer"><WhatsAppIcon /></button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {!classData || classData.rows.length === 0
                ? <div className="py-10 text-center text-gray-400 text-sm">No students found.</div>
                : classData.rows.map((row: any) => (
                  <div key={row.studentId} className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{row.name}</div>
                      <div className="text-xs text-indigo-600 font-mono font-bold">{row.studentId}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{row.phone}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-emerald-600 text-sm">Rs.{row.paid.toLocaleString('en-IN')}</div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black mt-1 ${badge(row.percentage)}`}>{row.percentage}%</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:block">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="sm:w-64">
            <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSearchTerm(''); }} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer transition-all shadow-sm">
              <option value="" disabled>Select a Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>
          {selectedClassId && (
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by student name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all shadow-sm" />
            </div>
          )}
        </div>

        {classData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  {classData.classInfo?.name} - {classData.classInfo?.section} Fee Report
                </h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Class Teacher: <span className="text-indigo-600 font-bold">{classData.teacherName}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadPDF(classData)} className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-indigo-100 cursor-pointer" title="Download PDF"><FileText className="w-5 h-5" /></button>
                <button onClick={() => downloadExcel(classData)} className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 cursor-pointer" title="Download Excel"><FileSpreadsheet className="w-5 h-5" /></button>
                <button onClick={() => whatsappShare(selectedClassId)} className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1db954] text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer">
                  <WhatsAppIcon /><span>Share</span>
                </button>
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
                    <th className="px-5 py-4 font-bold uppercase text-xs">Mobile No.</th>
                    <th className="px-5 py-4 font-bold uppercase text-xs text-right">Paid</th>
                    <th className="px-5 py-4 font-bold uppercase text-xs text-center">Paid %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classData.rows.length === 0
                    ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">No students found. (Loaded: {students.length})</td></tr>
                    : classData.rows.map((row: any) => (
                      <tr key={row.studentId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 font-medium">{row.sno}</td>
                        <td className="px-5 py-3 font-mono text-xs font-bold text-indigo-600">{row.studentId}</td>
                        <td className="px-5 py-3 font-bold text-gray-900">{row.name}</td>
                        <td className="px-5 py-3 text-gray-600 text-xs">{row.className}</td>
                        <td className="px-5 py-3 font-medium text-gray-600">{row.phone}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">Rs.{row.paid.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3 text-center">
                          <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black ${badge(row.percentage)}`}>{row.percentage}%</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedClassId && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-indigo-400" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Class Selected</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">Select a class from the dropdown above to view its fee report.</p>
          </div>
        )}
      </div>
    </div>
  );
};
