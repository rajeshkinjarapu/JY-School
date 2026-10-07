import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Play, Plus, Clock, FileText, CheckCircle, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database, LayoutDashboard, List, UploadCloud, Download, Eye, Power
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const CompetitiveExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminOrTeacher = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user?.role || '');
  
  if (isAdminOrTeacher) {
    return <AdminCompetitiveDashboard navigate={navigate} />;
  }

  return <StudentCompetitiveDashboard navigate={navigate} />;
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
    api.get('/api/competitive-exams/admin').then(res => {
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

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/competitive-exams/admin');
      if (response.data.success) {
        setExams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (examId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.put(`/api/competitive-exams/${examId}`, { status: newStatus });
      toast.success(`Exam ${newStatus === 'PUBLISHED' ? 'Published' : 'Unpublished'} Successfully`);
      fetchExams();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><List className="text-indigo-600" /> Exam List</h2>
        <button onClick={() => navigate('/create-competitive-exam')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
          <Plus size={18} /> Create New Exam
        </button>
      </div>
      
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <FileText size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-600">No Exams Found</h3>
          <p className="text-slate-500 mt-2">Click the 'Create New Exam' button to setup a JEE or NEET pattern exam.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">Exam Name</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">Class & Subject</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Date & Time</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Status</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map(exam => (
                <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-indigo-900 text-base">{exam.title}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-1">{exam.pattern || 'STANDARD'} Pattern</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <div className="bg-slate-100 px-2 py-1 rounded-md w-fit border border-slate-200 text-xs font-bold text-slate-600 mb-1">
                      {exam.class?.name} {exam.class?.section}
                    </div>
                    <div className="text-slate-500 text-xs font-bold">
                      {exam.subjectIds && JSON.parse(exam.subjectIds).length > 1 ? "Multiple Subjects" : exam.subject?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 text-center">
                    <div className="font-bold text-slate-800">{format(new Date(exam.startTime), 'MMM dd, yyyy')}</div>
                    <div className="text-slate-500 text-xs font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">
                      {format(new Date(exam.startTime), 'hh:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      exam.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {exam.status === 'PUBLISHED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)} className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors">
                        <FileQuestion className="w-3.5 h-3.5" /> Questions
                      </button>
                      
                      <button 
                        onClick={() => handleTogglePublish(exam.id, exam.status)} 
                        className={`font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ${
                          exam.status === 'PUBLISHED' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" /> {exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>

                      <button onClick={() => navigate(`/take-competitive-exam/${exam.id}`)} title="Admin Preview" className="text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs p-1.5 rounded-lg shadow-sm transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
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

const ResultsTab = () => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px] text-center">
      <Award size={64} className="text-slate-200 mb-4" />
      <h3 className="text-xl font-bold text-slate-700">Results & Ranks</h3>
      <p className="text-slate-500 max-w-md mt-2 mb-6">Select an exam to view detailed analytics, marks, and leaderboard.</p>
    </div>
  );
};

// --- STUDENT PORTAL ---

const StudentCompetitiveDashboard = ({ navigate }: { navigate: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/competitive-exams/student').then(res => {
      if(res.data.success) {
        setExams(res.data.data);
      }
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <BookOpen className="w-8 h-8 opacity-80" /> My Online Exams
          </h1>
          <p className="mt-2 text-indigo-100 font-medium">View and attempt your scheduled upcoming examinations.</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="text-indigo-600" /> Upcoming & Active Exams</h2>
        
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div></div>
        ) : exams.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Upcoming Exams</h3>
            <p className="text-slate-500 mt-1">You have no scheduled exams at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className="p-6 border-b border-slate-50 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100">{exam.pattern}</div>
                    <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{exam.duration} Mins</div>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-800 mb-2">{exam.title}</h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" /> {format(new Date(exam.startTime), 'MMM dd, yyyy - hh:mm a')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Award className="w-4 h-4 text-slate-400" /> {exam.totalMarks} Total Marks
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50">
                  <button 
                    onClick={() => navigate(`/take-competitive-exam/${exam.id}`)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitiveExamsPage;
