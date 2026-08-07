import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import { ArrowLeft, Users, School, Calendar, FileText, Download, PlayCircle } from 'lucide-react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const SubjectDetailsPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        const res: any = await api.get('/api/subjects');
        const allSubjects = res.data.data || res.data || [];
        const relatedClasses = allSubjects.filter((s: any) => s.name === name);
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
    <div className="flex flex-col h-full bg-gray-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={`${name} Curriculum`}
        icon={
          <Link to="/subjects">
            <ArrowLeft className="w-5 h-5 text-white/90 hover:text-white transition-colors" />
          </Link>
        }
        action={
          <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 px-3 py-1.5 rounded-lg border border-white/10 shadow-sm shrink-0">
            <School className="w-4 h-4" />
            {classes.length} {classes.length === 1 ? 'Class' : 'Classes'} Assigned
          </div>
        }
      />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-4">

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Assigned Classes */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex items-center gap-3 bg-blue-50/30">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-4.5 h-4.5" /></div>
                <h3 className="text-lg font-bold text-gray-900">Assigned Classes & Teachers</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map(cls => (
                  <div key={cls.id} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-gray-50/50 group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {cls.class ? `${cls.class.name.substring(0,2)}` : 'NA'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {cls.class ? `${cls.class.name}-${cls.class.section}` : 'N/A'}
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">Class Section</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {cls.classSubjectTeachers?.[0]?.teacher?.user?.name || 'No Teacher Assigned'}
                      </span>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-400 font-semibold text-sm">
                    No classes are currently assigned to this subject.
                  </div>
                )}
              </div>
            </div>

            {/* Curriculum Progress */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex items-center gap-3 bg-emerald-50/30">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileText className="w-4.5 h-4.5" /></div>
                <h3 className="text-lg font-bold text-gray-900">Recent Curriculum Updates</h3>
              </div>
              <div className="p-6 text-center text-gray-400 py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">Curriculum updates for this subject will appear here.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Study Materials */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex items-center gap-3 bg-rose-50/30">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Download className="w-4.5 h-4.5" /></div>
                <h3 className="text-lg font-bold text-gray-900">Study Materials</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { name: 'Syllabus Overview PDF', type: 'Document' },
                  { name: 'Term 1 Question Bank', type: 'Document' },
                  { name: 'Introduction Video Lesson', type: 'Video' },
                ].map((material, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-rose-50/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${material.type === 'Video' ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600'}`}>
                        {material.type === 'Video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-rose-600 transition-colors">{material.name}</p>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{material.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectDetailsPage;
