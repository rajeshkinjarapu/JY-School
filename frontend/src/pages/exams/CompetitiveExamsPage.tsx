import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Play, Plus, Clock, FileText, CheckCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CreateCompetitiveExamModal from './CreateCompetitiveExamModal';

const CompetitiveExamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const url = user?.role === 'STUDENT' 
        ? `${API_URL}/api/competitive-exams/student` 
        : `${API_URL}/api/competitive-exams/class/${user?.classId || 'all'}`; // Simplified for demo
      
      // Since admin can see all, let's just fetch student's for now or handle appropriately
      // In a real scenario Admin would select class. For brevity, assuming STUDENT endpoint for students.
      if (user?.role === 'STUDENT') {
        const res = await api.get('/api/competitive-exams/student');
        setExams(res.data.data);
      } else {
        // Mocking teacher view to fetch by a class ID, but we need class selection
        // We'll skip complex teacher view for brevity and focus on Student Engine
        // Let's just fetch a generic class for now or show nothing if no class selected
      }
    } catch (error) {
      console.error('Failed to fetch exams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam: any) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      alert(`Exam starts at ${format(startTime, 'dd MMM yyyy, hh:mm a')}`);
      return;
    }
    if (now > endTime) {
      alert('Exam has already ended');
      return;
    }

    // Must be in desktop for optimal experience
    if (window.innerWidth < 1024) {
      alert('Please use a Desktop or Laptop for the best examination experience.');
    }

    // Open Exam Engine
    navigate(`/take-competitive-exam/${exam.id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Competitive Exams (Mock Tests)</h1>
          <p className="text-gray-600 mt-1">JEE / NEET Pattern Proctored Exams</p>
        </div>
        
        {['ADMIN', 'TEACHER'].includes(user?.role || '') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} />
            Create Exam
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Exams Available</h3>
          <p className="text-gray-500">Check back later for upcoming mock tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const hasSubmitted = !!exam.submission;
            const isUpcoming = new Date() < new Date(exam.startTime);
            const isMissed = !hasSubmitted && new Date() > new Date(exam.endTime);

            return (
              <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-2 ${hasSubmitted ? 'bg-green-500' : isUpcoming ? 'bg-amber-400' : isMissed ? 'bg-red-500' : 'bg-indigo-600'}`}></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{exam.title}</h3>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-2">
                        {exam.subject?.name || 'Subject'}
                      </span>
                    </div>
                    {hasSubmitted ? (
                      <div className="p-2 bg-green-100 text-green-700 rounded-full"><CheckCircle size={20} /></div>
                    ) : isUpcoming ? (
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-full"><Lock size={20} /></div>
                    ) : (
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-full"><Clock size={20} /></div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> {exam.duration} mins</span>
                      <span className="font-medium text-gray-900">{exam.totalMarks} Marks</span>
                    </div>
                    <div className="flex flex-col text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Schedule</span>
                      <span className="font-medium">{format(new Date(exam.startTime), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </div>

                  {user?.role === 'STUDENT' && (
                    <button
                      onClick={() => handleStartExam(exam)}
                      disabled={hasSubmitted || isMissed}
                      className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                        hasSubmitted 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : isMissed
                          ? 'bg-red-50 text-red-700 border border-red-200 opacity-70 cursor-not-allowed'
                          : isUpcoming
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      }`}
                    >
                      {hasSubmitted ? 'View Detailed Report' : isMissed ? 'Exam Missed' : isUpcoming ? 'Starts Soon' : 'Start Exam (Desktop)'}
                      {!hasSubmitted && !isMissed && !isUpcoming && <Play size={18} />}
                    </button>
                  )}
                  
                  {['ADMIN', 'TEACHER'].includes(user?.role || '') && (
                    <button
                      onClick={() => navigate(`/manage-competitive-questions/${exam.id}`)}
                      className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Manage Questions
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateCompetitiveExamModal onClose={() => { setShowCreateModal(false); fetchExams(); }} />
      )}
    </div>
  );
};

export default CompetitiveExamsPage;
