import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Layers } from 'lucide-react';
import { TEMPLATES_LIST, TEMPLATE_CATEGORIES, getTemplateComponent, type IDCardData, type SchoolInfo } from '../../components/idcards/Templates';

// Dummy data for previewing templates on the dashboard
const dummyStudent: IDCardData = {
  id: 'preview',
  name: 'Ravi Kumar',
  rollNo: 'JY26-0001',
  className: 'Grade 10',
  section: 'A',
  bloodGroup: 'O+',
  address: 'Hyderabad, Telangana',
  phone: '9876543210',
  fatherName: 'Suresh Kumar',
  photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100',
};

const dummySchool: SchoolInfo = {
  schoolName: 'JY INTERNATIONAL SCHOOL',
  address: '123 Main Street, Hyderabad, TS 500001',
  phone: '+91 9876543210',
};

const IdCardDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES_LIST[0].id);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_LIST.filter((t) => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch = searchTerm === '' || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const handleProceed = () => {
    navigate(`/id-cards/generate?templateId=${selectedTemplate}`);
  };

  const selectedTemplateInfo = TEMPLATES_LIST.find(t => t.id === selectedTemplate);

  return (
    <div className="p-4 max-w-full mx-auto" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ID Card Templates</h1>
          <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{TEMPLATES_LIST.length} Designs</span>
        </div>
        <p className="text-gray-500 text-sm ml-10">Select a premium template for generating student ID cards.</p>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search + Filter Bar */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const count = cat === 'All' ? TEMPLATES_LIST.length : TEMPLATES_LIST.filter(t => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {cat} <span className={`ml-0.5 ${activeCategory === cat ? 'text-indigo-200' : 'text-gray-400'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-gray-400 mb-3 font-medium">
            Showing <span className="text-gray-700 font-bold">{filteredTemplates.length}</span> template{filteredTemplates.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && <span> in <span className="text-indigo-600">{activeCategory}</span></span>}
          </p>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold text-gray-600">No templates found</p>
              <p className="text-sm mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => {
                const TemplateComponent = getTemplateComponent(template.id);
                const isSelected = selectedTemplate === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`group relative rounded-2xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 ring-offset-2 shadow-lg shadow-indigo-100'
                        : 'border border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                    style={{ background: '#fff' }}
                  >
                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <CheckCircle className="w-6 h-6 text-indigo-600 fill-white" />
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute top-2 left-2 z-20">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {template.category}
                      </span>
                    </div>

                    {/* Template Preview */}
                    <div
                      className="rounded-t-2xl overflow-hidden flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        minHeight: template.isHorizontal ? '130px' : '200px',
                        padding: '12px',
                      }}
                    >
                      <div
                        style={{
                          transform: template.isHorizontal ? 'scale(0.52)' : 'scale(0.62)',
                          transformOrigin: 'center center',
                          pointerEvents: 'none',
                        }}
                      >
                        <TemplateComponent data={dummyStudent} school={dummySchool} />
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="px-3 py-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-800 truncate">{template.name}</p>
                      <p className="text-[10px] text-gray-400">{template.isHorizontal ? 'Horizontal' : 'Vertical'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Template Settings */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>⚙️</span> Template Settings
            </h2>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Selected Design</label>
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-gray-900 font-semibold text-sm">
                  {selectedTemplateInfo?.name || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium">
                  {selectedTemplateInfo?.category || '—'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Orientation</label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium">
                  {selectedTemplateInfo?.isHorizontal ? '↔️ Horizontal' : '↕️ Vertical'}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-semibold text-blue-800 mb-1">ℹ️ Information</h4>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  You can generate ID cards for an entire class or selected students on the next page.
                  Both front and back sides will be printed simultaneously.
                </p>
              </div>
            </div>

            <button
              onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-md active:scale-95"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              🎴 Proceed to Generate
            </button>

            {/* Mini Preview */}
            {selectedTemplate && (
              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Live Preview</label>
                <div className="flex justify-center bg-gray-50 rounded-xl p-3 overflow-hidden border border-gray-100">
                  <div style={{ transform: 'scale(0.42)', transformOrigin: 'top center', pointerEvents: 'none', height: selectedTemplateInfo?.isHorizontal ? '58px' : '90px' }}>
                    {React.createElement(getTemplateComponent(selectedTemplate), { data: dummyStudent, school: dummySchool })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardDashboard;
