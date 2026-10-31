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

## Marks Entry Loading & Performance Optimization (October 30 - 31, 2026)

### 1. Root Cause Resolution
- **Exam Details API (`/api/exams/:id`):** Removed default retrieval of whole-school nested `marks`. Converted to opt-in with `?includeMarks=true`.
- **Exam Marks by Class (`/api/marks/exam/:id`):** Added `classId` query filter support in `marks.controller.ts:getByExam`.
- **Student Roster Optimization (`/api/classes/:id/students`):** Made Base64 `photoUrl` inclusion opt-in with `?includePhoto=true`.
- **Unified Super-Fast API (`/api/marks/entry-data`):** Returns lightweight exam, class, student roster, marks, and real subjects in a single compact 15-20 KB payload.
- **Parallelized Query Engine:** Refactored `getMarksEntryData` in `backend/src/controllers/marks.controller.ts` to execute `exam`, `class`, `students`, and `realSubjects` simultaneously via `Promise.all` (latency down to 30-50ms).
- **Exam List Boot De-congestion (`frontend/src/pages/exams/ExamListPage.tsx`):** Eliminated eager initial boot requests (`fetchQuestionGroups`, `fetchOnlineExams`, `fetchQuestions`, `fetchQuestionPapers`). These secondary modules now load strictly lazily only when their specific tab is opened.
- **Backend Controller Guard Rails (`backend/src/controllers/examsExtended.controller.ts`):** Wrapped `getExamPlans`, `getQuestionGroups`, `getQuestions`, `getOnlineExams`, and `getOnlineExamSubmissions` in try-catch handlers returning clean fallback arrays rather than unhandled 500 errors.
- **Marks Entry Page Resiliency (`frontend/src/pages/exams/MarksEntryPage.tsx`):** Added explicit `fetchError` handling and retry trigger instead of misleading "No Students Found" message on network timeouts. Added automatic fallback to real class database subjects if exam configuration has empty subjects.

## Website Performance Speed Optimization (October 30, 2026)
- **PWA Precache Bloat:** Configured `globIgnores` in `vite.config.ts` for non-critical heavy vendor chunks (`vendor-pdf`, `vendor-excel`, `vendor-charts`, `vendor-math`, `KaTeX`).
- **App Boot API Congestion:** Introduced `DataCache.staggeredPrefetch` with 3.5s delay and 800ms spacing.
- **Ineffective Dynamic Import:** Decoupled `routeImports` into standalone `frontend/src/router/routeImports.ts`.
- **Database Query Bottlenecks:** Applied strict `select` projections on 7-day attendance and 12-month payments in `dashboard.controller.ts`.

## Student Address Collection Field Requirements (October 30, 2026)
- **Only Mobile Number Mandatory:** Updated `backend/src/controllers/addressCollection.controller.ts`, `frontend/src/pages/address-collection/AddressCollectionAdminPage.tsx`, and `AddressCollectionTeacherPage.tsx`.
- `studentName`, `fatherName`, `village`, and `mandal` are now strictly optional and marked with `(Optional)`. Only `Mobile Number` is required (`*`).
- Backend gracefully handles empty strings for omitted fields to prevent Prisma DB crashes.
- Table view, search filter, Excel export, and PDF export updated to display `-` gracefully for empty fields.

### Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`
