import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Filter, Plus, FileText, Search, Activity, BookOpen, Layers, Target, ChevronLeft } from 'lucide-react';

const CompetitiveQuestionBankDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    total: 12850,
    physics: 4200,
    chemistry: 4100,
    biology: 4550,
  };

  const difficultyStats = [
    { label: 'Easy', count: 3500, color: 'bg-emerald-500' },
    { label: 'Medium', count: 5200, color: 'bg-amber-500' },
    { label: 'Hard', count: 2800, color: 'bg-orange-500' },
    { label: 'Very Hard', count: 1350, color: 'bg-red-500' },
  ];

  const questionTypes = [
    'Single Correct', 'Multiple Correct', 'Numerical',
    'Assertion & Reason', 'Match the Following', 'True / False'
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4">
        <ChevronLeft size={20} /> Back to Online Exam
      </button>

      <div className="flex justify-between items-center bg-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
             <Database className="text-cyan-400" /> QUESTION BANK
          </h1>
          <p className="text-indigo-200 mt-1">JEE / NEET Question Repository</p>
        </div>
        <button onClick={() => navigate('/competitive-question-bank/new')} className="relative z-10 px-6 py-3 bg-white text-indigo-800 rounded-xl font-bold shadow-md hover:bg-indigo-50 flex items-center gap-2 transition">
          <Plus size={20} /> Add Question
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Questions</p>
          <h3 className="text-4xl font-extrabold text-slate-800">{stats.total.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Physics</p>
          <h3 className="text-4xl font-extrabold text-indigo-600">{stats.physics.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Chemistry</p>
          <h3 className="text-4xl font-extrabold text-emerald-600">{stats.chemistry.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Biology</p>
          <h3 className="text-4xl font-extrabold text-blue-600">{stats.biology.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit space-y-6">
           <div className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b pb-4">
             <Filter size={20} className="text-indigo-500" /> Smart Filters
           </div>
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                 <option>All Subjects</option>
                 <option>Physics</option>
                 <option>Chemistry</option>
                 <option>Botany</option>
                 <option>Zoology</option>
                 <option>Mathematics</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chapter</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                 <option>All Chapters</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                 <option>All Topics</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                 <option>All Difficulties</option>
                 <option>Easy</option>
                 <option>Medium</option>
                 <option>Hard</option>
                 <option>Very Hard</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Question Type</label>
               <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-indigo-500">
                 <option>All Types</option>
                 {questionTypes.map((t, i) => <option key={i}>{t}</option>)}
               </select>
             </div>
           </div>
           <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
             Apply Filters
           </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Difficulty Distribution</h3>
             <div className="flex flex-col gap-4">
               {difficultyStats.map((d, i) => (
                 <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-slate-600">{d.label}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full ${d.color}`} style={{ width: `${(d.count / stats.total) * 100}%` }}></div>
                    </div>
                    <div className="w-16 text-right font-bold text-slate-800">{d.count.toLocaleString()}</div>
                 </div>
               ))}
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Supported Question Types</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {questionTypes.map((t, i) => (
                 <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center font-bold text-slate-600 text-sm">
                   {t}
                 </div>
               ))}
             </div>
           </div>

           <div className="flex gap-4">
             <button onClick={() => navigate('/competitive-question-bank/new')} className="flex-1 py-4 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 transition flex justify-center items-center gap-2">
               <Plus /> Add New Question
             </button>
             <button className="flex-1 py-4 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-50 transition flex justify-center items-center gap-2">
               <Activity /> Bulk Upload
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveQuestionBankDashboard;
