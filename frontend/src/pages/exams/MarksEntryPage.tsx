import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const MarksEntryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<{ [key: string]: number }>({});
  const [remarksData, setRemarksData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Get Exam
      const examRes: any = await api.get(`/api/exams/${id}`);
      const examObj = examRes.data;
      setExam(examObj);

      // 2. Get students in class
      const studentsRes: any = await api.get(`/api/classes/${examObj.classId}/students`);
      setStudents(studentsRes.data || []);

      // 3. Get subjects in class
      const subjectsRes: any = await api.get(`/api/classes/${examObj.classId}/subjects`);
      setSubjects(subjectsRes.data || []);

      // 4. Get existing marks
      const marksRes: any = await api.get(`/api/exams/${id}/results`);
      const existingMarks = marksRes.data || [];

      // Map marks state
      const initialMarks: { [key: string]: number } = {};
      const initialRemarks: { [key: string]: string } = {};

      existingMarks.forEach((m: any) => {
        initialMarks[`${m.studentId}_${m.subjectId}`] = m.marksObtained;
        initialRemarks[`${m.studentId}_${m.subjectId}`] = m.remarks || '';
      });

      setMarksData(initialMarks);
      setRemarksData(initialRemarks);
    } catch (e) {
      toast.error('Failed to load marks matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleMarkChange = (studentId: string, subjectId: string, val: string) => {
    setMarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectId}`]: Number(val),
    }));
  };

  const handleRemarkChange = (studentId: string, subjectId: string, val: string) => {
    setRemarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectId}`]: val,
    }));
  };

  const handleSave = async () => {
    const payload = {
      examId: id,
      marks: Object.keys(marksData).map((key) => {
        const [studentId, subjectId] = key.split('_');
        return {
          studentId,
          subjectId,
          marksObtained: marksData[key],
          remarks: remarksData[key] || '',
        };
      }),
    };

    try {
      await api.post('/api/marks/bulk', payload);
      toast.success('Marks updated successfully!');
      navigate('/exams');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save marks');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/exams" className="btn-secondary !p-2 !rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold">{exam?.name}</h2>
          <span className="text-xs text-gray-400">Class: {exam?.class?.name}-{exam?.class?.section} • Term: {exam?.term}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4 min-w-[200px]">Student Name</th>
                {subjects.map((sub) => (
                  <th key={sub.id} className="px-6 py-4 min-w-[120px]">
                    {sub.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 font-semibold">{student.user.name}</td>
                  {subjects.map((sub) => {
                    const key = `${student.id}_${sub.id}`;
                    return (
                      <td key={sub.id} className="px-6 py-4">
                        <div className="space-y-1">
                          <input
                            type="number"
                            min={0}
                            max={exam.maxMarks}
                            value={marksData[key] !== undefined ? marksData[key] : ''}
                            onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                            placeholder={`Max: ${exam.maxMarks}`}
                            className="input !py-1.5 !px-2.5 max-w-[100px]"
                          />
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={remarksData[key] || ''}
                            onChange={(e) => handleRemarkChange(student.id, sub.id, e.target.value)}
                            className="input !py-1 !px-2 !text-xs max-w-[120px]"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
        <Save className="w-5 h-5" />
        <span>Save Marks Entry Registry</span>
      </button>
    </div>
  );
};
export default MarksEntryPage;
