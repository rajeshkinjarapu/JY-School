import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, RefreshCw, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import CreateOnlineExamModal from './CreateOnlineExamModal';
import api from '@/lib/api';

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
      const res = await api.get('/online-exams/admin');
      if (res.data.success) {
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
      await api.put(`/online-exams/${id}/publish`);
      fetchExams();
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Online Exams
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage online quizzes and AI generated exams.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchExams} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center p-12 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Exams Found</h3>
              <p className="text-muted-foreground mb-6">You haven't created any online exams yet.</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>Create Your First Exam</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
                  <div className={`h-2 ${exam.isPublished ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg line-clamp-1" title={exam.title}>{exam.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exam.class.name} {exam.class.section} • {exam.subject.name}
                        </p>
                      </div>
                      <Badge variant={exam.isPublished ? 'success' : 'outline'} className={exam.isPublished ? 'bg-green-100 text-green-800' : 'text-orange-600 border-orange-200'}>
                        {exam.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-muted/30 p-3 rounded-lg">
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-medium">{exam.duration} mins</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Marks</p>
                        <p className="font-medium">{exam.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Questions</p>
                        <p className="font-medium">{exam._count.questions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Submissions</p>
                        <p className="font-medium">{exam._count.submissions}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/online-exams/${exam.id}/manage`)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Manage
                      </Button>
                      {!exam.isPublished && (
                        <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handlePublish(exam.id)}>
                          Publish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
