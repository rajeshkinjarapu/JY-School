import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Loader2, Search, CheckSquare, Square, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { TEMPLATES_LIST, getTemplateComponent, getBacksideComponent, IDCardData, SchoolInfo } from '../../components/idcards/Templates';

// A4 paper size in CSS: 210mm x 297mm. We'll use CSS to force page breaks.
const PrintableContent = React.forwardRef<HTMLDivElement, { 
  students: IDCardData[], 
  school: SchoolInfo, 
  templateId: string 
}>(({ students, school, templateId }, ref) => {
  const FrontTemplate = getTemplateComponent(templateId);
  const BackTemplate = getBacksideComponent();
  const templateConfig = TEMPLATES_LIST.find(t => t.id === templateId);
  const isHorizontal = templateConfig?.isHorizontal || false;

  return (
    <div ref={ref} className="print-container hidden print:block bg-white p-4">
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 10mm; }
          .print-container { background: white; }
          .page-break { page-break-after: always; }
          .card-grid { 
            display: grid; 
            grid-template-columns: repeat(${isHorizontal ? 2 : 3}, 1fr); 
            gap: 15px; 
            justify-items: center; 
            align-content: start;
          }
        `}
      </style>
      
      {/* We will print front sides first, then back sides. So they can be printed double-sided easily. */}
      {/* Front Sides Page(s) */}
      <div className="card-grid">
        {students.map((student) => (
          <div key={`front-${student.id}`} className="mb-4" style={{ breakInside: 'avoid' }}>
            <FrontTemplate data={student} school={school} />
          </div>
        ))}
      </div>
      
      <div className="page-break" />
      
      {/* Back Sides Page(s) */}
      <div className="card-grid">
        {students.map((student) => (
          <div key={`back-${student.id}`} className="mb-4" style={{ breakInside: 'avoid' }}>
            <BackTemplate data={student} school={school} />
          </div>
        ))}
      </div>
    </div>
  );
});

const IdCardGeneratorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') || 'template_1';
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Dummy school info (until we fetch from settings)
  const schoolInfo: SchoolInfo = {
    schoolName: 'JY INTERNATIONAL SCHOOL',
    address: '123 Main Street, Education Hub, City, State 12345',
    phone: '+91 98765 43210',
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudentIds(new Set());
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/students?classId=${classId}&limit=1000`);
      setStudents(res.data.data || []);
      // Auto-select all by default
      setSelectedStudentIds(new Set((res.data.data || []).map((s: any) => s.id)));
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Student_ID_Cards',
    onAfterPrint: () => toast.success('Sent to printer successfully!'),
  });

  const toggleStudentSelection = (id: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStudentIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const filteredStudents = students.filter(s => 
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );

  // Map API student data to IDCardData format
  const mappedSelectedStudents: IDCardData[] = students
    .filter(s => selectedStudentIds.has(s.id))
    .map(s => ({
      id: s.id,
      name: s.user?.name || 'Unknown',
      rollNo: s.rollNo,
      className: s.class?.name || '',
      section: s.class?.section || '',
      bloodGroup: s.bloodGroup || '',
      address: s.address || '',
      phone: s.user?.phone || 'N/A',
      photoUrl: s.user?.photoUrl,
      fatherName: s.fatherName,
    }));

  const TemplatePreview = getTemplateComponent(templateId);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/id-cards')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Generate ID Cards</h1>
            <p className="text-sm text-gray-500">Select students and print</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Class & Section</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
            ))}
          </select>
          
          <button 
            onClick={handlePrint}
            disabled={mappedSelectedStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Printer size={18} />
            <span>Print {mappedSelectedStudents.length > 0 ? `(${mappedSelectedStudents.length})` : ''}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Student Selection */}
        <div className="w-1/3 min-w-[300px] border-r border-gray-200 bg-white flex flex-col h-full z-10 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                  <><CheckSquare size={18} /> Unselect All</>
                ) : (
                  <><Square size={18} /> Select All</>
                )}
              </button>
              <span className="text-gray-500 font-medium">{selectedStudentIds.size} selected</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Loader2 className="animate-spin mb-2" size={24} />
                <p className="text-sm">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                {selectedClass ? 'No students found.' : 'Select a class to view students.'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStudentIds.has(student.id) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="text-indigo-600">
                      {selectedStudentIds.has(student.id) ? <CheckSquare size={20} /> : <Square size={20} className="text-gray-300" />}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-300">
                      {student.user?.photoUrl ? (
                        <img src={student.user.photoUrl} alt={student.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">{student.user?.name?.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{student.user?.name}</p>
                      <p className="text-xs text-gray-500">{student.rollNo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
                <p className="text-sm text-gray-500">Previewing first selected student</p>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
                Design: {TEMPLATES_LIST.find(t => t.id === templateId)?.name}
              </div>
            </div>

            {mappedSelectedStudents.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 border-b w-full pb-2 text-center uppercase tracking-wider">Front Side</h3>
                  <div className="shadow-md rounded-lg overflow-hidden border border-gray-100 transform transition-transform hover:scale-105">
                     <TemplatePreview data={mappedSelectedStudents[0]} school={schoolInfo} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 border-b w-full pb-2 text-center uppercase tracking-wider">Back Side</h3>
                  <div className="shadow-md rounded-lg overflow-hidden border border-gray-100 transform transition-transform hover:scale-105">
                     {React.createElement(getBacksideComponent(), { data: mappedSelectedStudents[0], school: schoolInfo })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200 border-dashed">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Printer size={32} />
                </div>
                <p className="text-gray-500 font-medium">Select students to preview ID cards</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden printable content */}
      <div className="hidden">
        <PrintableContent ref={printRef} students={mappedSelectedStudents} school={schoolInfo} templateId={templateId} />
      </div>
    </div>
  );
};

export default IdCardGeneratorPage;
