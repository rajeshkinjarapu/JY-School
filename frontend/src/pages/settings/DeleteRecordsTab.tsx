import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeleteRecordsTab: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Error fetching classes', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true);
    try {
      const res: any = await api.get(`/api/students?classId=${classId}&limit=1000`);
      setStudents(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching students', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res: any = await api.get('/api/teachers?limit=1000');
      setTeachers(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching teachers', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the student "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/students/${studentId}`);
      toast.success('Student deleted successfully');
      setStudents(students.filter(s => s.id !== studentId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleDeleteTeacher = async (teacherId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the teacher "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/teachers/${teacherId}`);
      toast.success('Teacher deleted successfully');
      setTeachers(teachers.filter(t => t.id !== teacherId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  return (
    <div className="card p-6 space-y-8 max-w-4xl mx-auto border border-red-100 dark:border-red-900/30">
      <div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Delete Individual Records
        </h2>
        <p className="text-xs text-gray-500 mt-1">Warning: Deleting records here will remove all their associated data permanently.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delete Students Section */}
        <div className="bg-red-50 dark:bg-red-500/5 p-5 rounded-xl border border-red-100 dark:border-red-500/20 flex flex-col h-[500px]">
          <h3 className="font-bold text-red-800 dark:text-red-300 mb-4 border-b border-red-200 pb-2">Delete Students</h3>
          
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Select Class</label>
            <select 
              className="input bg-white w-full"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Choose a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {!selectedClassId ? (
              <div className="text-center text-sm text-gray-400 mt-10">Select a class to view students</div>
            ) : loadingStudents ? (
              <div className="text-center text-sm text-gray-400 mt-10">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center text-sm text-gray-400 mt-10">No students found</div>
            ) : (
              students.map(student => (
                <div key={student.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{student.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">{student.rollNo}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteStudent(student.id, student.user?.name || '')}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Teachers Section */}
        <div className="bg-red-50 dark:bg-red-500/5 p-5 rounded-xl border border-red-100 dark:border-red-500/20 flex flex-col h-[500px]">
          <h3 className="font-bold text-red-800 dark:text-red-300 mb-4 border-b border-red-200 pb-2">Delete Teachers</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {loadingTeachers ? (
              <div className="text-center text-sm text-gray-400 mt-10">Loading...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center text-sm text-gray-400 mt-10">No teachers found</div>
            ) : (
              teachers.map(teacher => (
                <div key={teacher.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{teacher.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">{teacher.employeeId}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteTeacher(teacher.id, teacher.user?.name || '')}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                    title="Delete Teacher"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
