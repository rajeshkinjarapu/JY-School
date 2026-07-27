import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

export const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addField = (type: string) => {
    setFields([...fields, { 
      id: Date.now().toString(), 
      type, 
      label: `New ${type} Field`, 
      required: false, 
      options: type === 'select' || type === 'radio' ? ['Option 1'] : [] 
    }]);
  };

  const updateField = (id: string, updates: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const addOption = (fieldId: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    setFields(fields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOptions = [...f.options];
        newOptions[index] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Form title is required');
    if (fields.length === 0) return toast.error('Add at least one field');

    setIsSubmitting(true);
    try {
      await api.post('/api/forms', {
        title,
        description,
        fields,
        targetRoles: 'ALL'
      });
      toast.success('Form created successfully!');
      navigate('/office-tools/forms');
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Saving...' : 'Save Form'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border-t-8 border-t-blue-600 rounded-2xl p-8 shadow-sm">
        <input
          type="text"
          placeholder="Form Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl font-bold border-none focus:ring-0 px-0 py-2 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 mb-4"
        />
        <textarea
          placeholder="Form Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none text-gray-600 dark:text-gray-400 border-none focus:ring-0 px-0 bg-transparent placeholder-gray-400"
          rows={2}
        />
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative group transition-all hover:shadow-md">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 opacity-0 group-hover:opacity-100 rounded-l-2xl transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-6">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                className="text-lg font-bold border-b border-dashed border-gray-300 focus:border-blue-500 focus:ring-0 px-0 py-1 bg-transparent w-1/2"
              />
              <button onClick={() => removeField(field.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="pl-2">
              {field.type === 'text' && <input type="text" disabled placeholder="Short answer text" className="w-full border-b border-gray-200 py-2 bg-transparent text-gray-400" />}
              {field.type === 'textarea' && <textarea disabled placeholder="Long answer text" className="w-full border-b border-gray-200 py-2 bg-transparent text-gray-400 resize-none" />}
              {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                <div className="space-y-3">
                  {field.options?.map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center gap-3">
                      {field.type === 'radio' ? <div className="w-4 h-4 rounded-full border-2 border-gray-300" /> : field.type === 'checkbox' ? <div className="w-4 h-4 rounded border-2 border-gray-300" /> : <div className="text-gray-400 text-xs">▼</div>}
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                        className="border-b border-dashed border-gray-200 focus:border-blue-500 px-0 py-1 bg-transparent w-full"
                      />
                    </div>
                  ))}
                  <button onClick={() => addOption(field.id)} className="text-blue-500 text-sm font-medium hover:underline flex items-center mt-2">
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <span>Required</span>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sticky bottom-6 z-10">
        <button onClick={() => addField('text')} className="p-3 text-gray-600 hover:bg-gray-50 rounded-xl flex flex-col items-center gap-1"><span className="text-xs font-bold">Text</span></button>
        <button onClick={() => addField('textarea')} className="p-3 text-gray-600 hover:bg-gray-50 rounded-xl flex flex-col items-center gap-1"><span className="text-xs font-bold">Long Text</span></button>
        <button onClick={() => addField('radio')} className="p-3 text-gray-600 hover:bg-gray-50 rounded-xl flex flex-col items-center gap-1"><span className="text-xs font-bold">Radio</span></button>
        <button onClick={() => addField('select')} className="p-3 text-gray-600 hover:bg-gray-50 rounded-xl flex flex-col items-center gap-1"><span className="text-xs font-bold">Dropdown</span></button>
        <button onClick={() => addField('checkbox')} className="p-3 text-gray-600 hover:bg-gray-50 rounded-xl flex flex-col items-center gap-1"><span className="text-xs font-bold">Checkbox</span></button>
      </div>
    </div>
  );
};
