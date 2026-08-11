import React, { useState, useEffect, useMemo } from 'react';
import { Key, Save, CheckCircle2, AlertTriangle, FileText, ChevronDown, ListOrdered, Sparkles, Printer } from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

interface GeneratedPaper {
  id: string;
  examName: string;
  examClass?: string;
  examSubject: string;
  examDate: string;
  time: string;
  content: string;
}

interface Answer {
  qNo: number;
  answer: string;
  subject?: string;
}

export const AnswerKeyManager = ({ prefilledPaperId }: { prefilledPaperId?: string | null }) => {
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const geminiApiKey = typeof window !== 'undefined' ? localStorage.getItem('jy_gemini_api_key') : '';

  useEffect(() => {
    fetchPapers();
  }, []);

  useEffect(() => {
    if (prefilledPaperId && papers.length > 0 && !selectedPaperId) {
      setSelectedPaperId(prefilledPaperId);
      const paper = papers.find(p => p.id === prefilledPaperId);
      if (paper) {
        let c = 'General';
        if (paper.examClass) {
          c = paper.examClass;
        } else {
          const cMatch = paper.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
          c = cMatch ? cMatch[1] : 'General';
        }
        setSelectedClass(c);
      }
    }
  }, [prefilledPaperId, papers]);

  useEffect(() => {
    if (selectedPaperId) {
      loadPaperAndAnswerKey(selectedPaperId);
    } else {
      setAnswers([]);
    }
  }, [selectedPaperId]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/generated-papers');
      setPapers(res.data);
    } catch (error) {
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  // Extract classes
  const classes = useMemo(() => {
    const classSet = new Set<string>();
    papers.forEach(p => {
      if (p.examClass) {
        classSet.add(p.examClass);
      } else {
        // Fallback for old papers
        const match = p.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
        if (match) classSet.add(match[1]);
        else classSet.add('General');
      }
    });
    return Array.from(classSet).sort();
  }, [papers]);

  // Extract subjects from headings in paper content
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    papers.forEach(p => {
      let c = 'General';
      if (p.examClass) {
        c = p.examClass;
      } else {
        const cMatch = p.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
        c = cMatch ? cMatch[1] : 'General';
      }
      
      if (!selectedClass || c === selectedClass) {
        // Extract headings like "## Biology"
        const headingRegex = /^##\s*(.+)$/gm;
        let match;
        let foundHeading = false;
        while ((match = headingRegex.exec(p.content)) !== null) {
          subjectSet.add(match[1].trim());
          foundHeading = true;
        }
        
        // Fallback to examSubject if no headings found
        if (!foundHeading && p.examSubject) {
          subjectSet.add(p.examSubject);
        }
      }
    });
    return Array.from(subjectSet).sort();
  }, [papers, selectedClass]);

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      let c = 'General';
      if (p.examClass) {
        c = p.examClass;
      } else {
        const cMatch = p.examName.match(/(\d+(th|st|nd|rd)\s+Class)/i);
        c = cMatch ? cMatch[1] : 'General';
      }
      
      const classMatch = selectedClass ? c === selectedClass : true;
      
      let sectionMatch = true;
      if (selectedSection) {
        const sectionRegex = new RegExp(`\\b${selectedSection}\\b|-${selectedSection}\\b`, 'i');
        sectionMatch = sectionRegex.test(p.examName) || (p.examClass ? sectionRegex.test(p.examClass) : false);
      }
      
      let subjMatch = true;
      if (selectedSubject && selectedSubject !== 'All Subjects' && selectedSubject !== 'All Subjects / Grand Test') {
        const escapedSubject = selectedSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const headingRegex = new RegExp(`^##\\s*${escapedSubject}\\s*$`, 'im');
        const hasHeading = headingRegex.test(p.content);
        const isExamSubject = p.examSubject === selectedSubject;
        subjMatch = hasHeading || isExamSubject;
      }
      
      return classMatch && sectionMatch && subjMatch;
    });
  }, [papers, selectedClass, selectedSection, selectedSubject]);

  const parseQuestionsWithSubjects = (content: string): { qNo: number, subject: string }[] => {
    const lines = content.split('\n');
    let currentSubject = 'General';
    const questions: { qNo: number, subject: string }[] = [];
    
    for (const line of lines) {
      const headingMatch = line.match(/^##\s*(.+)/);
      if (headingMatch) {
        currentSubject = headingMatch[1].trim();
        continue;
      }
      
      const match = line.match(/^(\d+)[\.\)]\s/);
      if (match) {
        const num = parseInt(match[1], 10);
        questions.push({ qNo: num, subject: currentSubject });
      }
    }
    
    // Sort and remove duplicates in case of bad formatting
    const unique = new Map();
    questions.forEach(q => {
      if (!unique.has(q.qNo)) unique.set(q.qNo, q);
    });
    
    return Array.from(unique.values()).sort((a, b) => a.qNo - b.qNo);
  };

  const loadPaperAndAnswerKey = async (paperId: string) => {
    try {
      setLoading(true);
      
      const paper = papers.find(p => p.id === paperId);
      if (!paper) return;

      const parsedQuestions = parseQuestionsWithSubjects(paper.content);
      
      const initialAnswers: Answer[] = parsedQuestions.map(q => ({
        qNo: q.qNo,
        answer: '',
        subject: q.subject
      }));

      try {
        const res = await api.get(`/api/answer-keys/${paperId}`);
        if (res.data && res.data.answers) {
          const dbAnswers: Answer[] = res.data.answers;
          dbAnswers.forEach(dbA => {
            const index = initialAnswers.findIndex(ia => ia.qNo === dbA.qNo);
            if (index !== -1) {
              initialAnswers[index].answer = dbA.answer || '';
            } else {
              initialAnswers.push(dbA);
            }
          });
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Failed to fetch existing answer key");
        }
      }

      setAnswers(initialAnswers.sort((a, b) => a.qNo - b.qNo));

      // Auto-trigger AI generation if no saved answers exist
      if (!hasAnswersInDB && initialAnswers.length > 0) {
        autoGenerateAI(paper, initialAnswers);
      }
    } catch (error) {
      toast.error('Failed to load answer key data');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateAI = async (paper: GeneratedPaper, currentAnswers: Answer[]) => {
    if (!geminiApiKey) return;
    try {
      setIsGeneratingAI(true);
      toast.loading('AI is reading the paper to auto-generate answers...', { id: 'ai-gen' });
      
      const prompt = `Extract the correct answers for the following multiple choice questions if possible. 
Return ONLY a valid JSON array of objects, where each object has "qNo" (number) and "answer" (string, e.g. "A", "B", "C", "D" or the exact text). 
If a question doesn't have a clear answer marked, leave "answer" as "".
Example: [{"qNo": 1, "answer": "A"}, {"qNo": 2, "answer": "B"}]

Questions:
${paper.content}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
         let text = data.candidates[0].content.parts[0].text;
         let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
         const match = cleanText.match(/\[[\s\S]*\]/);
         if (match) {
           cleanText = match[0];
         }
         let aiAnswers: Answer[] = JSON.parse(cleanText);
         
         setAnswers(prev => {
           const newAnswers = [...prev];
           aiAnswers.forEach(aiA => {
             const index = newAnswers.findIndex(a => a.qNo === aiA.qNo);
             if (index !== -1 && aiA.answer) {
               newAnswers[index] = { ...newAnswers[index], answer: aiA.answer };
             }
           });
           return newAnswers.sort((a, b) => a.qNo - b.qNo);
         });
         toast.success('AI Auto-generated answers! Please review and save.', { id: 'ai-gen', icon: '🤖' });
      }
    } catch(err) {
      console.error("AI Auto-gen error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPaperId) {
      toast.error('Please select a paper first');
      return;
    }
    try {
      setSaving(true);
      toast.loading('Saving Answer Key...', { id: 'save-ak' });
      await api.post('/api/answer-keys', {
        paperId: selectedPaperId,
        answers: answers
      });
      toast.success('Answer Key saved successfully!', { id: 'save-ak' });
    } catch (error) {
      toast.error('Failed to save answer key. Make sure the database is updated!', { id: 'save-ak' });
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedPaperId || !selectedPaper) return;
    if (!geminiApiKey) {
      toast.error('Gemini API Key is missing. Please set it in Exam Generator settings.', { id: 'ai-gen' });
      return;
    }

    try {
      setIsGeneratingAI(true);
      toast.loading('AI is reading the paper...', { id: 'ai-gen' });
      
      const prompt = `Extract the correct answers for the following multiple choice questions if possible. 
Return ONLY a valid JSON array of objects, where each object has "qNo" (number) and "answer" (string, e.g. "A", "B", "C", "D" or the exact text). 
If a question doesn't have a clear answer marked, leave "answer" as "".
Example: [{"qNo": 1, "answer": "A"}, {"qNo": 2, "answer": "B"}]

Questions:
${selectedPaper.content}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
         let text = data.candidates[0].content.parts[0].text;
         let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
         const match = cleanText.match(/\[[\s\S]*\]/);
         if (match) {
           cleanText = match[0];
         }
         let aiAnswers: Answer[] = JSON.parse(cleanText);
         
         // Merge AI answers into current answers
         setAnswers(prev => {
           const newAnswers = [...prev];
           aiAnswers.forEach(aiA => {
             const index = newAnswers.findIndex(a => a.qNo === aiA.qNo);
             if (index !== -1 && aiA.answer) {
               newAnswers[index] = { ...newAnswers[index], answer: aiA.answer };
             } else if (index === -1) {
               newAnswers.push(aiA);
             }
           });
           return newAnswers.sort((a, b) => a.qNo - b.qNo);
         });
         
         toast.success('Answers generated! Please review and click Save.', { id: 'ai-gen', icon: '🤖' });
      } else {
        toast.error('Failed to parse AI response.', { id: 'ai-gen' });
      }
    } catch(err) {
      console.error("AI Gen Error:", err);
      toast.error('Failed to generate answers.', { id: 'ai-gen' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAnswerChange = (qNo: number, value: string) => {
    setAnswers(prev => prev.map(a => a.qNo === qNo ? { ...a, answer: value } : a));
  };

  const selectedPaper = papers.find(p => p.id === selectedPaperId);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fade-in pb-16 min-h-[80vh] rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header & Filters */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 p-6 flex flex-col gap-5">

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px] flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={selectedPaperId}
                onChange={(e) => { setSelectedPaperId(e.target.value); }}
                className="appearance-none w-full pl-10 pr-10 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Select Exam Paper...</option>
                {filteredPapers.map(p => (
                  <option key={p.id} value={p.id}>{p.examName}</option>
                ))}
              </select>
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); }}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[150px] cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.filter(c => c !== 'General').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); }}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[150px] cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); }}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-[120px] cursor-pointer"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {selectedPaperId && (
              <>
                <button
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/25 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {isGeneratingAI ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="hidden sm:inline">AI Auto Generate</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500">Loading paper and answers...</p>
          </div>
        ) : !selectedPaperId ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/50 border border-slate-200 border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <Key className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-700">No Paper Selected</p>
            <p className="text-sm text-slate-400 mt-1">Please select an exam paper from the dropdown above.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden max-w-4xl mx-auto">
            <div className="flex items-center justify-between p-5 bg-indigo-50/50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <ListOrdered className="w-5 h-5 text-indigo-500" />
                <p className="text-sm font-bold text-slate-700">
                  <span className="text-indigo-600 font-black">{answers.length}</span> questions found for <span className="font-black text-slate-900">{selectedPaper?.examName}</span>.
                </p>
              </div>
            </div>
            
            {/* Table View */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-slate-500 w-24 text-center border-r border-slate-200">Q.No</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-slate-500">Correct Answer Option</th>
                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-slate-500 w-20 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.filter(a => !selectedSubject || selectedSubject === 'All Subjects' || selectedSubject === 'All Subjects / Grand Test' || a.subject === selectedSubject).map((ans, idx) => (
                    <tr key={ans.qNo} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="py-3 px-6 text-sm font-black text-slate-700 text-center border-r border-slate-100">
                        {ans.qNo}
                        {ans.subject && selectedSubject === '' && <div className="text-[9px] font-bold text-slate-400 leading-tight mt-0.5 max-w-[80px] mx-auto truncate" title={ans.subject}>{ans.subject}</div>}
                      </td>
                      <td className="py-3 px-6">
                        <div className="relative max-w-[200px]">
                          <select
                            value={ans.answer}
                            onChange={(e) => handleAnswerChange(ans.qNo, e.target.value)}
                            className="appearance-none w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">- Select -</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="BONUS">BONUS / ADD SCORE</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {ans.answer ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Save Button at Bottom */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3">
              
              <button
                onClick={handleSave}
                disabled={!selectedPaperId || saving}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Answer Key
              </button>
            </div>

            
          </div>
        )}
      </div>
    </div>
  );
};
