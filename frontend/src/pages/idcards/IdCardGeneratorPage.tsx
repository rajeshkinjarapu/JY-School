import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { PageHeader } from '../../components/UI/PageHeader';
import { Printer, ArrowLeft, Download, CheckSquare, Square } from 'lucide-react';
import { templates } from '../../components/idcards/Templates';
import toast from 'react-hot-toast';

export const IdCardGeneratorPage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  const template = templates.find(t => t.id === templateId) || templates[0];
  const TemplateComponent = template.component;

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchStudents(selectedClass);
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data);
      if (res.data.length > 0) setSelectedClass(res.data[0].id);
    } catch (e) {
      toast.error('Failed to load classes');
    }
  };

  const fetchStudents = async (classId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/students?classId=${classId}&limit=500`);
      setStudents(res.data.data || res.data);
      setSelectedStudents(new Set()); // reset selection
    } catch (e) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handlePrint = () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    // Simple window print
    window.print();
  };

  const selectedStudentsList = students.filter(s => selectedStudents.has(s.id));

  return (
    <div className="flex flex-col h-full bg-gray-50 id-card-page" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Hide the header and sidebar elements during printing using standard media queries in a global CSS or style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 10px;
          }
          .no-print { display: none !important; }
          .print-card {
             page-break-inside: avoid;
             margin-bottom: 20px;
          }
        }
      `}</style>
      
      <div className="no-print flex-1 flex flex-col">
        <PageHeader 
          title={`Generate ID Cards: ${template.name}`} 
          icon={<button onClick={() => navigate('/id-cards')} className="mr-2 hover:bg-gray-100 p-2 rounded-full"><ArrowLeft className="w-5 h-5" /></button>} 
          action={
            <button 
              onClick={handlePrint}
              disabled={selectedStudents.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" /> Print Selected ({selectedStudents.size})
            </button>
          }
        />
        
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 flex gap-6">
          {/* Left Panel - Student Selection */}
          <div className="w-1/3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
            <h3 className="font-bold text-gray-800 mb-4">Select Students</h3>
            <select 
              className="w-full p-2 border border-gray-200 rounded-lg mb-4 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
            
            <div className="flex items-center justify-between mb-2 px-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Total: {students.length}</span>
              <button onClick={toggleAll} className="text-sm text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800">
                {selectedStudents.size === students.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                Select All
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : students.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No students found</div>
              ) : (
                <ul className="space-y-1">
                  {students.map(s => (
                    <li 
                      key={s.id} 
                      onClick={() => toggleStudent(s.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedStudents.has(s.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      {selectedStudents.has(s.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                      <div>
                        <p className="font-medium text-sm text-gray-800">{s.user?.name}</p>
                        <p className="text-xs text-gray-500">{s.rollNo}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Right Panel - Preview Area */}
          <div className="w-2/3 bg-gray-200 rounded-2xl p-6 overflow-auto h-[calc(100vh-200px)] border-4 border-dashed border-gray-300">
            {selectedStudents.size === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <BadgeCheck className="w-16 h-16 mb-4 opacity-50" />
                <p>Select students to preview ID cards</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 place-items-center">
                {selectedStudentsList.map(s => (
                  <div key={s.id} className="relative group">
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                      ✓
                    </div>
                    <TemplateComponent student={s} schoolName="JY INTERNATIONAL SCHOOL" showQR={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden Print Container */}
      <div id="print-area" className="hidden print:flex" ref={printRef}>
        {selectedStudentsList.map(s => (
          <div key={`print-${s.id}`} style={{ marginBottom: '20px' }}>
            <TemplateComponent student={s} schoolName="JY INTERNATIONAL SCHOOL" showQR={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Extracted from lucide imports above that were missing
const BadgeCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>
);
