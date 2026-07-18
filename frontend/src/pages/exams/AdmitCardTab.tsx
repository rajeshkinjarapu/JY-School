import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, User, Calendar, MapPin, Phone, Mail, Globe } from 'lucide-react';

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

      {loading && <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">Generating Admit Cards...</div>}

      {!loading && students.length > 0 && (
        <div className="print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl flex flex-col items-center">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: A4; margin: 0; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; }
              .admit-card-wrapper { 
                width: 210mm; 
                height: 297mm; 
                page-break-after: always; 
                page-break-inside: avoid;
                margin: 0;
                padding: 10mm;
                box-sizing: border-box;
                background: white !important;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .admit-card-wrapper:last-child { page-break-after: auto; }
            }
          `}} />
          
          {students.map((student) => (
            <div key={student.id} className="admit-card-wrapper bg-white shadow-2xl print:shadow-none mb-8 rounded-none sm:rounded-xl">
              <div className="w-full h-full border-[6px] border-double border-indigo-900 rounded-3xl relative flex flex-col bg-white overflow-hidden">
                
                {/* Watermark */}
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <div className="w-96 h-96 bg-indigo-900 rounded-full blur-[100px]"></div>
                </div>
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <span className="text-[150px] font-black text-indigo-900 -rotate-45 tracking-widest uppercase">JY School</span>
                </div>

                {/* Header */}
                <div className="relative z-10 bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 flex items-center gap-6 border-b-4 border-amber-400">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-amber-400 shrink-0">
                    <span className="text-4xl font-black text-indigo-900">JY</span>
                  </div>
                  <div className="flex-1 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-wider text-amber-300 drop-shadow-md mb-2">JY School</h1>
                    <p className="text-sm font-semibold tracking-widest uppercase text-blue-100 mb-2">Excellence in Education</p>
                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-indigo-100">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> 123 Education City, NY</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> +1 234 567 890</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="relative z-10 text-center py-5 bg-indigo-50 border-b border-indigo-100">
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-indigo-900">Admit Card</h2>
                  <div className="inline-block mt-2 px-6 py-1.5 bg-amber-400 text-indigo-900 font-bold text-sm rounded-full shadow-sm">
                    {selectedExam?.name} (2026-2027)
                  </div>
                </div>

                {/* Main Body */}
                <div className="relative z-10 p-8 sm:p-10 flex-1 flex flex-col gap-10">
                  <div className="flex gap-10 items-start">
                    {/* Student Info */}
                    <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Candidate Name</p>
                        <p className="text-xl font-black text-indigo-950 uppercase">{student.user?.name}</p>
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Roll Number</p>
                        <p className="text-xl font-black text-indigo-950">{student.rollNo}</p>
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Class & Section</p>
                        <p className="text-lg font-bold text-indigo-900">{student.class?.name} - {student.class?.section}</p>
                      </div>
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Date of Birth</p>
                        <p className="text-lg font-bold text-indigo-900">12/05/2010</p>
                      </div>
                      <div className="col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Examination Center</p>
                        <p className="text-base font-bold text-indigo-900">JY School Main Campus, Hall A</p>
                      </div>
                    </div>

                    {/* Photo Area */}
                    <div className="w-[120px] h-[150px] border-2 border-indigo-300 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center text-indigo-300 shrink-0 p-2 relative shadow-inner">
                      <div className="w-full h-full border border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center bg-white">
                        <User className="w-10 h-10 mb-2 opacity-50 text-indigo-300" />
                        <span className="text-[9px] uppercase font-bold text-center leading-tight">Affix<br/>Passport<br/>Size Photo</span>
                      </div>
                    </div>
                  </div>

                  {/* Exam Schedule */}
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2 bg-indigo-50 py-2 px-4 rounded-lg border-l-4 border-indigo-600">
                      <Calendar className="w-5 h-5 text-indigo-600" /> Examination Schedule
                    </h4>
                    <div className="rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-indigo-600 text-white">
                          <tr>
                            <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Date</th>
                            <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Timing</th>
                            <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Subject</th>
                            <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Room</th>
                            <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider border-l border-indigo-500/50">Invigilator Sign</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100 bg-white">
                          {examPlans.map((plan: any) => (
                            <tr key={plan.id}>
                              <td className="py-3 px-4 font-bold text-indigo-950">{new Date(plan.examDate).toLocaleDateString('en-GB')}</td>
                              <td className="py-3 px-4 text-indigo-800 font-semibold text-xs">{plan.startTime} - {plan.endTime}</td>
                              <td className="py-3 px-4 font-black text-indigo-900">{plan.subject?.name}</td>
                              <td className="py-3 px-4 text-indigo-800 font-semibold">{plan.room || '-'}</td>
                              <td className="py-3 px-4 border-l border-indigo-100"></td>
                            </tr>
                          ))}
                          {examPlans.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-indigo-400 font-medium">No schedule mapped for this class.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer Notes & Signatures */}
                <div className="relative z-10 bg-indigo-50/50 mt-auto p-8 border-t border-indigo-100">
                  <div className="grid grid-cols-3 gap-8 items-end">
                    <div className="col-span-2">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 mb-2">Important Instructions:</h5>
                      <ul className="text-[9px] text-indigo-800 font-medium space-y-1.5 list-disc pl-4">
                        <li>Candidate must carry this Admit Card to the examination hall.</li>
                        <li>Electronic devices including calculators and mobile phones are strictly prohibited.</li>
                        <li>Candidate should report to the examination center 30 minutes before commencement.</li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <div className="w-40 mx-auto border-b-2 border-indigo-800 mb-2"></div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-indigo-900 mt-1">Principal Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && selectedExamId && selectedClassId && students.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium">No students found for this class.</div>
      )}
    </div>
  );
};
