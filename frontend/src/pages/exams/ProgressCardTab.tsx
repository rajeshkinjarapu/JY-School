import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatExamOptionLabel } from '../../utils/formatters';
import { Printer, Download, FileText, CheckCircle, Settings, Upload, Save, MessageCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { ProgressCardTemplate } from '../../components/Exams/ProgressCardTemplate';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const ProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
  const [examNameOverride, setExamNameOverride] = useState('');
  const [published, setPublished] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    if (selectedExam) {
      setLogoUrl(selectedExam.admitCardSettings?.logoUrl || '');
      setSignatureUrl(selectedExam.admitCardSettings?.signatureUrl || '');
      setTeacherSignatureUrl(selectedExam.admitCardSettings?.teacherSignatureUrl || '');
      setExamNameOverride(selectedExam.admitCardSettings?.examNameOverride || '');
      setPublished(selectedExam.admitCardSettings?.progressCardPublished || false);
    }
  }, [selectedExam]);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudentsData([]);
        return;
      }
      setLoading(true);
      try {
        const res: any = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        // Map the results to the data format expected by ProgressCardTemplate
        // the API returns { studentId, name, rollNo, className, marks, total, percentage, grade, rank }
        // We map it to { studentName, rollNo, className, section, mobile, rank, marks, photo }
        const formattedData = (res.data?.data || res.data || []).map((s: any) => {
           // extract section if it's combined in className like "10th - A"
           let cName = s.className;
           let sec = '';
           if (cName.includes(' - ')) {
              [cName, sec] = cName.split(' - ');
           }
           return {
              studentId: s.studentId,
              studentName: s.name,
              rollNo: s.rollNo,
              className: cName,
              section: sec,
              mobile: s.mobile || '-',
              rank: s.rank,
              total: s.total,
              marks: s.marks,
              photo: s.photo || ''
           };
        });
        setStudentsData(formattedData);
      } catch (e) {
        console.error('Error fetching progress card data', e);
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'teacherSignature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'signature') setSignatureUrl(res.data.url);
      if (type === 'teacherSignature') setTeacherSignatureUrl(res.data.url);
      if (type === 'logo') setLogoUrl(res.data.url);
      toast.success(`${type === 'logo' ? 'Logo' : type === 'signature' ? 'Principal Signature' : 'Teacher Signature'} uploaded!`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedExamId) return;
    try {
      const currentSettings = selectedExam?.admitCardSettings || {};
      const newSettings = { ...currentSettings, logoUrl, signatureUrl, teacherSignatureUrl, examNameOverride, progressCardPublished: published };
      
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: selectedExam?.admitCardPublished || false,
        admitCardSettings: newSettings,
      });
      
      toast.success('Settings saved successfully!');
      if (selectedExam) {
        selectedExam.admitCardSettings = newSettings;
      }
      setShowSettings(false);
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintSingle = (index: number) => {
    const parentContainer = document.getElementById('progress-cards-print-container');
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'block';
    }

    const cards = document.querySelectorAll('.progress-card-wrapper');
    cards.forEach((el, i) => {
      (el as HTMLElement).style.display = i === index ? 'flex' : 'none';
    });

    window.print();

    cards.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
    
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.style.display = '';
    }
  };

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    const parentContainer = document.getElementById('progress-cards-print-container');
    const originalParentDisplay = parentContainer?.style.display || '';
    const originalParentPosition = parentContainer?.style.position || '';
    const originalParentZIndex = parentContainer?.style.zIndex || '';
    const originalParentTop = parentContainer?.style.top || '';
    const originalParentLeft = parentContainer?.style.left || '';
    
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'flex';
      // Keep in viewport but hide behind other content to fix mobile rendering issues
      parentContainer.style.position = 'fixed';
      parentContainer.style.top = '0';
      parentContainer.style.left = '0';
      parentContainer.style.zIndex = '-9999';
    }

    const originalDisplay = el.style.display;
    el.style.display = 'flex';
    
    // Wait a bit for images and layout to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const canvas = await html2canvas(el, { 
        scale: window.innerWidth < 768 ? 1.5 : 2, // Better quality, fallback to 1.5 on mobile for memory
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      return pdf;
    } finally {
      el.style.display = originalDisplay;
      
      if (parentContainer) {
        parentContainer.classList.add('hidden');
        parentContainer.style.display = originalParentDisplay;
        parentContainer.style.position = originalParentPosition;
        parentContainer.style.zIndex = originalParentZIndex;
        parentContainer.style.top = originalParentTop;
        parentContainer.style.left = originalParentLeft;
      }
    }
  };

  const handleDownloadSingle = async (studentId: string, studentName: string, index: number) => {
    const el = document.getElementById(`progress-card-${index}`);
    if (!el) return toast.error('Could not find card element');
    
    const toastId = toast.loading(`Generating PDF for ${studentName}...`);
    try {
      const pdf = await generatePDFForElement(el, studentName);
      pdf.save(`${studentName}_ProgressCard.pdf`);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate PDF.', { id: toastId });
    }
  };

  const getWaUrl = (mobile: string, name?: string) => {
    let clean = (mobile || '').replace(/\D/g, '');
    if (clean.length === 10) clean = '91' + clean;
    const text = encodeURIComponent(`Hi! Please find attached the progress card for ${name || 'your child'}.`);
    return clean ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  const handleWhatsAppShare = async (studentId: string, studentName: string, index: number, mobile: string) => {
    const el = document.getElementById(`progress-card-${index}`);
    if (!el) return toast.error('Could not find card element');

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let canShareNatively = false;
    if (isMobileDevice && "share" in navigator && "canShare" in navigator) {
      try {
        canShareNatively = navigator.canShare({ files: [new File([''], 't.pdf', { type: 'application/pdf' })] });
      } catch (e) {
        canShareNatively = false;
      }
    }

    let newWindow: Window | null = null;
    if (!canShareNatively) {
      newWindow = window.open('about:blank', '_blank');
    }

    const toastId = toast.loading(`Preparing PDF for ${studentName}...`);
    let pdf: jsPDF;
    try {
      pdf = await generatePDFForElement(el, studentName);
    } catch (e) {
      console.error('PDF generation failed:', e);
      if (newWindow && !newWindow.closed) newWindow.close();
      return toast.error('Failed to generate PDF.', { id: toastId });
    }

    const cleanName = (studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanName}_ProgressCard.pdf`;
    const waUrl = getWaUrl(mobile, studentName);

    try {
      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (canShareNatively) {
        toast.dismiss(toastId);
        await navigator.share({
          files: [file],
          title: `${studentName} Progress Card`,
          text: `Please find the progress card for ${studentName} attached.`
        });
      } else {
        pdf.save(fileName);
        if (newWindow && !newWindow.closed) {
          newWindow.location.href = waUrl;
        } else {
          window.open(waUrl, '_blank');
        }
        toast.success('PDF downloaded! Opening WhatsApp...', { id: toastId, duration: 6000 });
      }
    } catch (e: any) {
      console.error('WhatsApp share error:', e);
      if (e.name === 'AbortError') { 
        toast.dismiss(toastId); 
        if (newWindow && !newWindow.closed) newWindow.close();
        return; 
      }
      
      pdf.save(fileName);
      if (newWindow && !newWindow.closed) {
        newWindow.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank');
      }
      toast.success('PDF downloaded! Opening WhatsApp...', { id: toastId, duration: 5000 });
    }
  };

  const handleDownloadAll = async () => {
    if (studentsData.length === 0) return;
    setIsDownloading(true);
    const loadingToastId = toast.loading(`Generating ${studentsData.length} progress cards...`);
    try {
      const zip = new JSZip();
      
      const printArea = document.getElementById('progress-cards-print-container');
      const originalParentDisplay = printArea?.style.display || '';
      const originalParentPosition = printArea?.style.position || '';
      const originalParentZIndex = printArea?.style.zIndex || '';
      const originalParentTop = printArea?.style.top || '';
      const originalParentLeft = printArea?.style.left || '';

      if (printArea) {
        printArea.classList.remove('hidden');
        printArea.classList.add('flex');
        printArea.style.position = 'fixed';
        printArea.style.top = '0';
        printArea.style.left = '0';
        printArea.style.zIndex = '-9999';
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const templates = document.querySelectorAll('.progress-card-wrapper');

      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const data = studentsData[i];
        
        if (i % 5 === 0) toast.loading(`Generated ${i} of ${studentsData.length}...`, { id: loadingToastId });
        
        const originalDisplay = el.style.display;
        el.style.display = 'flex';
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for layout
        
        const canvas = await html2canvas(el, { 
          scale: window.innerWidth < 768 ? 1.5 : 2, 
          useCORS: true, 
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const fileName = `${data.studentName || `Student_${i+1}`}_ProgressCard.pdf`;
        zip.file(fileName, pdf.output('blob'));
        
        el.style.display = originalDisplay;
      }
      
      if (printArea) {
        printArea.classList.add('hidden');
        printArea.classList.remove('flex');
        printArea.style.display = originalParentDisplay;
        printArea.style.position = originalParentPosition;
        printArea.style.zIndex = originalParentZIndex;
        printArea.style.top = originalParentTop;
        printArea.style.left = originalParentLeft;
      }

      toast.loading('Zipping files...', { id: loadingToastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `ProgressCards_${selectedExam?.name}_${selectedClassId}.zip`);
      toast.success('ZIP Downloaded successfully!', { id: loadingToastId });
    } catch (e: any) {
      console.error('Zip generation error:', e);
      toast.error(`Failed to generate zip: ${e.message}`, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:hidden gap-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-3.5 rounded-2xl shadow-lg shadow-pink-500/30 text-white shrink-0 hidden sm:block">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <select 
              value={selectedExamId} 
              onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
              className="appearance-none bg-white dark:bg-slate-800 border-2 border-pink-100 dark:border-pink-900/30 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[220px] truncate"
            >
              <option value="" className="text-xs font-medium">-- Choose Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id} className="text-xs font-medium">{formatExamOptionLabel(e.name)}</option>)}
            </select>

            {selectedExam && (
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)} 
                className="appearance-none bg-white dark:bg-slate-800 border-2 border-pink-100 dark:border-pink-900/30 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[180px]"
              >
                <option value="">-- Choose Class --</option>
                {(selectedExam.classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
          {isSuperAdmin && selectedExam && (
            <>
              {!published ? (
                <button
                  onClick={async () => {
                    const confirmPublish = window.confirm('Are you sure you want to publish these results? This will make them visible to students and parents.');
                    if (confirmPublish) {
                      setPublished(true);
                      try {
                        const newSettings = { ...(selectedExam.admitCardSettings || {}), progressCardPublished: true };
                        await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                          admitCardPublished: selectedExam?.admitCardPublished || false,
                          admitCardSettings: newSettings
                        });
                        toast.success('Results published successfully!');
                      } catch (e: any) {
                        toast.error('Failed to publish');
                        setPublished(false);
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Publish Cards
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4" /> Published
                  </span>
                </div>
              )}
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50 shadow-sm px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Actions */}
      {studentsData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden animate-fade-in-up">
          <button 
            onClick={handleDownloadAll} 
            disabled={isDownloading} 
            className="flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-pink-500/20 font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 shrink-0" />} 
            <span>{isDownloading ? 'Generating...' : 'Download ZIP'}</span>
          </button>

          <button 
            onClick={handlePrint} 
            className="flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Printer className="w-4 h-4 shrink-0" /> 
            <span>Print All Cards</span>
          </button>
        </div>
      )}

      {showSettings && selectedExamId && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-6 print:hidden flex flex-col gap-6 animate-fade-in-up">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
            <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Progress Card Settings
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Custom Exam Name (Optional)</label>
              <input
                type="text"
                value={examNameOverride}
                onChange={(e) => setExamNameOverride(e.target.value)}
                placeholder={`Default: ${selectedExam?.name || 'EXAMINATION RESULT CARD'}`}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">School Logo Image</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={resolveUrl(logoUrl)} alt="Logo" className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">No Logo</div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Principal Signature Image</label>
              <div className="flex items-center gap-4">
                {signatureUrl ? (
                  <img src={resolveUrl(signatureUrl)} alt="Signature" className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">No Signature</div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Signature
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                </label>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Teacher Signature Image</label>
              <div className="flex items-center gap-4">
                {teacherSignatureUrl ? (
                  <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">No Signature</div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Signature
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacherSignature')} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      )}


      {loading && <div className="p-12 text-center text-slate-400 font-bold animate-pulse"><LoadingSpinner size="lg" /></div>}

      {!loading && studentsData.length > 0 && (
        !isSuperAdmin && !published ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200/60">
            <CheckCircle className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">Not Published Yet</h3>
            <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md">The progress cards for this exam have not been published by the administration. Please check back later.</p>
          </div>
        ) : (
        <>
          {/* Table View of Students for Progress Cards */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden print:hidden animate-fade-in-up w-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-200">Class Progress Cards</h3>
                <p className="text-xs font-semibold text-slate-500">Generated {studentsData.length} cards based on exam results.</p>
              </div>
            </div>
            <div className="overflow-hidden w-full">
              <table className="w-full text-sm text-left table-fixed">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-3 py-3 font-black border-b border-slate-100 dark:border-slate-700/50 hidden md:table-cell w-14">Rank</th>
                    <th className="px-3 py-3 font-black border-b border-slate-100 dark:border-slate-700/50 w-auto">Student Name</th>
                    {!isTeacher && <th className="px-3 py-3 font-black border-b border-slate-100 dark:border-slate-700/50 hidden md:table-cell w-24">Roll No</th>}
                    <th className="px-3 py-3 font-black border-b border-slate-100 dark:border-slate-700/50 text-center w-14">Score</th>
                    <th className="px-3 py-3 font-black border-b border-slate-100 dark:border-slate-700/50 text-right w-24 sm:w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData.map((data, idx) => (
                    <tr key={data.studentId} className="hover:bg-gray-50 transition-colors bg-white">
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{data.rank}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900 truncate">
                        <span>{data.studentName}</span>
                      </td>
                      {!isTeacher && <td className="py-3 px-4 text-gray-600 font-medium hidden md:table-cell">{data.rollNo || '-'}</td>}
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{data.total}</td>
                      <td className="py-3 px-4 flex justify-end gap-1.5 items-center">
                        <button 
                          onClick={() => handleWhatsAppShare(data.studentId, data.studentName, idx, data.mobile)} 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
                          title="Share Progress Card on WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg> 
                          <span className="text-[11px] uppercase tracking-wider">WhatsApp</span>
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => handleDownloadSingle(data.studentId, data.studentName, idx)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0" title="Download PDF">
                            <Download className="w-4 h-4" /> <span className="hidden md:inline">Download</span>
                          </button>
                        )}
                        <button onClick={() => handlePrintSingle(idx)} className="hidden md:flex bg-gray-50 hover:bg-gray-100 text-gray-600 p-2 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5 transition-colors shrink-0">
                          <Printer className="w-4 h-4" /> <span className="hidden md:inline">Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hidden Container for Printing & PDF Generation */}
          <div id="progress-cards-print-container" className="hidden print:block print-area bg-gray-50 dark:bg-gray-900 p-0 flex-col items-center">
            <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; padding: 0 !important; margin: 0 !important; }
              html, body { height: 100%; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}} />
          
            {studentsData.map((data, idx) => (
              <div key={data.studentId} id={`progress-card-${idx}`} className="progress-card-wrapper flex justify-center bg-white" style={{ width: '210mm' }}>
                <ProgressCardTemplate data={data} exam={selectedExam} settings={selectedExam?.admitCardSettings} />
              </div>
            ))}
          </div>
        </>
        )
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">
          No results found for this class. Make sure marks are entered and finalized.
        </div>
      )}
    </div>
  );
};

