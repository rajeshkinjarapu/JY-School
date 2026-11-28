import React, { useState, useEffect } from "react";
import { Trash2, CheckSquare, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

const LeaveTypeTab: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Staff");
  const [formStatus, setFormStatus] = useState("Active");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("fin_leave_types");
    if (stored) {
      setLeaveTypes(JSON.parse(stored));
    } else {
      const defaults = [
        { id: "1", name: "Casual Leave", code: "CASUAL", role: "Staff", status: "Active", desc: "Personal & urgent needs (12/yr)" },
        { id: "2", name: "Sick Leave", code: "SICK", role: "Staff", status: "Active", desc: "Medical & health emergencies (10/yr)" },
        { id: "3", name: "Earned Leave", code: "EARNED", role: "Staff", status: "Active", desc: "Privilege / earned annual leave (15/yr)" },
      ];
      setLeaveTypes(defaults);
      localStorage.setItem("fin_leave_types", JSON.stringify(defaults));
    }
  }, []);

  const saveTypes = (updated: any[]) => {
    setLeaveTypes(updated);
    localStorage.setItem("fin_leave_types", JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    const newType = {
      id: Date.now().toString(),
      name: formName.trim(),
      role: formRole,
      status: formStatus,
      desc: formDesc.trim() || "Standard school leave policy",
    };
    saveTypes([...leaveTypes, newType]);
    toast.success("Leave Type added successfully!");
    setFormName("");
    setFormDesc("");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this leave type?")) {
      const updated = leaveTypes.filter((t) => t.id !== id);
      saveTypes(updated);
      toast.success("Leave Type deleted successfully!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Leave Type Card */}
      <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3.5 border-b border-indigo-50">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#D8CEF6] text-[#5B21B6] flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-[#1E1B4B]">Add Leave Type</h4>
            <p className="text-[11px] font-bold text-slate-400">Configure policy categories</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Maternity Leave"
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Applicable Role</label>
            <select
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            >
              <option value="Staff">Staff</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              placeholder="Describe eligibility & limits..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-semibold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" /> Save Leave Type
          </button>
        </form>
      </div>

      {/* Existing Leave Types Table */}
      <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] overflow-hidden">
        <div className="px-6 py-4 border-b border-indigo-50 flex items-center justify-between">
          <h4 className="text-base font-black text-[#1E1B4B]">Configured Leave Types</h4>
          <span className="px-3 py-1 rounded-full bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3] text-xs font-black">
            {leaveTypes.length} Types
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="student-grid-table w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">#</th>
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Leave Name</th>
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Policy Description</th>
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Role</th>
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-4 font-black !text-white text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {leaveTypes.map((t, index) => (
                <tr key={t.id} className="hover:bg-[#F8FAFF] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-400 text-xs">{index + 1}</td>
                  <td className="py-3.5 px-4 font-black text-[#1E1B4B]">{t.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs font-semibold">{t.desc}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-black">{t.role}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${t.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-xl bg-[#F8FAFF] hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-indigo-100 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {leaveTypes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-bold text-sm">
                    No leave types configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeTab;
