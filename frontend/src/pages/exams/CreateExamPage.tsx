import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Edit3, Calendar, FileText, CheckCircle, Hash, Layers, RefreshCw, Copy, Upload } from 'lucide-react';
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

  const [classes, setClasses] = useState<any[]>([]);
  const [allDbSubjects, setAllDbSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [examName, setExamName] = useState(editExam?.name || '');
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
        api.get(`/api/exams/${editExam.id}`),
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
          
          // 1. If marks exist for this class, that is 100% verified ground truth!
          if (marksByClass[cId] && marksByClass[cId].size > 0) {
            const subs = Array.from(marksByClass[cId].values());
            subs.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
            cfgMap[cId] = {
              classId: cId,
              className: clsName,
              subjects: subs
            };
            return;
          }

          // 2. If saved classConfigs exists
          if (parsedSubjects?.classConfigs && Array.isArray(parsedSubjects.classConfigs)) {
            const savedCfg = parsedSubjects.classConfigs.find((c: any) => c.classId === cId);
            if (savedCfg && Array.isArray(savedCfg.subjects) && savedCfg.subjects.length > 0) {
              const masterClassSubs = masterDbSubjects.filter((s: any) => s.classId === cId);
              const isCorruptedDefaultFour = savedCfg.subjects.length === 4 && 
                savedCfg.subjects.some((s: any) => s.name === 'ENGLISH') &&
                savedCfg.subjects.some((s: any) => s.name === 'MATHEMATICS') &&
                savedCfg.subjects.some((s: any) => s.name === 'SCIENCE') &&
                savedCfg.subjects.some((s: any) => s.name === 'SOCIAL');

              // If it's not the generic 4 defaults, or if master db has no subjects, trust it
              if (!isCorruptedDefaultFour || masterClassSubs.length === 0) {
                const dedupedSubs: any[] = [];
                const seen = new Set<string>();
                savedCfg.subjects.forEach((s: any) => {
                  const canon = getCanonicalSubjectName(s.name);
                  if (!seen.has(canon)) {
                    seen.add(canon);
                    dedupedSubs.push({ ...s, name: canon });
                  }
                });
                dedupedSubs.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
                cfgMap[cId] = {
                  ...savedCfg,
                  subjects: dedupedSubs
                };
                return;
              }
            }
          }

          // 3. Fallback: Load real school master subjects configured for this class!
          const dbSubsForClass = masterDbSubjects.filter((s: any) => s.classId === cId);
          if (dbSubsForClass.length > 0) {
            const dedupedDbSubs: any[] = [];
            const seenDb = new Set<string>();
            dbSubsForClass.forEach((s: any) => {
              const canon = getCanonicalSubjectName(s.name);
              if (!seenDb.has(canon)) {
                seenDb.add(canon);
                dedupedDbSubs.push({
                  id: s.id,
                  name: canon,
                  maxMarks: Number(fullExam?.maxMarks) || 50,
                  date: fullExam?.examDate ? new Date(fullExam.examDate).toISOString().split('T')[0] : examDate
                });
              }
            });
            dedupedDbSubs.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
            cfgMap[cId] = {
              classId: cId,
              className: clsName,
              subjects: dedupedDbSubs
            };
            return;
          }

          // 4. If old exam had flat array of subjects
          if (Array.isArray(parsedSubjects) && parsedSubjects.length > 0) {
            const dedupedOldSubs: any[] = [];
            const seenOld = new Set<string>();
            parsedSubjects.forEach((s: any) => {
              const canon = getCanonicalSubjectName(s.name);
              if (!seenOld.has(canon)) {
                seenOld.add(canon);
                dedupedOldSubs.push({
                  id: s.id || Date.now().toString() + Math.random(),
                  name: canon,
                  maxMarks: s.maxMarks || 50,
                  date: s.date || examDate
                });
              }
            });
            dedupedOldSubs.sort((a, b) => getSubjectSortWeight(a.name) - getSubjectSortWeight(b.name));
            cfgMap[cId] = {
              classId: cId,
              className: clsName,
              subjects: dedupedOldSubs
            };
            return;
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
      if (editExam?.id) {
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
        toast.success('Exam created successfully!');
      }
      navigate('/exams');
    } catch (err: any) {
      toast.error(err.message || 'Error saving exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 animate-fade-in" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={editExam ? 'Edit Exam Configuration' : 'Create New Exam'}
        icon={
          <button 
            type="button"
            onClick={() => navigate('/exams')}
            className="text-white hover:text-indigo-200 transition-colors cursor-pointer flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleCreateExam} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950/50 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </span>
                General Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Exam Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'JEE' ? 'border-amber-500 bg-amber-50/40 text-amber-900 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                      <input type="radio" name="examCategory" value="JEE" checked={examCategory === 'JEE'} onChange={() => { setExamCategory('JEE'); setBoardExamType(''); setExamName('JEE Mains Model Examination'); }} className="w-5 h-5 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      <div>
                        <div className="text-sm font-black text-slate-800">JEE Mains Exams</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">Objective patterns</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'BOARD' ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                      <input type="radio" name="examCategory" value="BOARD" checked={examCategory === 'BOARD'} onChange={() => { setExamCategory('BOARD'); setExamName(''); }} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      <div>
                        <div className="text-sm font-black text-slate-800">Board Exams</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">FA / SA / Finals</div>
                      </div>
                    </label>
                  </div>
                </div>

                {examCategory === 'BOARD' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Board Exam Type</label>
                    <select value={boardExamType} onChange={(e) => { setBoardExamType(e.target.value); setExamName(e.target.value + ' Examination'); }} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm">
                      <option value="">Select Board Exam Type...</option>
                      {['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2', 'Pre-Final'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Exam Name / Title</label>
                  <input type="text" required placeholder="e.g. Formative Assessment - 1" value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Exam Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="date" required value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Mode Total Max Marks</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="number" readOnly value={activeClassTotalMarks} className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-500 outline-none shadow-sm cursor-not-allowed" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-2">Auto-calculated from class subjects.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Card Settings Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6">
                <span className="p-1.5 bg-pink-50 text-pink-600 rounded-lg dark:bg-pink-950/50 dark:text-pink-400">
                  <FileText className="w-5 h-5" />
                </span>
                Progress Card Images (Logo & Signatures)
              </h2>
              <p className="text-xs font-bold text-slate-500 mb-6">These images will be displayed on the progress cards generated for this exam.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">School Logo</label>
                  <div className="flex flex-col items-start gap-3">
                    {logoUrl ? (
                      <img src={resolveUrl(logoUrl)} alt="Logo" className="h-14 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    ) : (
                      <div className="h-14 w-14 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">No Logo</div>
                    )}
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Principal Signature</label>
                  <div className="flex flex-col items-start gap-3">
                    {signatureUrl ? (
                      <img src={resolveUrl(signatureUrl)} alt="Principal Sign" className="h-14 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    ) : (
                      <div className="h-14 w-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 text-center">No Sign</div>
                    )}
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Upload Sign
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Teacher Signature</label>
                  <div className="flex flex-col items-start gap-3">
                    {teacherSignatureUrl ? (
                      <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Sign" className="h-14 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    ) : (
                      <div className="h-14 w-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 text-center">No Sign</div>
                    )}
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Upload Sign
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacherSignature')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5">
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-950/50 dark:text-emerald-400">
                      <Edit3 className="w-5 h-5" />
                    </span>
                    Subjects & Max Marks Configuration
                  </h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Select a class tab below to customize subjects, exam dates, and max marks for that class.
                  </p>
                </div>
              </div>

              {/* CLASS-WISE SUBJECTS MODE */}
              <div className="space-y-6">
                {examClassIds.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-[2rem]">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-black text-slate-700">No Classes Selected</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Select classes from the right sidebar to view and customize their subjects.
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
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border shrink-0 ${
                              isActive
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{clsCfg?.className || cId}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {clsCfg?.subjects?.length || 0} subs
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Class Subjects Editor */}
                    {activeClassConfig && (
                      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                          <div>
                            <h3 className="text-sm font-black text-slate-800">
                              {activeClassConfig.className} Subjects
                            </h3>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                              Total Class Max Marks: <span className="text-indigo-600 font-black">{activeClassTotalMarks} Marks</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyClassConfigToAll(activeClassTab)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] font-black shadow-sm flex items-center gap-1"
                              title="Copy these exact subjects and marks to all other selected classes"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy to All Classes
                            </button>
                            <div className="flex items-center gap-2 border-l border-slate-300 pl-2 ml-1">
                              <input
                                type="number"
                                min={1}
                                value={bulkMarksInput}
                                onChange={(e) => setBulkMarksInput(Number(e.target.value))}
                                placeholder="Marks"
                                className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 text-center outline-none focus:border-indigo-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyBulkMarksToClass(activeClassTab, bulkMarksInput)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm"
                              >
                                Apply to Class
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkMarksToClass(activeClassTab, 50)}
                              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm"
                            >
                              Set All 50M
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyBulkMarksToClass(activeClassTab, 100)}
                              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm"
                            >
                              Set All 100M
                            </button>
                            <button
                              type="button"
                              onClick={() => addSubjectToClass(activeClassTab)}
                              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Subject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearClassSubjects(activeClassTab)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {activeClassConfig.subjects.map((sub, i) => {
                            const hasMarks = fullExamMarks && fullExamMarks.some((m: any) => 
                              m.student?.classId === activeClassTab && 
                              (m.subject?.name?.toUpperCase().trim() === sub.name?.toUpperCase().trim() ||
                               m.subjectId === sub.id || m.subject?.id === sub.id)
                            );
                            return (
                              <div key={sub.id || i} className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-sm relative group items-center">
                                <div className="flex-1 w-full">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Name</label>
                                    {hasMarks && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                        🔒 Marks Entered (Protected)
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    value={sub.name}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'name', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white uppercase"
                                  />
                                </div>
                                <div className="w-full sm:w-36">
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Exam Date</label>
                                  <input
                                    type="date"
                                    value={sub.date || ''}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'date', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
                                  />
                                </div>
                                <div className="w-full sm:w-28">
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Max Marks</label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    value={sub.maxMarks}
                                    onChange={(e) => updateSubjectInClass(activeClassTab, i, 'maxMarks', Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 text-center outline-none focus:border-indigo-400 focus:bg-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSubjectFromClass(activeClassTab, i)}
                                  disabled={hasMarks}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    hasMarks 
                                      ? 'text-slate-300 cursor-not-allowed opacity-40' 
                                      : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  title={hasMarks ? 'Cannot remove this subject as marks are entered' : 'Remove Subject'}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}

                          {activeClassConfig.subjects.length === 0 && (
                            <div className="py-8 text-center text-xs font-bold text-slate-400">
                              No subjects for this class. Click "Add Subject" to add one.
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
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8 sticky top-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5">
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg dark:bg-amber-950/50 dark:text-amber-400">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                  Assign Classes
                </h2>
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  {examClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-6 pl-9">
                Select which classes will take this exam.
              </p>
              
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(c => {
                  const isSelected = examClassIds.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleClassToggle(c.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <div className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {c.name} - {c.section}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                        {c._count?.students || 0} students
                      </div>
                    </div>
                  );
                })}
                
                {classes.length === 0 && (
                  <div className="py-8 text-center text-xs font-semibold text-slate-500">
                    Loading classes or none available...
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-5 h-5" /> 
                      {editExam ? 'Save Changes' : 'Create Exam'}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/exams')}
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center"
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
