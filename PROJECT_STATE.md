# JY School Project State

## Attendance System Enhancements (October 30, 2026)

### 1. Daily Attendance Report (`/attendance/daily-report`)
- **Restored Exact Previous UI/Design:** Reverted from the custom iframe print back to the clean, modern original visual design with high-density premium cards, badges, and authentic styling.
- **Status Badge Removal:** Removed "Status: Normal Working Session" badge from the grand summary bar.
- **Dynamic Academic Session:** Computed accurately (`2026-2027`) based on selected report date and class academic year data.
- **Header Clean-up:** Removed "Excellence in Quality Education" tagline from the school letterhead.
- **Section Categorization:** Fixed class separation regex with numeric checks (`num >= 1 && num <= 5`) so `10th-A` correctly routes to Secondary Section instead of Primary Section (Primary: 11 classes, Secondary: 13 classes).

### 2. Today Absentees Page (`/attendance/absentees-today`)
- Removed `Mobile Number` column from the interactive web table.
- Removed `Mobile Number` from the PDF autoTable export and re-proportioned remaining columns (`S.No`, `Student ID`, `Student Name`, `Class`, `Status`).

## Marks Entry Loading & Performance Optimization (October 30, 2026)

### 1. Root Cause Resolution
- **Exam Details API (`/api/exams/:id`):** Removed default retrieval of whole-school nested `marks` (thousands of records with student/user joins). Converted to opt-in with `?includeMarks=true` (only for `CreateExamPage`). Response payload dropped from ~10MB to ~5KB.
- **Exam Marks by Class (`/api/marks/exam/:id`):** Added `classId` query filter support in `marks.controller.ts:getByExam`. Now only returns 30-40 rows for the active class instead of 4,000+ rows across all classes.
- **Student Roster Optimization (`/api/classes/:id/students`):** Made Base64 `photoUrl` inclusion opt-in with `?includePhoto=true` in `classes.controller.ts:getStudents`. Saves ~16MB per roster request.
- **Marks Entry Page (`MarksEntryPage.tsx`):**
  - Sends `classId` in `/api/marks/exam/:id?classId=:classId`.
  - Moved `/api/subjects` into the parallel `Promise.all` pool rather than waterfalling sequentially.
  - Total network transfer reduced from 30+ MB to ~25 KB (over 1000x reduction), eliminating the 30-second Axios timeout and rendering immediately.

### 2. Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`
