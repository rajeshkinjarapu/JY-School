import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Download, FileText, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { ProgressCardTemplate } from '../../components/Exams/ProgressCardTemplate';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const JEEProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudentsData([]);
        return;
      }
      setLoading(true);
      try {
        const res: any = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        setStudentsData(res.data?.data || res.data || []);
      } catch (e) {
        console.error('Error fetching progress card data', e);
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    // Force element to be visible for capture if it's hidden
    const originalDisplay = el.style.display;
    const originalPosition = el.style.position;
    
    // We assume the parent container makes it visible, but just in case:
    el.style.display = 'flex';
    
    // Allow DOM to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imgData = await toJpeg(el, { cacheBust: true, pixelRatio: 2, quality: 0.95, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    
    // Restore
    el.style.display = originalDisplay;
    
    return pdf;
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
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownloadAll = async () => {
    if (studentsData.length === 0) return;
    setIsDownloading(true);
    
    const loadingToastId = toast.loading(`Generating ${studentsData.length} progress cards. Please do not close this window...`);
    
    try {
      const zip = new JSZip();
      const printArea = document.getElementById('progress-cards-print-container');
      
      if (printArea) {
        printArea.classList.remove('hidden');
        printArea.classList.add('flex');
        printArea.style.position = 'absolute';
        printArea.style.left = '-9999px'; // Move off screen but keep rendered
        printArea.style.top = '0';
        printArea.style.width = '210mm';
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const templates = document.querySelectorAll('.progress-card-wrapper');
      
      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const data = studentsData[i];
        
        // Update toast progress every 5 cards
        if (i % 5 === 0) toast.loading(`Generated ${i} of ${templates.length}...`, { id: loadingToastId });
        
        const imgData = await toJpeg(el, { cacheBust: true, pixelRatio: 1.5, quality: 0.8, backgroundColor: '#ffffff' });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const fileName = `${data.studentName || `Student_${i+1}`}_ProgressCard.pdf`;
        zip.file(fileName, pdf.output('blob'));
      }

      if (printArea) {
        printArea.classList.add('hidden');
        printArea.classList.remove('flex');
        printArea.style.position = '';
        printArea.style.left = '';
        printArea.style.top = '';
        printArea.style.width = '';
      }

      toast.loading(`Zipping files...`, { id: loadingToastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `ProgressCards_${selectedExam?.name}_${selectedClassId}.zip`);
      toast.success('ZIP Downloaded successfully!', { id: loadingToastId });
    } catch (e: any) {
      console.error('Zip generation error:', e);
      toast.error(`Failed to generate zip file: ${e.message}`, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 print:hidden gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold uppercase text-gray-400 shrink-0">Select Exam:</span>
          <select 
            value={selectedExamId} 
            onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
            className="input !py-1.5 min-w-[200px]"
          >
            <option value="">-- Choose Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          {selectedExam && (
            <select 
              value={selectedClassId} 
              onChange={e => setSelectedClassId(e.target.value)} 
              className="input !py-1.5 min-w-[150px]"
            >
              <option value="">-- Choose Class --</option>
              {(selectedExam.classes || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
              ))}
            </select>
          )}
        </div>
        
        {studentsData.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handleDownloadAll} disabled={isDownloading} className="btn-secondary flex items-center gap-2">
              {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />} 
              {isDownloading ? 'Generating...' : 'Download ZIP'}
            </button>
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/30">
              <Printer className="w-4 h-4" /> Print All Cards
            </button>
          </div>
        )}
      </div>

      {loading && <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>}

      {!loading && studentsData.length > 0 && (
        <>
          {/* Table View of Students for Progress Cards */}
          <div className="card print:hidden overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Class Progress Cards</h3>
                <p className="text-xs text-gray-500">Generated {studentsData.length} cards based on exam results.</p>
              </div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="py-3 px-6 w-16">Rank</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Roll Number</th>
                  <th className="py-3 px-6 text-center">Score</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsData.map((data, idx) => (
                  <tr key={data.studentId} className="hover:bg-gray-50 transition-colors bg-white">
                    <td className="py-3 px-6">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{data.rank}</span>
                    </td>
                    <td className="py-3 px-6 font-bold text-gray-900">{data.studentName}</td>
                    <td className="py-3 px-6 text-gray-600 font-medium">{data.rollNo || '-'}</td>
                    <td className="py-3 px-6 text-center font-bold text-emerald-600">{data.total}</td>
                    <td className="py-3 px-6 text-right">
                      <button onClick={() => handleDownloadSingle(data.studentId, data.studentName, idx)} className="btn-secondary text-xs flex items-center gap-1 ml-auto hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <div key={data.studentId} id={`progress-card-${idx}`} className="flex justify-center bg-white" style={{ width: '210mm' }}>
                <ProgressCardTemplate data={data} exam={selectedExam} settings={selectedExam?.admitCardSettings} />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">
          No results found for this class. Make sure marks are entered and finalized.
        </div>
      )}
    </div>
  );
};
