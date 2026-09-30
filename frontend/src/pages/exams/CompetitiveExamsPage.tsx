import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Play, Plus, Clock, FileText, CheckCircle, Lock, Edit, ShieldAlert, Award, FileQuestion, Users, RefreshCw, Trash2, BarChart3, Activity, TrendingUp, AlertTriangle, BookOpen, ChevronRight, CheckCircle2, XCircle, MinusCircle, Database } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CompetitiveExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrTeacher = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user?.role || '');
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const res = await api.get('/api/competitive-exams/student');
        setExams(res.data.data || []);
      } else if (isAdminOrTeacher) {
        const res = await api.get('/api/competitive-exams/admin');
        setExams(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch competitive exams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam: any, hasSubmitted: boolean = false) => {
    if (hasSubmitted) {
      navigate(`/competitive-exam-result/${exam.id}`);
      return;
    }
    const now = new Date();
    if (now < new Date(exam.startTime)) return alert(`Exam starts at ${format(new Date(exam.startTime), 'dd MMM yyyy, hh:mm a')}`);
    if (now > new Date(exam.endTime)) return alert('Exam has already ended');
    if (window.innerWidth < 1024) alert('Please use a Desktop or Laptop for the best examination experience.');
    
    // In the future this should navigate to Exam Instructions page, but for now we navigate to the exam
    navigate(`/take-competitive-exam/${exam.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white min-h-screen">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600 font-medium text-lg">Loading Dashboard...</p>
      </div>
    );
  }

  if (isStudent) {
    return <StudentDashboard exams={exams} handleStartExam={handleStartExam} fetchExams={fetchExams} />;
  }

  return <AdminTeacherDashboard exams={exams} fetchExams={fetchExams} navigate={navigate} isAdminOrTeacher={isAdminOrTeacher} handleStartExam={handleStartExam} />;
};

const StudentDashboard = ({ exams, handleStartExam, fetchExams }: any) => {
  const now = new Date();
  
  const upcomingExams = exams.filter((e: any) => new Date(e.startTime) > now && !e.submission);
  const availableExams = exams.filter((e: any) => new Date(e.startTime) <= now && new Date(e.endTime) >= now && !e.submission);
  const completedExams = exams.filter((e: any) => !!e.submission);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
             <BookOpen className="text-cyan-400" /> ONLINE EXAM
          </h1>
          <p className="text-indigo-200 mt-1">JEE / NEET Mock Tests Dashboard</p>
        </div>
        <button onClick={fetchExams} className="relative z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Upcoming Exams</p>
          <h3 className="text-4xl font-extrabold text-slate-800">{String(upcomingExams.length).padStart(2, '0')}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Available Exams</p>
          <h3 className="text-4xl font-extrabold text-blue-600">{String(availableExams.length).padStart(2, '0')}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Exams</p>
          <h3 className="text-4xl font-extrabold text-slate-800">{String(completedExams.length).padStart(2, '0')}</h3>
        </div>
      </div>

      {/* AVAILABLE EXAMS */}
      {availableExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Live / Available Exam
          </h2>
          {availableExams.map((exam: any) => (
             <div key={exam.id} className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-md hover:shadow-lg transition flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-900 mb-2 uppercase">{exam.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-1.5"><FileQuestion size={16}/> {exam._count?.questions || 0} Questions</span>
                    <span className="flex items-center gap-1.5"><Clock size={16}/> {exam.duration} Minutes</span>
                    <span className="flex items-center gap-1.5"><Award size={16}/> {exam.totalMarks} Marks</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Available Now</span>
                   <button onClick={() => handleStartExam(exam, false)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-full md:w-auto">
                     START EXAM
                   </button>
                </div>
             </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* UPCOMING EXAMS */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-800 uppercase">Upcoming Exams</h2>
           {upcomingExams.length > 0 ? upcomingExams.map((exam: any) => (
              <div key={exam.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                 <h3 className="text-lg font-bold text-slate-800 uppercase">{exam.title}</h3>
                 <p className="text-slate-500 text-sm font-medium">{exam.subject?.name || 'General'}</p>
                 <div className="flex gap-4 text-sm font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                   <span>{exam._count?.questions || 0} Questions</span>
                   <span>|</span>
                   <span>{exam.duration} Minutes</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
                   <div className="text-sm font-bold text-indigo-600">
                     {format(new Date(exam.startTime), 'dd MMM yyyy')} | {format(new Date(exam.startTime), 'hh:mm a')}
                   </div>
                   <button className="text-slate-400 hover:text-indigo-600 text-sm font-bold flex items-center gap-1">VIEW DETAILS <ChevronRight size={16}/></button>
                 </div>
              </div>
           )) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 font-medium shadow-sm">
                 No upcoming exams scheduled.
              </div>
           )}
        </div>

        {/* RECENT RESULTS */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-800 uppercase">Recent Results</h2>
           {completedExams.length > 0 ? (
             <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">Exam</th>
                      <th className="p-4">Marks</th>
                      <th className="p-4">Rank</th>
                      <th className="p-4">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedExams.map((exam: any) => {
                       const marks = exam.submission?.marksObtained || 0;
                       const total = exam.totalMarks || 1;
                       const percent = Math.round((marks / total) * 100);
                       return (
                         <tr key={exam.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => handleStartExam(exam, true)}>
                           <td className="p-4 font-bold text-slate-800">{exam.title}</td>
                           <td className="p-4 font-bold text-indigo-600">{marks}/{total}</td>
                           <td className="p-4 font-bold text-slate-600">--</td>
                           <td className="p-4 font-bold text-emerald-600">{percent}%</td>
                         </tr>
                       );
                    })}
                  </tbody>
                </table>
             </div>
           ) : (
             <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 font-medium shadow-sm">
                 No results available yet.
              </div>
           )}
        </div>
      </div>

      {/* MY PERFORMANCE DASHBOARD */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-800 uppercase">My Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
              <div className="flex flex-wrap gap-6 mb-8">
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Accuracy</p>
                   <p className="text-4xl font-extrabold text-slate-800">78%</p> {/* Mocked for now */}
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Questions Attempted</p>
                   <p className="text-4xl font-extrabold text-blue-600">92%</p>
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                 <div>
                   <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500"/> Correct</p>
                   <p className="text-2xl font-bold text-emerald-600 mt-1">72</p>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><XCircle size={16} className="text-red-500"/> Wrong</p>
                   <p className="text-2xl font-bold text-red-600 mt-1">20</p>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><MinusCircle size={16} className="text-slate-400"/> Unattempted</p>
                   <p className="text-2xl font-bold text-slate-600 mt-1">8</p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Subject Performance</h3>
              <div className="space-y-5">
                 <div>
                   <div className="flex justify-between text-sm font-bold mb-1.5"><span>Physics</span> <span className="text-indigo-600">82%</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-indigo-500 h-2.5 rounded-full" style={{width: '82%'}}></div></div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm font-bold mb-1.5"><span>Chemistry</span> <span className="text-emerald-600">76%</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-emerald-500 h-2.5 rounded-full" style={{width: '76%'}}></div></div>
                 </div>
                 <div>
                   <div className="flex justify-between text-sm font-bold mb-1.5"><span>Biology</span> <span className="text-blue-600">81%</span></div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{width: '81%'}}></div></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdminTeacherDashboard = ({ exams, fetchExams, navigate, isAdminOrTeacher, handleStartExam }: any) => {
  const now = new Date();
  const totalExams = exams.length;
  const upcomingExams = exams.filter((e: any) => new Date(e.startTime) > now);
  const liveExams = exams.filter((e: any) => new Date(e.startTime) <= now && new Date(e.endTime) >= now);
  
  let totalAttempts = 0;
  let totalScore = 0;
  let highestScore = 0;
  let lowestScore = 0;
  let passCount = 0;
  
  exams.forEach((exam: any) => {
    totalAttempts += (exam._count?.submissions || 0);
    if (exam.submissions) {
      exam.submissions.forEach((sub: any) => {
        totalScore += sub.marksObtained;
        if (sub.marksObtained > highestScore) highestScore = sub.marksObtained;
        if (totalAttempts === 1 || sub.marksObtained < lowestScore) lowestScore = sub.marksObtained;
        if (sub.marksObtained >= (exam.passMarks || 0)) passCount++;
      });
    }
  });

  const avgScore = totalAttempts ? (totalScore / totalAttempts).toFixed(1) : '0';
  const passPercentage = totalAttempts ? ((passCount / totalAttempts) * 100).toFixed(1) : '0';
  const activeExam = liveExams[0]; 

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-indigo-500 opacity-20 blur-2xl"></div>

        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-cyan-400" />
            ONLINE EXAM DASHBOARD
          </h1>
          <p className="text-indigo-200 mt-2 text-sm md:text-base font-medium">JEE / NEET Pattern Proctored Exams</p>
        </div>
        
        <div className="flex flex-wrap gap-3 relative z-10 w-full sm:w-auto mt-4 sm:mt-0">
          <button onClick={fetchExams} className="flex justify-center items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 shadow-lg font-medium">
            <RefreshCw className={`h-4 w-4`} /> Refresh
          </button>
          {isAdminOrTeacher && (
            <>
              <button onClick={() => navigate('/competitive-question-bank')} className="flex justify-center items-center gap-2 px-6 py-3 bg-indigo-700/50 text-indigo-100 border border-indigo-400/50 rounded-xl hover:bg-indigo-600 transition-all shadow-xl font-bold">
                <Database className="h-5 w-5" /> Question Bank
              </button>
              <button onClick={() => navigate('/create-competitive-exam')} className="flex justify-center items-center gap-2 px-6 py-3 bg-white text-indigo-800 rounded-xl hover:bg-indigo-50 transition-all shadow-xl font-bold">
                <Plus className="h-5 w-5 text-indigo-600" /> Create Exam
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Exams</p>
            <h3 className="text-4xl font-extrabold text-slate-800">{String(totalExams).padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Upcoming</p>
            <h3 className="text-4xl font-extrabold text-slate-800">{String(upcomingExams.length).padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-3xl shadow-lg border border-indigo-500 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-white opacity-10 bg-stripes"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Live Exams
            </p>
            <h3 className="text-4xl font-extrabold text-white">{String(liveExams.length).padStart(2, '0')}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Attempts</p>
            <h3 className="text-4xl font-extrabold text-slate-800">{totalAttempts.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Middle Section: Performance & Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Exam Performance</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Score</p>
              <p className="text-3xl font-extrabold text-slate-800">{avgScore}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Highest Score</p>
              <p className="text-3xl font-extrabold text-emerald-600">{highestScore}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lowest Score</p>
              <p className="text-3xl font-extrabold text-red-500">{lowestScore}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pass %</p>
              <p className="text-3xl font-extrabold text-blue-600">{passPercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center gap-3">
            <Activity className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Live Exam Monitor</h2>
          </div>
          <div className="p-6 flex flex-col justify-center h-[calc(100%-65px)]">
            {activeExam ? (
              <>
                <h3 className="text-xl font-bold text-indigo-900 mb-4 truncate">{activeExam.title}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Students Writing</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{(activeExam._count?.submissions || 0) + 12}</span> 
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Submitted</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{activeExam._count?.submissions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Active Right Now</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg animate-pulse">12</span>
                  </div>
                  <button onClick={() => navigate(`/live-exam-monitor/${activeExam.id}`)} className="w-full mt-4 py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                    <Activity size={18} className="animate-pulse" /> Monitor Live Activity
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 h-full">
                <AlertTriangle className="h-10 w-10 opacity-20" />
                <p className="font-medium">No live exams currently</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Exams Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Upcoming Exams</h2>
          </div>
          {upcomingExams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold border-b border-slate-100">Exam Title</th>
                    <th className="p-4 font-semibold border-b border-slate-100">Date</th>
                    <th className="p-4 font-semibold border-b border-slate-100">Time</th>
                    <th className="p-4 font-semibold border-b border-slate-100">Enrolled (Est)</th>
                    <th className="p-4 font-semibold border-b border-slate-100">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {upcomingExams.slice(0, 5).map((exam: any) => (
                    <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{exam.title}</td>
                      <td className="p-4 text-slate-600 font-medium">{format(new Date(exam.startTime), 'dd MMM yyyy')}</td>
                      <td className="p-4 text-slate-600 font-medium">{format(new Date(exam.startTime), 'hh:mm a')}</td>
                      <td className="p-4 text-slate-600 font-medium">120 Stu</td>
                      <td className="p-4">
                         <button onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-semibold transition-colors">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 font-medium">No upcoming exams scheduled.</div>
          )}
      </div>

      {/* All Exams (Original View) */}
      <div className="pt-8 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight flex items-center gap-3">
          <FileText className="h-6 w-6 text-indigo-500" />
          Manage All Exams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => {
            const hasSubmitted = !!exam.submission;
            const isUpcoming = new Date() < new Date(exam.startTime);
            const isMissed = !hasSubmitted && new Date() > new Date(exam.endTime);

            return (
              <div key={exam.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className={`h-1.5 w-full ${hasSubmitted ? 'bg-emerald-500' : isUpcoming ? 'bg-amber-400' : isMissed ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4 items-start">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${hasSubmitted ? 'bg-emerald-50 border-emerald-100' : isUpcoming ? 'bg-amber-50 border-amber-100' : isMissed ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                        {hasSubmitted ? <CheckCircle className="h-6 w-6 text-emerald-600" /> : isUpcoming ? <Lock className="h-6 w-6 text-amber-500" /> : <ShieldAlert className="h-6 w-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={exam.title}>{exam.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600">{exam.subject?.name || 'General'}</span>
                          {exam.class && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>{exam.class.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-blue-500"><Clock className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.duration}m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-amber-500"><Award className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Marks</p>
                        <p className="font-bold text-slate-700 text-sm">{exam.totalMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-purple-500"><FileQuestion className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Questions</p>
                        <p className="font-bold text-slate-700 text-sm">{exam._count?.questions || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-transparent">
                      <div className="p-2 rounded-xl bg-white shadow-sm text-emerald-500"><Users className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Attempts</p>
                        <p className="font-bold text-slate-700 text-sm">{exam._count?.submissions || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 bg-slate-50 p-3 rounded-xl flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Schedule:</span>
                    <span className="font-bold text-slate-700">{format(new Date(exam.startTime), 'dd MMM yyyy, hh:mm a')}</span>
                  </div>

                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => navigate(`/live-exam-monitor/${exam.id}`)}
                        className="flex-1 py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <Activity size={16} /> Live Monitor
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)}
                        className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-200 font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Edit className="h-4 w-4" /> Manage
                      </button>
                      <button
                        onClick={() => navigate(`/competitive-exam-leaderboard/${exam.id}`)}
                        className="flex-1 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Award className="h-4 w-4" /> Results
                      </button>
                      <button
                        onClick={async () => {
                          if(window.confirm('Delete this exam?')) {
                            await api.delete(`/api/competitive-exams/${exam.id}`);
                            fetchExams();
                          }
                        }}
                        className="p-3 bg-white border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 font-bold flex items-center justify-center transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompetitiveExamsPage;
