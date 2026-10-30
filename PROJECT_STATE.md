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

### 1. Root Cause of 30-Second Timeout (`timeout of 30000ms exceeded`)
- **VPS Old Code Execution:** The VPS was running the older version where `MarksEntryPage` initiated 5 parallel heavy requests simultaneously (fetching 16MB Base64 photos, thousands of marks across all school classes, and admit card configurations), while `autoCleanDuplicateSubjectsAndMarks()` occupied Supabase pool connections on every boot.
- **Supabase Pool Exhaustion:** The Supabase connection pool (`connection_limit=20`) hit capacity, blocking incoming queries until Axios hit its 30-second timeout threshold.
- **Rejection Fallback:** On timeout rejection, the catch handler set `loading = false`, leaving students and exam state uninitialized (`Class: -`, `Max Marks: `, `No Students Found`).

### 2. Engineering Solution Implemented Locally
- **Unified Super-Fast API (`/api/marks/entry-data`):**
  - Created `getMarksEntryData` in `backend/src/controllers/marks.controller.ts` and wired to `/api/marks/entry-data` in `backend/src/routes/marks.ts`.
  - Serves lightweight exam object, class object, student roster (no Base64 photos), marks scoped strictly to the selected class, and real subjects in a single compact JSON payload (~15-20 KB instead of 30+ MB).
- **Startup Cleanup Protection (`backend/src/server.ts`):**
  - Enforced `process.env.RUN_CLEANUP_ON_BOOT === 'true'` condition so heavy database deduplication doesn't execute during normal server restarts.
- **Frontend Optimization (`MarksEntryPage.tsx`):**
  - Replaced the 5 waterfalling network requests with one call to `/api/marks/entry-data?examId=${id}&classId=${classId}`.
- **Component Adjustments:**
  - `CreateExamPage.tsx`: Added `?includeMarks=true` to retain marks during exam updates.
  - `AdmitCardTab.tsx`: Added `?includePhoto=true` to fetch photos only where strictly needed.

### 3. Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`
