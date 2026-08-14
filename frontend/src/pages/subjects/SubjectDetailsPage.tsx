import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, FileText, Download, PlayCircle, BookOpen, Clock, ChevronRight, GraduationCap, Award } from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const SubjectDetailsPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        const res: any = await api.get('/api/subjects');
        const allSubjects = res.data.data || res.data || [];
        const relatedClasses = allSubjects.filter((s: any) => s.name?.toUpperCase() === name?.toUpperCase());
        setClasses(relatedClasses);
      } catch (error) {
        console.error('Failed to fetch subject details', error);
      } finally {
        setLoading(false);
      }
    };
    if (name) fetchSubjectDetails();
  }, [name]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/subjects')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all text-white shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                  Global Subject
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md tracking-tight">
                {name}
              </h1>
              <p className="text-indigo-100/80 font-medium text-sm mt-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 opacity-70" /> Comprehensive Curriculum & Resources
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md transition-all border border-white/10 flex items-center gap-2 shadow-lg">
              <Calendar className="w-4 h-4" /> Syllabus
            </button>
            <button className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2">
              <Download className="w-4 h-4" /> Resources
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-6 space-y-8">

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <GraduationCap className="w-5 h-5" />, label: 'Active Classes', value: classes.length, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { icon: <Users className="w-5 h-5" />, label: 'Teachers', value: new Set(classes.map(c => c.classSubjectTeachers?.[0]?.teacherId).filter(Boolean)).size, color: 'text-blue-600', bg: 'bg-blue-100' },
            { icon: <FileText className="w-5 h-5" />, label: 'Study Materials', value: '12', color: 'text-rose-600', bg: 'bg-rose-100' },
            { icon: <Award className="w-5 h-5" />, label: 'Avg Performance', value: '84%', color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Assigned Classes */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Class Assignments</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Classes and their designated subject teachers</p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {classes.map(cls => (
                  <div key={cls.id} className="group p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 flex flex-col items-center justify-center shadow-inner border border-blue-100/50">
                          <span className="text-[10px] font-bold opacity-60 uppercase leading-none mt-1">Class</span>
                          <span className="text-lg font-black leading-tight">{cls.class ? `${cls.class.name}` : 'NA'}</span>
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                            {cls.class ? `${cls.class.name}-${cls.class.section}` : 'N/A'}
                          </h4>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 border border-white shadow-sm">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Subject Teacher</p>
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {cls.classSubjectTeachers?.[0]?.teacher?.user?.name || 'Not Assigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Classes Found</h3>
                    <p className="text-gray-500 font-medium text-sm">Classes have not been associated with this subject yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Study Materials & Curriculum */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Download className="w-5 h-5" /></div>
                  <h3 className="text-xl font-black text-gray-900">Study Materials</h3>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: 'Syllabus Overview PDF', type: 'Document', size: '2.4 MB' },
                  { name: 'Term 1 Question Bank', type: 'Document', size: '1.1 MB' },
                  { name: 'Introduction Video Lesson', type: 'Video', size: '45 mins' },
                  { name: 'Previous Year Papers', type: 'Archive', size: '8.5 MB' },
                ].map((material, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-rose-100 hover:bg-rose-50/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${material.type === 'Video' ? 'bg-purple-100 text-purple-600' : material.type === 'Archive' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                        {material.type === 'Video' ? <PlayCircle className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-rose-700 transition-colors">{material.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{material.type}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[10px] text-gray-400 font-semibold">{material.size}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
              <div className="p-8 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-5 backdrop-blur-sm border border-white/10">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Curriculum Updates</h3>
                <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
                  Stay up to date with the latest changes and additions to the {name} syllabus.
                </p>
                <button className="w-full py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
                  View Timeline <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectDetailsPage;
