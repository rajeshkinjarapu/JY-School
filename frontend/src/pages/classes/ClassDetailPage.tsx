import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import { ArrowLeft, BookOpen, Users, Calendar } from 'lucide-react';

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');

  const fetchClassDetails = async () => {
    try {
      const [classRes, studentsRes, subjectsRes]: any = await Promise.all([
        api.get(`/api/classes/${id}`),
        api.get(`/api/classes/${id}/students`),
        api.get(`/api/classes/${id}/subjects`),
      ]);
      setCls(classRes.data);
      setStudents(studentsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!cls) return <div className="text-center py-12">Class details not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/classes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </Link>

      <div className="card p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{cls.name}-{cls.section}</h2>
          <div className="flex gap-2">
            <Badge variant="info">Year: {cls.academicYear}</Badge>
            <Badge variant="success">Teacher: {cls.classTeacher?.user.name || 'No assignment'}</Badge>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-4 text-sm font-bold border-b-2 cursor-pointer ${
              activeTab === 'students' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-2 px-4 text-sm font-bold border-b-2 cursor-pointer ${
              activeTab === 'subjects' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400'
            }`}
          >
            Subjects ({subjects.length})
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((std) => (
                <tr key={std.id}>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar name={std.user.name} src={std.user.photoUrl} size="sm" variant="rectangular" />
                    <div>
                      <h4 className="font-semibold text-gray-950 dark:text-white leading-tight">{std.user.name}</h4>
                      {user?.role === 'STUDENT' ? (
                        std.user.phone && <span className="text-xs text-gray-400">{std.user.phone}</span>
                      ) : (
                        <span className="text-xs text-gray-400">{std.user.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{std.rollNo}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/students/${std.id}`} className="btn-secondary !p-1.5 !rounded-lg text-xs">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-450">
                    No students currently enrolled in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Teacher Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subjects.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-6 py-4 font-semibold">{sub.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{sub.code}</td>
                  <td className="px-6 py-4">
                    {sub.classSubjectTeachers?.[0]?.teacher ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={sub.classSubjectTeachers[0].teacher.user.name}
                          src={sub.classSubjectTeachers[0].teacher.user.photoUrl}
                          size="sm"
                          variant="rectangular"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {sub.classSubjectTeachers[0].teacher.user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-450 italic text-xs">No assignment</span>
                    )}
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-450">
                    No subjects configured for this class yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
};
export default ClassDetailPage;
