import React, { useState } from 'react';
import { Layers, DollarSign, Award, Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const FeeSettingsTabs: React.FC<{
  type: 'fee-group' | 'fee-head' | 'fee-concession';
  data: any[];
  groups?: any[]; // For fee-head
  onRefresh: () => void;
}> = ({ type, data, groups = [], onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState(''); // for fee-head
  const [cType, setCType] = useState('PERCENT'); // for concession
  const [value, setValue] = useState(''); // for concession

  const getTitle = () => {
    if (type === 'fee-group') return 'Fee Groups';
    if (type === 'fee-head') return 'Fee Heads';
    return 'Fee Concessions';
  };

  const getIcon = () => {
    if (type === 'fee-group') return <Layers className="w-5 h-5 text-emerald-600" />;
    if (type === 'fee-head') return <DollarSign className="w-5 h-5 text-amber-600" />;
    return <Award className="w-5 h-5 text-rose-600" />;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name };
      let endpoint = '';
      
      if (type === 'fee-group') {
        endpoint = '/api/fees/groups';
        payload.description = description;
      } else if (type === 'fee-head') {
        endpoint = '/api/fees/heads';
        payload.description = description;
        if (!groupId) throw new Error('Please select a group');
        payload.groupId = groupId;
      } else {
        endpoint = '/api/fees/concessions';
        payload.type = cType;
        payload.value = Number(value);
      }

      await api.post(endpoint, payload);
      toast.success(`${getTitle()} added successfully`);
      setShowModal(false);
      setName(''); setDescription(''); setValue(''); setGroupId('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const endpoint = type === 'fee-group' ? '/api/fees/groups' : type === 'fee-head' ? '/api/fees/heads' : '/api/fees/concessions';
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted successfully');
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="text-sm text-gray-500">Manage your {getTitle().toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-y border-gray-100 text-gray-500">
            <tr>
              <th className="py-3 px-4 font-semibold">Name</th>
              {type === 'fee-head' && <th className="py-3 px-4 font-semibold">Group</th>}
              {type !== 'fee-concession' && <th className="py-3 px-4 font-semibold">Description</th>}
              {type === 'fee-concession' && (
                <>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Value</th>
                </>
              )}
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                  {type === 'fee-head' && (
                    <td className="py-3 px-4 text-gray-600">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold">
                        {groups.find(g => g.id === item.groupId)?.name || 'Unknown'}
                      </span>
                    </td>
                  )}
                  {type !== 'fee-concession' && <td className="py-3 px-4 text-gray-600">{item.description || '-'}</td>}
                  {type === 'fee-concession' && (
                    <>
                      <td className="py-3 px-4 text-gray-600">{item.type}</td>
                      <td className="py-3 px-4 text-gray-600">{item.type === 'PERCENT' ? `${item.value}%` : `₹${item.value}`}</td>
                    </>
                  )}
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Add {getTitle().slice(0, -1)}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Tuition Fee"
                />
              </div>

              {type === 'fee-head' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Group <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select a Group...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {type !== 'fee-concession' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Optional description"
                  />
                </div>
              )}

              {type === 'fee-concession' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                    <select
                      value={cType}
                      onChange={(e) => setCType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Value <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={cType === 'PERCENT' ? '0.1' : '1'}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder={cType === 'PERCENT' ? 'e.g. 10' : 'e.g. 5000'}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
