import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { PageHeader } from "../../components/UI/PageHeader";
import { LoadingSpinner } from "../../components/UI/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { sortClasses } from "../../utils/sortClasses";
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  User,
  Users,
  Layers,
  BarChart3,
  Clock,
  Settings,
  Save,
  X,
  Wand2,
  RefreshCw,
  Printer,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Building,
  Search,
  ShieldCheck,
  Coffee,
  Utensils,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Types ─── */
interface PeriodConfig {
  id?: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  label: string;
  isBreak: boolean;
}

interface SlotData {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  isSubstitute?: boolean;
  subject?: { name: string; code?: string };
  teacher?: { id: string; user: { name: string }; employeeId?: string };
  class?: { id?: string; name: string; section: string };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const CATEGORIES = ["PRIMARY", "HIGHER"] as const;

/* ─── Subject color & abbreviation helpers ─── */
const SUBJECT_COLORS = [
  { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
  { bg: "#FDF2F8", text: "#9D174D", border: "#FBCFE8" },
  { bg: "#ECFEFF", text: "#155E75", border: "#A5F3FC" },
];

const SUBJECT_COLORS_MAPPING: Record<string, { bg: string; text: string; border: string }> = {
  mathematics: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  maths: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  math: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  science: { bg: "#CCFBF1", text: "#115E59", border: "#5EEAD4" },
  "general science": { bg: "#CCFBF1", text: "#115E59", border: "#5EEAD4" },
  "physical science": { bg: "#E0F2FE", text: "#075985", border: "#7DD3FC" },
  "biological science": { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  physics: { bg: "#E0F2FE", text: "#075985", border: "#7DD3FC" },
  chemistry: { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" },
  biology: { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  evs: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  english: { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  hindi: { bg: "#FFE4E6", text: "#9F1239", border: "#FDA4AF" },
  telugu: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
  "physical education": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  pt: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  sports: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  history: { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
  social: { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
  "social studies": { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
  computer: { bg: "#ECFEFF", text: "#155E75", border: "#67E8F9" },
  "general knowledge": { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  gk: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  art: { bg: "#F5F3FF", text: "#5B21B6", border: "#C4B5FD" },
  "art & craft": { bg: "#F5F3FF", text: "#5B21B6", border: "#C4B5FD" },
};

const getColor = (name: string) => {
  const normalized = (name || "").toLowerCase().trim();
  if (SUBJECT_COLORS_MAPPING[normalized]) return SUBJECT_COLORS_MAPPING[normalized];
  let h = 0;
  for (let i = 0; i < normalized.length; i++) h = normalized.charCodeAt(i) + ((h << 5) - h);
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
};

const abbreviateSubject = (name: string) => {
  if (!name) return "";
  if (name.length <= 5) return name;
  const words = name.trim().split(/\s+/);
  if (words.length > 1) return words.map((w) => w[0]).join("").toUpperCase();
  return name.substring(0, 4) + ".";
};

/* Properly classifies NUR, LKG, UKG, PP1, PP2, 1st-5th as PRIMARY and 6th-10th+ as HIGHER */
const resolveClassCategory = (className?: string): "PRIMARY" | "HIGHER" => {
  const n = (className || "").toLowerCase().trim();
  if (!n) return "PRIMARY";
  if (
    n.includes("nur") ||
    n.includes("lkg") ||
    n.includes("ukg") ||
    n.includes("pp") ||
    n.includes("pre") ||
    n.includes("kg")
  ) {
    return "PRIMARY";
  }
  const num = parseInt(n.replace(/\D/g, ""), 10);
  if (!isNaN(num) && num <= 5) return "PRIMARY";
  return "HIGHER";
};

const calcDurationMins = (start: string, end: string): number | null => {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return null;
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : null;
};

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const isTeacher = user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";

  const [activeTab, setActiveTab] = useState<"class" | "teacher" | "workload" | "settings">(
    isTeacher ? "teacher" : "class"
  );
  const [activeCategory, setActiveCategory] = useState<"PRIMARY" | "HIGHER">("PRIMARY");
  const [selectedDayMobile, setSelectedDayMobile] = useState("Monday");

  // Core data
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Configs
  const [configs, setConfigs] = useState<Record<string, PeriodConfig[]>>({
    PRIMARY: [],
    HIGHER: [],
  });

  // Timetable data
  const [classTimetable, setClassTimetable] = useState<Record<string, SlotData[]>>({});
  const [teacherTimetable, setTeacherTimetable] = useState<Record<string, SlotData[]>>({});
  const [allSlots, setAllSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(false);

  // Assign / Edit Slot Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null);
  const [modalDay, setModalDay] = useState("Monday");
  const [modalPeriod, setModalPeriod] = useState(1);
  const [modalClassId, setModalClassId] = useState("");
  const [modalSubjectId, setModalSubjectId] = useState("");
  const [modalTeacherId, setModalTeacherId] = useState("");
  const [modalRoom, setModalRoom] = useState("");

  // Settings edit state
  const [editPeriods, setEditPeriods] = useState<PeriodConfig[]>([]);
  const [settingsCategory, setSettingsCategory] = useState<"PRIMARY" | "HIGHER">("PRIMARY");

  // Auto Generate Modal
  const [generating, setGenerating] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);

  // Clash Validation Modal
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [serverClashes, setServerClashes] = useState<any[]>([]);

  // Duplicate Timetable Modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [dupMode, setDupMode] = useState<"class" | "day">("class");
  const [dupTargetClassId, setDupTargetClassId] = useState("");
  const [dupSourceDay, setDupSourceDay] = useState("Monday");
  const [dupTargetDay, setDupTargetDay] = useState("Tuesday");
  const [duplicating, setDuplicating] = useState(false);

  // Free Teachers Finder Modal
  const [showFreeTeachersModal, setShowFreeTeachersModal] = useState(false);
  const [finderDay, setFinderDay] = useState("Monday");
  const [finderPeriod, setFinderPeriod] = useState<number>(1);
  const [finderSearch, setFinderSearch] = useState("");

  // Workload Matrix Filters
  const [workloadSearch, setWorkloadSearch] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState<"ALL" | "OVERLOADED" | "OPTIMAL" | "UNDERLOADED">("ALL");

  /* ─── Default period templates ─── */
  const defaultPeriods = (cat: string): PeriodConfig[] => {
    if (cat === "PRIMARY") {
      return [
        { periodNumber: 1, startTime: "09:00", endTime: "09:40", label: "Period 1", isBreak: false },
        { periodNumber: 2, startTime: "09:40", endTime: "10:20", label: "Period 2", isBreak: false },
        { periodNumber: 3, startTime: "10:20", endTime: "10:35", label: "Break", isBreak: true },
        { periodNumber: 4, startTime: "10:35", endTime: "11:15", label: "Period 3", isBreak: false },
        { periodNumber: 5, startTime: "11:15", endTime: "11:55", label: "Period 4", isBreak: false },
        { periodNumber: 6, startTime: "11:55", endTime: "12:30", label: "Lunch", isBreak: true },
        { periodNumber: 7, startTime: "12:30", endTime: "13:10", label: "Period 5", isBreak: false },
        { periodNumber: 8, startTime: "13:10", endTime: "13:50", label: "Period 6", isBreak: false },
      ];
    }
    return [
      { periodNumber: 1, startTime: "09:00", endTime: "09:45", label: "Period 1", isBreak: false },
      { periodNumber: 2, startTime: "09:45", endTime: "10:30", label: "Period 2", isBreak: false },
      { periodNumber: 3, startTime: "10:30", endTime: "10:45", label: "Break", isBreak: true },
      { periodNumber: 4, startTime: "10:45", endTime: "11:30", label: "Period 3", isBreak: false },
      { periodNumber: 5, startTime: "11:30", endTime: "12:15", label: "Period 4", isBreak: false },
      { periodNumber: 6, startTime: "12:15", endTime: "13:00", label: "Lunch", isBreak: true },
      { periodNumber: 7, startTime: "13:00", endTime: "13:45", label: "Period 5", isBreak: false },
      { periodNumber: 8, startTime: "13:45", endTime: "14:30", label: "Period 6", isBreak: false },
      { periodNumber: 9, startTime: "14:30", endTime: "15:15", label: "Period 7", isBreak: false },
      { periodNumber: 10, startTime: "15:15", endTime: "16:00", label: "Period 8", isBreak: false },
    ];
  };

  /* ─── Fetch helpers ─── */
  const fetchBaseData = async () => {
    try {
      const [cRes, tRes]: any = await Promise.all([
        api.get("/api/classes?limit=5000"),
        isTeacher ? Promise.resolve({ data: [] }) : api.get("/api/teachers?limit=5000"),
      ]);
      const rawClasses = Array.isArray(cRes) ? cRes : cRes?.data?.data || cRes?.data || [];
      const cl = sortClasses(rawClasses);
      const rawTeachers = Array.isArray(tRes) ? tRes : tRes?.data?.data || tRes?.data || [];
      const tl = [...rawTeachers].sort((a: any, b: any) =>
        (a.user?.name || "").localeCompare(b.user?.name || "")
      );

      setClasses(cl);
      setTeachers(tl);

      if (cl.length) {
        const studentClassId = isStudent ? (user as any)?.student?.classId : "";
        const initialClass = studentClassId && cl.some((c: any) => c.id === studentClassId) ? studentClassId : cl[0].id;
        setSelectedClassId(initialClass);
        setModalClassId(initialClass);
        if (cl.length > 1) setDupTargetClassId(cl[1].id);
      }
      if (isTeacher && user?.teacher?.id) {
        setSelectedTeacherId(user.teacher.id);
        setModalTeacherId(user.teacher.id);
      } else if (tl.length) {
        setSelectedTeacherId(tl[0].id);
        setModalTeacherId(tl[0].id);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchConfigs = async () => {
    try {
      const res: any = await api.get("/api/timetable/config");
      const all: PeriodConfig[] = Array.isArray(res) ? res : res?.data || [];
      const grouped: Record<string, PeriodConfig[]> = {
        PRIMARY: [],
        HIGHER: [],
      };
      all.forEach((c: any) => {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c);
      });
      Object.keys(grouped).forEach((k) =>
        grouped[k].sort((a, b) => a.periodNumber - b.periodNumber)
      );
      setConfigs(grouped);
    } catch {
      /* ignore */
    }
  };

  const fetchClassSchedule = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const [tRes, sRes]: any = await Promise.all([
        api.get(`/api/timetable/class?classId=${selectedClassId}`),
        api.get(`/api/classes/${selectedClassId}/subjects`),
      ]);
      setClassTimetable(tRes?.data || tRes || {});
      setSubjects(Array.isArray(sRes) ? sRes : sRes?.data || []);
    } catch {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async () => {
    if (!selectedTeacherId && !isTeacher) return;
    setLoading(true);
    try {
      const endpoint = isTeacher
        ? "/api/timetable/teacher"
        : `/api/timetable/teacher/${selectedTeacherId}`;
      const res: any = await api.get(endpoint);
      setTeacherTimetable(res?.data || res || {});
    } catch {
      toast.error("Failed to load teacher schedule");
    } finally {
      setLoading(false);
    }
  };

  const loadAllSlots = async (classList = classes) => {
    if (!classList.length) return;
    try {
      const responses = await Promise.all(
        classList.map((c) => api.get(`/api/timetable/class?classId=${c.id}`))
      );
      const all: SlotData[] = [];
      responses.forEach((r: any, idx: number) => {
        const clsObj = classList[idx];
        const byDay = r?.data || r || {};
        Object.values(byDay).forEach((slots: any) => {
          if (Array.isArray(slots)) {
            slots.forEach((s) => {
              all.push({
                ...s,
                class: s.class || { id: clsObj.id, name: clsObj.name, section: clsObj.section },
              });
            });
          }
        });
      });
      setAllSlots(all);
    } catch {
      /* ignore */
    }
  };

  /* ─── Effects ─── */
  useEffect(() => {
    fetchBaseData();
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (isAdmin && classes.length) loadAllSlots(classes);
  }, [isAdmin, classes]);

  useEffect(() => {
    if (isTeacher) {
      if (user?.teacher?.id) {
        setSelectedTeacherId(user.teacher.id);
        setModalTeacherId(user.teacher.id);
      }
      fetchTeacherSchedule();
    }
  }, [user, isTeacher]);

  useEffect(() => {
    if (selectedClassId) fetchClassSchedule();
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedTeacherId && !isTeacher) fetchTeacherSchedule();
  }, [selectedTeacherId]);

  useEffect(() => {
    if (activeTab === "workload" && classes.length) loadAllSlots(classes);
  }, [activeTab, classes]);

  useEffect(() => {
    if (activeTab === "settings") {
      setEditPeriods(
        configs[settingsCategory]?.length
          ? configs[settingsCategory].map((p) => ({ ...p }))
          : defaultPeriods(settingsCategory)
      );
    }
  }, [activeTab, settingsCategory, configs]);

  useEffect(() => {
    if (modalClassId) {
      api
        .get(`/api/classes/${modalClassId}/subjects`)
        .then((r: any) => setSubjects(Array.isArray(r) ? r : r?.data || []))
        .catch(() => {});
    }
  }, [modalClassId]);

  /* ─── Category & Periods Resolution ─── */
  const getClassCategory = (targetClassId = selectedClassId): "PRIMARY" | "HIGHER" => {
    const cls = classes.find((c) => c.id === targetClassId);
    if (!cls) return activeCategory;
    return resolveClassCategory(cls.name);
  };

  const getPeriodsForCategory = (cat: "PRIMARY" | "HIGHER"): PeriodConfig[] => {
    if (configs[cat]?.length) return configs[cat];
    return defaultPeriods(cat);
  };

  const currentPeriods = (): PeriodConfig[] => {
    const cat = activeTab === "class" ? getClassCategory() : activeCategory;
    return getPeriodsForCategory(cat);
  };

  const modalPeriodsList = useMemo(() => {
    const cat = getClassCategory(modalClassId || selectedClassId);
    return getPeriodsForCategory(cat).filter((p) => !p.isBreak);
  }, [modalClassId, selectedClassId, configs, classes]);

  /* ─── Accurate ERP Stats & Conflicts ─── */
  const conflictSlotKeys = useMemo(() => {
    const counts = new Map<string, number>();
    allSlots.forEach((s) => {
      if (!s.teacherId) return;
      const key = `${s.teacherId}_${s.day}_${s.periodNumber}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [allSlots]);

  const isConflicting = (slot: SlotData) => {
    if (!slot.teacherId || !allSlots.length) return false;
    return (conflictSlotKeys.get(`${slot.teacherId}_${slot.day}_${slot.periodNumber}`) || 0) > 1;
  };

  const totalConflicts = useMemo(() => {
    let clashes = 0;
    conflictSlotKeys.forEach((val) => {
      if (val > 1) clashes += val;
    });
    return clashes;
  }, [conflictSlotKeys]);

  const freePeriodsCount = useMemo(() => {
    if (!classes.length) return 0;
    const primaryTeachingCount = getPeriodsForCategory("PRIMARY").filter((c) => !c.isBreak).length;
    const higherTeachingCount = getPeriodsForCategory("HIGHER").filter((c) => !c.isBreak).length;
    let totalCapacity = 0;
    classes.forEach((c) => {
      const cat = resolveClassCategory(c.name);
      totalCapacity += (cat === "PRIMARY" ? primaryTeachingCount : higherTeachingCount) * DAYS.length;
    });
    return Math.max(0, totalCapacity - allSlots.length);
  }, [classes, configs, allSlots]);

  /* Busy teachers map for currently opened Assign Slot modal or Finder */
  const getBusyTeacherMap = (day: string, periodNumber: number, excludeSlotId?: string) => {
    const busy = new Map<string, string>();
    allSlots.forEach((s) => {
      if (s.id === excludeSlotId) return;
      if (s.day === day && s.periodNumber === periodNumber && s.teacherId) {
        const clsLabel = s.class ? `${s.class.name}-${s.class.section}` : "Another class";
        busy.set(s.teacherId, `${clsLabel} (${s.subject?.name || "Class"})`);
      }
    });
    return busy;
  };

  /* ─── Modal & Action Handlers ─── */
  const openSlotModal = (day: string, periodNumber?: number, existingSlot?: SlotData) => {
    if (!isAdmin) return;
    const cat = getClassCategory(existingSlot?.classId || selectedClassId);
    const validTeachingPeriods = getPeriodsForCategory(cat).filter((p) => !p.isBreak);
    const defaultPeriod = periodNumber || validTeachingPeriods[0]?.periodNumber || 1;

    setModalDay(day);
    setModalPeriod(defaultPeriod);
    if (existingSlot) {
      setEditingSlot(existingSlot);
      setModalClassId(existingSlot.classId);
      setModalSubjectId(existingSlot.subjectId);
      setModalTeacherId(existingSlot.teacherId);
      setModalRoom(existingSlot.room || "");
    } else {
      setEditingSlot(null);
      setModalClassId(selectedClassId);
      setModalSubjectId("");
      setModalTeacherId(teachers[0]?.id || "");
      const clsObj = classes.find((c) => c.id === selectedClassId);
      setModalRoom(clsObj ? `${clsObj.name}-${clsObj.section}` : "");
    }
    setShowModal(true);
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = getClassCategory(modalClassId);
    const period = getPeriodsForCategory(cat).find((p) => p.periodNumber === modalPeriod);
    const payload = {
      classId: modalClassId,
      subjectId: modalSubjectId,
      teacherId: modalTeacherId,
      day: modalDay,
      periodNumber: modalPeriod,
      startTime: period?.startTime || "",
      endTime: period?.endTime || "",
      room: modalRoom,
    };
    try {
      if (editingSlot) {
        await api.put(`/api/timetable/${editingSlot.id}`, payload);
        toast.success("Slot updated!");
      } else {
        await api.post("/api/timetable", payload);
        toast.success("Slot assigned!");
      }
      setShowModal(false);
      await Promise.all([
        fetchClassSchedule(),
        fetchTeacherSchedule(),
        isAdmin ? loadAllSlots(classes) : Promise.resolve(),
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Teacher or class conflict detected!");
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Delete this timetable slot?")) return;
    try {
      await api.delete(`/api/timetable/${id}`);
      toast.success("Slot deleted");
      await Promise.all([
        fetchClassSchedule(),
        fetchTeacherSchedule(),
        isAdmin ? loadAllSlots(classes) : Promise.resolve(),
      ]);
    } catch {
      toast.error("Failed to delete slot");
    }
  };

  /* ─── Validate Clashes Handler ─── */
  const handleValidateTimetable = async () => {
    setShowValidateModal(true);
    setValidating(true);
    try {
      const res: any = await api.get("/api/timetable/clashes");
      const list = Array.isArray(res) ? res : res?.data || [];
      setServerClashes(list);
      if (isAdmin) await loadAllSlots(classes);
    } catch {
      toast.error("Failed to run server clash validation");
    } finally {
      setValidating(false);
    }
  };

  /* ─── Duplicate Timetable Handler ─── */
  const handleDuplicateConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setDuplicating(true);
    let created = 0;
    let skipped = 0;

    try {
      if (dupMode === "day") {
        if (dupSourceDay === dupTargetDay) {
          toast.error("Source and target days must be different");
          setDuplicating(false);
          return;
        }
        const sourceSlots = classTimetable[dupSourceDay] || [];
        if (sourceSlots.length === 0) {
          toast.error(`No slots scheduled on ${dupSourceDay} to copy`);
          setDuplicating(false);
          return;
        }
        for (const s of sourceSlots) {
          try {
            await api.post("/api/timetable", {
              classId: selectedClassId,
              subjectId: s.subjectId,
              teacherId: s.teacherId,
              day: dupTargetDay,
              periodNumber: s.periodNumber,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room || "",
            });
            created++;
          } catch {
            skipped++;
          }
        }
      } else {
        if (!dupTargetClassId || dupTargetClassId === selectedClassId) {
          toast.error("Select a different target class");
          setDuplicating(false);
          return;
        }
        const sourceAll = Object.values(classTimetable).flat();
        if (sourceAll.length === 0) {
          toast.error("Current class has no slots to copy");
          setDuplicating(false);
          return;
        }
        for (const s of sourceAll) {
          try {
            await api.post("/api/timetable", {
              classId: dupTargetClassId,
              subjectId: s.subjectId,
              teacherId: s.teacherId,
              day: s.day,
              periodNumber: s.periodNumber,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room || "",
            });
            created++;
          } catch {
            skipped++;
          }
        }
      }

      toast.success(
        `Copied ${created} slots successfully${skipped > 0 ? ` (${skipped} skipped due to clashes/existing slots)` : ""}`
      );
      setShowDuplicateModal(false);
      await Promise.all([fetchClassSchedule(), loadAllSlots(classes)]);
    } catch {
      toast.error("Duplicate operation failed");
    } finally {
      setDuplicating(false);
    }
  };

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    const periods = currentPeriods();
    const rows: string[][] = [];
    if (activeTab === "workload") {
      rows.push(["Teacher", "Employee ID", "Specialization", "Periods/Week", "Classes"]);
      teachers.forEach((t) => {
        const tSlots = allSlots.filter((s) => s.teacherId === t.id);
        const clsNames = [...new Set(tSlots.map((s) => `${s.class?.name}-${s.class?.section}`))].join(" | ");
        rows.push([t.user?.name || "", t.employeeId || "", t.specialization || "General", String(tSlots.length), clsNames]);
      });
    } else {
      const source = activeTab === "class" ? classTimetable : teacherTimetable;
      rows.push(["Day", ...periods.map((p) => `${p.label} (${p.startTime}-${p.endTime})`)]);
      DAYS.forEach((day) => {
        const line = [day];
        periods.forEach((p) => {
          if (p.isBreak) line.push(p.label);
          else {
            const slot = (source[day] || []).find((s) => s.periodNumber === p.periodNumber);
            if (!slot) line.push("-");
            else if (activeTab === "class") line.push(`${slot.subject?.name || ""} (${slot.teacher?.user?.name || ""})`);
            else line.push(`${slot.subject?.name || ""} (${slot.class?.name}-${slot.class?.section})`);
          }
        });
        rows.push(line);
      });
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  /* ─── Settings save ─── */
  const handleSaveSettings = async () => {
    try {
      await api.post("/api/timetable/config", {
        category: settingsCategory,
        periods: editPeriods.map((p, i) => ({ ...p, periodNumber: i + 1 })),
      });
      toast.success(`${settingsCategory} period config saved!`);
      fetchConfigs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save");
    }
  };

  const addPeriodRow = () => {
    const teachingCount = editPeriods.filter((p) => !p.isBreak).length;
    setEditPeriods([
      ...editPeriods,
      {
        periodNumber: editPeriods.length + 1,
        startTime: "",
        endTime: "",
        label: `Period ${teachingCount + 1}`,
        isBreak: false,
      },
    ]);
  };

  const removePeriodRow = (idx: number) => {
    setEditPeriods(editPeriods.filter((_, i) => i !== idx));
  };

  const updatePeriodRow = (idx: number, field: string, value: any) => {
    const copy = [...editPeriods];
    (copy[idx] as any)[field] = value;
    setEditPeriods(copy);
  };

  const handleAutoRenumberLabels = () => {
    let count = 1;
    setEditPeriods(
      editPeriods.map((p, idx) => ({
        ...p,
        periodNumber: idx + 1,
        label: p.isBreak ? p.label : `Period ${count++}`,
      }))
    );
    toast.success("Period numbers & labels cleaned in preview — click Save Config to apply");
  };

  /* ─── Auto Generate ─── */
  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const res: any = await api.post("/api/timetable/generate-auto", { clearExisting });
      const count = res.data?.count || res?.count || 0;
      toast.success(`Auto-generated ${count} timetable slots successfully!`);
      setShowAutoModal(false);
      await Promise.all([fetchClassSchedule(), fetchTeacherSchedule(), loadAllSlots(classes)]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Auto-generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const selectedClassCategory = getClassCategory();

  /* Teacher Schedule Weekly Load */
  const teacherWeeklyCount = useMemo(() => {
    return Object.values(teacherTimetable).flat().length;
  }, [teacherTimetable]);

  /* Break/Period Misconfig Detection inside Period Settings */
  const misconfiguredBreakRows = editPeriods.filter(
    (p) => p.isBreak && p.label.toLowerCase().includes("period")
  );

  const tabs = [
    ...(!isTeacher
      ? [{ key: "class", label: "Class Timetable", icon: Layers }]
      : []),
    { key: "teacher", label: isTeacher ? "My Timetable" : "Teacher Timetable", icon: User },
    ...(isAdmin
      ? [
          { key: "workload", label: "Workload Matrix", icon: BarChart3 },
          { key: "settings", label: "Period Settings", icon: Settings },
        ]
      : []),
  ];

  const currentBusyTeachers = useMemo(() => {
    return getBusyTeacherMap(modalDay, modalPeriod, editingSlot?.id);
  }, [allSlots, modalDay, modalPeriod, editingSlot]);

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] print-landscape" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* ══ HEADER ══ */}
      <PageHeader
        title={isTeacher ? "My Weekly Timetable" : "Timetable Studio & Scheduler"}
        icon={<Calendar className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2 no-print">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFreeTeachersModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Free Teachers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutoModal(true)}
                  className="px-4 py-2 rounded-xl bg-white text-[#5B21B6] hover:bg-indigo-50 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Auto Generate
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="space-y-5 max-w-7xl mx-auto print:max-w-none print:w-full print:space-y-2">

          {/* ══ NAVIGATION PILLS ══ */}
          {!isTeacher && !isStudent && (
            <div className="bg-white rounded-[20px] border border-[#DDD7F3] shadow-[0_4px_18px_-6px_rgba(79,70,229,0.1)] p-2 no-print flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isSelected = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm shadow-indigo-500/25"
                        : "text-slate-600 hover:bg-[#F8FAFF] hover:text-[#5B21B6]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ══ LIGHT PASTEL KPI SUMMARY STRIP ══ */}
          {isAdmin && activeTab === "class" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 no-print">
              <div className="bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border border-[#D8CEF6] rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5B21B6] block">Total Classes</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#1E1B4B] mt-1 block">{classes.length}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#5B21B6] text-white flex items-center justify-center shadow-sm shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border border-blue-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">Faculty Members</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 block">{teachers.length}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border border-amber-200 rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Unassigned Slots</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block">{freePeriodsCount}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div
                onClick={handleValidateTimetable}
                className={`rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs border cursor-pointer transition-transform hover:-translate-y-0.5 ${
                  totalConflicts > 0
                    ? "bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-rose-200"
                    : "bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-emerald-200"
                }`}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${totalConflicts > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    Teacher Clashes
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black mt-1 block ${totalConflicts > 0 ? "text-rose-950" : "text-emerald-950"}`}>
                    {totalConflicts}
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm shrink-0 ${totalConflicts > 0 ? "bg-rose-500" : "bg-emerald-600"}`}>
                  {totalConflicts > 0 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
              </div>
            </div>
          )}

          {/* ══ COMMAND TOOLBAR ══ */}
          {(activeTab === "class" || activeTab === "teacher") && (
            <div className="bg-white p-4 rounded-[22px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] border border-[#DDD7F3] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 no-print">
              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && activeTab === "class" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openSlotModal("Monday")}
                      className="px-3.5 py-2 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Assign Slot
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateTimetable}
                      className="px-3.5 py-2 bg-[#F8FAFF] hover:bg-[#F2EDFF] border border-indigo-100 text-[#1E1B4B] hover:text-[#5B21B6] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Validate Clashes
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDuplicateModal(true)}
                      className="px-3.5 py-2 bg-[#F8FAFF] hover:bg-[#F2EDFF] border border-indigo-100 text-[#1E1B4B] hover:text-[#5B21B6] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-500" /> Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("workload")}
                      className="px-3.5 py-2 bg-[#F8FAFF] hover:bg-[#F2EDFF] border border-indigo-100 text-[#1E1B4B] hover:text-[#5B21B6] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> Workload
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-[#F8FAFF] hover:bg-emerald-50 border border-indigo-100 hover:border-emerald-200 text-[#1E1B4B] hover:text-emerald-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsCategory(activeTab === "class" ? selectedClassCategory : activeCategory);
                      setActiveTab("settings");
                    }}
                    className="px-3.5 py-2 bg-[#F8FAFF] hover:bg-[#F2EDFF] border border-indigo-100 text-[#1E1B4B] hover:text-[#5B21B6] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" /> Period Settings
                  </button>
                )}
              </div>

              {/* Filter Selector */}
              <div className="flex flex-wrap items-center gap-2.5 bg-[#F8FAFF] px-3.5 py-2 rounded-2xl border border-indigo-100">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {activeTab === "class" ? "Class:" : "Faculty:"}
                </span>
                {isTeacher ? (
                  <span className="text-xs font-black text-[#1E1B4B]">
                    {user?.name} {user?.teacher?.employeeId ? `(${user.teacher.employeeId})` : ""}
                  </span>
                ) : activeTab === "class" ? (
                  <>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={isStudent}
                      className="bg-white border border-indigo-100 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-black text-[#1E1B4B] outline-none focus:border-[#5B21B6] cursor-pointer"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.section ? `-${c.section}` : ""}
                        </option>
                      ))}
                    </select>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                      selectedClassCategory === "PRIMARY"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[#F2EDFF] text-[#5B21B6] border-[#DDD7F3]"
                    }`}>
                      {selectedClassCategory} BELLS
                    </span>
                  </>
                ) : (
                  <>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="bg-white border border-indigo-100 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-black text-[#1E1B4B] outline-none focus:border-[#5B21B6] cursor-pointer max-w-[230px]"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user?.name} ({t.employeeId || "Staff"})
                        </option>
                      ))}
                    </select>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3]">
                      {teacherWeeklyCount} Periods / Week
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ CONTENT AREA ══ */}
          {loading ? (
            <LoadingSpinner size="lg" className="py-16" />
          ) : (
            <>
              {/* ── TAB 1: CLASS TIMETABLE GRID ── */}
              {activeTab === "class" && (
                <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] overflow-hidden print:border-0 print:shadow-none">
                  {/* Print Only Header */}
                  <div className="hidden print:block text-center mb-3 pt-2">
                    <h1 className="text-2xl font-black text-[#5B21B6]">SRI VENKATESWARA JY SCHOOL</h1>
                    <h2 className="text-base font-bold text-slate-800 mt-0.5">
                      Class Timetable —{" "}
                      {selectedClassObj
                        ? `${selectedClassObj.name}${selectedClassObj.section ? `-${selectedClassObj.section}` : ""}`
                        : "All Classes"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Academic Year: {selectedClassObj?.academicYear || "2026-2027"}</p>
                  </div>

                  {/* Mobile Day Switcher */}
                  <div className="md:hidden p-3 border-b border-indigo-50 bg-[#F8FAFF] no-print">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDayMobile(d)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                            selectedDayMobile === d
                              ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs"
                              : "bg-white text-slate-600 border border-indigo-100"
                          }`}
                        >
                          {d.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Day Cards View */}
                  <div className="md:hidden p-3.5 space-y-2.5 no-print">
                    {currentPeriods().map((period) => {
                      if (period.isBreak) {
                        return (
                          <div key={period.periodNumber} className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                              {period.label.toLowerCase().includes("lunch") ? <Utensils className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                              {period.label}
                            </span>
                            <span className="text-[11px] font-bold text-amber-700">{period.startTime} – {period.endTime}</span>
                          </div>
                        );
                      }
                      const slot = (classTimetable[selectedDayMobile] || []).find((s) => s.periodNumber === period.periodNumber);
                      if (slot) {
                        const color = getColor(slot.subject?.name || "");
                        const conflict = isConflicting(slot);
                        return (
                          <div
                            key={period.periodNumber}
                            onClick={() => isAdmin && openSlotModal(selectedDayMobile, period.periodNumber, slot)}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${conflict ? "ring-2 ring-rose-500" : ""}`}
                            style={{ backgroundColor: color.bg, color: color.text, borderColor: conflict ? "#F43F5E" : color.border }}
                          >
                            <div className="min-w-0">
                              <div className="text-[10px] font-black uppercase opacity-75">{period.label} · {period.startTime}–{period.endTime}</div>
                              <div className="font-black text-sm truncate mt-0.5">{slot.subject?.name}</div>
                              <div className="text-xs font-bold opacity-85 truncate">{slot.teacher?.user?.name}</div>
                            </div>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                className="p-2 rounded-xl bg-white/80 text-rose-500 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={period.periodNumber}
                          onClick={() => isAdmin && openSlotModal(selectedDayMobile, period.periodNumber)}
                          className="p-3.5 rounded-2xl border border-dashed border-indigo-200 bg-[#F8FAFF] flex items-center justify-between text-slate-400"
                        >
                          <div>
                            <div className="text-xs font-black text-slate-600">{period.label}</div>
                            <div className="text-[10px] font-bold">{period.startTime} – {period.endTime}</div>
                          </div>
                          {isAdmin && <span className="text-[11px] font-black text-[#5B21B6]">+ Assign</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Weekly Grid Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="student-grid-table w-full border-collapse min-w-[920px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                          <th className="p-3.5 text-left text-[11px] font-black uppercase tracking-wider !text-white w-28 sticky left-0 bg-[#6D38EA] z-20 border-r border-white/15">
                            Day \ Period
                          </th>
                          {currentPeriods().map((period) => (
                            <th
                              key={period.periodNumber}
                              className={`p-3 text-center border-l border-white/15 ${
                                period.isBreak ? "bg-amber-500/30 min-w-[82px]" : "min-w-[115px]"
                              }`}
                            >
                              <div className="text-xs print:text-[9px] font-black !text-white uppercase tracking-wide flex items-center justify-center gap-1">
                                {period.isBreak && <Coffee className="w-3 h-3 text-amber-200" />}
                                {period.label}
                              </div>
                              <div className="text-[10px] print:text-[7px] !text-white/80 font-bold mt-0.5">
                                {period.startTime} – {period.endTime}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentPeriods().length === 0 ? (
                          <tr>
                            <td colSpan={12} className="p-12 text-center text-sm font-bold text-slate-400">
                              No period configuration found. Go to <strong>Period Settings</strong> tab to set up periods first.
                            </td>
                          </tr>
                        ) : (
                          DAYS.map((day, dIdx) => {
                            const daySlots = classTimetable[day] || [];
                            const teachTotal = currentPeriods().filter((p) => !p.isBreak).length;
                            return (
                              <tr key={day} className={`${dIdx % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"} border-b border-indigo-50`}>
                                <td className={`p-3 print:p-1.5 border-r border-indigo-100 sticky left-0 z-10 ${dIdx % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"}`}>
                                  <div className="text-xs print:text-[9px] font-black text-[#1E1B4B] uppercase tracking-wider">{day}</div>
                                  <div className="text-[10px] font-bold text-slate-400 mt-0.5 no-print">
                                    {daySlots.length}/{teachTotal} filled
                                  </div>
                                </td>

                                {currentPeriods().map((period) => {
                                  if (period.isBreak) {
                                    const isLunch = period.label.toLowerCase().includes("lunch");
                                    return (
                                      <td
                                        key={period.periodNumber}
                                        className={`p-2 print:p-1 border-l border-indigo-50 text-center ${
                                          isLunch ? "bg-orange-50/50" : "bg-amber-50/40"
                                        }`}
                                      >
                                        <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] print:text-[8px] font-black uppercase tracking-wide ${
                                          isLunch
                                            ? "bg-orange-100/80 text-orange-700"
                                            : "bg-amber-100/80 text-amber-700"
                                        }`}>
                                          {isLunch ? <Utensils className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                                          {period.label}
                                        </span>
                                      </td>
                                    );
                                  }

                                  const slot = daySlots.find((s) => s.periodNumber === period.periodNumber);
                                  if (slot) {
                                    const color = getColor(slot.subject?.name || "");
                                    const conflict = isConflicting(slot);
                                    return (
                                      <td key={period.periodNumber} className="p-1.5 print:p-0.5 border-l border-indigo-50 align-top">
                                        <div
                                          onClick={() => isAdmin && openSlotModal(day, period.periodNumber, slot)}
                                          className={`rounded-xl p-2.5 print:p-1.5 relative group transition-all border shadow-2xs ${
                                            isAdmin ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : ""
                                          } ${conflict ? "ring-2 ring-rose-500" : ""}`}
                                          style={{
                                            backgroundColor: color.bg,
                                            color: color.text,
                                            borderColor: conflict ? "#EF4444" : color.border,
                                          }}
                                        >
                                          <div className="font-black text-xs print:text-[9px] leading-tight truncate flex items-center gap-1">
                                            {conflict && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
                                            <span className="hidden lg:inline">{slot.subject?.name}</span>
                                            <span className="lg:hidden">{abbreviateSubject(slot.subject?.name || "")}</span>
                                          </div>
                                          <div className="text-[10px] print:text-[8px] font-bold text-slate-600 mt-1 truncate flex items-center gap-1">
                                            <User className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                            {slot.teacher?.user?.name || "Unassigned"}
                                          </div>
                                          {slot.room && (
                                            <div className="text-[9px] print:text-[7px] font-bold text-slate-500 mt-0.5 flex items-center gap-0.5 truncate">
                                              <Building className="w-2.5 h-2.5 shrink-0" /> {slot.room}
                                            </div>
                                          )}
                                          {isAdmin && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSlot(slot.id);
                                              }}
                                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 cursor-pointer no-print shadow-xs"
                                              title="Remove slot"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={period.periodNumber} className="p-1.5 print:p-0.5 border-l border-indigo-50">
                                      <div
                                        onClick={() => isAdmin && openSlotModal(day, period.periodNumber)}
                                        className={`rounded-xl border border-dashed border-indigo-200/80 bg-[#F8FAFF]/60 h-[62px] print:h-8 flex flex-col items-center justify-center transition-all ${
                                          isAdmin ? "cursor-pointer hover:bg-[#F2EDFF] hover:border-[#5B21B6]/50 group" : ""
                                        }`}
                                      >
                                        {isAdmin ? (
                                          <Plus className="w-4 h-4 text-indigo-300 group-hover:text-[#5B21B6] transition-colors no-print" />
                                        ) : (
                                          <span className="text-[10px] font-bold text-slate-300">—</span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 2: TEACHER TIMETABLE GRID ── */}
              {activeTab === "teacher" && (
                <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] overflow-hidden print:border-0 print:shadow-none">
                  <div className="hidden print:block text-center mb-4 pt-2">
                    <h1 className="text-2xl font-black text-[#5B21B6]">SRI VENKATESWARA JY SCHOOL</h1>
                    <h2 className="text-base font-bold text-slate-800 mt-0.5">
                      Teacher Timetable — {teachers.find((t) => t.id === selectedTeacherId)?.user?.name || user?.name || ""}
                    </h2>
                    <p className="text-xs text-slate-500">Bell Schedule: {activeCategory}</p>
                  </div>

                  {/* Category toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-indigo-50 bg-[#F8FAFF] no-print">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1">Bell Grid:</span>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            activeCategory === cat
                              ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs"
                              : "bg-white border border-indigo-100 text-slate-600 hover:text-[#5B21B6]"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Assigned Weekly Periods: <strong className="text-[#5B21B6]">{teacherWeeklyCount}</strong>
                    </span>
                  </div>

                  {/* Mobile Day Selector */}
                  <div className="md:hidden p-3 border-b border-indigo-50 bg-[#F8FAFF] no-print">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {DAYS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDayMobile(d)}
                          className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                            selectedDayMobile === d
                              ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-sm"
                              : "bg-white text-slate-600 border border-indigo-100"
                          }`}
                        >
                          {d.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Schedule Cards */}
                  <div className="md:hidden p-3.5 space-y-2.5 no-print">
                    {getPeriodsForCategory(activeCategory).map((period) => {
                      if (period.isBreak) {
                        return (
                          <div key={period.periodNumber} className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                            <span className="text-amber-800 font-black text-xs flex items-center gap-2">
                              <Clock className="w-4 h-4" /> {period.label}
                            </span>
                            <span className="text-[11px] font-bold text-amber-700">{period.startTime} – {period.endTime}</span>
                          </div>
                        );
                      }
                      const slot = (teacherTimetable[selectedDayMobile] || []).find((s) => s.periodNumber === period.periodNumber);
                      if (slot) {
                        const color = getColor(slot.subject?.name || "");
                        return (
                          <div key={period.periodNumber} className="p-4 rounded-2xl border flex items-center justify-between gap-3" style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white/85 flex flex-col items-center justify-center font-black text-xs shrink-0">
                                P{period.periodNumber}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-sm truncate">{slot.subject?.name}</h4>
                                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-white/85 inline-block mt-1">
                                  {slot.class?.name}-{slot.class?.section}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-bold shrink-0">
                              <div>{period.startTime}</div>
                              <div className="opacity-70">{period.endTime}</div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={period.periodNumber} className="p-3.5 rounded-2xl border border-dashed border-indigo-200 bg-[#F8FAFF] flex items-center justify-between text-slate-400">
                          <div>
                            <p className="text-xs font-black text-slate-600">{period.label} — Free</p>
                            <p className="text-[10px] font-semibold">{period.startTime} – {period.endTime}</p>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-indigo-100 text-slate-400 rounded-lg">Free</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Teacher Matrix */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="student-grid-table w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                          <th className="p-3.5 text-left text-[11px] font-black uppercase tracking-wider !text-white w-28 sticky left-0 bg-[#6D38EA] z-20 border-r border-white/15">
                            Day \ Period
                          </th>
                          {getPeriodsForCategory(activeCategory).map((period) => (
                            <th
                              key={period.periodNumber}
                              className={`p-3 text-center border-l border-white/15 ${
                                period.isBreak ? "bg-amber-500/30 min-w-[82px]" : "min-w-[115px]"
                              }`}
                            >
                              <div className="text-xs print:text-[9px] font-black !text-white uppercase">{period.label}</div>
                              <div className="text-[10px] print:text-[7px] !text-white/80 font-bold mt-0.5">{period.startTime} – {period.endTime}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map((day, dIdx) => (
                          <tr key={day} className={`${dIdx % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"} border-b border-indigo-50`}>
                            <td className="p-3 border-r border-indigo-100">
                              <div className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider">{day}</div>
                            </td>
                            {getPeriodsForCategory(activeCategory).map((period) => {
                              if (period.isBreak) {
                                return (
                                  <td key={period.periodNumber} className="p-2 border-l border-indigo-50 text-center bg-amber-50/40">
                                    <span className="text-[10px] font-black text-amber-700 uppercase">{period.label}</span>
                                  </td>
                                );
                              }
                              const slot = (teacherTimetable[day] || []).find((s) => s.periodNumber === period.periodNumber);
                              if (slot) {
                                const color = getColor(slot.subject?.name || "");
                                const conflict = isConflicting(slot);
                                return (
                                  <td key={period.periodNumber} className="p-1.5 border-l border-indigo-50">
                                    <div
                                      className={`rounded-xl p-2.5 border ${conflict ? "ring-2 ring-rose-500" : ""}`}
                                      style={{ backgroundColor: color.bg, color: color.text, borderColor: conflict ? "#EF4444" : color.border }}
                                    >
                                      <div className="font-black text-xs truncate flex items-center gap-1">
                                        {conflict && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                                        {slot.subject?.name}
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-600 mt-1 truncate">
                                        {slot.class?.name}-{slot.class?.section}
                                      </div>
                                    </div>
                                  </td>
                                );
                              }
                              return (
                                <td key={period.periodNumber} className="p-1.5 border-l border-indigo-50">
                                  <div className="rounded-xl border border-dashed border-indigo-100 bg-[#F8FAFF]/60 h-14 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                    Free
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 3: WORKLOAD MATRIX ── */}
              {activeTab === "workload" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-[20px] border border-[#DDD7F3] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs no-print">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={workloadSearch}
                        onChange={(e) => setWorkloadSearch(e.target.value)}
                        placeholder="Search faculty name, ID or specialization..."
                        className="w-full pl-10 pr-4 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
                      {[
                        { id: "ALL", label: "All Faculty" },
                        { id: "OVERLOADED", label: "Overloaded (>30)" },
                        { id: "OPTIMAL", label: "Optimal (20–30)" },
                        { id: "UNDERLOADED", label: "Light (<20)" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setWorkloadFilter(f.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                            workloadFilter === f.id
                              ? "bg-[#5B21B6] text-white shadow-xs"
                              : "text-slate-600 hover:text-[#5B21B6]"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="ml-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[22px] border border-[#DDD7F3] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="student-grid-table w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6]">
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider">Teacher</th>
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider">Employee ID</th>
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider text-center">Periods / Wk</th>
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider">Classes Covered</th>
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider w-56">Load Gauge</th>
                            <th className="p-3.5 font-black !text-white text-xs uppercase tracking-wider text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                          {teachers
                            .filter((t) => {
                              const tCount = allSlots.filter((s) => s.teacherId === t.id).length;
                              const q = workloadSearch.trim().toLowerCase();
                              const matchesQ =
                                !q ||
                                (t.user?.name || "").toLowerCase().includes(q) ||
                                (t.employeeId || "").toLowerCase().includes(q) ||
                                (t.specialization || "").toLowerCase().includes(q);
                              const matchesSt =
                                workloadFilter === "ALL" ||
                                (workloadFilter === "OVERLOADED" && tCount > 30) ||
                                (workloadFilter === "OPTIMAL" && tCount >= 20 && tCount <= 30) ||
                                (workloadFilter === "UNDERLOADED" && tCount < 20);
                              return matchesQ && matchesSt;
                            })
                            .map((t) => {
                              const tSlots = allSlots.filter((s) => s.teacherId === t.id);
                              const count = tSlots.length;
                              const maxLoad = 30;
                              const pct = Math.min((count / maxLoad) * 100, 100);
                              const uniqueClasses =
                                [...new Set(tSlots.map((s) => `${s.class?.name}-${s.class?.section}`))].join(", ") || "—";
                              return (
                                <tr key={t.id} className="hover:bg-[#F8FAFF] transition-colors">
                                  <td className="p-3.5">
                                    <div className="font-black text-[#1E1B4B] text-sm">{t.user?.name}</div>
                                    <div className="text-[11px] font-semibold text-slate-400">{t.specialization || "General"}</div>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-[#F2EDFF] text-[#5B21B6] border border-[#DDD7F3] text-xs font-black">
                                      {t.employeeId || "—"}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center text-sm font-black text-[#1E1B4B]">{count}</td>
                                  <td className="p-3.5 text-xs text-slate-600 font-bold max-w-[220px] truncate" title={uniqueClasses}>
                                    {uniqueClasses}
                                  </td>
                                  <td className="p-3.5">
                                    <div className="w-full bg-indigo-50 rounded-full h-2.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          count > 30 ? "bg-rose-500" : count >= 20 ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-black mt-1 text-right">{count}/{maxLoad}</div>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                        count > 30
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : count >= 20
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {count > 30 ? "Overloaded" : count >= 20 ? "Optimal" : "Light"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: PERIOD SETTINGS ── */}
              {activeTab === "settings" && isAdmin && (
                <div className="bg-white rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_24px_-8px_rgba(79,70,229,0.1)] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-50">
                    <div>
                      <h3 className="text-lg font-black text-[#1E1B4B]">Bell Schedule & Period Configuration</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Configure teaching slots, start/end timings, and break intervals separately for Primary & Higher sections
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F8FAFF] p-1 rounded-xl border border-indigo-100">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSettingsCategory(cat)}
                          className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            settingsCategory === cat
                              ? "bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs"
                              : "text-slate-600 hover:text-[#5B21B6]"
                          }`}
                        >
                          {cat === "PRIMARY" ? "PRIMARY (Nur–5th)" : "HIGHER (6th–10th)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smart Misconfiguration Warning */}
                  {misconfiguredBreakRows.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs font-bold leading-relaxed">
                          <span className="font-black block">Misconfigured Break Detected!</span>
                          {misconfiguredBreakRows.map((m) => m.label).join(", ")} is currently marked as <strong>Type: Break</strong> even though its label says "Period". Switch Type to <strong>Teaching Period</strong> if students have classes then!
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoRenumberLabels}
                        className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 text-[11px] font-black shrink-0 cursor-pointer hover:bg-amber-100"
                      >
                        Auto-Fix Numbering
                      </button>
                    </div>
                  )}

                  {/* Period rows editor */}
                  <div className="space-y-2.5">
                    <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">
                      <div className="col-span-1">#</div>
                      <div className="col-span-3">Label</div>
                      <div className="col-span-2">Start Time</div>
                      <div className="col-span-2">End Time</div>
                      <div className="col-span-1 text-center">Dur</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-1 text-right">Del</div>
                    </div>

                    {editPeriods.map((p, idx) => {
                      const mins = calcDurationMins(p.startTime, p.endTime);
                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl border transition-colors ${
                            p.isBreak
                              ? "bg-amber-50/60 border-amber-200"
                              : "bg-[#F8FAFF] border-indigo-100"
                          }`}
                        >
                          <div className="col-span-1 text-xs font-black text-[#5B21B6]">#{idx + 1}</div>
                          <div className="col-span-1 sm:col-span-3">
                            <input
                              value={p.label}
                              onChange={(e) => updatePeriodRow(idx, "label", e.target.value)}
                              className="w-full bg-white border border-indigo-100 rounded-xl px-3 py-2 text-xs font-black text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <input
                              type="time"
                              value={p.startTime}
                              onChange={(e) => updatePeriodRow(idx, "startTime", e.target.value)}
                              className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <input
                              type="time"
                              value={p.endTime}
                              onChange={(e) => updatePeriodRow(idx, "endTime", e.target.value)}
                              className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs font-bold text-[#1E1B4B] outline-none focus:border-[#5B21B6]"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <span className="px-2 py-1 rounded-lg bg-white border border-indigo-100 text-[10px] font-black text-slate-600">
                              {mins ? `${mins}m` : "—"}
                            </span>
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <select
                              value={p.isBreak ? "break" : "period"}
                              onChange={(e) => updatePeriodRow(idx, "isBreak", e.target.value === "break")}
                              className="w-full bg-white border border-indigo-100 rounded-xl px-2.5 py-2 text-xs font-black text-[#1E1B4B] outline-none cursor-pointer"
                            >
                              <option value="period">Teaching Period</option>
                              <option value="break">Break / Lunch</option>
                            </select>
                          </div>
                          <div className="col-span-2 sm:col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => removePeriodRow(idx)}
                              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-indigo-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-50">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addPeriodRow}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-[#5B21B6]/40 bg-[#F8FAFF] text-xs font-black text-[#5B21B6] hover:bg-[#F2EDFF] transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Period / Break
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoRenumberLabels}
                        className="px-3.5 py-2.5 rounded-xl bg-[#F8FAFF] border border-indigo-100 text-xs font-black text-slate-600 hover:text-[#5B21B6] cursor-pointer"
                      >
                        Renumber Labels
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white rounded-xl flex items-center gap-2 text-xs font-black shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save {settingsCategory} Config
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ ASSIGN / EDIT SLOT MODAL (With Live Availability Check) ══ */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black">{editingSlot ? "Edit Slot" : "Assign Timetable Slot"}</h3>
                    <p className="text-xs font-semibold text-indigo-100">{modalDay} · Period {modalPeriod}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSlotSubmit} className="p-6 space-y-4 bg-[#F8FAFF]">
                  <div>
                    <label className="label">Class</label>
                    <select value={modalClassId} onChange={(e) => setModalClassId(e.target.value)} className="input" required>
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}{c.section ? `-${c.section}` : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Day</label>
                      <select value={modalDay} onChange={(e) => setModalDay(e.target.value)} className="input">
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Teaching Period</label>
                      <select
                        value={modalPeriod}
                        onChange={(e) => setModalPeriod(Number(e.target.value))}
                        className="input"
                        required
                      >
                        {modalPeriodsList.map((p) => (
                          <option key={p.periodNumber} value={p.periodNumber}>
                            {p.label} ({p.startTime}–{p.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Subject</label>
                    <select value={modalSubjectId} onChange={(e) => setModalSubjectId(e.target.value)} className="input" required>
                      <option value="">Select Subject</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0">Teacher (Live Availability)</label>
                      {modalTeacherId && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          currentBusyTeachers.has(modalTeacherId)
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {currentBusyTeachers.has(modalTeacherId)
                            ? `Busy: ${currentBusyTeachers.get(modalTeacherId)}`
                            : "Available"}
                        </span>
                      )}
                    </div>
                    <select value={modalTeacherId} onChange={(e) => setModalTeacherId(e.target.value)} className="input" required>
                      <option value="">Select Teacher</option>
                      {teachers.map((t) => {
                        const busyIn = currentBusyTeachers.get(t.id);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.user?.name} {busyIn ? `[Busy: ${busyIn}]` : "[Free]"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="label">Room (optional)</label>
                    <input type="text" value={modalRoom} onChange={(e) => setModalRoom(e.target.value)} placeholder="e.g. Room 201" className="input" />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs font-black uppercase">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-black uppercase shadow-sm cursor-pointer">
                      {editingSlot ? "Update Slot" : "Assign Slot"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══ VALIDATION & CLASH DIAGNOSTIC MODAL ══ */}
          {showValidateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <h3 className="text-base font-black">Timetable Clash Validator</h3>
                      <p className="text-[11px] font-semibold text-indigo-100">Live conflict scan across all classes & teachers</p>
                    </div>
                  </div>
                  <button onClick={() => setShowValidateModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 bg-[#F8FAFF] max-h-[70vh] overflow-y-auto space-y-4">
                  {validating ? (
                    <LoadingSpinner size="md" className="py-10" />
                  ) : serverClashes.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                      <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                      <h4 className="text-base font-black text-emerald-950">Zero Schedule Conflicts Detected!</h4>
                      <p className="text-xs font-bold text-emerald-700">No teacher is double-booked across any day or period.</p>
                    </div>
                  ) : (
                    serverClashes.map((clash, idx) => (
                      <div key={idx} className="bg-white border border-rose-200 rounded-2xl p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-500" /> {clash.teacher}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase">
                            {clash.day} · Period {clash.periodNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(clash.conflictingSlots || []).map((cs: any) => (
                            <div key={cs.id} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>{cs.class?.name}-{cs.class?.section} · {cs.subject?.name}</span>
                              <button
                                type="button"
                                onClick={() => { setShowValidateModal(false); handleDeleteSlot(cs.id); }}
                                className="text-rose-600 hover:underline font-black cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-6 py-4 bg-white border-t border-indigo-50 flex justify-end">
                  <button onClick={() => setShowValidateModal(false)} className="px-5 py-2 rounded-xl bg-[#5B21B6] text-white text-xs font-black uppercase cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ DUPLICATE TIMETABLE MODAL ══ */}
          {showDuplicateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Copy className="w-5 h-5" />
                    <h3 className="text-base font-black">Duplicate / Copy Schedule</h3>
                  </div>
                  <button onClick={() => setShowDuplicateModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleDuplicateConfirm} className="p-6 space-y-4 bg-[#F8FAFF]">
                  <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-indigo-100">
                    <button
                      type="button"
                      onClick={() => setDupMode("class")}
                      className={`py-2 rounded-lg text-xs font-black cursor-pointer ${dupMode === "class" ? "bg-[#5B21B6] text-white" : "text-slate-600"}`}
                    >
                      Copy to Another Class
                    </button>
                    <button
                      type="button"
                      onClick={() => setDupMode("day")}
                      className={`py-2 rounded-lg text-xs font-black cursor-pointer ${dupMode === "day" ? "bg-[#5B21B6] text-white" : "text-slate-600"}`}
                    >
                      Copy Day → Day
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-bold text-[#5B21B6]">
                    Source Class: <strong>{selectedClassObj?.name}-{selectedClassObj?.section}</strong>
                  </div>

                  {dupMode === "class" ? (
                    <div>
                      <label className="label">Target Class</label>
                      <select value={dupTargetClassId} onChange={(e) => setDupTargetClassId(e.target.value)} className="input" required>
                        <option value="">Select Target Class...</option>
                        {classes.filter((c) => c.id !== selectedClassId).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">From Day</label>
                        <select value={dupSourceDay} onChange={(e) => setDupSourceDay(e.target.value)} className="input">
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">To Day</label>
                        <select value={dupTargetDay} onChange={(e) => setDupTargetDay(e.target.value)} className="input">
                          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] font-semibold text-slate-500">
                    Note: Conflicting teacher slots or already filled periods are automatically skipped safely.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowDuplicateModal(false)} className="btn-secondary text-xs font-black uppercase">Cancel</button>
                    <button type="submit" disabled={duplicating} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-black uppercase shadow-sm cursor-pointer disabled:opacity-60">
                      {duplicating ? "Copying..." : "Copy Schedule"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══ FREE TEACHERS FINDER MODAL ══ */}
          {showFreeTeachersModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
                <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5" />
                    <div>
                      <h3 className="text-base font-black">Free Teachers Finder (Substitution Lookup)</h3>
                      <p className="text-[11px] font-semibold text-indigo-100">Instantly inspect which teachers are free vs busy for any day & period</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFreeTeachersModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 bg-[#F8FAFF] border-b border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                  <select value={finderDay} onChange={(e) => setFinderDay(e.target.value)} className="input text-xs font-bold">
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={finderPeriod} onChange={(e) => setFinderPeriod(Number(e.target.value))} className="input text-xs font-bold">
                    {currentPeriods().filter((p) => !p.isBreak).map((p) => (
                      <option key={p.periodNumber} value={p.periodNumber}>{p.label} ({p.startTime}–{p.endTime})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={finderSearch}
                    onChange={(e) => setFinderSearch(e.target.value)}
                    placeholder="Filter teacher..."
                    className="input text-xs font-bold"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-5 bg-[#F8FAFF] space-y-2.5 custom-scrollbar">
                  {(() => {
                    const busyMap = getBusyTeacherMap(finderDay, finderPeriod);
                    return teachers
                      .filter((t) => !finderSearch.trim() || (t.user?.name || "").toLowerCase().includes(finderSearch.trim().toLowerCase()))
                      .sort((a, b) => Number(busyMap.has(a.id)) - Number(busyMap.has(b.id)))
                      .map((t) => {
                        const busyReason = busyMap.get(t.id);
                        return (
                          <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-[#1E1B4B]">{t.user?.name}</div>
                              <div className="text-[11px] font-bold text-slate-400">{t.employeeId || "Staff"} · {t.specialization || "General"}</div>
                            </div>
                            {busyReason ? (
                              <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black">
                                Busy · {busyReason}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black">
                                Free / Available
                              </span>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ══ AUTO GENERATE MODAL ══ */}
          {showAutoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[26px] border border-[#DDD7F3] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] px-6 py-4 text-white flex items-center justify-between">
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Wand2 className="w-5 h-5" /> Auto Generate Timetable
                  </h3>
                  <button onClick={() => setShowAutoModal(false)} className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 bg-[#F8FAFF]">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-bold text-[#1E1B4B] leading-relaxed">
                      <strong>How it works:</strong> Reads all Class → Subject → Teacher assignments from the Subjects module and your Period Settings (PRIMARY & HIGHER), then builds a clash-free Monday–Saturday timetable.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-indigo-100 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="w-4 h-4 text-[#5B21B6] rounded"
                    />
                    <div>
                      <span className="text-sm font-black text-[#1E1B4B] block">Clear existing timetable first</span>
                      <span className="text-[11px] font-semibold text-slate-400">If unchecked, fills only empty slots</span>
                    </div>
                  </label>

                  {clearExisting && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                      Warning: This will replace all existing timetable entries across classes.
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowAutoModal(false)} className="btn-secondary text-xs font-black uppercase">Cancel</button>
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      disabled={generating}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white text-xs font-black uppercase shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {generating ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4" /> Generate Now</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;
