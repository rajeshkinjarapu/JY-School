import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, Save, ArrowLeft, FileText, Upload, Copy } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

const ManageExamQuestions = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // AI Generation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiInstructions, setAiInstructions] = useState('Generate 10 multiple choice questions suitable for a 10th-grade exam.');
  const [file, setFile] = useState<File | null>(null);
  
  // Manual Entry States
  const [manualQuestion, setManualQuestion] = useState<Question>({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('instructions', aiInstructions);
      if (aiPrompt) formData.append('prompt', aiPrompt);
      if (file) formData.append('file', file);

      const res = await api.post('/online-exams/generate-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success && Array.isArray(res.data.data)) {
        setQuestions([...questions, ...res.data.data]);
        toast.success(`Generated ${res.data.data.length} questions successfully!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate questions using AI');
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const addManualQuestion = () => {
    if (!manualQuestion.questionText || !manualQuestion.correctAnswer || manualQuestion.options.some(o => !o)) {
      toast.error("Please fill all fields and options");
      return;
    }
    
    if (!manualQuestion.options.includes(manualQuestion.correctAnswer)) {
      toast.error("Correct answer must exactly match one of the options");
      return;
    }

    setQuestions([...questions, manualQuestion]);
    setManualQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1
    });
    toast.success("Question added locally. Click 'Save Exam Questions' to upload.");
  };

  const saveQuestionsToBackend = async () => {
    if (questions.length === 0) {
      toast.error("No questions to save");
      return;
    }

    try {
      const res = await api.post(`/online-exams/${id}/questions`, { questions });
      if (res.data.success) {
        toast.success("Questions saved to exam successfully!");
        navigate('/online-exams');
      }
    } catch (error) {
      toast.error('Failed to save questions');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/online-exams')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Manage Exam Questions
          </h2>
          <p className="text-muted-foreground mt-1">
            Add questions manually or generate them using Gemini AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Builder */}
        <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Add Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Generator
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" /> Manual Entry
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai" className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-600" /> AI Instructions (Prompt)</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={aiInstructions}
                      onChange={e => setAiInstructions(e.target.value)}
                      placeholder="e.g. Generate 10 tough MCQ questions on Indian History for Class 10."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 border p-3 rounded bg-white">
                      <Label className="flex items-center gap-2"><Copy className="h-4 w-4 text-blue-500" /> Copy Paste Source Text</Label>
                      <textarea 
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Paste Wikipedia article or notes here..."
                      />
                    </div>
                    <div className="space-y-2 border p-3 rounded bg-white">
                      <Label className="flex items-center gap-2"><Upload className="h-4 w-4 text-green-500" /> Upload File (PDF/Doc)</Label>
                      <Input 
                        type="file" 
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="mt-2 cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload a syllabus document or chapter PDF and the AI will extract questions from it.
                      </p>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-primary hover:opacity-90" 
                    onClick={handleAiGenerate}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <span className="flex items-center"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating Magic...</span>
                    ) : (
                      <span className="flex items-center"><Sparkles className="mr-2 h-4 w-4" /> Generate with Gemini AI</span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-3">
                  <Label>Question Text</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                    value={manualQuestion.questionText}
                    onChange={e => setManualQuestion({...manualQuestion, questionText: e.target.value})}
                    placeholder="Enter question here"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    {manualQuestion.options.map((opt, i) => (
                      <div key={i} className="space-y-1">
                        <Label>Option {i + 1}</Label>
                        <Input 
                          value={opt} 
                          onChange={e => {
                            const newOptions = [...manualQuestion.options];
                            newOptions[i] = e.target.value;
                            setManualQuestion({...manualQuestion, options: newOptions});
                          }} 
                          placeholder={`Option ${i + 1}`} 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Correct Answer (Must match an option exactly)</Label>
                      <Input 
                        value={manualQuestion.correctAnswer} 
                        onChange={e => setManualQuestion({...manualQuestion, correctAnswer: e.target.value})} 
                        placeholder="Correct Answer" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Marks</Label>
                      <Input 
                        type="number" 
                        value={manualQuestion.marks} 
                        onChange={e => setManualQuestion({...manualQuestion, marks: parseInt(e.target.value)})} 
                      />
                    </div>
                  </div>

                  <Button className="w-full mt-2" onClick={addManualQuestion}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Question to List
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Side: Preview */}
        <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm flex flex-col max-h-[80vh]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Preview Questions ({questions.length})</CardTitle>
              <CardDescription>Review generated/added questions before saving.</CardDescription>
            </div>
            <Button onClick={saveQuestionsToBackend} disabled={questions.length === 0} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> Save Exam Questions
            </Button>
          </CardHeader>
          <CardContent className="overflow-y-auto flex-1 space-y-4 mt-2">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p>No questions added yet.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-white shadow-sm relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={() => {
                      const newQ = [...questions];
                      newQ.splice(idx, 1);
                      setQuestions(newQ);
                    }}
                  >
                    &times;
                  </Button>
                  <p className="font-semibold mb-2">Q{idx + 1}. {q.questionText}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-2 rounded border ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 font-medium text-green-800' : 'bg-gray-50'}`}>
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground text-right font-medium">
                    Marks: {q.marks}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ManageExamQuestions;
