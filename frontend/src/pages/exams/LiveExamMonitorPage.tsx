import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Activity, Users, Clock, CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft } from 'lucide-react';

const LiveExamMonitorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamData();
    const interval = setInterval(fetchExamData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchExamData = async () => {
    try {
      const res = await api.get('/api/competitive-exams/' + id);
      setExam(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exam) {
    return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>;
  }

  const totalStudents = 250;
  const submitted = exam._count?.submissions || 18;
  const started = submitted + 220;
  const notStarted = totalStudents - started;
  const currentlyWriting = started - submitted;

  const mockStudents = [
    { name: 'Rahul Kumar', status: 'Active', progress: 78, lastActivity: '2 mins ago' },
    { name: 'Anil Reddy', status: 'Active', progress: 62, lastActivity: '1 min ago' },
    { name: 'Suresh Rao', status: 'Active', progress: 91, lastActivity: 'Just now' },
    { name: 'Priya Sharma', status: 'Submitted', progress: 100, lastActivity: '15 mins ago' },
    { name: 'Ravi Varma', status: 'Not Started', progress: 0, lastActivity: '--' },
    { name: 'Kavitha S', status: 'Active', progress: 45, lastActivity: '5 mins ago' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4">
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex justify-between items-start">
           <div>
             <h1 className="text-3xl font-extrabold flex items-center gap-3"><Activity className="text-red-400 animate-pulse"/> LIVE EXAM MONITOR</h1>
             <p className="text-indigo-200 mt-2 text-lg uppercase tracking-wider font-semibold">{exam.title}</p>
           </div>
           <button onClick={fetchExamData} className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition backdrop-blur-sm border border-white/20">
             <RefreshCw size={20} />
           </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-10 relative z-10">
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <p className="text-indigo-200 text-sm font-bold uppercase mb-1">Total Students</p>
            <p className="text-3xl font-extrabold">{totalStudents}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <p className="text-blue-200 text-sm font-bold uppercase mb-1">Started</p>
            <p className="text-3xl font-extrabold text-blue-300">{started}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <p className="text-yellow-200 text-sm font-bold uppercase mb-1">Not Started</p>
            <p className="text-3xl font-extrabold text-yellow-300">{notStarted}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <p className="text-emerald-200 text-sm font-bold uppercase mb-1">Submitted</p>
            <p className="text-3xl font-extrabold text-emerald-400">{submitted}</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-5 border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] transform scale-105">
            <p className="text-white text-sm font-bold uppercase mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Writing Now</p>
            <p className="text-4xl font-extrabold text-white">{currentlyWriting}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
         <div className="bg-slate-50 border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 uppercase">Student Activity Log</h2>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-white text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
               <tr>
                 <th className="p-5">Student Name</th>
                 <th className="p-5">Status</th>
                 <th className="p-5">Progress</th>
                 <th className="p-5">Last Activity</th>
                 <th className="p-5">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {mockStudents.map((s, i) => {
                 const statusClass = s.status === 'Active' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                     s.status === 'Submitted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                     'bg-slate-100 text-slate-500 border border-slate-200';
                 const barClass = s.status === 'Active' ? 'bg-blue-500' : s.status === 'Submitted' ? 'bg-emerald-500' : 'bg-slate-300';
                 return (
                   <tr key={i} className="hover:bg-slate-50 transition">
                     <td className="p-5 font-bold text-slate-800 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">{s.name.charAt(0)}</div>
                       {s.name}
                     </td>
                     <td className="p-5">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${statusClass}`}>
                         {s.status === 'Active' ? <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> :
                          s.status === 'Submitted' ? <CheckCircle2 size={12} /> :
                          <AlertTriangle size={12} />}
                         {s.status}
                       </span>
                     </td>
                     <td className="p-5">
                       <div className="flex items-center gap-3">
                          <div className="w-full max-w-[120px] bg-slate-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${s.progress}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-600 text-sm">{s.progress}%</span>
                       </div>
                     </td>
                     <td className="p-5 font-medium text-slate-500 text-sm">{s.lastActivity}</td>
                     <td className="p-5">
                       <button className="text-indigo-600 hover:text-indigo-800 font-bold text-sm">View Logs</button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default LiveExamMonitorPage;
