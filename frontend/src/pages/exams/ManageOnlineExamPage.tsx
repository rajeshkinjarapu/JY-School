import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Trash2, CheckCircle, Save } from 'lucide-react';
import api from '../../api/axios';

interface Question {
  id?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

const ManageOnlineExamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // New question form state
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Question>({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/online-exams/${id}/admin`);
      if (res.data?.data) {
        setExam(res.data.data);
        setQuestions(res.data.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to fetch exam details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handleAddQuestion = async () => {
    // Basic validation
    if (!newQuestion.questionText || newQuestion.options.some(opt => !opt) || !newQuestion.correctAnswer) {
      alert("Please fill all fields and ensure the correct answer is selected.");
      return;
    }
    
    try {
      // API expects an array of questions
      await api.post(`/api/online-exams/${id}/questions`, {
        questions: [newQuestion]
      });
      // Refresh list
      fetchExamDetails();
      // Reset form
      setIsAdding(false);
      setNewQuestion({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1
      });
    } catch (error) {
      console.error('Failed to add question', error);
      alert("Failed to add question.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Exam Details...</div>;
  }

  if (!exam) {
    return <div className="p-8 text-center text-red-500">Exam not found</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button onClick={() => navigate('/online-exams')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-sm text-gray-500">Manage Questions & Settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Exam Info & Stats */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Exam Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Class:</span>
                <span className="font-medium text-gray-800">{exam.class.name} {exam.class.section}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subject:</span>
                <span className="font-medium text-gray-800">{exam.subject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Marks:</span>
                <span className="font-medium text-gray-800">{exam.totalMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium text-gray-800">{exam.duration} mins</span>
              </div>
              <div className="flex justify-between pt-2 border-t mt-2">
                <span className="text-gray-500">Questions Added:</span>
                <span className="font-bold text-indigo-600">{questions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Questions List & Form */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Questions ({questions.length})</h2>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              {isAdding ? 'Cancel' : 'Add Question'}
            </button>
          </div>

          {/* Add Question Form */}
          {isAdding && (
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5 border-t-4 border-t-indigo-600">
              <h3 className="font-semibold text-gray-800 mb-4">New Question</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <textarea
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 border"
                    rows={3}
                    placeholder="Type the question here..."
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newQuestion.options.map((opt, idx) => (
                    <div key={idx} className="relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Option {String.fromCharCode(65 + idx)}</label>
                      <input
                        type="text"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border pl-3"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 pt-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                    <select
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border bg-white"
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                    >
                      <option value="">Select Correct Option</option>
                      {newQuestion.options.map((opt, idx) => (
                        opt ? <option key={idx} value={opt}>Option {String.fromCharCode(65 + idx)}: {opt}</option> : null
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                      value={newQuestion.marks}
                      onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                  <button
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Save className="h-4 w-4" /> Save Question
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of existing questions */}
          <div className="space-y-4">
            {questions.length === 0 && !isAdding ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No questions added yet. Click 'Add Question' to start.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id || idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                        {idx + 1}
                      </span>
                      <h4 className="text-gray-800 font-medium mt-1 leading-relaxed">
                        {q.questionText}
                      </h4>
                    </div>
                    <span className="shrink-0 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                      {q.marks} Marks
                    </span>
                  </div>
                  
                  <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        className={`p-2 rounded-lg text-sm border flex items-center gap-2 ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                      >
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${opt === q.correctAnswer ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageOnlineExamPage;
