import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAcademicYear } from "../../contexts/AcademicYearContext";
import { changePassword } from "../../api/auth";
import { PageHeader } from "../../components/UI/PageHeader";
import {
  Save, Lock, User as UserIcon, Key, Camera, Mail, Phone,
  ShieldCheck, Building2, CalendarDays, GraduationCap, LogOut,
  Edit3, CheckCircle2, Settings, Eye, EyeOff, Users, MapPin,
  Smartphone, Award
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { getPhotoUrl } from "../../utils/photo";

const roleDisplayMap: Record<string, string> = {
  GROUP_CHAIRMAN: "Group Chairman",
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  TEACHER: "Teacher / Faculty",
  STUDENT: "Student",
  ACCOUNTANT: "Accountant",
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { selectedYear } = useAcademicYear();

  const [uploading, setUploading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [freshUser, setFreshUser] = useState<any>(null);

  // Password form states
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Profile edit states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editQual, setEditQual] = useState((user as any)?.teacher?.qualification || "");
  const [editJoinDate, setEditJoinDate] = useState(
    (user as any)?.teacher?.joiningDate
      ? new Date((user as any)?.teacher?.joiningDate).toISOString().split("T")[0]
      : ""
  );

  // Fetch full fresh user + school institution settings
  useEffect(() => {
    api.get("/api/auth/me").then((res: any) => {
      const me = res.data?.data || res.data;
      if (me) {
        setFreshUser(me);
        setEditName(me.name || "");
        setEditEmail(me.email || "");
        setEditPhone(me.phone || "");
        if (me.teacher) {
          setEditQual(me.teacher.qualification || "");
          setEditJoinDate(
            me.teacher.joiningDate
              ? new Date(me.teacher.joiningDate).toISOString().split("T")[0]
              : ""
          );
        }
      }
    }).catch(() => {});

    api.get("/api/settings").then((res: any) => {
      const s = res.data?.data || res.data;
      if (s) setSchoolInfo(s);
    }).catch(() => {});
  }, []);

  const activeUser: any = freshUser || user;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      };
      if (activeUser?.role === "TEACHER") {
        payload.qualification = editQual;
        payload.joiningDate = editJoinDate || undefined;
      }

      const res: any = await api.put("/api/auth/profile", payload);
      const updated = res.data?.data || res.data || activeUser;
      setFreshUser(updated);
      updateUser(updated);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to update profile"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    const loadingToast = toast.loading("Uploading profile photo...");
    try {
      const uploadRes: any = await api.post("/api/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      if (!uploadedUrl) throw new Error("Upload returned no URL");

      const res: any = await api.put("/api/auth/profile", { photoUrl: uploadedUrl });
      const updated = res.data?.data || { ...activeUser, photoUrl: uploadedUrl };
      setFreshUser(updated);
      updateUser(updated);
      toast.success("Photo updated successfully!", { id: loadingToast });
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to upload photo",
        { id: loadingToast }
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password don't match");
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error changing password. Verify old password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!activeUser) return null;

  const isAdmin = activeUser.role === "SUPER_ADMIN" || activeUser.role === "ADMIN" || activeUser.role === "GROUP_CHAIRMAN";
  const isTeacher = activeUser.role === "TEACHER";
  const isStudent = activeUser.role === "STUDENT";
  const roleLabel = roleDisplayMap[activeUser.role] || activeUser.role;

  const passwordScore = !newPassword
    ? 0
    : [
        newPassword.length >= 6,
        newPassword.length >= 10,
        /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword),
        /[^A-Za-z0-9]/.test(newPassword),
      ].filter(Boolean).length;

  const inputClass =
    "w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F8FAFF] hover:bg-white focus:bg-white border border-indigo-100/90 rounded-xl text-slate-800 placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all";
  const labelClass = "block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1";

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] overflow-hidden">
      <PageHeader
        title="My Profile"
        icon={<UserIcon className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/settings"
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>School Settings</span>
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── 1. Light Colourful Hero Identity Banner (Matches Dashboard Hero Banner) ── */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#EBF3FF] via-[#F4EBFF] to-[#FFF0F6] border border-indigo-100/90 p-5 sm:p-6 shadow-[0_10px_28px_-8px_rgba(79,70,229,0.12)]">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 left-1/3 w-48 h-48 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left min-w-0">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-tr from-[#4F46E5] via-[#7C3AED] to-[#EC4899] shadow-lg">
                    {activeUser.photoUrl ? (
                      <img
                        src={getPhotoUrl(activeUser.photoUrl)}
                        alt={activeUser.name}
                        className="w-full h-full rounded-[13px] object-cover border-2 border-white bg-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[13px] border-2 border-white bg-white flex items-center justify-center text-[#4F46E5] font-black text-2xl">
                        {(activeUser.name || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-white ${
                      activeUser.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    title={activeUser.isActive !== false ? "Active Account" : "Inactive"}
                  />
                  {!isStudent && (
                    <label
                      className="cursor-pointer absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-xl shadow-md hover:scale-105 transition-all"
                      title="Upload Profile Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                      {activeUser.name}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] text-[11px] font-extrabold text-white shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{roleLabel}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        activeUser.isActive !== false
                          ? "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{activeUser.isActive !== false ? "Active" : "Suspended"}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-slate-600">
                    {activeUser.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        {activeUser.email}
                      </span>
                    )}
                    {activeUser.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        {activeUser.phone}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-rose-500" />
                      Session: {selectedYear}
                    </span>
                  </div>
                </div>
              </div>

              {!isStudent && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile Info</span>
                </button>
              )}
            </div>
          </div>

          {/* ── 2. 2-Column Complete Workspace ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ══ LEFT COLUMN (5 cols): Account Summary Tiles + Institution / Role Profile ══ */}
            <div className="lg:col-span-5 space-y-5">

              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-[18px] p-3.5 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-xs">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">Role Access</p>
                  <p className="text-sm font-black text-[#4C1D95] mt-1 truncate">{roleLabel}</p>
                </div>
                <div className="relative overflow-hidden rounded-[18px] p-3.5 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-xs">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">Account Status</p>
                  <p className="text-sm font-black text-[#065F46] mt-1">
                    {activeUser.isActive !== false ? "Verified & Active" : "Suspended"}
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-[18px] p-3.5 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-xs">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">Active Session</p>
                  <p className="text-sm font-black text-[#1E3A8A] mt-1">{selectedYear}</p>
                </div>
                <div className="relative overflow-hidden rounded-[18px] p-3.5 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-xs">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-600">Member Since</p>
                  <p className="text-sm font-black text-[#9A3412] mt-1">
                    {activeUser.createdAt
                      ? new Date(activeUser.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                      : "2026"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[22px] overflow-hidden border border-indigo-100/90 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.10)]">
                <div className="bg-gradient-to-r from-[#ECFDF5] via-[#E5FAEF] to-[#E6FAFC] px-5 py-3 border-b border-emerald-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-xs shrink-0">
                      {isStudent ? <GraduationCap className="w-4 h-4" /> : isTeacher ? <Award className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      {isStudent
                        ? "Academic Profile"
                        : isTeacher
                          ? "Faculty & Service Details"
                          : "School Institution Details"}
                    </h3>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/settings"
                      className="text-[11px] font-extrabold text-emerald-700 hover:underline"
                    >
                      Configure →
                    </Link>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  {isStudent && activeUser.student ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Roll No / ID</span>
                        <span className="font-black text-indigo-700 mt-0.5 block">{activeUser.student.rollNo || "N/A"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Class &amp; Section</span>
                        <span className="font-black text-slate-800 mt-0.5 block">
                          {activeUser.student.class ? `${activeUser.student.class.name} - ${activeUser.student.class.section}` : "Unassigned"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Father Name</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{activeUser.student.fatherName || "N/A"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Date of Birth</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {activeUser.student.dob ? new Date(activeUser.student.dob).toLocaleDateString("en-IN") : "N/A"}
                        </span>
                      </div>
                      <div className="col-span-2 p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">{activeUser.student.address || "N/A"}</span>
                      </div>
                    </div>
                  ) : isTeacher && activeUser.teacher ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee ID</span>
                        <span className="font-black text-indigo-700 mt-0.5 block">{activeUser.teacher.employeeId || "N/A"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Class Teacher Of</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {activeUser.teacher.homeRoomClass
                            ? `${activeUser.teacher.homeRoomClass.name} - ${activeUser.teacher.homeRoomClass.section}`
                            : "Subject Teacher"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Qualification</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{activeUser.teacher.qualification || "N/A"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Joining Date</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {activeUser.teacher.joiningDate
                            ? new Date(activeUser.teacher.joiningDate).toLocaleDateString("en-IN")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100/80 space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Institution Name</span>
                          <span className="font-black text-[#1E1B4B] text-sm block mt-0.5">
                            {schoolInfo?.schoolName || "SRI VENKATESWARA JY HIGH SCHOOL"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">School Phone</span>
                            <span className="font-bold text-slate-700 block mt-0.5">{schoolInfo?.phone || "9441104648"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Academic Session</span>
                            <span className="font-bold text-indigo-700 block mt-0.5">{schoolInfo?.currentYear || selectedYear}</span>
                          </div>
                        </div>
                        {schoolInfo?.address && (
                          <div className="pt-1 flex items-start gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium leading-snug">{schoolInfo.address}</span>
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Link
                            to="/staff-management"
                            className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 font-bold flex items-center gap-2 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Staff Access</span>
                          </Link>
                          <Link
                            to="/app-installs"
                            className="p-2.5 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-100 text-sky-700 font-bold flex items-center gap-2 transition-colors"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>App Installs</span>
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN (7 cols): Profile Details / Edit + Security Password ══ */}
            <div className="lg:col-span-7 space-y-5">

              <div className="bg-white rounded-[22px] overflow-hidden border border-indigo-100/90 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.10)]">
                <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-5 py-3 border-b border-indigo-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-xs shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                      Account Information
                    </h3>
                  </div>

                  {!isStudent && !isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-extrabold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="p-5">
                  {isEditing ? (
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Display / Full Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Phone Number</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            className={inputClass}
                          />
                        </div>
                        {isTeacher && (
                          <>
                            <div>
                              <label className={labelClass}>Qualification</label>
                              <input
                                type="text"
                                value={editQual}
                                onChange={(e) => setEditQual(e.target.value)}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Joining Date</label>
                              <input
                                type="date"
                                value={editJoinDate}
                                onChange={(e) => setEditJoinDate(e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2 border-t border-indigo-100/70">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-95 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                      <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Full Name</span>
                        <span className="font-extrabold text-[#1E1B4B] mt-0.5 block">{activeUser.name}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Role Group</span>
                        <span className="font-extrabold text-indigo-700 mt-0.5 block">{roleLabel}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
                        <span className="font-bold text-slate-800 mt-0.5 block break-all">{activeUser.email || "Not Set"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFF] border border-indigo-100/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Mobile Number</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{activeUser.phone || "Not Set"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[22px] overflow-hidden border border-purple-100/90 shadow-[0_8px_24px_-6px_rgba(91,33,182,0.10)]">
                <div className="bg-gradient-to-r from-[#F2EDFF] via-[#FFEBF3] to-[#FFF6E5] px-5 py-3 border-b border-purple-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                      Security &amp; Change Password
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                    Protected Account
                  </span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className={labelClass}>Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type={showOldPwd ? "text" : "password"}
                          required
                          placeholder="Current password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`${inputClass} pl-9 pr-9`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPwd((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOldPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type={showNewPwd ? "text" : "password"}
                          required
                          placeholder="Min 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`${inputClass} pl-9 pr-9`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type={showConfirmPwd ? "text" : "password"}
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`${inputClass} pl-9 pr-9`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className="text-slate-500">Strength:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((lvl) => (
                          <span
                            key={lvl}
                            className={`w-6 h-1.5 rounded-full ${
                              passwordScore >= lvl
                                ? passwordScore <= 1
                                  ? "bg-rose-500"
                                  : passwordScore <= 2
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      {confirmPassword && (
                        <span className={newPassword === confirmPassword ? "text-emerald-600 ml-2" : "text-rose-600 ml-2"}>
                          {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Mismatch"}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPassword ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
