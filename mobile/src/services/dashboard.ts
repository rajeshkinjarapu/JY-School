// src/services/dashboard.ts
import { api } from "./api";

type AttendanceSummary = {
  total: number;
  present: number;
};

type FeeInfo = {
  totalDue: number;
  totalPaid: number;
};

type RecentResult = {
  examName: string;
  subject: string;
  score: number;
  maxScore: number;
};

export interface StudentDashboardData {
  attendanceToday: number;
  attendanceSummary: AttendanceSummary;
  feeInfo: FeeInfo;
  recentPayments: any[]; // you can type more precisely if needed
  recentResults: RecentResult[];
}

export const fetchStudentDashboard = async (): Promise<StudentDashboardData> => {
  const resp = await api.get("/dashboard/student");
  return resp.data as StudentDashboardData;
};
