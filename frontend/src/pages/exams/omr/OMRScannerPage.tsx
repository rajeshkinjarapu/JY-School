import React, { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle, Save, Scan, Edit, Loader, AlertTriangle, Image as ImageIcon, ChevronRight, FileText } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../../api/axios";

// Helper for sending messages to worker
const processImageWithWorker = (worker: Worker, file: File, id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context error");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const handler = (msg: MessageEvent) => {
          if (msg.data.payload?.id === id) {
            worker.removeEventListener('message', handler);
            if (msg.data.type === 'PROCESS_SUCCESS') resolve(msg.data.payload.result);
            else reject(msg.data.payload.error);
          }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'PROCESS_IMAGE', payload: { imageData, id } });
      };
      img.onerror = () => reject("Image load error");
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const OMRScannerPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({});
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  
  // Live Preview State
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [currentScanningFile, setCurrentScanningFile] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/exams").then((res: any) => setExams(res.data));
    
    // Initialize Worker
    const omrWorker = new Worker(new URL("../../../workers/omr.worker.ts", import.meta.url), { type: 'module' });
    omrWorker.onmessage = (e) => {
      if (e.data.type === 'INIT_SUCCESS') setWorkerReady(true);
    };
    omrWorker.postMessage({ type: 'INIT' });
    setWorker(omrWorker);

    return () => omrWorker.terminate();
  }, []);

  const selectedExam = exams.find(e => e.id === selectedExamId);
  
  // Deduplicate classes
  const uniqueClasses = selectedExam?.classes ? Array.from(new Map(selectedExam.classes.map((c: any) => [c.name, c])).values()) : [];
  
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
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const newKey: Record<number, string> = {};
        data.forEach(row => {
          if (row.length >= 2) {
            const q = parseInt(row[0]);
            const a = row[1]?.toString().trim().toUpperCase();
            if (!isNaN(q) && q >= 1 && q <= 75 && ["A", "B", "C", "D"].includes(a)) {
              newKey[q] = a;
            }
          }
        });
        setAnswerKey(newKey);
        toast.success("Answer Key loaded from Excel!");
      } catch (err) {
        toast.error("Error reading Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImages = async () => {
    if (!worker || !workerReady) return toast.error("Scanner engine is still initializing. Please wait.");
    if (Object.keys(answerKey).length === 0) return toast.error("Please enter the Answer Key first.");
    if (uploadedImages.length === 0) return toast.error("Please select images to process.");

    setIsProcessing(true);
    const results = [];

    for (let i = 0; i < uploadedImages.length; i++) {
      const file = uploadedImages[i];
      const fileId = `img_${i}`;
      
      // Setup Live Preview
      setCurrentScanningFile(file.name);
      const objectUrl = URL.createObjectURL(file);
      setCurrentPreviewUrl(objectUrl);

      try {
        const result = await processImageWithWorker(worker, file, fileId);
        
        // Evaluate against answer key
        let maths = 0, physics = 0, chemistry = 0;
        let doubtful = false;
        
        for (let q = 1; q <= 75; q++) {
           const studentAns = result.answers[q];
           if (studentAns === "DOUBTFUL") doubtful = true;
           else if (studentAns === answerKey[q]) {
             if (q <= 25) maths += 4; 
             else if (q <= 50) physics += 4;
             else chemistry += 4;
           } else if (studentAns !== "-" && studentAns !== undefined) {
             if (q <= 25) maths -= 1;
             else if (q <= 50) physics -= 1;
             else chemistry -= 1;
           }
        }

        results.push({
          fileName: file.name,
          studentId: result.studentId,
          maths,
          physics,
          chemistry,
          total: maths + physics + chemistry,
          doubtful,
          rawAnswers: result.answers
        });
      } catch (err: any) {
        toast.error(`Error processing ${file.name}: ${err}`);
      }
      
      // Cleanup preview URL
      URL.revokeObjectURL(objectUrl);
    }
    
    setProcessedResults(results);
    setCurrentPreviewUrl(null);
    setCurrentScanningFile(null);
    setIsProcessing(false);
    toast.success("Processing complete!");
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
            <Scan className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">OMR Scanner Pro</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Dual Vision Layout</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!workerReady ? (
             <span className="text-amber-500 text-sm font-semibold flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/50">
               <Loader className="animate-spin w-4 h-4"/> Engine Initializing...
             </span>
          ) : (
             <span className="text-emerald-500 text-sm font-semibold flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
               <CheckCircle className="w-4 h-4"/> Engine Ready
             </span>
          )}
        </div>
      </div>

      {/* Main Dual Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        
        {/* LEFT PANEL: Live Preview / Scanner Area */}
        <div className="bg-gray-900 flex flex-col relative overflow-hidden border-r border-gray-800">
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
            <h3 className="text-white/90 font-semibold flex items-center gap-2 text-sm tracking-wide">
              <Scan className="w-4 h-4 text-emerald-400" /> LIVE SCANNER VIEW
            </h3>
            {isProcessing && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
          
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {/* Scanning Overlay Effect */}
            {isProcessing && currentPreviewUrl && (
              <div className="absolute inset-0 pointer-events-none z-20 flex justify-center">
                 <div className="w-[80%] h-1 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[scan_2s_ease-in-out_infinite] opacity-70"></div>
                 <style>{`@keyframes scan { 0% { transform: translateY(50px); } 100% { transform: translateY(600px); } }`}</style>
              </div>
            )}

            {currentPreviewUrl ? (
              <img src={currentPreviewUrl} className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-sm border border-gray-700 transition-opacity duration-300" alt="Scanning Preview" />
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-gray-600" />
                </div>
                <p className="font-medium text-gray-400">Scanner is Idle</p>
                <p className="text-xs mt-2 text-gray-600 max-w-xs">Upload your OMR sheets on the right panel to begin the scanning process. Live preview will appear here.</p>
              </div>
            )}
          </div>
          
          {currentScanningFile && (
            <div className="absolute bottom-0 left-0 w-full p-3 bg-black/60 text-white text-xs backdrop-blur-md border-t border-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400"/> Processing: <span className="font-mono text-gray-300">{currentScanningFile}</span></span>
              <span className="text-emerald-400 font-semibold animate-pulse">Extracting Data...</span>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Controls, Uploads, Results */}
        <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto custom-scrollbar">
          
          {/* Controls Section */}
          <div className="p-6 space-y-6">
            
            {/* Top Setup Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">1. Exam Context</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Target Exam</label>
                  <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                    <option value="">Select Exam</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Target Class</label>
                  <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                    <option value="">Select Class</option>
                    {(uniqueClasses as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Answer Key Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col max-h-[300px]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Master Answer Key</h4>
                <label className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800">
                  <Upload size={14} /> Import Excel (.xlsx)
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                </label>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar pr-2 grid grid-cols-3 gap-6">
                <div>
                  <div className="sticky top-0 bg-white dark:bg-gray-900 pb-2 mb-2 border-b border-indigo-100 dark:border-gray-800 font-bold text-xs text-indigo-600 tracking-wide z-10">MATHS (1-25)</div>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+1} className="flex items-center gap-2 mb-1.5"><span className="w-6 text-right text-xs text-gray-500 font-medium">{i+1}.</span><select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs font-bold" value={answerKey[i+1] || ""} onChange={e => handleAnswerChange(i+1, e.target.value)}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                  ))}
                </div>
                <div>
                  <div className="sticky top-0 bg-white dark:bg-gray-900 pb-2 mb-2 border-b border-teal-100 dark:border-gray-800 font-bold text-xs text-teal-600 tracking-wide z-10">PHYSICS (26-50)</div>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+26} className="flex items-center gap-2 mb-1.5"><span className="w-6 text-right text-xs text-gray-500 font-medium">{i+26}.</span><select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs font-bold" value={answerKey[i+26] || ""} onChange={e => handleAnswerChange(i+26, e.target.value)}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                  ))}
                </div>
                <div>
                  <div className="sticky top-0 bg-white dark:bg-gray-900 pb-2 mb-2 border-b border-amber-100 dark:border-gray-800 font-bold text-xs text-amber-600 tracking-wide z-10">CHEMISTRY (51-75)</div>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i+51} className="flex items-center gap-2 mb-1.5"><span className="w-6 text-right text-xs text-gray-500 font-medium">{i+51}.</span><select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs font-bold" value={answerKey[i+51] || ""} onChange={e => handleAnswerChange(i+51, e.target.value)}><option value="">-</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Uploader Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-1 text-indigo-100">3. Process Sheets</h4>
                  <p className="text-2xl font-black mb-2">Ready to Scan?</p>
                  <p className="text-indigo-100 text-sm">{uploadedImages.length} images selected in queue.</p>
                </div>
                
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <label className="bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                    <Upload size={16} /> Add Images
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setUploadedImages(Array.from(e.target.files || []))} />
                  </label>
                  <button onClick={processImages} disabled={isProcessing || uploadedImages.length === 0} className="bg-white text-indigo-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5">
                    {isProcessing ? <><Loader className="animate-spin" size={16}/> Processing...</> : <><Scan size={16}/> Start Scanner</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table */}
            {processedResults.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Award size={16} className="text-emerald-500"/> Scan Results ({processedResults.length})</h3>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"><Save size={14}/> Save to DB</button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold">
                      <tr>
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Maths</th>
                        <th className="px-4 py-3">Phy</th>
                        <th className="px-4 py-3">Chem</th>
                        <th className="px-4 py-3 text-indigo-600 dark:text-indigo-400">Total</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {processedResults.map((res, i) => (
                        <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${res.doubtful ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}>
                          <td className="px-4 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">{res.studentId}</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{res.maths}</td>
                          <td className="px-4 py-3 text-teal-600 font-semibold">{res.physics}</td>
                          <td className="px-4 py-3 text-amber-600 font-semibold">{res.chemistry}</td>
                          <td className="px-4 py-3 text-indigo-700 dark:text-indigo-400 font-black text-base">{res.total}</td>
                          <td className="px-4 py-3 flex justify-end">
                            {res.doubtful ? 
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"><AlertTriangle size={12}/> Review</span> : 
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"><CheckCircle size={12}/> Clear</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Bottom Padding */}
            <div className="h-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
