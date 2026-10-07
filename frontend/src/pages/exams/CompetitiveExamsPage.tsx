import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Play, Plus, Clock, FileText, CheckCircle, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database, LayoutDashboard, List, UploadCloud, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CompetitiveExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrTeacher = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user?.role || '');
  
  if (isAdminOrTeacher) {
    return <AdminCompetitiveDashboard navigate={navigate} />;
  }

  // Student view (simplified for now as requested by user to focus on Original Exams admin type)
  return <div className="p-8 text-center text-gray-500 font-bold">Student view is being updated...</div>;
};

const AdminCompetitiveDashboard = ({ navigate }: { navigate: any }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MANAGE_EXAMS' | 'RESULTS'>('DASHBOARD');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Online Exams
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Complete Management for Online Objective Exams</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <TabButton active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={18} />} label="Dashboard Overview" />
        <TabButton active={activeTab === 'MANAGE_EXAMS'} onClick={() => setActiveTab('MANAGE_EXAMS')} icon={<List size={18} />} label="Manage Exams" />
        <TabButton active={false} onClick={() => navigate('/competitive-question-bank')} icon={<Database size={18} />} label="Question Bank" />
        <TabButton active={activeTab === 'RESULTS'} onClick={() => setActiveTab('RESULTS')} icon={<Award size={18} />} label="Results & Ranks" />
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'DASHBOARD' && <DashboardTab />}
        {activeTab === 'MANAGE_EXAMS' && <ManageExamsTab navigate={navigate} />}
        {activeTab === 'RESULTS' && <ResultsTab />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
  >
    {icon} {label}
  </button>
);

// --- TABS COMPONENTS ---

const DashboardTab = () => {
  const [stats, setStats] = useState({ totalExams: 0, totalQuestions: 0, activeStudents: 0 });
  
  useEffect(() => {
    // We can add actual API call later for dashboard stats
    api.get('/competitive-exams/admin').then(res => {
      if(res.data.success) {
        setStats(prev => ({ ...prev, totalExams: res.data.data.length }));
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Exams" value={stats.totalExams} color="blue" />
        <StatCard title="Total Questions" value="0" color="emerald" />
        <StatCard title="Results Published" value="0" color="purple" />
        <StatCard title="Active Students" value="0" color="amber" />
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-center">
        <Activity size={64} className="text-slate-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Analytics Dashboard</h3>
        <p className="text-slate-500 max-w-md mt-2">Create your first exam and upload results to see detailed analytics, subject-wise performance, and rank charts here.</p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col justify-center relative overflow-hidden group`}>
      <p className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">{title}</p>
      <h3 className="text-4xl font-extrabold">{value}</h3>
    </div>
  );
};

const ManageExamsTab = ({ navigate }: { navigate: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await api.get('/competitive-exams/admin');
        if (response.data.success) {
          setExams(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><List className="text-indigo-600" /> Exam List</h2>
        <button onClick={() => navigate('/create-competitive-exam')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
          <Plus size={18} /> Create New Exam
        </button>
      </div>
      
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <FileText size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-600">No Exams Found</h3>
          <p className="text-slate-500">Click the 'Create New Exam' button to setup a JEE or NEET pattern exam.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">Exam Name</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">Class & Subject</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Date & Time</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Marks</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map(exam => (
                <tr key={exam.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-indigo-900">{exam.title}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <div>Class: {exam.class?.name} {exam.class?.section}</div>
                    <div className="text-slate-500">Subject: {exam.subjectIds && JSON.parse(exam.subjectIds).length > 1 ? "Multiple Subjects" : exam.subject?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 text-center">
                    <div>{format(new Date(exam.startTime), 'MMM dd, yyyy')}</div>
                    <div className="text-slate-500">{format(new Date(exam.startTime), 'hh:mm a')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center">
                    {exam.totalMarks}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg">
                      Manage Questions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const QuestionBankTab = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Database className="text-indigo-600" /> Question Bank</h2>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm">
             <UploadCloud size={18} /> Bulk Import (Excel)
           </button>
           <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
             <Plus size={18} /> Add Question
           </button>
        </div>
      </div>
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <FileQuestion size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-600">Question Bank Empty</h3>
        <p className="text-slate-500">Start adding objective questions for Mathematics, Physics, Chemistry, etc.</p>
      </div>
    </div>
  );
};

const ResultsTab = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award className="text-indigo-600" /> Results & Ranks</h2>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm">
          <UploadCloud size={18} /> Upload OMR Marks (Excel)
        </button>
      </div>
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <Award size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-600">No Results Published</h3>
        <p className="text-slate-500">Upload offline OMR scanner results in excel format to auto-generate Ranks and Analytics.</p>
        <button className="mt-4 flex items-center gap-2 text-indigo-600 font-bold hover:underline">
           <Download size={16} /> Download Excel Template
        </button>
      </div>
    </div>
  );
};

export default CompetitiveExamsPage;
