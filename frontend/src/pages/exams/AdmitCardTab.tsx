import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatExamOptionLabel } from "../../utils/formatters";
import {
  Printer,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Settings,
  Upload,
  CheckCircle,
  Save,
  ExternalLink,
  Download,
  FileText,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { AdmitCardTemplate } from "../../components/Exams/AdmitCardTemplate";

export const AdmitCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedClass = selectedExam?.classes?.find(
    (c: any) => c.id === selectedClassId,
  );

  const [published, setPublished] = useState(false);
  const [instructions, setInstructions] = useState(
    "Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.",
  );
  const [signatureUrl, setSignatureUrl] = useState("");
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [examTitleOverride, setExamTitleOverride] = useState("");
  const [examCenterOverride, setExamCenterOverride] = useState("");
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (selectedExam) {
      setPublished(selectedExam.admitCardPublished || false);
      const settings = selectedExam.admitCardSettings || {};
      setInstructions(
        settings.instructions ||
          "Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.",
      );
      setSignatureUrl(settings.signatureUrl || "");
      setTeacherSignatureUrl(settings.teacherSignatureUrl || "");
      setLogoUrl(settings.logoUrl || "");
      setExamTitleOverride(settings.examTitleOverride || "");
      setExamCenterOverride(settings.examCenterOverride || "");
      setSchedule(settings.schedule || []);
    }
  }, [selectedExam]);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudents([]);
        setExamPlans([]);
        return;
      }
      setLoading(true);
      try {
        const [studentsRes, plansRes]: any = await Promise.all([
          api.get(`/api/classes/${selectedClassId}/students`),
          api.get(`/api/exams-extended/plans?examId=${selectedExamId}`),
        ]);
        setStudents(studentsRes.data?.data || studentsRes.data || []);
        setExamPlans(plansRes.data?.data || plansRes.data || []);
      } catch (e) {
        console.error("Error fetching admit card data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    const parentContainer = document.getElementById(
      "admit-cards-print-container",
    );
    const originalParentDisplay = parentContainer?.style.display;
    const originalParentPosition = parentContainer?.style.position;

    if (parentContainer) {
      parentContainer.classList.remove("hidden");
      parentContainer.style.display = "flex";
      parentContainer.style.position = "absolute";
      parentContainer.style.left = "-9999px";
    }

    const originalDisplay = el.style.display;
    el.style.display = "flex";
    await new Promise((resolve) => setTimeout(resolve, 500));
    let pdf: any;
    try {
      const imgData = await toJpeg(el, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
        backgroundColor: "#ffffff",
      });
      pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );
    } catch (err) {
      el.style.display = originalDisplay;
      if (parentContainer) {
        parentContainer.classList.add("hidden");
        parentContainer.style.display = originalParentDisplay || "";
        parentContainer.style.position = originalParentPosition || "";
        parentContainer.style.left = "";
      }
      throw new Error(
        `Failed to generate image: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }

    el.style.display = originalDisplay;
    if (parentContainer) {
      parentContainer.classList.add("hidden");
      parentContainer.style.display = originalParentDisplay || "";
      parentContainer.style.position = originalParentPosition || "";
      parentContainer.style.left = "";
    }
    return pdf;
  };

  const handleDownloadSingle = async (studentName: string, index: number) => {
    const el = document.getElementById(`admit-card-${index}`);
    if (!el) return toast.error("Could not find card element");
    const toastId = toast.loading(`Generating PDF for ${studentName}...`);
    try {
      const pdf = await generatePDFForElement(el, studentName);
      pdf.save(`${studentName}_AdmitCard.pdf`);
      toast.success("Downloaded successfully!", { id: toastId });
    } catch (e: any) {
      console.error("PDF Generation Error:", e);
      const errorMsg = e.message || "Failed to generate PDF. Please try again.";
      toast.error(errorMsg, { id: toastId });
    }
  };

  const handleDownloadAll = async () => {
    if (students.length === 0) return;
    setIsDownloading(true);

    const loadingToastId = toast.loading(
      `Generating ${students.length} admit cards, please wait...`,
    );

    try {
      const zip = new JSZip();
      const printArea = document.getElementById("admit-cards-print-container");

      if (printArea) {
        printArea.classList.remove("hidden");
        printArea.classList.add("flex");
        printArea.style.position = "absolute";
        printArea.style.left = "-9999px";
        printArea.style.top = "0";
        printArea.style.width = "210mm";
        printArea.style.zIndex = "-9999";
        printArea.style.visibility = "visible";
      }

      // Allow DOM to update and images to load (increased timeout)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const templates = document.querySelectorAll(".admit-card-wrapper");

      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const student = students[i];

        try {
          const imgData = await toJpeg(el, {
            cacheBust: true,
            pixelRatio: 1.5,
            backgroundColor: "#ffffff",
          });

          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;

          pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
            undefined,
            "FAST",
          );
          const fileName = `${student.user?.name || student.name || `Student_${i + 1}`}.pdf`;
          zip.file(fileName, pdf.output("blob"));
        } catch (err) {
          console.error(`Failed to generate PDF for student ${i}:`, err);
          throw new Error(
            `Failed to generate PDF for ${student.user?.name || student.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }

      if (printArea) {
        printArea.classList.add("hidden");
        printArea.classList.remove("flex");
        printArea.style.position = "";
        printArea.style.left = "";
        printArea.style.top = "";
        printArea.style.width = "";
        printArea.style.zIndex = "";
        printArea.style.visibility = "";
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `AdmitCards_${selectedClassId}.zip`);
      toast.success("Downloaded successfully!", { id: loadingToastId });
    } catch (e: any) {
      console.error("Zip/PDF generation error:", e);
      const errorMsg =
        e.message ||
        "Failed to generate PDFs. Please ensure all images are properly loaded.";
      toast.error(errorMsg, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedExamId) return;
    try {
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: published,
        admitCardSettings: {
          instructions,
          signatureUrl,
          teacherSignatureUrl,
          logoUrl,
          examTitleOverride,
          examCenterOverride,
          schedule,
        },
      });
      toast.success("Admit Card settings saved successfully!");
      // Update local object to avoid fetching again
      if (selectedExam) {
        selectedExam.admitCardPublished = published;
        selectedExam.admitCardSettings = {
          instructions,
          signatureUrl,
          teacherSignatureUrl,
          logoUrl,
          examTitleOverride,
          examCenterOverride,
          schedule,
        };
      }
    } catch (e: any) {
      toast.error("Failed to save settings: " + e.message);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "signature" | "teacherSignature" | "logo",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (type === "signature") setSignatureUrl(res.data.url);
      if (type === "teacherSignature") setTeacherSignatureUrl(res.data.url);
      if (type === "logo") setLogoUrl(res.data.url);
      toast.success(
        `${type === "logo" ? "Logo" : type === "signature" ? "Principal Signature" : "Teacher Signature"} uploaded!`,
      );
    } catch (err) {
      toast.error("Failed to upload image");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] print:hidden gap-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 rounded-2xl shadow-lg shadow-orange-500/30 text-white shrink-0 hidden sm:block">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[220px]"
            >
              <option value="" className="text-xs font-medium">-- Select Exam --</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id} className="text-xs font-medium">
                  {formatExamOptionLabel(e.name)} ({e.term})
                </option>
              ))}
            </select>

            {selectedExam && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 transition-all shadow-sm cursor-pointer w-full sm:min-w-[180px]"
              >
                <option value="">-- Select Class --</option>
                {(selectedExam.classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}-{c.section}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && selectedExam && (
            <>
              {!published ? (
                <button
                  onClick={async () => {
                    setPublished(true);
                    try {
                      await api.post(
                        `/api/exams/${selectedExamId}/admit-card-settings`,
                        {
                          admitCardPublished: true,
                          admitCardSettings:
                            selectedExam.admitCardSettings || {},
                        },
                      );
                      toast.success(
                        "Admit Cards sent to Teachers, Students & Admins successfully!",
                      );
                      if (selectedExam) selectedExam.admitCardPublished = true;
                    } catch (e: any) {
                      toast.error("Failed to send admit cards");
                      setPublished(false);
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Publish Cards
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4" /> Published
                  </span>
                  <button
                    onClick={async () => {
                      setPublished(false);
                      try {
                        await api.post(
                          `/api/exams/${selectedExamId}/admit-card-settings`,
                          {
                            admitCardPublished: false,
                            admitCardSettings:
                              selectedExam.admitCardSettings || {},
                          },
                        );
                        toast.success("Admit Cards unpublished!");
                        if (selectedExam)
                          selectedExam.admitCardPublished = false;
                      } catch (e: any) {
                        toast.error("Failed to unpublish");
                        setPublished(true);
                      }
                    }}
                    className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-sm px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300"
                  >
                    Unpublish
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 shadow-sm px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </>
          )}
          {students.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="bg-white dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 hover:border-orange-400 hover:bg-orange-50 shadow-sm px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {!isDownloading && "Download All"}
              </button>
              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 hover:-translate-y-0.5 px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print All
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && selectedExamId && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-6 print:hidden flex flex-col gap-6 animate-fade-in-up">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
               <Settings className="w-5 h-5 text-indigo-500" /> Admit Card Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Important Instructions (One per line)
              </label>
              <textarea
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-32 resize-none"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
                Exam Title Override
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="e.g. JEE EXAM - 5 (2026 - 2027)"
                value={examTitleOverride}
                onChange={(e) => setExamTitleOverride(e.target.value)}
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
                Examination Center
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="e.g. JY School Main Campus, Hall A"
                value={examCenterOverride}
                onChange={(e) => setExamCenterOverride(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Principal Signature Image
              </label>
              <div className="flex items-center gap-4">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    No Image
                  </div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "signature")}
                  />
                </label>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
                Teacher Signature Image
              </label>
              <div className="flex items-center gap-4">
                {teacherSignatureUrl ? (
                  <img
                    src={teacherSignatureUrl}
                    alt="Teacher Signature"
                    className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    No Image
                  </div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "teacherSignature")}
                  />
                </label>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
                School Logo Image
              </label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    No Logo
                  </div>
                )}
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Schedule Editor */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">
                Examination Schedule
              </h4>
              <button
                onClick={() =>
                  setSchedule([
                    ...schedule,
                    { date: "", timing: "", subject: "", room: "" },
                  ])
                }
                className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                + Add Row
              </button>
            </div>

            {schedule.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-2 font-black text-xs text-slate-400 uppercase tracking-wider px-2">
                <div>Date</div>
                <div>Timing</div>
                <div>Subject</div>
                <div>Room</div>
                <div>Action</div>
              </div>
            )}

            <div className="space-y-2">
              {schedule.map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    type="date"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    value={row.date}
                    onChange={(e) => {
                      const newSch = [...schedule];
                      newSch[idx].date = e.target.value;
                      setSchedule(newSch);
                    }}
                  />
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="10:00 AM - 01:00 PM"
                    value={row.timing}
                    onChange={(e) => {
                      const newSch = [...schedule];
                      newSch[idx].timing = e.target.value;
                      setSchedule(newSch);
                    }}
                  />
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="Subject"
                    value={row.subject}
                    onChange={(e) => {
                      const newSch = [...schedule];
                      newSch[idx].subject = e.target.value;
                      setSchedule(newSch);
                    }}
                  />
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="Room"
                    value={row.room}
                    onChange={(e) => {
                      const newSch = [...schedule];
                      newSch[idx].room = e.target.value;
                      setSchedule(newSch);
                    }}
                  />
                  <button
                    onClick={() => {
                      setSchedule(schedule.filter((_, i) => i !== idx));
                    }}
                    className="bg-rose-50 text-rose-500 px-3 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {schedule.length === 0 && (
                <div className="text-sm font-medium text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  No schedule added. Will fallback to default exam plans if
                  available.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              onClick={handleSaveSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
          Loading Data...
        </div>
      )}

      {!loading &&
        students.length > 0 &&
        (!isSuperAdmin && !published ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-200/60">
            <CheckCircle className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">
              Not Published Yet
            </h3>
            <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md">
              The admit cards for this exam have not been published by the
              administration. Please check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden print:hidden animate-fade-in-up">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50 w-20">S.No</th>
                      <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50">Student Name</th>
                      {!isTeacher && <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50">Roll Number</th>}
                      <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {students.map((student, idx) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-400">
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3 max-w-[250px] overflow-hidden text-ellipsis">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black shrink-0 border border-orange-200/50 dark:border-orange-700/30">
                            {student.user?.name?.[0] || "S"}
                          </div>
                          <span className="truncate">
                            {student.user?.name || student.name}
                          </span>
                        </td>
                        {!isTeacher && (
                          <td className="px-6 py-4 text-slate-500 font-semibold">
                            {student.rollNo || "-"}
                          </td>
                        )}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              handleDownloadSingle(
                                student.user?.name || student.name,
                                idx,
                              )
                            }
                            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 shadow-sm px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all duration-300 flex items-center gap-2 ml-auto"
                          >
                            <Download className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              id="admit-cards-print-container"
              className="hidden print:block print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl flex flex-col items-center"
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
            @media print {
              @page { size: A4; margin: 0; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; }
              .admit-card-wrapper { 
                width: 210mm; 
                height: 297mm; 
                page-break-after: always; 
                page-break-inside: avoid;
                margin: 0;
                padding: 10mm;
                box-sizing: border-box;
                background: white !important;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .admit-card-wrapper:last-child { page-break-after: auto; }
            }
          `,
                }}
              />

              {students.map((student, idx) => (
                <div
                  key={student.id}
                  id={`admit-card-${idx}`}
                  className="w-full flex justify-center bg-white"
                >
                  <AdmitCardTemplate
                    student={student}
                    exam={selectedExam}
                    examPlans={examPlans}
                    className={selectedClass?.name}
                    section={selectedClass?.section}
                  />
                </div>
              ))}
            </div>
          </>
        ))}

      {!loading &&
        selectedExamId &&
        selectedClassId &&
        students.length === 0 && (
          <div className="p-12 text-center text-gray-400 font-medium">
            No students found for this class.
          </div>
        )}
    </div>
  );
};

