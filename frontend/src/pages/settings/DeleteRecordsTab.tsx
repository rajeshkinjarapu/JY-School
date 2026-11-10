import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Trash2, AlertTriangle, School, Users, User, ShieldAlert, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { DataCache } from '../../services/dataCache';

export const DeleteRecordsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'classes' | 'students' | 'teachers'>('classes');

  // Classes state
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Students state
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Teachers state
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
    setLoadingClasses(true);
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Error fetching classes', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoadingClasses(false);
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

  const handleDeleteClass = async (classId: string, className: string, studentCount: number) => {
    const confirmation = window.confirm(
      `⚠️ DANGER ZONE: Are you sure you want to permanently delete Class "${className}"?\n\n` +
      `• ${studentCount} enrolled student(s) will be unassigned.\n` +
      `• Timetable, subject mappings, and attendance records for this class will be permanently removed.\n\n` +
      `This action CANNOT be undone. Proceed?`
    );
    if (!confirmation) return;

    try {
      await api.delete(`/api/classes/${classId}`);
      toast.success(`Class "${className}" deleted successfully`);
      DataCache.invalidate('classes');
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the student "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/students/${studentId}`);
      toast.success('Student deleted successfully');
      setStudents(students.filter(s => s.id !== studentId));
      DataCache.invalidate('students');
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
      DataCache.invalidate('teachers');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  return (
    <div className="card p-6 md:p-8 space-y-6 max-w-5xl mx-auto border border-rose-200/80 dark:border-rose-900/40 shadow-xl bg-white dark:bg-gray-900 rounded-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100 dark:border-rose-950">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-600 dark:text-rose-500 flex items-center gap-2">
              Danger Zone & Record Deletion
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently delete classes, students, or staff records. Actions taken here are irreversible.
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-gray-800 rounded-2xl shrink-0">
          <button
            onClick={() => setSubTab('classes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'classes'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Classes ({classes.length})</span>
          </button>
          <button
            onClick={() => setSubTab('students')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'students'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students</span>
          </button>
          <button
            onClick={() => setSubTab('teachers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'teachers'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Teachers ({teachers.length})</span>
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-black">Administrative Security Notice: </span>
          Class deletion has been removed from the main directory to prevent accidental data loss. Classes deleted here will unassign all linked students and remove timetable/attendance data.
        </div>
      </div>

      {/* SUB-TAB 1: DELETE CLASSES */}
      {subTab === 'classes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-rose-500" />
              Manage & Delete Classes
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{classes.length} Total Configured</span>
          </div>

          <div className="bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/40 overflow-hidden">
            {loadingClasses ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">Loading classes directory...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">No classes available to delete.</div>
            ) : (
              <div className="divide-y divide-rose-100 dark:divide-rose-900/40 max-h-[480px] overflow-y-auto">
                {classes.map((cls) => {
                  const studentCount = cls._count?.students || 0;
                  const teacherName = cls.classTeacher?.user?.name || 'No Teacher Assigned';
                  return (
                    <div
                      key={cls.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
                          {cls.name}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm">
                              Class {cls.name}-{cls.section}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
                              {cls.academicYear}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>👥 {studentCount} Students</span>
                            <span>•</span>
                            <span>👨‍🏫 {teacherName}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteClass(cls.id, `${cls.name}-${cls.section}`, studentCount)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-black border border-rose-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Class</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DELETE STUDENTS */}
      {subTab === 'students' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              Delete Individual Students
            </h3>
            
            <div className="w-full sm:w-64">
              <select
                className="input bg-white w-full text-xs font-bold"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select a class to load students...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name}-{c.section} ({c._count?.students || 0} students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/40 overflow-hidden min-h-[300px]">
            {!selectedClassId ? (
              <div className="text-center py-16 text-slate-400 text-xs font-bold">
                Please select a class from the dropdown above to view and manage its students.
              </div>
            ) : loadingStudents ? (
              <div className="text-center py-16 text-slate-400 text-xs font-bold">Loading student records...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-bold">No students found in this class.</div>
            ) : (
              <div className="divide-y divide-rose-100 dark:divide-rose-900/40 max-h-[480px] overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                        🎓
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                          {student.user?.name || 'Unknown Name'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          Roll: {student.rollNo} • Aadhaar: {student.aadharNo ? `**** ${student.aadharNo.slice(-4)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.user?.name || student.rollNo)}
                      className="p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DELETE TEACHERS */}
      {subTab === 'teachers' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-rose-500" />
              Delete Individual Teachers
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{teachers.length} Active Staff</span>
          </div>

          <div className="bg-rose-50/30 dark:bg-rose-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/40 overflow-hidden">
            {loadingTeachers ? (
              <div className="text-center py-16 text-slate-400 text-xs font-bold">Loading teacher records...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-bold">No teachers found.</div>
            ) : (
              <div className="divide-y divide-rose-100 dark:divide-rose-900/40 max-h-[480px] overflow-y-auto">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-black text-xs shrink-0">
                        👨‍🏫
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                          {teacher.user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          ID: {teacher.employeeId} • {teacher.user?.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.user?.name || teacher.employeeId)}
                      className="p-2 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                      title="Delete Teacher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
