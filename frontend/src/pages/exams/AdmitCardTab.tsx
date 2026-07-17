import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, User, Calendar, MapPin } from 'lucide-react';

export const AdmitCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudents([]);
        setExamPlans([]);
        return;
      }
      setLoading(true);
      try {
        const [studentsRes, plansRes]: any = await Promise.all([
          api.get(`/api/classes/${selectedClassId}/students`),
          api.get(`/api/exams/${selectedExamId}/plans`)
        ]);
        setStudents(studentsRes.data || []);
        setExamPlans(plansRes.data || []);
      } catch (e) {
        console.error('Error fetching admit card data', e);
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
        
        {students.length > 0 && (
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Admit Cards
          </button>
        )}
      </div>

      {loading && <div className="p-12 text-center">Loading Data...</div>}

      {!loading && students.length > 0 && (
        <div className="print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
              .admit-card { page-break-inside: avoid; page-break-after: always; box-shadow: none !important; border: 1px solid #ddd !important; }
              .admit-card:last-child { page-break-after: auto; }
            }
          `}} />
          
          {students.map((student) => (
            <div key={student.id} className="admit-card w-full max-w-[210mm] mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative">
              {/* Header */}
              <div className="bg-indigo-600 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-indigo-600 text-2xl shadow-inner">
                    JY
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-wider uppercase">JY School</h2>
                    <p className="text-indigo-100 font-medium text-sm tracking-widest uppercase">Excellence in Education</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold uppercase tracking-widest text-indigo-100 mb-1">Admit Card</div>
                  <div className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-lg inline-block">{selectedExam?.name}</div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 flex gap-8">
                {/* Photo Area */}
                <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 shrink-0 relative overflow-hidden">
                  <User className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-[10px] uppercase font-bold text-center leading-tight">Affix<br/>Passport<br/>Photo</span>
                </div>

                {/* Student Details */}
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Candidate Name</p>
                    <p className="text-lg font-bold text-gray-900">{student.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Roll Number</p>
                    <p className="text-lg font-bold text-gray-900">{student.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Class & Section</p>
                    <p className="text-base font-semibold text-gray-800">{student.class?.name} - {student.class?.section}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Academic Year</p>
                    <p className="text-base font-semibold text-gray-800">2026-2027</p>
                  </div>
                </div>
              </div>

              {/* Exam Schedule */}
              <div className="px-8 pb-8">
                <h4 className="text-sm font-bold text-gray-800 border-b-2 border-indigo-100 pb-2 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Exam Schedule
                </h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-indigo-50/50">
                      <th className="text-left py-2 px-3 font-bold text-indigo-900 border border-indigo-100">Date</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-900 border border-indigo-100">Time</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-900 border border-indigo-100">Subject</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-900 border border-indigo-100">Room</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-900 border border-indigo-100">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examPlans.map((plan: any) => (
                      <tr key={plan.id}>
                        <td className="py-2 px-3 border border-gray-200 font-semibold text-gray-700">{new Date(plan.examDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3 border border-gray-200 text-gray-600 text-xs font-medium">{plan.startTime} - {plan.endTime}</td>
                        <td className="py-2 px-3 border border-gray-200 font-bold text-gray-900">{plan.subject?.name}</td>
                        <td className="py-2 px-3 border border-gray-200 text-gray-600">{plan.room || '-'}</td>
                        <td className="py-2 px-3 border border-gray-200"></td>
                      </tr>
                    ))}
                    {examPlans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-400 italic border border-gray-200">No schedule found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Signatures */}
              <div className="px-8 pb-8 pt-4 flex justify-between items-end">
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-2"></div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Student Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-2"></div>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Principal Signature</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && selectedExamId && selectedClassId && students.length === 0 && (
        <div className="p-12 text-center text-gray-400">No students found for this class.</div>
      )}
    </div>
  );
};
