import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const WebsiteManagerPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [settings, setSettings] = useState({
    heroTitle: '', heroSubtitle: '', heroDescription: '',
    contactPhone: '', contactEmail: '', contactAddress: '',
    facebookUrl: '', instagramUrl: '', youtubeUrl: ''
  });
  const [stats, setStats] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/website/data`);
      if (res.data.success) {
        if (res.data.data.settings) setSettings(res.data.data.settings);
        setStats(res.data.data.stats || []);
        setPrograms(res.data.data.programs || []);
        setNews(res.data.data.news || []);
      }
    } catch (err) {
      toast.error('Failed to load website data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/website/settings`, settings, { withCredentials: true });
      toast.success('Website Settings Updated Successfully!');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  // Generic handler for creating items
  const handleAddItem = async (endpoint: string, data: any, refreshFn: Function, stateArray: any[]) => {
    try {
      const res = await axios.post(`${API_URL}/api/website/${endpoint}`, data, { withCredentials: true });
      if (res.data.success) {
        toast.success('Added successfully!');
        refreshFn([...stateArray, res.data.data]);
      }
    } catch (err) { toast.error('Error adding item'); }
  };

  const handleDeleteItem = async (endpoint: string, id: string, refreshFn: Function, stateArray: any[]) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await axios.delete(`${API_URL}/api/website/${endpoint}/${id}`, { withCredentials: true });
      toast.success('Deleted successfully!');
      refreshFn(stateArray.filter((item: any) => item.id !== id));
    } catch (err) { toast.error('Error deleting item'); }
  };

  if (loading) return <div className="p-10 text-center">Loading Website CMS...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Website Content Manager (CMS)</h1>
        <p className="text-gray-500 text-sm mt-1">Manage public website content directly from here.</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        {['general', 'stats', 'programs', 'news'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
            <div className="grid grid-cols-1 gap-4">
              <input type="text" placeholder="Hero Subtitle (e.g. IIT/NEET)" value={settings.heroSubtitle} onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} className="border p-2 rounded" />
              <input type="text" placeholder="Hero Title" value={settings.heroTitle} onChange={e => setSettings({...settings, heroTitle: e.target.value})} className="border p-2 rounded text-lg font-bold" />
              <textarea placeholder="Hero Description" value={settings.heroDescription} onChange={e => setSettings({...settings, heroDescription: e.target.value})} className="border p-2 rounded h-24" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Phone Number" value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="border p-2 rounded" />
              <input type="text" placeholder="Email Address" value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="border p-2 rounded" />
              <textarea placeholder="Physical Address" value={settings.contactAddress} onChange={e => setSettings({...settings, contactAddress: e.target.value})} className="border p-2 rounded md:col-span-2" />
            </div>
          </div>

          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Save General Settings</button>
        </form>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold mb-4">Website Statistics (Counter)</h3>
           {/* Form to add new stat */}
           <div className="grid grid-cols-4 gap-4 mb-6">
              <input type="text" id="statValue" placeholder="Value (e.g. 1500+)" className="border p-2 rounded" />
              <input type="text" id="statLabel" placeholder="Label (e.g. Students)" className="border p-2 rounded" />
              <input type="text" id="statColor" placeholder="Color (e.g. bg-blue-500)" className="border p-2 rounded" />
              <button onClick={() => {
                const val = (document.getElementById('statValue') as HTMLInputElement).value;
                const lab = (document.getElementById('statLabel') as HTMLInputElement).value;
                const col = (document.getElementById('statColor') as HTMLInputElement).value;
                if(val && lab) handleAddItem('stats', { value: val, label: lab, color: col || 'bg-indigo-600', icon: 'fa-star' }, setStats, stats);
              }} className="bg-green-600 text-white rounded">Add Stat</button>
           </div>
           
           <div className="space-y-3">
             {stats.map(s => (
               <div key={s.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                 <div><span className="font-bold text-lg">{s.value}</span> - {s.label}</div>
                 <button onClick={() => handleDeleteItem('stats', s.id, setStats, stats)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-trash"></i></button>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold mb-4">Programs & Foundation</h3>
           {/* Form to add new program */}
           <div className="grid grid-cols-1 gap-4 mb-6">
              <input type="text" id="progTitle" placeholder="Program Title (e.g. IIT-JEE Foundation)" className="border p-2 rounded" />
              <textarea id="progDesc" placeholder="Description" className="border p-2 rounded h-20" />
              <div className="flex gap-4">
                 <input type="text" id="progIcon" placeholder="Icon (e.g. fa-rocket)" className="border p-2 rounded flex-1" />
                 <input type="text" id="progColor" placeholder="Color (e.g. blue)" className="border p-2 rounded flex-1" />
                 <button onClick={() => {
                   const t = (document.getElementById('progTitle') as HTMLInputElement).value;
                   const d = (document.getElementById('progDesc') as HTMLTextAreaElement).value;
                   const i = (document.getElementById('progIcon') as HTMLInputElement).value;
                   const c = (document.getElementById('progColor') as HTMLInputElement).value;
                   if(t && d) handleAddItem('programs', { title: t, description: d, icon: i || 'fa-book', color: c || 'blue' }, setPrograms, programs);
                 }} className="bg-green-600 text-white px-6 rounded">Add Program</button>
              </div>
           </div>
           
           <div className="space-y-4">
             {programs.map(p => (
               <div key={p.id} className="flex justify-between items-start p-4 border rounded bg-gray-50">
                 <div>
                   <h4 className="font-bold text-lg"><i className={`fa-solid ${p.icon} mr-2`}></i>{p.title}</h4>
                   <p className="text-gray-600 text-sm mt-1">{p.description}</p>
                 </div>
                 <button onClick={() => handleDeleteItem('programs', p.id, setPrograms, programs)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-trash"></i></button>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold mb-4">Latest News & Events</h3>
           {/* Form to add new news */}
           <div className="grid grid-cols-1 gap-4 mb-6">
              <input type="text" id="newsTitle" placeholder="News Title" className="border p-2 rounded" />
              <textarea id="newsDesc" placeholder="Description" className="border p-2 rounded h-20" />
              <div className="flex gap-4">
                 <input type="text" id="newsTag" placeholder="Tag (e.g. Event, Announcement)" className="border p-2 rounded flex-1" />
                 <input type="date" id="newsDate" className="border p-2 rounded flex-1" />
                 <button onClick={() => {
                   const t = (document.getElementById('newsTitle') as HTMLInputElement).value;
                   const d = (document.getElementById('newsDesc') as HTMLTextAreaElement).value;
                   const tg = (document.getElementById('newsTag') as HTMLInputElement).value;
                   const dt = (document.getElementById('newsDate') as HTMLInputElement).value;
                   if(t && d && dt) handleAddItem('news', { title: t, description: d, tag: tg || 'News', date: new Date(dt).toISOString() }, setNews, news);
                 }} className="bg-green-600 text-white px-6 rounded">Add News</button>
              </div>
           </div>
           
           <div className="space-y-4">
             {news.map(n => (
               <div key={n.id} className="flex justify-between items-start p-4 border rounded bg-gray-50">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{n.tag}</span>
                     <span className="text-gray-500 text-xs">{new Date(n.date).toLocaleDateString()}</span>
                   </div>
                   <h4 className="font-bold">{n.title}</h4>
                   <p className="text-gray-600 text-sm mt-1">{n.description}</p>
                 </div>
                 <button onClick={() => handleDeleteItem('news', n.id, setNews, news)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-trash"></i></button>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
};
