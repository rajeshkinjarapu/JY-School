import React, from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import { BadgeCheck } from 'lucide-react';
import { templates } from '../../components/idcards/Templates';

export const IdCardDashboard = () => {
  const navigate = useNavigate();

  // Dummy student for previewing the templates
  const dummyStudent = {
    rollNo: 'S-2026-001',
    user: { name: 'John Doe', photoUrl: '', phone: '+91 9876543210' },
    class: { name: 'Grade 10', section: 'A' },
    dob: '2010-05-14T00:00:00Z',
    bloodGroup: 'O+',
    fatherName: 'Robert Doe'
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="ID Card Generator" 
        icon={<BadgeCheck className="w-5 h-5" />} 
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Select a Template</h2>
            <p className="text-gray-500 mb-6 text-sm">Choose from 10 premium ID card designs to generate cards for your students.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex flex-col items-center">
                  <div className="bg-gray-100 p-4 rounded-xl mb-3 shadow-inner overflow-hidden flex justify-center items-center w-full min-h-[350px]">
                    <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
                      <tpl.component student={dummyStudent} schoolName="JY INTERNATIONAL SCHOOL" showQR={true} />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-center">{tpl.name}</h3>
                  <button 
                    onClick={() => navigate(`/id-cards/generate/${tpl.id}`)}
                    className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold shadow transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
