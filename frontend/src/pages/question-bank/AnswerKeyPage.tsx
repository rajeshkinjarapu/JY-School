import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key } from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';

export const AnswerKeyPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/exams?tab=question-papers', { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Answer Key" icon={<Key className="w-5 h-5" />} />
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500">Redirecting to Exams Module...</p>
      </div>
    </div>
  );
};

export default AnswerKeyPage;
