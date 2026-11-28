import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Edit3, Calendar, FileText, CheckCircle, Hash, Layers, RefreshCw, Copy, Upload, Search, Sparkles, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { PageHeader } from '../../components/UI/PageHeader';
import { sortClasses, getClassOrderIndex } from '../../utils/sortClasses';
import { getSubjectSortWeight, getCanonicalSubjectName } from './ResultsTab';

interface ClassSubjectConfig {
  classId: string;
  className: string;
  subjects: { id: string; name: string; maxMarks: number; date?: string }[];
}

export const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editExam = location.state?.exam;
  const isDuplicate = location.state?.isDuplicate;

  const [classes, setClasses] = useState<any[]>([]);
  const [allDbSubjects, setAllDbSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const [examName, setExamName] = useState(editExam ? (isDuplicate ? `${editExam.name} (Copy)` : editExam.name) : '');
  const [examCategory, setExamCategory] = useState<'JEE' | 'BOARD' | ''>('');
  const [boardExamType, setBoardExamType] = useState('');
  const [examClassIds, setExamClassIds] = useState<string[]>(editExam?.classes?.map((c: any) => c.id) || []);
  const [examDate, setExamDate] = useState(
    editExam?.examDate 
      ? new Date(editExam.examDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );

  // Class-wise subjects configuration map: { [classId]: ClassSubjectConfig }
  const [classConfigs, setClassConfigs] = useState<{ [classId: string]: ClassSubjectConfig }>({});
  const [activeClassTab, setActiveClassTab] = useState<string>('');
  const [bulkMarksInput, setBulkMarksInput] = useState<number>(100);

  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
  const [fullExamSettings, setFullExamSettings] = useState<any>({});
  const [fullExamMarks, setFullExamMarks] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
    if (editExam) {
      // Fetch full exam details, global settings, and master subjects together
      Promise.all([
        api.get(`/api/exams/${editExam.id}?includeMarks=true`),
        api.get('/api/settings').catch(() => ({ data: {} })),
        api.get('/api/subjects?limit=5000').catch(() => ({ data: [] }))
      ]).then(([res, settingsRes, dbSubRes]: any) => {
        const fullExam = res.data;
        const globalSettings = settingsRes.data?.data || settingsRes.data || {};
        const masterDbSubjects = dbSubRes.data?.data || dbSubRes.data || [];
        
        if (fullExam?.admitCardSettings) {
          setFullExamSettings(fullExam.admitCardSettings);
          setLogoUrl(fullExam.admitCardSettings.logoUrl || globalSettings.logoUrl || '');
          setSignatureUrl(fullExam.admitCardSettings.signatureUrl || fullExam.admitCardSettings.principalSignatureUrl || globalSettings.principalSignatureUrl || globalSettings.signatureUrl || '');
          setTeacherSignatureUrl(fullExam.admitCardSettings.teacherSignatureUrl || globalSettings.teacherSignatureUrl || '');
        } else {
          setLogoUrl(globalSettings.logoUrl || '');
          setSignatureUrl(globalSettings.principalSignatureUrl || globalSettings.signatureUrl || '');
          setTeacherSignatureUrl(globalSettings.teacherSignatureUrl || '');
        }

        if (Array.isArray(fullExam?.marks)) {
          setFullExamMarks(fullExam.marks);
        }

        // Group existing marks by student's classId (Ground truth of what was actually examined!)
        // Group existing marks by student's classId (Ground truth of what was actually examined!)
        const marksByClass: { [classId: string]: Map<string, { id: string; name: string; maxMarks: number; date?: string }> } = {};
        if (Array.isArray(fullExam?.marks) && fullExam.marks.length > 0) {
          fullExam.marks.forEach((m: any) => {
            const cId = m.student?.classId;
            if (!cId || !m.subject?.name) return;
            if (!marksByClass[cId]) marksByClass[cId] = new Map();
            const sName = m.subject.name.trim();
            const sKey = getCanonicalSubjectName(sName);
            if (!marksByClass[cId].has(sKey)) {
              marksByClass[cId].set(sKey, {
                id: m.subject.id || m.subjectId,
                name: sKey,
                maxMarks: Number(m.maxMarks) || Number(fullExam.maxMarks) || 50,
                date: fullExam.examDate ? new Date(fullExam.examDate).toISOString().split('T')[0] : examDate
              });
            }
          });
        }

        // Parse saved subjects
        let parsedSubjects: any = fullExam?.subjects || editExam.subjects;
        if (typeof parsedSubjects === 'string') {
          try { parsedSubjects = JSON.parse(parsedSubjects); } catch (e) {}
        }

        const cfgMap: any = {};
        const examClasses = fullExam?.classes || editExam.classes || [];
        
        examClasses.forEach((cls: any) => {
          const cId = cls.id;
          const clsName = `${cls.name} - ${cls.section}`;
          
          // Load base config from saved classConfigs if they exist
          let loadedSubjects: any[] = [];
          if (parsedSubjects?.classConfigs && Array.isArray(parsedSubjects.classConfigs)) {
            const savedCfg = parsedSubjects.classConfigs.find((c: any) => c.classId === cId);
            if (savedCfg && Array.isArray(savedCfg.subjects) && savedCfg.subjects.length > 0) {
              const masterClassSubs = masterDbSubjects.filter((s: any) => s.classId === cId);
              const isCorruptedDefaultFour = savedCfg.subjects.length === 4 && 
                savedCfg.subjects.some((s: any) => s.name === 'ENGLISH') &&
                savedCfg.subjects.some((s: any) => s.name === 'MATHEMATICS') &&
                savedCfg.subjects.some((s: any) => s.name === 'SCIENCE') &&
                savedCfg.subjects.some((s: any) => s.name === 'SOCIAL');
              
              if (!isCorruptedDefaultFour || masterClassSubs.length === 0) {
                loadedSubjects = [...savedCfg.subjects];
              }
            }
          }

          // Fallback to DB master subjects or legacy flat array if not loaded
          if (loadedSubjects.length === 0) {
            const dbSubsForClass = masterDbSubjects.filter((s: any) => s.classId === cId);
            if (dbSubsForClass.length > 0) {
              loadedSubjects = dbSubsForClass.map((s: any) => ({
                id: s.id,
                name: s.name,
                maxMarks: Number(fullExam?.maxMarks) || 50,
                date: fullExam?.examDate ? new Date(fullExam.examDate).toISOString().split('T')[0] : examDate
              }));
            } else if (Array.isArray(parsedSubjects) && parsedSubjects.length > 0) {
              loadedSubjects = [...parsedSubjects];
            }
          }

          // Merge loaded subjects with guaranteed protected marks
          const dedupedSubs: any[] = [];
          const seen = new Set<string>();

          // First, add all subjects that have actual marks (PROTECTED)
          if (marksByClass[cId] && marksByClass[cId].size > 0) {
            marksByClass[cId].forEach((subVal, subKey) => {
              seen.add(subKey);
              dedupedSubs.push(subVal);
            });
          }

          // Next, add the loaded subjects if they don't conflict
          loadedSubjects.forEach((s: any) => {
            const canon = getCanonicalSubjectName(s.name);
            if (!seen.has(canon)) {
              seen.add(canon);
              dedupedSubs.push({
                id: s.id || Date.now().toString() + Math.random(),
                name: canon,
                maxMarks: s.maxMarks || Number(fullExam?.maxMarks) || 50,
                date: s.date || (fullExam?.examDate ? new Date(fullExam.examDate).toISOString().split('T')[0] : examDate)
              });
            }
          });

          if (dedupedSubs.length > 0) {
            dedupedSubs.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
            cfgMap[cId] = {
              classId: cId,
              className: clsName,
              subjects: dedupedSubs
            };
          }
        });

        if (Object.keys(cfgMap).length > 0) {
          setClassConfigs(cfgMap);
        }
      }).catch(err => console.error('Failed to load full exam', err));

      if (editExam.name?.includes('JEE')) setExamCategory('JEE');
      else if (['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2', 'Pre-Final'].some(t => editExam.name?.includes(t))) setExamCategory('BOARD');
      else setExamCategory('');
    }
  }, [editExam]);

  const fetchInitialData = async () => {
    try {
      const [classRes, subRes, settingsRes]: any = await Promise.all([
        api.get('/api/classes?limit=500'),
        api.get('/api/subjects?limit=5000'),
        api.get('/api/settings').catch(() => ({ data: {} }))
      ]);
      const classList = classRes.data || classRes || [];
      const subList = subRes.data || subRes || [];
      const globalSettings = settingsRes.data?.data || settingsRes.data || {};
      
      const sortedClasses = sortClasses(classList);
      setClasses(sortedClasses);
      setAllDbSubjects(subList);

      if (!editExam) {
        setLogoUrl(globalSettings.logoUrl || '');
        setSignatureUrl(globalSettings.principalSignatureUrl || globalSettings.signatureUrl || '');
        setTeacherSignatureUrl(globalSettings.teacherSignatureUrl || '');
      }
    } catch {
      toast.error('Failed to load initial data');
    }
  };


  // Initialize class configs when class list or examClassIds change (MANUAL ENTRY ONLY)
  useEffect(() => {
    if (classes.length === 0) return;
    if (editExam) return; // CRITICAL: Never overwrite existing exam subjects with defaults!

    setClassConfigs((prev) => {
      const updated = { ...prev };
      examClassIds.forEach((cId) => {
        const cls = classes.find((c) => c.id === cId);
        if (!cls) return;

        const clsName = `${cls.name} - ${cls.section}`;
        
        // If class config doesn't exist yet, initialize with standard curriculum subjects
        if (!updated[cId]) {
          const dbSubsForClass = allDbSubjects.filter(s => s.classId === cId);
          let defaultSubs: any[] = [];
          
          const isFa = examName.toUpperCase().includes('FA') || boardExamType.toUpperCase().includes('FA');
          const defaultMax = isFa ? 50 : 100;

          if (dbSubsForClass.length > 0) {
            defaultSubs = [...dbSubsForClass]
              .sort((a, b) => {
                const wA = getSubjectSortWeight(a.name);
                const wB = getSubjectSortWeight(b.name);
                if (wA !== wB) return wA - wB;
                return a.name.localeCompare(b.name);
              })
              .map((s) => ({
                id: s.id,
                name: s.name,
                maxMarks: defaultMax,
                date: examDate
              }));
          } else {
            const upperName = cls.name.toUpperCase();
            if (upperName.includes('NUR') || upperName.includes('PP') || upperName.includes('LKG') || upperName.includes('UKG')) {
              defaultSubs = [
                { id: Date.now().toString() + '_1', name: 'ENGLISH', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_2', name: 'MATHS', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_3', name: 'GENERAL AWARENESS', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_4', name: 'RHYMES, ART & CRAFT', maxMarks: defaultMax, date: examDate }
              ];
            } else if (['1', '2', '3', '4', '5', 'CLASS 1', 'CLASS 2', 'CLASS 3', 'CLASS 4', 'CLASS 5', 'IST', 'IIND', 'IIIRD', 'IVTH', 'VTH'].some(p => upperName.includes(p))) {
              defaultSubs = [
                { id: Date.now().toString() + '_1', name: 'TELUGU', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_2', name: 'HINDI', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_3', name: 'ENGLISH', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_4', name: 'MATHEMATICS', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_5', name: 'EVS', maxMarks: defaultMax, date: examDate }
              ];
            } else {
              defaultSubs = [
                { id: Date.now().toString() + '_1', name: 'TELUGU', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_2', name: 'HINDI', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_3', name: 'ENGLISH', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_4', name: 'MATHEMATICS', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_5', name: 'SCIENCE', maxMarks: defaultMax, date: examDate },
                { id: Date.now().toString() + '_6', name: 'SOCIAL', maxMarks: defaultMax, date: examDate }
              ];
            }
          }

          updated[cId] = {
            classId: cId,
            className: clsName,
            subjects: defaultSubs
          };
        }
      });

      // Remove unselected class configs
      Object.keys(updated).forEach((cId) => {
        if (!examClassIds.includes(cId)) {
          delete updated[cId];
        }
      });

      return updated;
    });

    if (examClassIds.length > 0 && !examClassIds.includes(activeClassTab)) {
      setActiveClassTab(examClassIds[0]);
    }
  }, [examClassIds, classes, examDate, allDbSubjects]);

  const handleClassToggle = (classId: string) => {
    if (examClassIds.includes(classId)) {
      const nextClassIds = examClassIds.filter((id) => id !== classId);
      setExamClassIds(nextClassIds);
    } else {
      setExamClassIds([...examClassIds, classId]);
      setActiveClassTab(classId);
    }
  };

  const handleSelectAllClasses = () => {
    if (examClassIds.length === classes.length) {
      setExamClassIds([]);
    } else {
      const allIds = classes.map((c) => c.id);
      setExamClassIds(allIds);
      if (allIds.length > 0) setActiveClassTab(allIds[0]);
    }
  };

  const updateSubjectInClass = (classId: string, subIndex: number, field: string, value: any) => {
    setClassConfigs((prev) => {
      const clsCfg = prev[classId];
      if (!clsCfg) return prev;

      const newSubs = [...clsCfg.subjects];
      newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };

      return {
        ...prev,
        [classId]: { ...clsCfg, subjects: newSubs }
      };
    });
  };

  const addSubjectToClass = (classId: string) => {
    setClassConfigs((prev) => {
      const clsCfg = prev[classId];
      if (!clsCfg) return prev;

      const newSub = {
        id: Date.now().toString(),
        name: '',
        maxMarks: 100,
        date: examDate
      };

      return {
        ...prev,
        [classId]: { ...clsCfg, subjects: [...clsCfg.subjects, newSub] }
      };
    });
  };

  const removeSubjectFromClass = (classId: string, subIndex: number) => {
    const targetSub = classConfigs[classId]?.subjects[subIndex];
    if (targetSub && fullExamMarks && fullExamMarks.length > 0) {
      const hasMarks = fullExamMarks.some((m: any) => 
        m.student?.classId === classId && 
        (m.subject?.name?.toUpperCase().trim() === targetSub.name?.toUpperCase().trim() ||
         m.subjectId === targetSub.id || m.subject?.id === targetSub.id)
      );
      if (hasMarks) {
        toast.error(`"${targetSub.name}" subject already has marks entered! Cannot remove for data safety.`);
        return;
      }
    }

    setClassConfigs((prev) => {
      const clsCfg = prev[classId];
      if (!clsCfg) return prev;

      const newSubs = clsCfg.subjects.filter((_, idx) => idx !== subIndex);

      return {
        ...prev,
        [classId]: { ...clsCfg, subjects: newSubs }
      };
    });
  };

  const handleCopyClassConfigToAll = (sourceClassId: string) => {
    const sourceCfg = classConfigs[sourceClassId];
    if (!sourceCfg || sourceCfg.subjects.length === 0) {
      toast.error('Source class has no subjects to copy');
      return;
    }

    let protectedCount = 0;
    setClassConfigs((prev) => {
      const updated = { ...prev };
      examClassIds.forEach((cId) => {
        if (cId !== sourceClassId && updated[cId]) {
          // If destination class has recorded student marks, do not overwrite its subjects!
          const hasMarks = fullExamMarks && fullExamMarks.some((m: any) => m.student?.classId === cId);
          if (hasMarks) {
            protectedCount++;
            return;
          }
          updated[cId] = {
            ...updated[cId],
            subjects: sourceCfg.subjects.map((s, idx) => ({
              id: `${Date.now()}_${cId}_${idx}`,
              name: s.name,
              maxMarks: s.maxMarks,
              date: s.date || examDate
            }))
          };
        }
      });
      return updated;
    });

    if (protectedCount > 0) {
      toast.success(`Subjects copied. (${protectedCount} classes skipped as they already have marks)`);
    } else {
      toast.success(`Copied ${sourceCfg.className} subjects to ALL selected classes!`);
    }
  };

  const handleClearClassSubjects = (classId: string) => {
    if (fullExamMarks && fullExamMarks.length > 0) {
      const hasMarksForClass = fullExamMarks.some((m: any) => m.student?.classId === classId);
      if (hasMarksForClass) {
        toast.error('Students in this class already have marks! Cannot clear all subjects at once.');
        return;
      }
    }
    setClassConfigs((prev) => {
      const clsCfg = prev[classId];
      if (!clsCfg) return prev;
      return {
        ...prev,
        [classId]: { ...clsCfg, subjects: [] }
      };
    });
  };

  const handleApplyBulkMarksToClass = (classId: string, marks: number) => {
    setClassConfigs((prev) => {
      const clsCfg = prev[classId];
      if (!clsCfg) return prev;

      const newSubs = clsCfg.subjects.map((s) => ({ ...s, maxMarks: marks }));
      return {
        ...prev,
        [classId]: { ...clsCfg, subjects: newSubs }
      };
    });
    toast.success(`Applied ${marks} Max Marks to all subjects in this class!`);
  };



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'teacherSignature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'signature') setSignatureUrl(res.data.url);
      if (type === 'teacherSignature') setTeacherSignatureUrl(res.data.url);
      if (type === 'logo') setLogoUrl(res.data.url);
      toast.success(`${type === 'logo' ? 'Logo' : type === 'signature' ? 'Principal Signature' : 'Teacher Signature'} uploaded successfully!`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
  };

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  // Calculate total max marks across active tab or overall
  const activeClassConfig = classConfigs[activeClassTab];
  const activeClassTotalMarks = activeClassConfig
    ? activeClassConfig.subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0)
    : 0;

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    if (!examName.trim()) {
      toast.error('Please enter Exam Name');
      return;
    }

    // Build payload with canonicalized and deduplicated subjects
    const classConfigsList = Object.values(classConfigs).map((cfg: any) => {
      const deduped: any[] = [];
      const seen = new Set<string>();
      (cfg.subjects || []).forEach((s: any) => {
        if (!s.name) return;
        const canon = getCanonicalSubjectName(s.name);
        if (!seen.has(canon)) {
          seen.add(canon);
          deduped.push({ ...s, name: canon });
        }
      });
      deduped.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
      return {
        ...cfg,
        subjects: deduped
      };
    });
    
    // Flatten subjects for legacy fallback
    const mergedSubjectsMap = new Map<string, { id: string; name: string; maxMarks: number; date?: string }>();
    classConfigsList.forEach((cfg) => {
      cfg.subjects.forEach((s) => {
        const can = getCanonicalSubjectName(s.name);
        if (can && !mergedSubjectsMap.has(can)) {
          mergedSubjectsMap.set(can, { ...s, name: can });
        }
      });
    });

    const fallbackGlobalSubjects = Array.from(mergedSubjectsMap.values()).sort(
      (a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name)
    );
    const finalSubjectsPayload = {
      classConfigs: classConfigsList,
      globalSubjects: fallbackGlobalSubjects
    };

    setLoading(true);
    
    const admitCardSettings = {
      ...fullExamSettings,
      logoUrl,
      signatureUrl,
      teacherSignatureUrl
    };

    try {
      if (editExam?.id && !isDuplicate) {
        await api.put(`/api/exams/${editExam.id}`, {
          name: examName,
          classIds: examClassIds,
          examDate: new Date(examDate),
          maxMarks: activeClassTotalMarks,
          subjects: finalSubjectsPayload,
          admitCardSettings
        });
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/api/exams', {
          name: examName,
          classIds: examClassIds,
          examDate: new Date(examDate),
          maxMarks: activeClassTotalMarks,
          subjects: finalSubjectsPayload,
          admitCardSettings
        });
        toast.success(isDuplicate ? 'Exam duplicated successfully!' : 'Exam created successfully!');
      }
      navigate('/exams');
    } catch (err: any) {
      toast.error(err.message || 'Error saving exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] animate-fade-in" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader
        title={editExam ? (isDuplicate ? 'Duplicate Exam Configuration' : 'Edit Exam Configuration') : 'Create New Exam'}
        icon={
          <button
            type="button"
            onClick={() => navigate('/exams?tab=examination')}
            className="text-white hover:text-indigo-200 transition-colors cursor-pointer flex items-center justify-center"
            title="Back to Examinations List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        action={
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-extrabold">
              <Layers className="w-3.5 h-3.5" />
              {examClassIds.length} {examClassIds.length === 1 ? 'Class' : 'Classes'} Selected
            </span>
            <button
              type="button"
              onClick={() => navigate('/exams?tab=examination')}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Exams
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleCreateExam} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Form Left Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. General Settings Card */}
            <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#1E1B4B]">General Examination Details</h2>
                    <p className="text-[11px] font-bold text-slate-500">Define exam category, official title, and commencement date</p>
                  </div>
                </div>
                {editExam && !isDuplicate && (
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                    Editing Existing
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2.5">Exam Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'JEE' ? 'border-amber-400 bg-gradient-to-br from-[#FFF9EB] to-[#FEF3C7]/60 text-amber-950 shadow-sm' : 'border-slate-200/80 hover:border-amber-200 bg-[#FAFBFF]'}`}>
                      <input type="radio" name="examCategory" value="JEE" checked={examCategory === 'JEE'} onChange={() => { setExamCategory('JEE'); setBoardExamType(''); setExamName('JEE Mains Model Examination'); }} className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-[#1E1B4B] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> JEE Mains Exams
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">Objective competitive patterns</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'BOARD' ? 'border-[#6D28D9] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]/60 text-[#1E1B4B] shadow-sm' : 'border-slate-200/80 hover:border-indigo-200 bg-[#FAFBFF]'}`}>
                      <input type="radio" name="examCategory" value="BOARD" checked={examCategory === 'BOARD'} onChange={() => { setExamCategory('BOARD'); setExamName(''); }} className="w-4 h-4 text-[#5B21B6] focus:ring-[#5B21B6] cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-[#1E1B4B] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-[#5B21B6]" /> Board / Academic Exams
                        </div>
                        <div className="text-xs font-semibold text-slate-500 mt-0.5">FA / SA / Pre-Finals / Finals</div>
                      </div>
                    </label>
                  </div>
                </div>

                {examCategory === 'BOARD' && (
                  <div className="animate-fade-in">
                    <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wider">Board Exam Type</label>
                    <select value={boardExamType} onChange={(e) => { setBoardExamType(e.target.value); setExamName(e.target.value + ' Examination'); }} className="w-full px-4 py-3 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#5B21B6] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all">
                      <option value="">Select Board Exam Type...</option>
                      {['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2', 'Pre-Final'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wider">Exam Name / Title</label>
                  <input type="text" required placeholder="e.g. Formative Assessment - 1" value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-4 py-3 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#5B21B6] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wider">Exam Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input type="date" required value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#5B21B6] focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wider">Active Class Max Marks</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                      <input type="number" readOnly value={activeClassTotalMarks} className="w-full pl-11 pr-4 py-3 bg-[#F2EDFF]/70 border border-[#DDD7F3] rounded-xl text-sm font-black text-[#5B21B6] outline-none cursor-not-allowed" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1.5">Auto-calculated from selected class subjects.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Progress Card Settings Card */}
            <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] p-6 sm:p-7">
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-indigo-50">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3] border border-pink-100 text-pink-600 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#1E1B4B]">Progress Card Images & Branding</h2>
                  <p className="text-[11px] font-bold text-slate-500">Displayed on printed Admit Cards & Student Progress Report Cards</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100/80 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">School Logo</label>
                    {logoUrl && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Uploaded</span>}
                  </div>
                  <div className="h-20 bg-white rounded-xl border border-dashed border-indigo-200 flex items-center justify-center p-2">
                    {logoUrl ? (
                      <img src={resolveUrl(logoUrl)} alt="Logo" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">No Logo</span>
                    )}
                  </div>
                  <label className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100/80 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">Principal Sign</label>
                    {signatureUrl && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Uploaded</span>}
                  </div>
                  <div className="h-20 bg-white rounded-xl border border-dashed border-indigo-200 flex items-center justify-center p-2">
                    {signatureUrl ? (
                      <img src={resolveUrl(signatureUrl)} alt="Principal Sign" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">No Signature</span>
                    )}
                  </div>
                  <label className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Upload Sign
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-indigo-100/80 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">Teacher Sign</label>
                    {teacherSignatureUrl && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Uploaded</span>}
                  </div>
                  <div className="h-20 bg-white rounded-xl border border-dashed border-indigo-200 flex items-center justify-center p-2">
                    {teacherSignatureUrl ? (
                      <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Sign" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">No Signature</span>
                    )}
                  </div>
                  <label className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" /> Upload Sign
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacherSignature')} />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Subjects & Max Marks Matrix Card */}
            <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-5 border-b border-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#1E1B4B]">Subjects & Max Marks Matrix</h2>
                    <p className="text-[11px] font-bold text-slate-500">Pick a class tab to configure timetable dates & subject max marks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {examClassIds.length === 0 ? (
                  <div className="py-12 text-center bg-[#F8FAFF] border-2 border-dashed border-[#DDD7F3] rounded-2xl">
                    <Layers className="w-9 h-9 text-indigo-300 mx-auto mb-2.5" />
                    <h3 className="text-sm font-black text-[#1E1B4B]">No Classes Selected Yet</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm mx-auto">
                      Choose one or more classes from the Assign Classes panel on the right to configure subjects and max marks.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Class Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {[...examClassIds].sort((idA, idB) => {
                        const clsA = classes.find(c => c.id === idA);
                        const clsB = classes.find(c => c.id === idB);
                        const orderA = getClassOrderIndex(clsA?.name || '');
                        const orderB = getClassOrderIndex(clsB?.name || '');
                        if (orderA !== orderB) return orderA - orderB;
                        return (clsA?.section || '').localeCompare(clsB?.section || '');
                      }).map((cId) => {
                        const clsCfg = classConfigs[cId];
                        const isActive = activeClassTab === cId;
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => setActiveClassTab(cId)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white border-[#5B21B6] shadow-md shadow-indigo-500/20'
                                : 'bg-[#F8FAFF] text-slate-700 border-indigo-100 hover:bg-indigo-50/70'
                            }`}
                          >
                            <span>{clsCfg?.className || cId}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isActive ? 'bg-white/20 text-white' : 'bg-white text-indigo-700 border border-indigo-100'
                            }`}>
                              {clsCfg?.subjects?.length || 0} subs
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Class Subjects Editor */}
                    {activeClassConfig && (
                      <div className="bg-[#F8FAFF] rounded-2xl border border-[#DDD7F3] p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 pb-3.5 border-b border-indigo-100">
                          <div>
                            <h3 className="text-sm font-black text-[#1E1B4B] flex items-center gap-2">
                              <span>{activeClassConfig.className} Timetable & Marks</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3] text-[11px] font-black">
                                Total: {activeClassTotalMarks}M
                              </span>
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyClassConfigToAll(activeClassTab)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy these exact subjects and marks to all other selected classes"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy to All Classes
                            </button>
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-indigo-100">
                              <input
                                type="number"
                                min={1}
                                value={bulkMarksInput}
                                onChange={(e) => setBulkMarksInput(Number(e.target.value))}
                                placeholder="Marks"
                                className="w-12 px-1 py-0.5 bg-transparent text-[11px] font-black text-slate-800 text-center outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyBulkMarksToClass(activeClassTab, bulkMarksInput)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer"
                              >
                                Apply
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkMarksToClass(activeClassTab, 50)}
                              className="bg-white hover:bg-indigo-50 border border-indigo-100 text-slate-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                            >
                              50M
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkMarksToClass(activeClassTab, 100)}
                              className="bg-white hover:bg-indigo-50 border border-indigo-100 text-slate-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                            >
                              100M
                            </button>
                            <button
                              type="button"
                              onClick={() => addSubjectToClass(activeClassTab)}
                              className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Subject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearClassSubjects(activeClassTab)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {activeClassConfig.subjects.map((sub, i) => {
                            const hasMarks = fullExamMarks && fullExamMarks.some((m: any) =>
                              m.student?.classId === activeClassTab &&
                              (m.subject?.name?.toUpperCase().trim() === sub.name?.toUpperCase().trim() ||
                               m.subjectId === sub.id || m.subject?.id === sub.id)
                            );
                            return (
                              <div key={sub.id || i} className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-indigo-100/80 shadow-xs relative group items-center">
                                <div className="flex-1 w-full">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Name</label>
                                    {hasMarks && (
                                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                        Marks Entered (Protected)
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    value={sub.name}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'name', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-[#5B21B6] focus:bg-white uppercase"
                                  />
                                </div>
                                <div className="w-full sm:w-36">
                                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Exam Date</label>
                                  <input
                                    type="date"
                                    value={sub.date || ''}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'date', e.target.value)}
                                    className="w-full px-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#5B21B6] focus:bg-white"
                                  />
                                </div>
                                <div className="w-full sm:w-28">
                                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Max Marks</label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    value={sub.maxMarks}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'maxMarks', Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-[#F2EDFF]/50 border border-[#DDD7F3] rounded-xl text-xs font-black text-[#5B21B6] text-center outline-none focus:border-[#5B21B6] focus:bg-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSubjectFromClass(activeClassTab, i)}
                                  disabled={hasMarks}
                                  className={`p-2 rounded-xl transition-colors sm:mt-4 cursor-pointer ${
                                    hasMarks
                                      ? 'text-slate-300 cursor-not-allowed opacity-40'
                                      : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title={hasMarks ? 'Cannot remove this subject as marks are entered' : 'Remove Subject'}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}

                          {activeClassConfig.subjects.length === 0 && (
                            <div className="py-8 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-dashed border-indigo-100">
                              No subjects configured for this class. Click "Add Subject" above.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Classes Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] p-6 sticky top-6">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-indigo-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border border-amber-200 text-amber-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1E1B4B]">Assign Classes</h2>
                    <p className="text-[11px] font-bold text-slate-500">
                      {examClassIds.length} of {classes.length} selected
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="px-3 py-1.5 rounded-xl bg-[#F2EDFF] hover:bg-indigo-100 text-[#5B21B6] text-[11px] font-black transition-colors cursor-pointer"
                >
                  {examClassIds.length === classes.length ? 'Clear All' : 'Select All'}
                </button>
              </div>

              {/* Search Classes */}
              <div className="relative my-3.5">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Filter classes..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {classes
                  .filter(c => !classSearch.trim() || `${c.name} ${c.section}`.toLowerCase().includes(classSearch.trim().toLowerCase()))
                  .map(c => {
                    const isSelected = examClassIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleClassToggle(c.id)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-[#7C3AED] bg-gradient-to-r from-[#F5F3FF] to-[#EEF2FF] shadow-xs'
                            : 'border-slate-100 bg-[#FAFBFF] hover:border-indigo-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#5B21B6] border-[#5B21B6]' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm font-black ${isSelected ? 'text-[#1E1B4B]' : 'text-slate-700'}`}>
                            {c.name} - {c.section}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                          isSelected ? 'bg-white text-[#5B21B6] border-[#DDD7F3]' : 'bg-white text-slate-500 border-slate-200/70'
                        }`}>
                          {c._count?.students || 0} pupils
                        </span>
                      </div>
                    );
                  })}

                {classes.length === 0 && (
                  <div className="py-8 text-center text-xs font-bold text-slate-400">
                    Loading classes or none available...
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-indigo-50 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'Saving Configuration...' : (
                    <>
                      <Save className="w-4 h-4" />
                      {editExam && !isDuplicate ? 'Save Exam Changes' : 'Create Examination'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/exams?tab=examination')}
                  className="w-full py-3 bg-[#F8FAFF] border border-indigo-100 hover:bg-indigo-50/70 text-slate-600 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamPage;
