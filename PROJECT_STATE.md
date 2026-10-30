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
- **Exam Details API (`/api/exams/:id`):** Removed default retrieval of whole-school nested `marks`. Converted to opt-in with `?includeMarks=true`.
- **Exam Marks by Class (`/api/marks/exam/:id`):** Added `classId` query filter support in `marks.controller.ts:getByExam`.
- **Student Roster Optimization (`/api/classes/:id/students`):** Made Base64 `photoUrl` inclusion opt-in with `?includePhoto=true`.
- **Unified Super-Fast API (`/api/marks/entry-data`):** Returns lightweight exam, class, student roster, marks, and real subjects in a single compact 15-20 KB payload.

## Website Performance Speed Optimization (October 30, 2026)

### 1. Root Causes Resolved
- **PWA Precache Bloat:** Fixed in `frontend/vite.config.ts` by ignoring non-critical heavy vendor chunks (`vendor-pdf`, `vendor-excel`, `vendor-charts`, `vendor-math`, `KaTeX`) during initial precache. Initial asset load dropped from 5.1 MB down to ~400 KB.
- **App Boot API Congestion:** Fixed in `frontend/src/App.tsx` and `frontend/src/services/dataCache.ts` by introducing `DataCache.staggeredPrefetch`. Deferred prefetching by 3.5 seconds and spaced requests by 800ms so dashboard and authentication get 100% of the network pipe on page open.
- **Ineffective Dynamic Import:** Decoupled `routeImports` into a standalone `frontend/src/router/routeImports.ts`, resolving bundler circular dependencies between `Sidebar.tsx` and `router/index.tsx`.
- **Supabase Database Query Bottlenecks:** Optimized `backend/src/controllers/dashboard.controller.ts:getAdminDashboard` by applying strict `select` projections on 7-day attendance, 12-month payments, classes, and recent transactions, reducing database wire transfer by 90%.

### 2. Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`
