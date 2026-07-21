import React, { useState } from 'react';
import { Upload, FileType, CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface OMRResult {
  student_id?: string;
  answers: Record<string, string | null>;
  total_questions: number;
  filled_count: number;
  blank_count: number;
  score?: number | null;
  correct_count?: number | null;
  wrong_count?: number | null;
  max_score?: number;
}

export const OMRScannerPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<OMRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // Quick Answer Key configuration state
  const [answerKeyInput, setAnswerKeyInput] = useState<string>('');
  const [parsedAnswerKey, setParsedAnswerKey] = useState<Record<string, string> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResults(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSaveAnswerKey = () => {
    // Parse comma-separated or space-separated answers like "A,B,C,D..." or "1:A 2:B"
    try {
      const keyObj: Record<string, string> = {};
      const tokens = answerKeyInput.toUpperCase().trim().split(/[\s,]+/);
      tokens.forEach((token, idx) => {
        if (token.includes(':')) {
          const [q, a] = token.split(':');
          if (q && ['A','B','C','D'].includes(a)) keyObj[q] = a;
        } else if (['A','B','C','D'].includes(token)) {
          keyObj[(idx + 1).toString()] = token;
        }
      });
      setParsedAnswerKey(Object.keys(keyObj).length > 0 ? keyObj : null);
      setShowKeyModal(false);
    } catch {
      alert('Invalid Answer Key format. Enter options like: A, B, C, D...');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const file = files[0];
      const base64Image = await fileToBase64(file);

      const response = await fetch('/api/omr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: base64Image,
          answer_key: parsedAnswerKey 
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResults(data);
      } else {
        throw new Error(data.error || 'Failed to scan OMR sheet');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during OMR scan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMR Scanner</h1>
          <p className="text-gray-500">Upload scanned OMR sheets for 100% automated evaluation</p>
        </div>
        <button 
          onClick={() => setShowKeyModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" />
          {parsedAnswerKey ? `Answer Key Set (${Object.keys(parsedAnswerKey).length} Qs)` : 'Set Answer Key'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border-dashed border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-center relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Drag & Drop or Click to Upload OMR Image</h3>
                <p className="text-sm text-slate-500 mt-1">Supports scanned JPG / PNG images of JY High School OMR sheets</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between">
                Selected File
                <button onClick={() => { setFiles([]); setResults(null); }} className="text-xs text-red-500 hover:underline">Clear</button>
              </h3>
              <div className="space-y-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <FileType className="w-5 h-5 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing OMR Sheet...
                  </>
                ) : 'Start 100% OMR Scan'}
              </button>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {results && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">OMR Scan Results</h2>
                    {results.student_id && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Student ID: {results.student_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                    Attempted: {results.filled_count} / {results.total_questions}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    Blank: {results.blank_count}
                  </span>
                </div>
              </div>

              {/* SCORE CARD DISPLAY */}
              {results.score !== null && results.score !== undefined && (
                <div className="p-4 bg-indigo-950 text-white rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Total Score (No Negative Marking)</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-white">{results.score}</span>
                      <span className="text-sm text-indigo-300">/ {results.max_score} Marks</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div className="bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                      <p className="text-xs text-emerald-300">Correct (+4)</p>
                      <p className="text-lg font-bold text-emerald-400">{results.correct_count}</p>
                    </div>
                    <div className="bg-rose-900/50 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                      <p className="text-xs text-rose-300">Wrong (0)</p>
                      <p className="text-lg font-bold text-rose-400">{results.wrong_count}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2 bg-slate-50 rounded-xl">
                {Object.entries(results.answers).map(([qNum, ans]) => {
                  const keyAns = parsedAnswerKey?.[qNum];
                  const isCorrect = keyAns && ans === keyAns;
                  const isWrong = keyAns && ans && ans !== keyAns;

                  let cardStyle = 'bg-gray-100 border-gray-200 text-gray-400';
                  if (ans) {
                    if (parsedAnswerKey) {
                      cardStyle = isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900';
                    } else {
                      cardStyle = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                    }
                  }

                  return (
                    <div key={qNum} className={`p-2 rounded-lg border text-center text-xs font-bold ${cardStyle}`}>
                      <span>Q{qNum.padStart(2, '0')}: </span>
                      <span className={ans ? 'text-sm font-extrabold' : ''}>{ans || '-'}</span>
                      {keyAns && (
                        <div className="text-[10px] opacity-75 font-normal">Key: {keyAns}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* ANSWER KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Set Answer Key</h3>
            <p className="text-xs text-gray-500">
              Enter answers separated by spaces or commas (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">C B C D B D A...</code>)
            </p>
            <textarea
              rows={5}
              value={answerKeyInput}
              onChange={(e) => setAnswerKeyInput(e.target.value)}
              placeholder="C, B, C, D, B, D, A, C, D, A..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAnswerKey}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Save Answer Key
              </button>
            </div>
          </div>
        </div>
      )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 bg-amber-50 border border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              Instructions for Best Accuracy
            </h3>
            <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
              <li>Use high-resolution flat-bed scanner images for 100% accuracy.</li>
              <li>Ensure the sheet image includes full boundaries.</li>
              <li>Bubble markings must be clear with dark blue/black ink.</li>
              <li>Results display recognized responses for Q01 to Q75.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

