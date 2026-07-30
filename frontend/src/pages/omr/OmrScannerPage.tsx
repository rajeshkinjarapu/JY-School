import React, { useState } from 'react';
import { Upload, Scan, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const OmrScannerPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  // A simple example mapping. The teacher can type this out or we can add an interface to build this key.
  const [answerKey, setAnswerKey] = useState<string>('1:B, 2:B, 3:B, 4:A, 5:C, 6:B, 7:A, 8:C, 9:D, 10:A, 11:A, 12:C, 13:B, 14:B, 15:C, 16:B, 17:B, 18:D, 19:B, 20:B, 21:A, 22:A, 23:B, 24:B, 25:B, 26:B, 27:C, 28:B, 29:B, 30:B, 31:C, 32:B, 33:B, 34:B, 35:B, 36:B, 37:B, 38:D, 39:A, 40:B, 41:A, 42:C, 43:B, 44:A, 45:B, 46:B, 47:C, 48:C, 49:C, 50:B, 51:C, 52:C, 53:C, 54:C, 55:C, 56:C, 57:B, 58:B, 59:B, 60:A, 61:C, 62:B, 63:B, 64:B, 65:B, 66:B, 67:C, 68:B, 69:B, 70:B, 71:B, 72:B, 73:B, 74:B, 75:C');

  const parseAnswerKey = (str: string) => {
    const keyObj: Record<string, string> = {};
    const pairs = str.split(',').map(s => s.trim()).filter(Boolean);
    pairs.forEach(pair => {
      const [q, a] = pair.split(':');
      if (q && a) {
        keyObj[q.trim()] = a.trim().toUpperCase();
      }
    });
    return keyObj;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file first');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await api.post('/api/omr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = res.data?.data;
      if (data && data.answers) {
        // Calculate score
        const keyObj = parseAnswerKey(answerKey);
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;

        const evaluatedAnswers: any = {};
        
        // Loop over the student's extracted answers
        Object.keys(data.answers).forEach(qNo => {
          const studentAns = data.answers[qNo]?.toUpperCase();
          const correctAns = keyObj[qNo];
          
          if (!correctAns) return; // ignore if not in key

          let status = 'UNATTEMPTED';
          if (studentAns === 'UNATTEMPTED' || !studentAns) {
            unattempted++;
          } else if (studentAns === correctAns) {
            correct++;
            status = 'CORRECT';
          } else {
            incorrect++;
            status = 'INCORRECT';
          }

          evaluatedAnswers[qNo] = {
            student: studentAns,
            correct: correctAns,
            status,
          };
        });

        const score = (correct * 4) - (incorrect * 1);

        setScanResult({
          ...data,
          evaluatedAnswers,
          stats: { correct, incorrect, unattempted, score }
        });
        toast.success('OMR Scanned successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error scanning OMR');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">AI OMR Scanner</h1>
          <p className="text-sm text-gray-500 mt-1">Automatically evaluate OMR sheets using Google Gemini Vision AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">1. Answer Key (Format: Q:Ans)</h2>
            <textarea
              className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              placeholder="1:A, 2:B, 3:C..."
            ></textarea>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">2. Upload OMR Sheet Image</h2>
            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl p-8 text-center bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="omr-upload"
              />
              <label htmlFor="omr-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-indigo-500 mb-3" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {selectedFile ? selectedFile.name : 'Click to Upload Image'}
                </span>
                <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP</span>
              </label>
            </div>

            <button
              onClick={handleScan}
              disabled={!selectedFile || isScanning}
              className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {isScanning ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Scanning with AI...</>
              ) : (
                <><Scan className="w-5 h-5" /> Scan & Evaluate</>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {scanResult ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-800 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{scanResult.studentName || 'Unknown Student'}</h2>
                  <p className="text-indigo-600 font-bold font-mono bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg inline-block mt-2">
                    ID: {scanResult.studentId || 'Not found'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Final Score</p>
                  <p className="text-4xl font-black text-indigo-600">{scanResult.stats.score}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
                  <span className="text-2xl font-black text-emerald-700">{scanResult.stats.correct}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Correct</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex flex-col items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                  <span className="text-2xl font-black text-rose-700">{scanResult.stats.incorrect}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-600">Incorrect</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-700 mt-7">{scanResult.stats.unattempted}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 mt-1">Unattempted</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Detailed Analysis</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {Object.keys(scanResult.evaluatedAnswers).map(qNo => {
                  const ans = scanResult.evaluatedAnswers[qNo];
                  const isCorrect = ans.status === 'CORRECT';
                  const isUnattempted = ans.status === 'UNATTEMPTED';
                  
                  return (
                    <div 
                      key={qNo} 
                      className={`p-3 rounded-xl border flex flex-col items-center ${
                        isCorrect ? 'bg-emerald-50 border-emerald-200' : 
                        isUnattempted ? 'bg-gray-50 border-gray-200' : 
                        'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-500">Q{qNo}</span>
                      <span className={`text-lg font-black ${
                        isCorrect ? 'text-emerald-700' : 
                        isUnattempted ? 'text-gray-500' : 
                        'text-rose-700'
                      }`}>
                        {ans.student || '-'}
                      </span>
                      {!isCorrect && !isUnattempted && (
                        <span className="text-[10px] font-bold text-emerald-600 mt-1">Ans: {ans.correct}</span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50 dark:bg-gray-900/50">
              <Scan className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-500">No Scan Results Yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mt-2">Upload an OMR sheet and click "Scan & Evaluate" to see the AI analysis here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
