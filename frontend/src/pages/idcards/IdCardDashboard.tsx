import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES_LIST, getTemplateComponent, type IDCardData, type SchoolInfo } from '../../components/idcards/Templates';

// Dummy data for previewing templates on the dashboard
const dummyStudent: IDCardData = {
  id: 'preview',
  name: 'John Doe',
  rollNo: 'JY26-0001',
  className: 'Grade 10',
  section: 'A',
  bloodGroup: 'O+',
  address: '123 School Lane, City',
  phone: '9876543210',
  photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100&h=100',
};

const dummySchool: SchoolInfo = {
  schoolName: 'JY INTERNATIONAL SCHOOL',
  address: '123 Main Street, City, State 12345',
  phone: '+91 9876543210',
};

const IdCardDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES_LIST[0].id);

  const handleProceed = () => {
    navigate(`/id-cards/generate?templateId=${selectedTemplate}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ID Card Generation</h1>
        <p className="text-gray-600 mt-1">Select a premium template for generating student ID cards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEMPLATES_LIST.map((template) => {
              const TemplateComponent = getTemplateComponent(template.id);
              return (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedTemplate === template.id 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-100' 
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedTemplate === template.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                    }`}>
                      {selectedTemplate === template.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  
                  <div className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-hidden relative" style={{ minHeight: '300px' }}>
                    <div className="scale-75 origin-top relative z-10" style={{ pointerEvents: 'none' }}>
                      <TemplateComponent data={dummyStudent} school={dummySchool} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Template Settings</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected Design</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                  {TEMPLATES_LIST.find(t => t.id === selectedTemplate)?.name}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Information</h4>
                <p className="text-xs text-blue-600">
                  You can generate ID cards for an entire class or selected students on the next page. 
                  Both front and back sides will be printed simultaneously.
                </p>
              </div>
            </div>

            <button
              onClick={handleProceed}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Proceed to Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardDashboard;
