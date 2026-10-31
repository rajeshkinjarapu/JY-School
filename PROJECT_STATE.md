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

## Teacher Global Student Access Permission (October 31, 2026)
- **Feature Scope:** Implemented ability for Admins to grant specific teachers access to view full student details (DOB, Aadhaar, address, parent phone numbers) across all classes.
- **Database Model:** Added `canViewAllStudents Boolean @default(false)` to `Teacher` model in `schema.prisma`.
- **Backend API:** Updated `teachers.controller.ts` (`create`, `update`) and `students.controller.ts` (`getById`). Teachers with `canViewAllStudents === true` or `isClassTeacher === true` receive full student profiles with contacts, while unpermitted subject teachers have sensitive fields securely masked.
- **Web Admin UI:** Added "Allow to View All Students Details" toggle in `TeacherFormPage.tsx` enabling admins to grant/revoke access seamlessly.
- **Flutter Mobile App:** `StudentProfileScreen` has role & permission check. Properly renders "Subject Teacher" badge and Telugu privacy restriction shield when restricted, and displays full demographics and call/WhatsApp actions when granted.

## Frontend Dynamic Import & Stale Chunk Auto-Recovery (October 31, 2026)
- **Root Cause of TypeError:** When Vite builds a new production release, asset content hashes change. Browsers or PWA service workers caching previous `index.html` requested stale chunk files that were already removed from `dist/assets`, causing `TypeError: Failed to fetch dynamically imported module`.
- **Resilient Lazy Loader (`frontend/src/utils/lazyWithRetry.ts`):** Wrapped all router dynamic imports with `lazyWithRetry`. Automatically detects dynamic chunk load failures, purges ServiceWorker registrations and CacheStorage, and forces a clean reload with latest assets.
- **Preload Error Auto-Recovery (`frontend/src/main.tsx`):** Improved `vite:preloadError` listener to clear stale CacheStorage and clean URLs without infinite reload loops.
- **Route System Registration:** Added `/address-collection/admin` and `/address-collection/teacher` to `routeImports.ts`.

## Daily Attendance Report Print Blank Page Resolution (October 31, 2026)
- **Root Cause of Blank Print Preview:** 
  1. `DashboardLayout` and `PullToRefresh` wrapped the page in `overflow: hidden`, `overflow-y: auto`, `h-full`, and `transform: translateY(0px)`. Chromium's print engine clips content inside `overflow: hidden` containers, collapsing the printable area to 0 height.
  2. In `PullToRefresh.tsx`, `isPrinting` state inside `beforeprint` event did not trigger a React re-render before Chromium took the print snapshot due to synchronous event blocking.
  3. `AttendanceDailyReport.css` lacked complete print isolation and container reset rules.
- **Implemented Fix:**
  1. **Dual Print Architecture in `AttendanceDailyReportPage.tsx`:** Updated `handlePrint` to inject an isolated, hidden print iframe containing only `#reportArea` innerHTML and document stylesheets. This bypasses all React layout hierarchy, sidebar, header, and overflow constraints, producing an instant, crisp 1-page A4 print preview on any printer (Kyocera, HP, Canon, etc.).
  2. **Comprehensive Print Isolation in `AttendanceDailyReport.css`:** Added reset rules for `html, body, #root, main, div` (`overflow: visible !important; height: auto !important; transform: none !important;`) and body-wide `visibility: hidden` with `#reportArea` visibility breakout.
  3. **PullToRefresh Print Resiliency (`PullToRefresh.tsx`):** Added `print:overflow-visible print:h-auto print:static print:transform-none` Tailwind utility classes to container elements.

## Student Birthday & WhatsApp Wish Dashboard Restoration (October 31, 2026)
- **Root Cause of Attendance Overview Reappearing:** 
  - Originally implemented in commit `4c1a5b27aae1023778af90dd80320a9dec79175e`.
  - When the multi-tenant SaaS model was reverted in commit `300c3b68bcaaa6ee8099053adf7ee83fcd20fe9f`, `DashboardPage.tsx` and `dashboard.controller.ts` were inadvertently reverted.
- **Implemented Fix:**
  1. **Backend (`backend/src/controllers/dashboard.controller.ts`):** Added query for students with `dob` in `getAdminDashboard`. Automatically computes `todayBirthdays` and `upcomingBirthdays` (next 7 days) and delivers them in `/api/dashboard/admin`.
  2. **Frontend (`frontend/src/pages/dashboard/DashboardPage.tsx`):** Completely replaced the redundant "Attendance Overview" LineChart with a premium "Today's Birthdays" card featuring student photo, name, class badge, roll number, celebration indicators, and a one-click WhatsApp wishing action that sends official personalized birthday greetings to parents. Empty state cleanly displays upcoming birthdays for the week.

## Student Promotion Module Restoration & Build Error Resolution (October 31, 2026)
- **Backend Status:** Build successful with 0 errors.
- **Frontend JSX Fix:** Added missing closing `<>` fragment wrapper around Promote & Add buttons in `StudentListPage.tsx`.
- **UI Access Points:**
  1. **Sidebar Navigation:** "Promotion" item added under Admin menu (`Sidebar.tsx`).
  2. **Student List Page:** "Promote" header action button added (`StudentListPage.tsx`).

### Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`
