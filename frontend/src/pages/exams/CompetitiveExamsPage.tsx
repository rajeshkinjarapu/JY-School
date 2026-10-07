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
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MANAGE_EXAMS' | 'QUESTION_BANK' | 'RESULTS'>('DASHBOARD');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Competitive Exams (JEE / NEET)
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Complete Management for Objective Type Exams</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <TabButton active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={18} />} label="Dashboard Overview" />
        <TabButton active={activeTab === 'MANAGE_EXAMS'} onClick={() => setActiveTab('MANAGE_EXAMS')} icon={<List size={18} />} label="Manage Exams" />
        <TabButton active={activeTab === 'QUESTION_BANK'} onClick={() => setActiveTab('QUESTION_BANK')} icon={<Database size={18} />} label="Question Bank" />
        <TabButton active={activeTab === 'RESULTS'} onClick={() => setActiveTab('RESULTS')} icon={<Award size={18} />} label="Results & Ranks" />
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'DASHBOARD' && <DashboardTab />}
        {activeTab === 'MANAGE_EXAMS' && <ManageExamsTab />}
        {activeTab === 'QUESTION_BANK' && <QuestionBankTab />}
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Exams" value="0" color="blue" />
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

const ManageExamsTab = () => {
  const [showCreate, setShowCreate] = useState(false);
  
  if (showCreate) return <CreateExamForm onClose={() => setShowCreate(false)} />;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><List className="text-indigo-600" /> Exam List</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
          <Plus size={18} /> Create New Exam
        </button>
      </div>
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <FileText size={48} className="text-slate-200 mb-4" />
        <h3 className="text-lg font-bold text-slate-600">No Exams Found</h3>
        <p className="text-slate-500">Click the 'Create New Exam' button to setup a JEE or NEET pattern exam.</p>
      </div>
    </div>
  );
};

const CreateExamForm = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">Create Competitive Exam</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"><XCircle size={24} /></button>
      </div>
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Exam Name (e.g. Grand Test - 1)</label>
            <input type="text" className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition" placeholder="Enter exam name" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
            <select className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition bg-white">
              <option value="JEE_MAINS">JEE Mains Pattern</option>
              <option value="JEE_ADVANCED">JEE Advanced Pattern</option>
              <option value="NEET">NEET Pattern</option>
              <option value="EAMCET">EAPCET / EAMCET Pattern</option>
              <option value="CUSTOM">Custom Pattern</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Total Marks</label>
            <input type="number" className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition" placeholder="300" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Minutes)</label>
            <input type="number" className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition" placeholder="180" />
          </div>
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Exam Date</label>
             <input type="date" className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none transition" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
           <AlertTriangle className="text-blue-600 mt-0.5" size={20} />
           <p className="text-sm text-blue-800 font-medium">After creating the exam, you can configure subject-wise negative marking and cutoffs in the Manage Exams tab.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
          <button className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md">Create Exam</button>
        </div>
      </div>
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
