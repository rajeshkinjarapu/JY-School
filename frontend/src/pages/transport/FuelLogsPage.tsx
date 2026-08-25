import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Fuel, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';

export const FuelLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ 
    vehicleId: '', date: '', liters: '', costPerLiter: '', totalCost: '', odometerReading: '', remarks: '' 
  });

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/api/transport/fuel-logs'),
        api.get('/api/transport/vehicles')
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/transport/fuel-logs', formData);
      toast.success('Fuel log added');
      setShowModal(false);
      setFormData({ vehicleId: '', date: '', liters: '', costPerLiter: '', totalCost: '', odometerReading: '', remarks: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Fuel Logs" 
        icon={<Fuel className="w-5 h-5" />} 
        action={
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Fuel Log
          </button>
        }
      />
      
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Liters</th>
                    <th className="px-6 py-4">Cost/Liter</th>
                    <th className="px-6 py-4">Total Cost</th>
                    <th className="px-6 py-4">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(log.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.vehicle?.registrationNo}</td>
                      <td className="px-6 py-4">{log.liters} L</td>
                      <td className="px-6 py-4">₹{log.costPerLiter}</td>
                      <td className="px-6 py-4 font-bold text-rose-600">₹{log.totalCost}</td>
                      <td className="px-6 py-4">{log.odometerReading || '-'} km</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No fuel logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Add Fuel Log</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNo}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date" required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                  <input
                    type="number" step="0.01" required
                    value={formData.liters}
                    onChange={(e) => {
                      const liters = e.target.value;
                      const costPerLiter = formData.costPerLiter;
                      const total = (Number(liters) * Number(costPerLiter)).toFixed(2);
                      setFormData({...formData, liters, totalCost: total !== '0.00' ? total : ''});
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Liter</label>
                  <input
                    type="number" step="0.01" required
                    value={formData.costPerLiter}
                    onChange={(e) => {
                      const costPerLiter = e.target.value;
                      const liters = formData.liters;
                      const total = (Number(liters) * Number(costPerLiter)).toFixed(2);
                      setFormData({...formData, costPerLiter, totalCost: total !== '0.00' ? total : ''});
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <input
                    type="number" step="0.01" required
                    value={formData.totalCost}
                    onChange={(e) => setFormData({...formData, totalCost: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold text-rose-600"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (Optional)</label>
                  <input
                    type="number"
                    value={formData.odometerReading}
                    onChange={(e) => setFormData({...formData, odometerReading: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm transition-colors">
                  Save Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelLogsPage;
