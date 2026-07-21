import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Award, User, Star } from 'lucide-react';

export const ProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudentsData([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch exam results mapped by student
        const res: any = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        setStudentsData(res.data || []);
      } catch (e) {
        console.error('Error fetching progress card data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 print:hidden gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold uppercase text-gray-400 shrink-0">Select Exam:</span>
          <select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)} 
            className="input !py-1.5 min-w-[200px]"
          >
            <option value="">-- Choose Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
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
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-none shadow-lg shadow-pink-500/30">
            <Printer className="w-4 h-4" /> Print Progress Cards
          </button>
        )}
      </div>

      {loading && <div className="p-12 text-center">Loading Data...</div>}

      {!loading && studentsData.length > 0 && (
        <div className="print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; padding: 0 !important; }
              .progress-card { page-break-inside: avoid; page-break-after: always; box-shadow: none !important; border: 1px solid #eee !important; margin: 0 auto !important; }
              .progress-card:last-child { page-break-after: auto; }
            }
          `}} />
          
          {studentsData.map((data: any) => {
            const totalMaxMarks = data.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
            const totalObtained = data.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
            const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : 0;
            
            return (
              <div key={data.studentId} className="progress-card w-full max-w-[210mm] mx-auto bg-white border-2 border-gray-800 p-8 relative font-serif text-black">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b-4 border-double border-gray-800 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold uppercase tracking-wider text-black whitespace-nowrap truncate">JY School</h2>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-lg font-bold uppercase underline tracking-wider">Academic Progress Report</p>
                    <p className="text-sm font-semibold mt-1">Session: 2026-27</p>
                  </div>
                </div>

                {/* Student Details & Photo */}
                <div className="flex justify-between items-start mb-6">
                  <table className="w-[70%] text-sm font-bold border-collapse">
                    <tbody>
                      <tr><td className="py-1.5 text-gray-600">Student Name:</td><td className="py-1.5 px-2 text-black border-b border-gray-300">{data.studentName}</td></tr>
                      <tr><td className="py-1.5 text-gray-600">Examination:</td><td className="py-1.5 px-2 text-black border-b border-gray-300">{selectedExam?.name}</td></tr>
                      <tr><td className="py-1.5 text-gray-600">Class & Section:</td><td className="py-1.5 px-2 text-black border-b border-gray-300">{data.className}</td></tr>
                      <tr><td className="py-1.5 text-gray-600">Roll Number:</td><td className="py-1.5 px-2 text-black border-b border-gray-300">{data.rollNo}</td></tr>
                    </tbody>
                  </table>
                  
                  <div className="w-[100px] h-[120px] border-2 border-gray-800 bg-gray-50 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img 
                      src={data.photoUrl || data.studentPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.studentName || 'Student')}&background=random`} 
                      alt="Student" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.studentName || 'Student')}&background=random`; }}
                    />
                  </div>
                </div>

                {/* Marks Table */}
                <table className="w-full text-sm border-collapse border-2 border-gray-800 mb-8">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-800 py-3 px-4 text-left font-bold uppercase">Subject</th>
                      <th className="border border-gray-800 py-3 px-4 text-center font-bold uppercase w-32">Max Marks</th>
                      <th className="border border-gray-800 py-3 px-4 text-center font-bold uppercase w-32">Marks Obtained</th>
                      <th className="border border-gray-800 py-3 px-4 text-center font-bold uppercase w-24">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.marks.map((m: any, idx: number) => (
                      <tr key={idx} className="even:bg-gray-50">
                        <td className="border border-gray-800 py-2 px-4 font-semibold text-black">{m.subject}</td>
                        <td className="border border-gray-800 py-2 px-4 text-center text-black">{m.maxMarks || 100}</td>
                        <td className="border border-gray-800 py-2 px-4 text-center font-bold text-black">{m.obtained}</td>
                        <td className="border border-gray-800 py-2 px-4 text-center font-bold text-black">{m.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-gray-800">
                      <td className="border border-gray-800 py-3 px-4 font-bold text-right uppercase">Total Score:</td>
                      <td className="border border-gray-800 py-3 px-4 text-center font-bold text-black">{totalMaxMarks}</td>
                      <td className="border border-gray-800 py-3 px-4 text-center font-bold text-black">{totalObtained}</td>
                      <td className="border border-gray-800 py-3 px-4 text-center font-bold text-black">{percentage}%</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer Signatures */}
                <div className="flex justify-between items-end pt-8 mt-4 border-t border-gray-300">
                  <div className="text-center">
                    <div className="w-40 border-b-2 border-gray-600 mb-2"></div>
                    <p className="text-xs uppercase font-bold text-gray-700">Class Teacher</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b-2 border-gray-600 mb-2"></div>
                    <p className="text-xs uppercase font-bold text-gray-700">Parent / Guardian</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b-2 border-gray-800 mb-2"></div>
                    <p className="text-xs uppercase font-bold text-gray-900">Principal</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400">No results found for this class. Make sure marks are entered.</div>
      )}
    </div>
  );
};
