import React from 'react';
import { Key } from 'lucide-react';
import { PageHeader } from '../../components/UI/PageHeader';
import { AnswerKeyManager } from '../../components/QuestionBank/AnswerKeyManager';

export const AnswerKeyPage = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader
        title="Answer Key"
        icon={<Key className="w-5 h-5" />}
      />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <AnswerKeyManager prefilledPaperId={null} />
        </div>
      </div>
    </div>
  );
};

export default AnswerKeyPage;
