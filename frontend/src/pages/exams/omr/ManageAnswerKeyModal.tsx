import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../../../api/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  classId: string;
}

export const ManageAnswerKeyModal: React.FC<Props> = ({ isOpen, onClose, examId, classId }) => {
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && examId && classId) {
      fetchAnswerKey();
    }
  }, [isOpen, examId, classId]);

  const fetchAnswerKey = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/exams/answer-key?examId=${examId}&classId=${classId}`);
      if (res.data && Object.keys(res.data).length > 0) {
        setAnswerKey(res.data);
      } else {
        setAnswerKey({}); // Reset if empty
      }
    } catch (err) {
      toast.error('Failed to fetch existing answer key');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswerKey = async () => {
    if (Object.keys(answerKey).length === 0) {
      return toast.error("Answer key is empty!");
    }
    setIsSaving(true);
    try {
      await api.post('/api/exams/answer-key', { examId, classId, answers: answerKey });
      toast.success('Answer Key saved successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to save answer key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerChange = (qNum: number, answer: string) => {
    setAnswerKey(prev => ({ ...prev, [qNum]: answer }));
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const newKey: Record<number, string> = { ...answerKey };
        let count = 0;
        
        // Skip header row if it contains 'Q.No'
        const startIndex = data[0][0]?.toString().toLowerCase().includes('q') ? 1 : 0;
        
        for (let i = startIndex; i < data.length; i++) {
          const row = data[i];
          if (row.length >= 2) {
            const q = parseInt(row[0]);
            const a = row[1]?.toString().trim().toUpperCase();
            if (!isNaN(q) && q >= 1 && q <= 75 && ['A', 'B', 'C', 'D'].includes(a)) {
              newKey[q] = a;
              count++;
            }
          }
        }
        setAnswerKey(newKey);
        toast.success(`Loaded ${count} answers from Excel!`);
      } catch (err) {
        toast.error('Error reading Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  const downloadSampleExcel = () => {
    const ws_data = [['Question Number', 'Answer (A/B/C/D)']];
    for (let i = 1; i <= 75; i++) {
      ws_data.push([i, '']);
    }
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Answer Key");
    XLSX.writeFile(wb, "Sample_OMR_Answer_Key.xlsx");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Manage Master Answer Key</h2>
            <p className="text-sm text-gray-500">Add or upload the correct answers for 75 questions.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-6 bg-gray-50 dark:bg-gray-950">
          
          {/* Actions */}
          <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
             <label className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 py-3 rounded-lg font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800">
               <Upload size={18} /> Upload Excel
               <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
             </label>
             <button onClick={downloadSampleExcel} className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
               <Download size={18} /> Download Sample Excel
             </button>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Maths */}
              <div>
                <div className="sticky top-0 bg-white dark:bg-gray-900 pb-3 mb-4 border-b-2 border-indigo-500 font-black text-sm text-indigo-600 tracking-wider z-10">MATHS (1-25)</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+1} className="flex items-center gap-2">
                      <span className="w-6 text-right text-sm text-gray-500 font-bold">{i+1}.</span>
                      <select className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={answerKey[i+1] || ""} onChange={e => handleAnswerChange(i+1, e.target.value)}>
                        <option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physics */}
              <div>
                <div className="sticky top-0 bg-white dark:bg-gray-900 pb-3 mb-4 border-b-2 border-teal-500 font-black text-sm text-teal-600 tracking-wider z-10">PHYSICS (26-50)</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+26} className="flex items-center gap-2">
                      <span className="w-6 text-right text-sm text-gray-500 font-bold">{i+26}.</span>
                      <select className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none" value={answerKey[i+26] || ""} onChange={e => handleAnswerChange(i+26, e.target.value)}>
                        <option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chemistry */}
              <div>
                <div className="sticky top-0 bg-white dark:bg-gray-900 pb-3 mb-4 border-b-2 border-amber-500 font-black text-sm text-amber-600 tracking-wider z-10">CHEMISTRY (51-75)</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+51} className="flex items-center gap-2">
                      <span className="w-6 text-right text-sm text-gray-500 font-bold">{i+51}.</span>
                      <select className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" value={answerKey[i+51] || ""} onChange={e => handleAnswerChange(i+51, e.target.value)}>
                        <option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-950 rounded-b-2xl">
           <button onClick={onClose} className="px-6 py-2.5 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
           <button onClick={saveAnswerKey} disabled={isSaving || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50">
             {isSaving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>} Save to Database
           </button>
        </div>
      </div>
    </div>
  );
};
