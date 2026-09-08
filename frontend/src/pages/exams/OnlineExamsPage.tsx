import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateOnlineExamModal from './CreateOnlineExamModal';
import api from '../../api/axios';

interface OnlineExam {
  id: string;
  title: string;
  duration: number;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passMarks: number;
  isPublished: boolean;
  class: { name: string; section: string };
  subject: { name: string };
  _count: { questions: number; submissions: number };
}

const OnlineExamsPage = () => {
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/online-exams/admin');
      if (res.data && Array.isArray(res.data)) {
        setExams(res.data);
      } else if (res.data?.data) {
        setExams(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch online exams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/api/online-exams/${id}/publish`);
      fetchExams();
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Online Exams</h1>
          <p className="text-gray-500 mt-1">Create and manage online quizzes and AI generated exams.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchExams}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusCircle className="h-4 w-4" />
            Create Exam
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl bg-gray-50">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exams Found</h3>
            <p className="text-gray-500 mb-6">You haven't created any online exams yet.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Create Your First Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`h-2 ${exam.isPublished ? 'bg-green-500' : 'bg-orange-400'}`} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="font-bold text-lg text-gray-900 truncate" title={exam.title}>
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {exam.class.name} {exam.class.section} • {exam.subject.name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        exam.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-gray-400 text-xs">Duration</p>
                      <p className="font-medium text-gray-800">{exam.duration} mins</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Total Marks</p>
                      <p className="font-medium text-gray-800">{exam.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Questions</p>
                      <p className="font-medium text-gray-800">{exam._count.questions}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Submissions</p>
                      <p className="font-medium text-gray-800">{exam._count.submissions}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/online-exams/${exam.id}/manage`)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      <Edit className="h-3.5 w-3.5" /> Manage
                    </button>
                    {!exam.isPublished && (
                      <button
                        onClick={() => handlePublish(exam.id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateOnlineExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchExams();
        }}
      />
    </div>
  );
};

export default OnlineExamsPage;
