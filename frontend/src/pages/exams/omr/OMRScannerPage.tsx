import React, { useState, useEffect, useRef } from "react";
import {
  Upload, CheckCircle, Save, Scan, Loader, AlertTriangle,
  FileText, Maximize, Minimize, Key, Zap, BarChart3,
  ChevronRight, ImagePlus, X, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { ManageAnswerKeyModal } from "./ManageAnswerKeyModal";

interface ScanResult {
  fileName: string;
  student_id: string;
  maths: number;
  physics: number;
  chemistry: number;
  total: number;
  correct: number;
  wrong: number;
  doubtful?: boolean;
}

export const OMRScannerPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({});

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/api/exams").then((res: any) => setExams(res.data)).catch(() => {});
    api.get("/api/classes").then((res: any) => setClasses(res.data)).catch(() => {});
  }, []);

  // Fetch answer key from DB when exam/class selected
  const fetchAnswerKey = async () => {
    if (!selectedExamId || !selectedClassId) { setAnswerKey({}); return; }
    try {
      const res = await api.get(`/api/exams/answer-key?examId=${selectedExamId}&classId=${selectedClassId}`);
      setAnswerKey(res.data || {});
    } catch { setAnswerKey({}); }
  };

  useEffect(() => { fetchAnswerKey(); }, [selectedExamId, selectedClassId, isModalOpen]);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => {
      if (!prev) { document.body.classList.add('omr-fullscreen'); }
      else { document.body.classList.remove('omr-fullscreen'); }
      return !prev;
    });
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setUploadedFiles(arr);
    setPreviewUrls(arr.map(f => URL.createObjectURL(f)));
    setProcessedResults([]);
    if (arr.length > 0) setCurrentPreview(URL.createObjectURL(arr[0]));
  };

  const processImages = async () => {
    if (!selectedExamId) return toast.error("Exam select చేయండి");
    if (Object.keys(answerKey).length === 0) return toast.error("Master Answer Key missing! Manage Key లో ముందు save చేయండి.");
    if (uploadedFiles.length === 0) return toast.error("OMR images select చేయండి");

    setIsProcessing(true);
    setProcessedResults([]);
    const results: ScanResult[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      setCurrentFileName(file.name);
      setCurrentPreview(previewUrls[i]);
      setProgress(Math.round(((i) / uploadedFiles.length) * 100));

      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("examId", selectedExamId);
        formData.append("answerKey", JSON.stringify(answerKey));

        const res = await api.post("/api/exams/scan-omr", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const data = res.data?.data || res.data;
        results.push({
          fileName: file.name,
          student_id: data.student_id || "UNKNOWN",
          maths: data.marks?.maths || 0,
          physics: data.marks?.physics || 0,
          chemistry: data.marks?.chemistry || 0,
          total: data.marks?.total || 0,
          correct: data.correct || 0,
          wrong: data.wrong || 0,
          doubtful: false,
        });
      } catch (err: any) {
        toast.error(`${file.name} process failed: ${err?.response?.data?.message || err.message}`);
      }
    }

    setProgress(100);
    setProcessedResults(results);
    setCurrentFileName(null);
    setIsProcessing(false);
    if (results.length > 0) toast.success(`${results.length} sheets processed successfully!`);
  };

  const totalCorrect = processedResults.reduce((a, b) => a + b.correct, 0);
  const avgTotal = processedResults.length > 0
    ? Math.round(processedResults.reduce((a, b) => a + b.total, 0) / processedResults.length)
    : 0;

  return (
    <div className={`bg-gray-50 dark:bg-[#0f0f1a] overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50' : 'flex flex-col'}`} style={{ height: isFullScreen ? '100vh' : 'calc(100vh - 4rem)' }}>

      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-[#16162a] border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
            <Scan className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white leading-none">OMR Scanner Pro</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Backend AI Processing Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            AI Engine Ready
          </span>
          <button onClick={toggleFullScreen} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" title="Focus Mode">
            {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">

        {/* LEFT: Live Preview */}
        <div className="lg:col-span-2 bg-gray-900 dark:bg-[#0a0a14] flex flex-col overflow-hidden relative border-r border-gray-800">
          {/* Scanner overlay line animation */}
          {isProcessing && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              <div className="scanner-line"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent"></div>
            </div>
          )}

          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Live Preview</span>
            </div>
            {isProcessing && (
              <span className="text-emerald-400 text-xs font-bold animate-pulse">{progress}% Complete</span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            {currentPreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentPreview}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-gray-700"
                  alt="Scanning"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 flex flex-col items-center gap-2">
                      <Loader className="animate-spin text-indigo-400 w-8 h-8" />
                      <p className="text-white text-sm font-bold">Processing...</p>
                      <p className="text-gray-400 text-xs">{currentFileName}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-4 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-700 group-hover:border-indigo-500 flex items-center justify-center transition-all duration-300">
                  <ImagePlus className="w-12 h-12 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-gray-400 font-bold text-sm">Scanner Idle</p>
                  <p className="text-gray-600 text-xs mt-1 max-w-xs">Click here or use "Upload Images" button to load OMR sheets</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Strip */}
          {previewUrls.length > 1 && (
            <div className="shrink-0 p-3 bg-black/40 border-t border-gray-800 flex gap-2 overflow-x-auto">
              {previewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  onClick={() => setCurrentPreview(url)}
                  className={`h-14 w-10 object-cover rounded cursor-pointer border-2 transition-all ${currentPreview === url ? 'border-indigo-500 scale-105' : 'border-gray-700 opacity-60'}`}
                  alt={`Sheet ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Status bar */}
          {currentFileName && (
            <div className="shrink-0 px-4 py-2.5 bg-indigo-900/40 border-t border-indigo-800/50 flex items-center gap-2">
              <FileText className="text-indigo-400 w-4 h-4 shrink-0" />
              <span className="text-indigo-200 text-xs truncate font-mono">{currentFileName}</span>
              <Loader className="animate-spin ml-auto text-indigo-400 w-3 h-3 shrink-0" />
            </div>
          )}

          <style>{`
            .scanner-line {
              position: absolute; left: 0; right: 0; height: 3px;
              background: linear-gradient(to right, transparent, #34d399, transparent);
              box-shadow: 0 0 20px #34d399;
              animation: scanDown 2s ease-in-out infinite;
            }
            @keyframes scanDown {
              0% { top: 10%; } 100% { top: 90%; }
            }
          `}</style>
        </div>

        {/* RIGHT: Controls + Results */}
        <div className="lg:col-span-3 flex flex-col overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0f0f1a]">
          <div className="p-5 space-y-5">

            {/* Setup Card */}
            <div className="bg-white dark:bg-[#16162a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                <h3 className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Exam Setup</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Target Exam</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow dark:text-gray-200"
                      value={selectedExamId}
                      onChange={e => { setSelectedExamId(e.target.value); setProcessedResults([]); }}
                    >
                      <option value="">Select Exam...</option>
                      {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Target Class</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow dark:text-gray-200"
                      value={selectedClassId}
                      onChange={e => { setSelectedClassId(e.target.value); setProcessedResults([]); }}
                    >
                      <option value="">Select Class...</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                  </div>
                </div>

                {/* Answer Key Status */}
                <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${Object.keys(answerKey).length > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'}`}>
                  <Key size={18} className={Object.keys(answerKey).length > 0 ? 'text-emerald-600' : 'text-amber-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Master Answer Key</p>
                    <p className={`text-xs ${Object.keys(answerKey).length > 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {Object.keys(answerKey).length > 0
                        ? `✓ Ready — ${Object.keys(answerKey).length} answers saved in database`
                        : '⚠ Not set — Click "Manage Key" to add answers'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!selectedExamId || !selectedClassId}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors"
                  >
                    Manage Key
                  </button>
                </div>
              </div>
            </div>

            {/* Upload & Scan Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl overflow-hidden shadow-xl relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full -ml-8 -mb-8 blur-xl"></div>

              <div className="relative p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Upload & Process</p>
                    <h3 className="text-white text-2xl font-black leading-none">
                      {uploadedFiles.length === 0 ? "Ready to Scan?" : `${uploadedFiles.length} Sheet${uploadedFiles.length > 1 ? 's' : ''} Loaded`}
                    </h3>
                    {uploadedFiles.length > 0 && (
                      <p className="text-indigo-200 text-xs mt-1">Select "Start Scanner" to begin AI processing</p>
                    )}
                  </div>
                  <Zap className="text-indigo-300 w-8 h-8 shrink-0 mt-1" />
                </div>

                <div className="flex gap-3 mt-4">
                  <label className="flex-1 bg-white/15 hover:bg-white/25 border border-white/20 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2">
                    <Upload size={15} /> Upload Images
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFilesSelected(e.target.files)} />
                  </label>

                  <button
                    onClick={processImages}
                    disabled={isProcessing || uploadedFiles.length === 0}
                    className="flex-1 bg-white text-indigo-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isProcessing
                      ? <><Loader className="animate-spin" size={15} /> Processing...</>
                      : <><Scan size={15} /> Start Scanner</>
                    }
                  </button>
                </div>

                {/* Progress */}
                {isProcessing && (
                  <div className="mt-3">
                    <div className="flex justify-between text-white/70 text-xs mb-1">
                      <span>Processing sheets...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {processedResults.length > 0 && (
              <div className="bg-white dark:bg-[#16162a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-indigo-600">{processedResults.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sheets Scanned</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">{avgTotal}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Avg Total /300</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-black text-amber-600">{totalCorrect}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Correct Ans</p>
                  </div>
                </div>

                <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Scan Results</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setProcessedResults([]); setUploadedFiles([]); setPreviewUrls([]); setCurrentPreview(null); }} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <RefreshCw size={12} /> Reset
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5">
                      <Save size={12} /> Save All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                        <th className="px-4 py-3 text-left">File / Student</th>
                        <th className="px-3 py-3 text-center text-indigo-500">Maths</th>
                        <th className="px-3 py-3 text-center text-teal-500">Phy</th>
                        <th className="px-3 py-3 text-center text-amber-500">Chem</th>
                        <th className="px-3 py-3 text-center text-purple-600 font-black">Total</th>
                        <th className="px-4 py-3 text-center">C/W</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {processedResults.map((res, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-xs truncate max-w-[120px]" title={res.fileName}>{res.fileName}</p>
                            <p className="text-gray-400 text-xs font-mono">{res.student_id}</p>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-indigo-600">{res.maths}</td>
                          <td className="px-3 py-3 text-center font-bold text-teal-600">{res.physics}</td>
                          <td className="px-3 py-3 text-center font-bold text-amber-600">{res.chemistry}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="font-black text-purple-700 dark:text-purple-400 text-base">{res.total}</span>
                            <p className="text-gray-400 text-[10px]">/300</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-emerald-600 font-bold text-xs">{res.correct}✓</span>
                            <span className="text-gray-400 text-xs"> / </span>
                            <span className="text-red-500 font-bold text-xs">{res.wrong}✗</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="h-6"></div>
          </div>
        </div>
      </div>

      <ManageAnswerKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        examId={selectedExamId}
        classId={selectedClassId}
      />
    </div>
  );
};
