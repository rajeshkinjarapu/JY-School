import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Download, ChevronLeft, Settings, Save, Trash2, FileSpreadsheet, X, Upload } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { SlipTestRankCard, type ProcessedStudent } from '../../components/OfficeTools/SlipTestRankCard';

export const SlipTestManualPage = () => {
  const navigate = useNavigate();
  const { setDynamicTitle } = useOutletContext<{ setDynamicTitle?: (title: string) => void }>() || {};
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (setDynamicTitle) {
      setDynamicTitle('Slip Test Manager');
    }
  }, [setDynamicTitle]);


  // Form State
  const [testName, setTestName] = useState('SLIP TEST');
  const HARDCODED_SUBJECTS = ['TELUGU', 'HINDI', 'ENGLISH', 'MATHS', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'SCIENCE', 'SOCIAL'];
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [classId, setClassId] = useState('');
  const [maxMarks, setMaxMarks] = useState(20);
  
  // Signatures State
  const [teacherSign, setTeacherSign] = useState<string>('');
  const [principalSign, setPrincipalSign] = useState<string>('');

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Marks State
  const [marks, setMarks] = useState<Record<string, number | ''>>({});

  // Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/api/classes');
      return res.data;
    }
  });

  // Fetch Students for selected class
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await api.get(`/api/students?classId=${classId}&limit=1000`);
      return res.data?.data || res.data || [];
    },
    enabled: !!classId
  });

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('slipTestSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.testName) setTestName(parsed.testName);
        if (parsed.subjectName) setSubjectName(parsed.subjectName);
        if (parsed.examDate) setExamDate(parsed.examDate);
        if (parsed.classId) setClassId(parsed.classId);
        if (parsed.maxMarks) setMaxMarks(parsed.maxMarks);
        if (parsed.teacherSign) setTeacherSign(parsed.teacherSign);
        if (parsed.principalSign) setPrincipalSign(parsed.principalSign);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    const settings = { testName, subjectName, examDate, classId, maxMarks, teacherSign, principalSign };
    localStorage.setItem('slipTestSettings', JSON.stringify(settings));
  }, [testName, subjectName, examDate, classId, maxMarks, teacherSign, principalSign]);

  // Derived Values
  const selectedClass = classes.find((c: any) => c.id === classId);


  // Calculate dense rankings whenever marks change
  const processedStudents: ProcessedStudent[] = React.useMemo(() => {
    if (!students || students.length === 0) return [];
    
    // First map to StudentMark format, ignoring those without valid marks
    const validStudents = students.map((s: any) => {
      const markStr = marks[s.id] || '';
      const markNum = parseFloat(String(markStr));
      return {
        id: s.id,
        rollNo: s.rollNo,
        name: s.user?.name || 'Unknown',
        marks: isNaN(markNum) ? -1 : markNum
      };
    }).filter((s: any) => s.marks >= 0);

    // Sort descending by marks
    validStudents.sort((a: any, b: any) => b.marks - a.marks);

    // Calculate Dense Rank and Percentage
    let currentRank = 1;
    let prevMarks = -1;

    return validStudents.map((s: any, index: number) => {
      if (index > 0 && s.marks < prevMarks) {
        currentRank++;
      }
      prevMarks = s.marks;
      
      const pct = maxMarks > 0 ? (s.marks / maxMarks) * 100 : 0;
      return {
        ...s,
        rank: currentRank,
        percentage: pct.toFixed(1)
      };
    });
  }, [students, marks, maxMarks]);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    try {
      toast.loading("Generating High-Res Image...", { id: "download" });
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      const filename = `${testName}_${subjectName || 'Subject'}_${selectedClass?.name || 'Class'}.jpg`.replace(/[^a-z0-9_]/gi, '_');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Downloaded successfully!", { id: "download" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.", { id: "download" });
    }
  };

  const handleDownloadExcel = async () => {
    if (processedStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const excelData = processedStudents.map((s) => ({
      "Rank": s.rank,
      "Student ID": s.rollNo || 'N/A',
      "Name of the Student": s.name,
      "Obtained Marks": s.marks,
      "Maximum Marks": maxMarks,
      "Percentage (%)": s.percentage
    }));

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Slip Test Marks");

    const filename = `${testName}_${subjectName || 'Subject'}_${selectedClass?.name || 'Class'}.xlsx`.replace(/[^a-z0-9_]/gi, '_');
    XLSX.writeFile(workbook, filename);
    toast.success("Excel Downloaded!");
  };

  const handleSaveToDB = async () => {
    if (!classId || !subjectName || !examDate) {
      toast.error("Please select Class, Subject, and Date in Settings.");
      setIsSettingsOpen(true);
      return;
    }

    if (processedStudents.length === 0) {
      toast.error("Please enter marks for at least one student.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving to Database...");

    try {
      // 1. Create Slip Test
      const slipTestRes = await api.post('/api/slipTests', {
        name: testName,
        date: examDate,
        maxMarks: maxMarks,
        classId: classId,
        subjectId: subjectName // Passing subjectName as subjectId, backend will handle it
      });

      const slipTestId = slipTestRes.data.id;

      // 2. Save Marks
      const marksData = processedStudents.map(s => ({
        studentId: s.id,
        marksObtained: s.marks
      }));

      await api.post(`/api/slipTests/${slipTestId}/marks`, {
        marks: marksData
      });

      toast.success("Marks saved to database successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save to database.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearMarks = () => {
    if (window.confirm("Are you sure you want to clear all entered marks?")) {
      setMarks({});
      toast.success("Marks cleared.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition-colors font-medium"
        >
          <Settings className="w-4 h-4" />
          Test Settings
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Input */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">1</span> 
                Enter Marks
              </h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-600">
                {students.length} Students
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleSaveToDB}
                disabled={isSaving || processedStudents.length === 0}
                className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save to DB"}
              </button>
              <button 
                onClick={handleClearMarks}
                disabled={processedStudents.length === 0}
                className="flex justify-center items-center px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-50"
                title="Clear Marks"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-2 mt-4">
              {!classId ? (
                <div className="text-center py-8 text-slate-500">
                  Please select a Class in <span className="font-semibold cursor-pointer text-blue-600 underline" onClick={() => setIsSettingsOpen(true)}>Settings</span> to view students.
                </div>
              ) : isLoadingStudents ? (
                <div className="text-center py-8 text-slate-500">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No students found.</div>
              ) : (
                students.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="truncate pr-4 flex-1">
                      <p className="font-medium text-slate-800 text-sm truncate">{student.user?.name}</p>
                      <p className="text-xs text-slate-500">{student.rollNo || 'No Roll No'}</p>
                    </div>
                    <input
                      type="number"
                      placeholder="Marks"
                      value={marks[student.id] || ''}
                      onChange={(e) => setMarks({ ...marks, [student.id]: e.target.value })}
                      className="w-24 p-2 text-center rounded-lg border-slate-200 border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-blue-600"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preview & Download */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800">Live Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadExcel}
                disabled={processedStudents.length === 0}
                className="px-4 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleDownloadImage}
                disabled={processedStudents.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                JPG
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-8 rounded-3xl w-full flex justify-center overflow-x-auto shadow-inner min-h-[600px]">
            <div className="origin-top scale-[0.60] sm:scale-[0.80] xl:scale-[0.90] transition-transform">
              <SlipTestRankCard 
                ref={cardRef}
                students={processedStudents}
                testName={testName}
                subject={subjectName || 'SUBJECT'}
                examDate={examDate}
                className={selectedClass?.name || 'Class'}
                maxMarks={maxMarks}
                logoSrc="/logo.png"
                teacherSigSrc={teacherSign}
                principalSigSrc={principalSign}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Test Settings Modal Overlay */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Test Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select Class...</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select Subject...</option>
                    {HARDCODED_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. SLIP TEST"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-800 mb-4">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Teacher Signature */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Teacher Signature</label>
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group bg-white">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, setTeacherSign)} 
                      />
                      {teacherSign ? (
                        <>
                          <img src={teacherSign} alt="Teacher Sig" className="h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                            <Upload className="w-5 h-5" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center">
                          <Upload className="w-5 h-5 mb-1 opacity-50" />
                          <span className="text-xs">Upload Image</span>
                        </div>
                      )}
                    </label>
                    {teacherSign && (
                      <button onClick={() => setTeacherSign('')} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>

                  {/* Principal Signature */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Principal Signature</label>
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden group bg-white">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, setPrincipalSign)} 
                      />
                      {principalSign ? (
                        <>
                          <img src={principalSign} alt="Principal Sig" className="h-full object-contain p-2" />
                          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                            <Upload className="w-5 h-5" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center">
                          <Upload className="w-5 h-5 mb-1 opacity-50" />
                          <span className="text-xs">Upload Image</span>
                        </div>
                      )}
                    </label>
                    {principalSign && (
                      <button onClick={() => setPrincipalSign('')} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">Settings and signatures are automatically saved in this browser for future use.</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default SlipTestManualPage;
