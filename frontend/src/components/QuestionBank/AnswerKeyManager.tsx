import React from 'react';
import { Key, Construction } from 'lucide-react';

export const AnswerKeyManager = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-slate-500 bg-white/50 backdrop-blur-sm rounded-3xl m-4 border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
        <Key className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">Answer Key Management</h3>
      <p className="text-slate-500 text-center max-w-sm mb-6 flex items-center justify-center gap-2">
        <Construction className="w-4 h-4 text-amber-500" />
        This feature is currently under development. You will soon be able to generate and manage answer keys here.
      </p>
    </div>
  );
};
