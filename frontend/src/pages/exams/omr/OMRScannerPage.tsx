import React, { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle, Save, Scan, Edit, Loader, AlertTriangle, AlertCircle } from "lucide-react";
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
  
  // Handlers for Manual Answer Key
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
        // Assuming Excel has two columns: Q.No and Answer
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
      try {
        const result = await processImageWithWorker(worker, file, fileId);
        // Evaluate against answer key
        let maths = 0, physics = 0, chemistry = 0;
        let doubtful = false;
        
        for (let q = 1; q <= 75; q++) {
           const studentAns = result.answers[q];
           if (studentAns === "DOUBTFUL") doubtful = true;
           else if (studentAns === answerKey[q]) {
             if (q <= 25) maths += 4; // Assuming 4 marks per correct answer
             else if (q <= 50) physics += 4;
             else chemistry += 4;
           } else if (studentAns !== "-" && studentAns !== undefined) {
             // Negative marking (-1) if wrong, just as an example
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
    }
    setProcessedResults(results);
    setIsProcessing(false);
    toast.success("Processing complete!");
  };

  return (
    <div className="page-container h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">OMR Scanner & Processor</h2>
          <p className="text-sm text-gray-500">Scan filled OMR sheets and automatically evaluate them.</p>
        </div>
        {!workerReady && <span className="text-amber-500 text-sm font-semibold flex items-center gap-2"><Loader className="animate-spin" size={16}/> Initializing Scanner Engine...</span>}
        {workerReady && <span className="text-emerald-500 text-sm font-semibold flex items-center gap-2"><CheckCircle size={16}/> Scanner Ready</span>}
      </div>

      {/* Target Exam Selection */}
      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Select Exam</label>
          <select className="input" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            <option value="">-- Select Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Select Class</label>
          <select className="input" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
            <option value="">-- Select Class --</option>
            {selectedExam?.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Answer Key Section */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Edit size={18} /> Answer Key (75 Questions)</h3>
          <div className="flex gap-2">
             <label className="btn-secondary cursor-pointer">
                <Upload size={16} /> Upload Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
             </label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 max-h-64 overflow-y-auto p-2">
          {/* Maths */}
          <div>
            <h4 className="font-bold text-indigo-600 mb-2 border-b">Maths (1-25)</h4>
            {Array.from({ length: 25 }).map((_, i) => {
              const q = i + 1;
              return (
                <div key={q} className="flex items-center gap-2 mb-1 text-sm">
                  <span className="w-6 text-right font-semibold">{q}.</span>
                  <select className="input !py-1 !px-2" value={answerKey[q] || ""} onChange={e => handleAnswerChange(q, e.target.value)}>
                    <option value="">-</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              );
            })}
          </div>
          {/* Physics */}
          <div>
            <h4 className="font-bold text-teal-600 mb-2 border-b">Physics (26-50)</h4>
            {Array.from({ length: 25 }).map((_, i) => {
              const q = i + 26;
              return (
                <div key={q} className="flex items-center gap-2 mb-1 text-sm">
                  <span className="w-6 text-right font-semibold">{q}.</span>
                  <select className="input !py-1 !px-2" value={answerKey[q] || ""} onChange={e => handleAnswerChange(q, e.target.value)}>
                    <option value="">-</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              );
            })}
          </div>
          {/* Chemistry */}
          <div>
            <h4 className="font-bold text-amber-600 mb-2 border-b">Chemistry (51-75)</h4>
            {Array.from({ length: 25 }).map((_, i) => {
              const q = i + 51;
              return (
                <div key={q} className="flex items-center gap-2 mb-1 text-sm">
                  <span className="w-6 text-right font-semibold">{q}.</span>
                  <select className="input !py-1 !px-2" value={answerKey[q] || ""} onChange={e => handleAnswerChange(q, e.target.value)}>
                    <option value="">-</option>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload & Scan Section */}
      <div className="card p-6 flex flex-col items-center justify-center min-h-[150px] border-dashed border-2 bg-indigo-50/30 dark:bg-indigo-900/10">
         <Scan size={40} className="text-indigo-400 mb-3" />
         <h3 className="text-lg font-bold">Upload Scanned OMR Sheets</h3>
         <label className="btn-primary cursor-pointer mt-4">
            Select Images
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setUploadedImages(Array.from(e.target.files || []))} />
         </label>
         {uploadedImages.length > 0 && (
           <div className="mt-4 flex flex-col items-center">
             <p className="font-semibold text-indigo-600 mb-3">{uploadedImages.length} files selected.</p>
             <button onClick={processImages} disabled={isProcessing} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 w-48">
               {isProcessing ? <><Loader className="animate-spin" size={18}/> Processing...</> : <><Scan size={18}/> Start Scanning</>}
             </button>
           </div>
         )}
      </div>

      {/* Results Section */}
      {processedResults.length > 0 && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Processed Results</h3>
            <button className="btn-primary"><Save size={18}/> Save Marks to Database</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Student ID</th>
                  <th>Maths</th>
                  <th>Physics</th>
                  <th>Chemistry</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {processedResults.map((res, i) => (
                  <tr key={i} className={res.doubtful ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                    <td className="font-mono text-xs">{res.fileName}</td>
                    <td className="font-bold">{res.studentId}</td>
                    <td className="text-emerald-600 font-bold">{res.maths}</td>
                    <td className="text-teal-600 font-bold">{res.physics}</td>
                    <td className="text-amber-600 font-bold">{res.chemistry}</td>
                    <td className="font-black text-indigo-600 text-lg">{res.total}</td>
                    <td>
                      {res.doubtful ? 
                        <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1 w-max"><AlertTriangle size={12}/> Needs Review</span> : 
                        <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1 w-max"><CheckCircle size={12}/> Clear</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
