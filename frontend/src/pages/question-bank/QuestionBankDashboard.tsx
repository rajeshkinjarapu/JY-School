import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, HelpCircle, BookOpen, FolderTree, List, BarChart, Type, 
  FileUp, FileText, Key, CheckCircle, PieChart, Settings, ChevronRight, Sparkles 
} from 'lucide-react';

export const QuestionBankDashboard = () => {
  const navigate = useNavigate();
  const tools = [
    { title: 'Dashboard', description: 'Overview and analytics', icon: LayoutDashboard, color: 'from-blue-600 to-blue-400' },
    { title: 'Questions', description: 'Manage all questions', icon: HelpCircle, color: 'from-indigo-600 to-indigo-400' },
    { title: 'Subjects', description: 'Manage subjects', icon: BookOpen, color: 'from-fuchsia-600 to-fuchsia-400' },
    { title: 'Chapters', description: 'Manage chapters', icon: FolderTree, color: 'from-rose-600 to-rose-400' },
    { title: 'Topics', description: 'Manage topics', icon: List, color: 'from-emerald-600 to-emerald-400' },
    { title: 'Difficulty Levels', description: 'Configure difficulty levels', icon: BarChart, color: 'from-amber-500 to-yellow-400' },
    { title: 'Question Types', description: 'Configure question types', icon: Type, color: 'from-violet-600 to-violet-400' },
    { title: 'Import / Export', description: 'Bulk data operations', icon: FileUp, color: 'from-slate-700 to-slate-500' },
    { title: 'Paper Generator', description: 'Generate question papers', icon: FileText, color: 'from-blue-600 to-indigo-600' },
    { title: 'Answer Keys', description: 'Manage answer keys', icon: Key, color: 'from-teal-600 to-teal-400' },
    { title: 'Review & Approval', description: 'Review questions', icon: CheckCircle, color: 'from-orange-600 to-orange-400' },
    { title: 'Reports', description: 'Question bank reports', icon: PieChart, color: 'from-purple-600 to-purple-400' },
    { title: 'Settings', description: 'Question bank settings', icon: Settings, color: 'from-gray-700 to-gray-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto p-4 md:p-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-pink-500 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="text-white text-sm font-semibold tracking-wide uppercase">Premium Tools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-4 drop-shadow-sm">
            Question Bank System
          </h1>
          <p className="text-indigo-200 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            Manage your entire assessment workflow from a single, powerful dashboard. Create, organize, and generate high-quality question papers with ease.
          </p>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div 
              key={index}
              onClick={() => {
                if (tool.title === 'Questions') navigate('/question-bank/questions');
                else if (tool.title === 'Paper Generator') navigate('/question-bank/papers/new');
                else if (tool.title === 'Dashboard') navigate('/question-bank');
              }}
              className="group relative bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[160px]"
            >
              {/* Colorful Background Glow on Hover */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${tool.color} rounded-full opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}></div>
              
              <div className="relative z-10 flex items-start justify-between w-full">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${tool.color} shadow-lg text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-sm border border-slate-100">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <div className="relative z-10 mt-6">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionBankDashboard;
