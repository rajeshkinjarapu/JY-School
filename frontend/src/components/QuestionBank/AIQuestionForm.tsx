import React, { useState } from 'react';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from './LaTeXPreview';
import { Sparkles, AlertCircle, Loader2, Save } from 'lucide-react';

interface AIQuestionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AIQuestionForm: React.FC<AIQuestionFormProps> = ({ onSuccess, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text to parse.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.parseQuestionsWithAI(inputText, subject);
      if (res.questions && res.questions.length > 0) {
        setParsedQuestions(res.questions);
      } else {
        setError('No questions could be extracted from the text.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to parse with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (parsedQuestions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.bulkCreateQuestions(parsedQuestions);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save questions in bulk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full text-white grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col h-[calc(100vh-120px)]">
        <h2 className="text-xl font-bold mb-4 text-white drop-shadow-md flex items-center gap-2">
          <Sparkles className="text-yellow-300 w-6 h-6" />
          Add Questions with AI
        </h2>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-white/90">Preferred Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:border-white/50"
          >
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>

        <div className="flex-1 flex flex-col mb-4">
          <label className="block text-sm font-medium mb-1 text-white/90">Paste your questions or give instructions</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="E.g. Create 3 physics questions from Electrostatics. OR Just paste raw text of questions."
            className="w-full flex-1 bg-slate-900/50 border border-white/20 rounded-lg p-3 text-white font-sans focus:outline-none focus:border-white/50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:brightness-110 font-bold text-slate-900 rounded-lg text-sm shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Parse with AI'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            Live Preview ({parsedQuestions.length} Questions)
          </h2>
          {parsedQuestions.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {parsedQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/50 text-sm">
              Waiting for AI extraction...
            </div>
          ) : (
            parsedQuestions.map((q, idx) => (
              <div key={idx} className="bg-white text-black p-6 rounded-xl border border-slate-300 font-serif text-[15px] shadow-lg">
                <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2 mb-4 font-sans text-slate-500">
                  <div>SUBJECT: <span className="font-semibold text-indigo-700 uppercase">{q.subject}</span></div>
                  <div>CHAPTER: <span className="font-semibold text-slate-800 uppercase">{q.chapter || '—'}</span></div>
                  <div>TOPIC: <span className="font-semibold text-slate-800 uppercase">{q.topic || '—'}</span></div>
                </div>

                <div className="mb-4 leading-relaxed">
                  <span className="font-sans font-bold mr-2 text-[14px]">Q{idx + 1}.</span>
                  <LaTeXPreview text={q.questionText || ''} className="inline-block" />
                </div>

                {q.type?.startsWith('MCQ') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm font-sans">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const optName = 'option' + letter;
                      const optionText = q[optName] || '';
                      return (
                        <div key={letter} className="flex items-start gap-2 p-1">
                          <span className="font-bold">({letter})</span>
                          <LaTeXPreview text={String(optionText)} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'NUMERICAL' && (
                  <div className="mt-4 p-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 font-sans">
                    [Numerical Value. Correct: <span className="font-mono font-bold text-black">{q.correctAnswer}</span>]
                  </div>
                )}

                <div className="mt-6 border-t border-slate-200 pt-4 font-sans">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                    <div>Correct Key: <span className="font-bold text-emerald-600 font-mono text-[13px]">{q.correctAnswer}</span></div>
                    <div>Difficulty: <span className="font-bold text-slate-700">{q.difficulty}</span></div>
                    <div>Type: <span className="font-bold text-slate-700">{q.type}</span></div>
                  </div>

                  <div className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded border border-emerald-100 leading-relaxed">
                    <span className="font-bold text-emerald-800">Explanation:</span>{' '}
                    <LaTeXPreview text={q.solution || 'No explanation provided.'} className="mt-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
