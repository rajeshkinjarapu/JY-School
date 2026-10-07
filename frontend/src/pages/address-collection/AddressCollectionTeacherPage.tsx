import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddressCollectionTeacherPage = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: ''
  });
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://66.116.252.191:19998/api/teachers', {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.data.success) {
          setTeachers(response.data.data.map((t: any) => ({
            id: t.id,
            name: t.user?.name || 'Unknown'
          })));
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'referenceTeacherId' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.fatherName || !formData.village || !formData.mandal || !formData.mobileNo) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://66.116.252.191:19998/api/address-collection', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      if (response.data.success) {
        toast.success('Address collected successfully!');
        setFormData({
          studentName: '',
          fatherName: '',
          village: '',
          mandal: '',
          mobileNo: '',
          alternateMobileNo: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Address Entry</h1>
        <p className="text-gray-500">Collect student details for survey & reference</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User size={24} />
            Student Details
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="Enter student full name"
                />
              </div>
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Father Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="Enter father's name"
                />
              </div>
            </div>

            {/* Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="Village / Town"
                />
              </div>
            </div>

            {/* Mandal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mandal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Navigation className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="mandal"
                  value={formData.mandal}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="Mandal"
                />
              </div>
            </div>

            {/* Mobile No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="10 digit mobile no"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternate Mobile <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="alternateMobileNo"
                  value={formData.alternateMobileNo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
                  placeholder="Alternate number"
                  maxLength={10}
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Teacher <span className="text-gray-400 text-xs">(Defaults to you if empty)</span>
              </label>
              <select
                name="referenceTeacherId"
                value={formData.referenceTeacherId}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
              >
                <option value="">-- Self (Default) --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-medium shadow-md hover:shadow-lg transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Submitting...' : 'Submit Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressCollectionTeacherPage;
