import React from 'react';
import { Briefcase, FileText, Settings, Database, Server, Image, Calendar, Book, ChevronRight } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';

export const OfficeToolsDashboard = () => {
  const navigate = useNavigate();
  const tools = [
    { 
      title: 'STUDY CERTIFICATE', 
      description: 'Generate study certificates for students', 
      icon: FileText, 
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30'
    },
    { 
      title: 'DUPLICATE ACADEMIC PROGRESS CARD', 
      description: 'Issue duplicate progress cards', 
      icon: Settings, 
      gradient: 'from-indigo-500 to-purple-500',
      shadow: 'shadow-indigo-500/30'
    },
    { 
      title: 'ORIGINAL ACADEMIC PROGRESS CARD', 
      description: 'Generate original progress cards', 
      icon: Database, 
      gradient: 'from-fuchsia-500 to-pink-500',
      shadow: 'shadow-fuchsia-500/30'
    },
    { 
      title: 'TRANSFER CERTIFICATE', 
      description: 'Issue transfer certificates (TC)', 
      icon: Server, 
      gradient: 'from-rose-500 to-orange-400',
      shadow: 'shadow-rose-500/30'
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Office Tools" 
        icon={<Briefcase className="w-5 h-5" />} 
      />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div 
                key={index} 
                onClick={() => {
                  if (tool.title === 'SLIP TEST RANK CARD') {
                    navigate('/office-tools/slip-test');
                  }
                }}
                className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-start gap-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Top accent */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${tool.gradient} opacity-80`} />
                
                {/* Subtle hover background highlight */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${tool.gradient}`}></div>
                
                <div className={`relative z-10 p-4 rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg ${tool.shadow} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                
                <div className="relative z-10 w-full mt-2">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 transition-colors leading-tight">{tool.title}</h3>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors transform group-hover:translate-x-1 shrink-0" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-semibold leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{tool.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
};

export default OfficeToolsDashboard;

