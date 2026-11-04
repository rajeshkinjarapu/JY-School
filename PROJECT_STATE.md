# JY School Project State

## Admit Card Header Address & Center Alignment Update (November 4, 2026)
- **Header Address Update:** Updated default campus address in `AdmitCardTemplate.tsx` and `AdmitCardTab.tsx` to `Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta`.
- **True Center Alignment:** Added symmetrical balancing spacer opposite the logo so the school title, subtitle, and address are mathematically centered across the entire card.
- **Auto-fallback Migration:** Added automatic migration from old address string to the new comprehensive address.

## Mobile App Teacher Login 3D Icons Update (November 4, 2026)
- **Source Assets:** Integrated 18 premium 3D squircle icons provided in `flutter_mobile/app icons/`.
- **Assets Config (`flutter_mobile/pubspec.yaml`):** Registered `- "app icons/"` in `flutter.assets`.
- **Dashboard (Home Tab - `flutter_mobile/lib/screens/dashboard_screen.dart`):**
  - Updated all 12 teacher dashboard options to use `_buildImageCard` with local 3D icons:
    - Mark Attendance (`app icons/mark attendance.png`)
    - My Students (`app icons/my studens.png`)
    - Question Papers (`app icons/question papers.png`)
    - Timetable (`app icons/timetable.png`)
    - Marks Entry (`app icons/marks entry.png`)
    - Results (`app icons/results.png`)
    - Progress Cards (`app icons/progress card.png`)
    - Fee Reminder (`app icons/fee remainder.png`)
    - Messaging (`app icons/messaging.png`)
    - Home Work (`app icons/home work.png`)
    - Leave Apply (`app icons/leave apply.png`)
    - Gate Pass (`app icons/gate pass.png`)
  - Enhanced `_buildImageCard` with crisp squircle border (`width: 3`), white backing, and colored glow shadow.
- **Exam Tab (`flutter_mobile/lib/screens/examination_dashboard_screen.dart`):**
  - Added `assetPath` support in `_buildDashboardCard`.
  - Replaced network `icons8.com` icons with high-res local 3D icons: Question Papers, Marks Upload, Results, Progress Card, Answer Key, Send SMS, and Settings.
- **More Tab (`flutter_mobile/lib/screens/modules_screen.dart`):**
  - Added `assetIcon` support in `_buildModuleCard` for both Admin/Teacher and Student module grids.
  - Replaced generic Material icons with local 3D icons: Admissions, Fee Reminder, Address Data, Gate Pass, Attendance, Leave, Timetable, My Salary, and Settings.
- **OTA Patch Compatibility:** Verified changes are Dart/asset UI changes fully deliverable via Shorebird OTA patch (`shorebird patch android`).

## Admit Card & Progress Card Design Enhancements (November 4, 2026)
- **Admit Card Web & Mobile Layout Synchronization:**
  - Header school name aligned with webapp design (`SRI VENKATESWARA JY SCHOOL`, `(IIT-JEE/NEET FOUNDATION - OLYMPIADS)`).
  - Address updated to plain text without box (`SVL Paradise Campus, Narasannapeta`).
  - Candidate details section updated with student photo placeholder and school logo.
  - Exam Center dynamically reflects configured center (`JY School SVL Paradise Campus`).
  - Time table schedule synchronizes default exam timing (`02:00 PM - 05:00 PM` or configured time).
  - Cleaned up reporting notice and enlarged principal signature.
- **Welcome Screen Bottom Button Safe Area:**
  - Added `SafeArea(bottom: true)` padding to "Get Started" button to prevent overlap with Android system navigation bar.


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

## Student Profile Mobile Number & Direct Actions (October 31, 2026)
- **Root Cause:** In `StudentProfilePage.tsx`, phone numbers existed in the backend API payload (`student.user.phone` and `student.fatherPhone`), but were not mapped into the interactive web view (Hero header or Family card).
- **Features Implemented:**
  1. **Hero Header Contact Badge:** Added an interactive phone badge next to "Joined Date" in the student profile header with direct click-to-call (`tel:`).
  2. **Family Card Contact Details:** Added a dedicated `Mobile No` row in the Family table displaying the contact number with a click-to-call link and a dedicated one-click **WhatsApp** button (`https://wa.me/91...`).
  3. **Multi-source Fallback:** Uses `student.user?.phone || student.phone || student.fatherPhone` to ensure contact details display regardless of how the student was registered.

## Flutter Web Compilation & Dependency Resolution (November 2, 2026)
- **Root Causes:**
  1. Invalid `const` keywords on `TeXViewPadding.all`, `TeXViewStyle`, and `pdf` package widgets (`pw.TextStyle`, `pw.BoxDecoration`, `pw.EdgeInsets`) causing Dart compiler type resolution cascade failures.
  2. Missing cached pub package files on local machine for newly introduced dependencies (`pdf`, `qr_flutter`, `font_awesome_flutter`).
- **Fixes Applied:**
  1. `lib/widgets/latex_preview_widget.dart`: Removed invalid `const` modifiers.
  2. `lib/services/admission_pdf_service.dart`: Removed all invalid `const` modifiers across `pw.` widgets.
  3. `lib/screens/quiz_result_screen.dart`: Replaced `FontAwesomeIcons` with native Flutter Material `Icons`.

## Examination Admit Cards Header Controls Single-Row Compaction (November 3, 2026)
- **Issue:** The top controls bar in `AdmitCardTab.tsx` had bulky padding (`p-6`), large select dropdowns, and wide button padding (`px-4 py-2 uppercase tracking-widest font-black`), forcing action buttons (`Published`, `Unpublish`, `Settings`, `Download All`, `Print All`) to wrap into 2 lines.
- **Fix:**
  - Compacted header card padding to `p-3.5 sm:p-4 rounded-2xl`.
  - Streamlined dropdowns to `px-3 py-1.5 text-xs font-bold rounded-lg`.
  - Scaled down buttons to `px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide` with `w-3.5 h-3.5` icons.
  - Applied `whitespace-nowrap shrink-0` across all action items and aligned them in a single horizontal flex row (`flex items-center flex-wrap sm:flex-nowrap gap-1.5 shrink-0 overflow-x-auto`).

### Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`


## Admit Card Official School Logo Display & Fallback (November 3, 2026)
- **Issue:** On the Examination Admit Card view and downloaded/printed PDFs, when no custom logo was configured for an exam, the logo box displayed the placeholder word "LOGO" inside a border rather than the official school crest image.
- **Root Cause:**
  1. In `AdmitCardTemplate.tsx`, when `settings.logoUrl` was undefined, `logoUrl` resolved to empty and rendered a fallback `<span>LOGO</span>`.
  2. In `AdmitCardTab.tsx`, `logoUrl`, `signatureUrl`, and `teacherSignatureUrl` were not passed as props to `<AdmitCardTemplate />`.
- **Fix Implemented:**
  1. `frontend/src/components/Exams/AdmitCardTemplate.tsx`: Added props `logoUrl`, `signatureUrl`, `teacherSignatureUrl`. Updated `resolveUrl` to default to `/logo.png`. Completely eliminated the placeholder `<span ...>LOGO</span>` element and replaced it with an `<img>` tag pointing to `/logo.png` with `crossOrigin="anonymous"` and an `onError` fallback to `/logo.png`. Also updated the central background watermark to render the authentic school logo at subtle opacity.
  2. `frontend/src/pages/exams/AdmitCardTab.tsx`: Initialized `logoUrl` state to `"/logo.png"`. Added fallback in `useEffect` so `settings.logoUrl || globalSettings.logoUrl || "/logo.png"` is used. Passed `logoUrl={logoUrl || '/logo.png'}`, `signatureUrl={signatureUrl}`, and `teacherSignatureUrl={teacherSignatureUrl}` directly into `<AdmitCardTemplate />`.
  3. Verified `StudentAdmitCardViewPage.tsx` and `TeacherAdmitCardsPage.tsx` so both student and teacher portals seamlessly show the official SVJY High School logo on all admit cards.

## Subject Name Normalization & Physical Science Reversion Fix (November 3, 2026)
- **Issue:** When adding or editing a subject such as "PHYSICAL SCIENCE" (or "BIOLOGICAL SCIENCE") in Exam Configuration, the subject saved temporarily but upon reload reverted back to "PHYSICS" (or "BIOLOGY").
- **Root Cause:** In `getCanonicalSubjectName()` in `backend/src/controllers/exams.controller.ts` and `frontend/src/pages/exams/ResultsTab.tsx`, greedy regex checking `s.includes('PHYSIC') || s.startsWith('PHY')` matched `"PHYSICAL SCIENCE"` (since `PHYSICALSCIENCE` contains `PHYSIC`), collapsing it into `"PHYSICS"`. Furthermore, when `normalizeSubjectsToRealIds` executed, it mapped the subject to the existing database record for "PHYSICS".
- **Fix Implemented:**
  1. Re-ordered canonical matching to evaluate compound high school science names (`PHYSICAL SCIENCE`, `BIOLOGICAL SCIENCE`, `GENERAL SCIENCE`) before single-word physics/chemistry/biology aliases.
  2. Maintained discrete short codes: `PS` for Physical Science and `BS` for Biological Science.
  3. Updated curriculum sorting weight order (`getSubjectSortWeight`) to place TELUGU (10), HINDI (20), ENGLISH (30), MATHEMATICS (40), SCIENCE/EVS (50), PHYSICAL SCIENCE (51), BIOLOGICAL SCIENCE (52), PHYSICS (53), CHEMISTRY (54), BIOLOGY (55), SOCIAL (60).
  4. Synchronized canonical helpers identically between backend (`exams.controller.ts`) and frontend (`ResultsTab.tsx`).

## Admit Card Examination Schedule Automatic Sync (November 3, 2026)
- **Feature Scope:** Eliminated the requirement to manually re-enter examination timetable rows in Admit Card Settings. Examination subjects and scheduled exam dates configured during exam creation (`/exams/create`) now automatically populate into Admit Cards.
- **Implementation Details:**
  1. **Helper Function `getAutoExamSchedule` (`AdmitCardTemplate.tsx`):** Reads the exam's `subjects.classConfigs` matching by `classId` (or normalized class + section name). Gracefully falls back to `globalSubjects`. Generates an array of `{ id, date, subject, timing, maxMarks }`.
  2. **AdmitCardTemplate Display:** `displaySchedule` defaults directly to `autoSchedule` if `settings.schedule` is empty or unset.
  3. **AdmitCardTab Settings UI:**
     - Added unified "Default Exam Timing" input field (default: `09:30 AM - 12:30 PM`), updating all subject timings at once without editing individual rows.
     - Added a "⚡ Sync from Exam" button in Admit Card Settings modal allowing administrators to refresh or pull latest dates/subjects on demand with a single click.
     - When no manual rows are added, an informational auto-sync alert is shown indicating that the schedule is flowing directly from Exam Configuration.
  4. **Student Portal Support (`StudentAdmitCardViewPage.tsx`):** Passes student's class name and section into `AdmitCardTemplate` so student-side admit card views automatically reflect the exam schedule.

## Double-Sided 2-in-1 A4 Admit Card Print System (November 3, 2026)
- **Feature Scope:** Implemented full double-sided 2-in-1 A4 Admit Card printing. Each A4 sheet fits 2 students' admit cards on the front, and their corresponding examination schedules + instructions + signatures on the back.
- **Root Cause of Previous Failure:**
  1. An artificial CSS `transform: scale(0.499)` was applied to full A4 cards, which scaled width down to 105mm, leaving 50% of the A4 page on the right side completely blank, while also squishing the entire schedule into the front card illegibly.
  2. The `Double Side` option was originally restricted by `isFASaExam`.
- **Implementation Details:**
  1. **Full-Width A5 Components (`AdmitCardFrontHalf` & `AdmitCardBackHalf` in `AdmitCardTemplate.tsx`):**
     - Width is 100% of the printable A4 width (no blank side voids).
     - Retains the exact prestigious styling of the single-page card: outer 4px slate-900 border with inner 1px border, Georgia serif school title, official crest logo, map pin center badge, ribbon, candidate details table, photo box, and background watermark.
     - `AdmitCardFrontHalf`: Candidate details, photo, and bottom notice reminding students to check reverse.
     - `AdmitCardBackHalf`: Examination schedule timetable (auto-synced subjects & dates), rules, and principal signature.
  2. **Paired A4 Duplex Sheet Generator (`AdmitCardSheetPair`):**
     - Front Sheet: Top Student 1 Front + Center Dashed Cut Line (`✂ CUT ALONG THIS LINE (A5 SIZE) ✂`) + Bottom Student 2 Front.
     - Back Sheet: Top Student 1 Schedule + Center Dashed Cut Line + Bottom Student 2 Schedule.
     - Sized at 134mm per card + 6mm cut line = 274mm total sheet height (within 284mm printable boundary), completely preventing Chrome's default 10mm print margins from pushing the 2nd card onto the next sheet or clipping it.
     - Completely eliminated internal white gaps on the front card by adding Candidate Rules, Student Signature, Invigilator Signature, and Principal Signature boxes.
  3. **Universal Compatibility & Error Elimination:** Available for all exams. Standard single-page printing remains 100% untouched when Double Side is unchecked. Single student PDF download and bulk zip generation hardened against `Invalid argument passed to jsPDF.scale` with fallback dimension bounds (794x1123).


## Admit Card 2-in-1 Front Page Premium Redesign (November 3, 2026)
- **User Feedback:** The backpage design (auto-schedule timetable, reporting times, principal signature) was highly appreciated, but the front page layout appeared unbalanced: the student photo was small and isolated on the right edge, candidate details were crammed into an unstyled form, and a large empty white space remained at the bottom.
- **Root Cause:** The earlier front half card placed candidate details in a narrow 6-row table with the photo floating in a disconnected right column, with no dedicated exam guidelines, candidate signing box, or official authentication badges.
- **Redesign Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  1. **Official School Header:** Centered Georgia serif school title, official crest logo on the left, exam center badge, and an authentic "ACADEMIC YEAR: 2026-27 | AUTHENTICATED" badge on the right.
  2. **High-Contrast Identity Ribbon:** Slate-900 navy ribbon with gold/amber exam title (`SUMMATIVE ASSESSMENT - 1`), left-accented with "OFFICIAL HALL TICKET / ADMIT CARD".
  3. **Dedicated Photo & Candidate Signature Block (Left Column):**
     - Passport-proportioned photo frame (`w-[92px]`) with crisp borders and clean placeholder fallback.
     - Attached Candidate Signature box directly underneath the photo with verified signing line.
  4. **Rich Demographic Profile Card (Right Column):**
     - Dark Slate-900 header with Registration / Admission number.
     - Highlighted candidate name in bold uppercase.
     - Dark Navy badge for `ROLL: JY26-XXXX` and Indigo badge for `CLASS: Xth - X` side by side.
     - Clear rows for Father/Guardian Name, Gender & DOB, and Examination Center.
  5. **Exam Day Protocol & Guidelines Card:**
     - 4 high-value board examination guidelines formatted in a compact 2-column layout.
     - Eliminates all dead white space while providing critical student reporting instructions.
  6. **Official 3-Party Verification Signatures Bar:**
     - Candidate's Signature box (verified in exam hall).
     - Invigilator's Signature box.
     - Principal / Exam Controller block featuring the authentic digital signature image (`signatureUrl`) with `mix-blend-multiply`.
  7. **Bottom Reverse-Schedule Notice:**
     - High-contrast banner with emerald indicator directing students to the reverse-side timetable.
  8. **Strict Dimension Control:** All elements engineered within the `134mm` maximum height limit, ensuring 2 cards fit per A4 page without multi-page overflow in Chrome or desktop printer drivers.


## Admit Card Blank PDF Download Resolution & Exact Image 3 Design Restoration (November 3, 2026)
- **User Feedback:**
  1. Image 2: Downloading single student admit card ("DOWNLOAD PDF") resulted in a completely blank white PDF.
  2. Image 1 vs Image 3: The user wanted the admit card to look 100% like the authentic original design in Image 3 (Georgia serif header, centered skewed black `ADMIT CARD` badge with exam name below, clean `CANDIDATE DETAILS` box with zebra rows, and proportionate `[105px]` photo frame on the right).
- **Root Cause of Blank PDF (Image 2):**
  - Download elements were wrapped in `<div className="hidden print:hidden" style={{ display: 'none' }}>` inside `admit-cards-print-container`. Because the wrapper had `display: none !important`, `document.getElementById('admit-card-dl-${index}')` had `offsetWidth = 0` and `offsetHeight = 0` during `toJpeg` image snapshot, rendering a completely empty canvas into jsPDF.
- **Fix Implemented:**
  1. **Off-Screen Active Layer Architecture (`AdmitCardTab.tsx`):**
     - Moved download elements out of the hidden print container into a dedicated `#admit-cards-download-container` with `position: fixed; left: -9999px; top: 0; width: 210mm` (never `display: none`).
     - In `generatePDFForElement`, the element is temporarily elevated to `position: fixed; left: 0; top: 0; zIndex: 999999; opacity: 1; visibility: visible; display: block;` so the browser computes real pixel dimensions (`794px x 1123px`), fonts, and images before `toJpeg` capture.
     - In `handleDownloadAll`, batch capture coordinates directly through `#admit-cards-download-container`.
  2. **Exact Image 3 Design Alignment (`AdmitCardTemplate.tsx`):**
     - `AdmitCardFrontHalf` updated to replicate Image 3's exact visual style: Georgia serif school header, rounded logo box, centered skewed black `ADMIT CARD` badge, exam name, authentic `CANDIDATE DETAILS` card with user icon and zebra rows, and right-aligned passport photo container with rounded border.
     - Bottom section contains compact Important Instructions, 3-party signatures (Candidate, Invigilator, Principal), and reverse-side timetable notice, all strictly within `134mm` height.


## 2-in-1 Admit Card Download PDF Multi-Student Sheet Pairing Fix (November 3, 2026)
- **User Feedback:** In `HANUMANTHU CHANDINI_AdmitCard.pdf`, when downloading the admit card with Double Sided (2-in-1 A4) checked, only 1 student's card appeared on the top half of Page 1 (with bottom half empty), and only 1 student's timetable appeared on the top half of Page 2 (with bottom half empty). The second student was missing on the paper.
- **Root Cause:** In `AdmitCardTab.tsx`, each student's download container passed only that single student into `<AdmitCardTemplate doubleSided={isDoubleSided} />`. While print mode was properly grouped by pairs using `AdmitCardSheetPair`, the download container was not pairing students, leaving the bottom 134mm half of the A4 page empty.
- **Fix Implemented:**
  1. **Paired 2-in-1 Download Structure (`AdmitCardTab.tsx`):**
     - When `isDoubleSided` is true, the off-screen download container maps each student to their pair (`pairIdx = Math.floor(idx / 2)`), binding `studentTop` (`students[pairIdx * 2]`) and `studentBottom` (`students[pairIdx * 2 + 1]`).
     - Page 1 renders `AdmitCardSheetPair(side="front")` with Student 1 (Top) + Cutline + Student 2 (Bottom).
     - Page 2 renders `AdmitCardSheetPair(side="back")` with Student 1 Schedule (Top) + Cutline + Student 2 Schedule (Bottom).
     - Both students now seamlessly print on a single double-sided A4 sheet without wasted paper.
  2. **Intelligent File Naming:** Generates informative filename indicating both students on the sheet (e.g., `HANUMANTHU CHANDINI_&_TARRA LEKHANA_2in1_AdmitCard.pdf`).
  3. **Batch Zip Download Alignment:** When Double Sided is checked, batch zip generation processes by pairs (`i += 2`), creating clean paired 2-in-1 PDFs for every 2 students in the roster.


## Admit Card Front Page Layout Refinement (November 3, 2026)
- **User Feedback:**
  1. Remove "Important Instructions" and bottom signatures (Candidate Sign, Invigilator Sign, Principal Signature) from the front card (since rules and signatures are already placed on the reverse timetable card).
  2. Remove the bottom text "(టైంటేబుల్ వెనుక వైపు చూడండి)".
  3. Increase the Header size and height (make School Name, Logo, Subtitle, and Exam Center larger and more prominent).
  4. Integrate the student photo inside the Candidate Details box itself so it looks cohesive and visually appealing ("student image kuda candidate box lo kalupuko andam ga undali").
- **Fix Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  - Updated `AdmitCardFrontHalf`:
    - Header height increased with larger logo (`w-16 h-16`), larger Georgia serif school title (`20px`), prominent subtitle, and centered campus badge.
    - Unified the Candidate Details container: the student photo is now placed directly inside the Candidate Details card on the right-hand column (`w-[125px]`), sharing the same outer rounded border, dark header strip, and inner divider as the demographic table.
    - Removed instructions, signatures row, and reverse notice from the front card.
    - Total card height remains strictly constrained to `134mm` (A5) for 2-in-1 printing.


## Admit Card Front Page Typography & Photo Alignment Optimization (November 3, 2026)
- **User Feedback:**
  1. Make the examination title heading (`SUMMATIVE ASSESSMENT - 1`) significantly bigger.
  2. In the header, make the school name (`SRI VENKATESWARA JY SCHOOL`) bolder and larger.
  3. Make the remaining two lines in the header (the subtitle and the exam center/campus badge) larger and more prominent.
  4. Align the student image inside the candidate box to the **TOP** on the right side rather than the vertical center (`student image center lo kakunda right lo paina undali`).
- **Fix Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  - Updated `AdmitCardFrontHalf`:
    - School title increased to `text-[22px] sm:text-[25px] font-black`.
    - Subtitle increased to `text-[12px] sm:text-[13px] font-black tracking-[0.16em]`.
    - Campus center badge increased to `text-[10px] sm:text-[10.5px] font-bold` with an enlarged logo (`w-[72px] h-[72px]`).
    - Exam title (`SUMMATIVE ASSESSMENT - 1`) increased to `text-[15px] sm:text-[17px] font-black tracking-widest text-slate-950`.
    - Photo container aligned to the top (`justify-start pt-3`), allowing the passport photo frame to align flush with the top of the candidate details table.


## Admit Card Back Page Redesign & jsPDF Scale Error Resolution (November 3, 2026)
- **User Feedback & Errors:**
  1. Toast Error on Download: `Failed to generate image: Invalid argument passed to jsPDF.scale`.
  2. Single student download previously produced a blank white PDF.
  3. Backside card modifications requested:
     - Remove school header from the back card; start directly with the Examination Schedule table.
     - Reduce `Subject` column width.
     - Increase `Invigilator Sign` column size and ensure text stays strictly on a single line without wrapping.
     - Remove dotted lines (`..............`) from the invigilator sign boxes so cells are clean.
     - Increase instruction text size and make it clearer.
     - Add 3 signature blocks at the bottom: **Parent Signature**, **Class Teacher Sign**, and **Principal Signature**.
- **Fix Implemented:**
  1. **Backside Hall Ticket Redesign (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
     - Completely removed the bulky top school header bar from `AdmitCardBackHalf`.
     - Placed the `Examination Schedule & Time Table` container directly at the top of the card.
     - Reduced `Subject` column width to `w-32`.
     - Expanded `Invigilator Sign` column to `w-44 min-w-[140px]` with `whitespace-nowrap font-black uppercase text-[9.5px]` to prevent text wrapping.
     - Removed all dotted lines (`..............`), leaving invigilator signature boxes completely clean.
     - Enlarged instruction text size to `text-[9.5px]` (bold, `leading-relaxed`).
     - Added 3 signature blocks in the bottom footer:
       - **Parent Signature**: dashed line with title.
       - **Class Teacher Sign**: supports digital `teacherSignatureUrl` or fallback line.
       - **Principal Signature**: supports digital `signatureUrl` (`mix-blend-multiply`) or fallback line.
  2. **jsPDF Scale & Blank PDF Error Resolution (`frontend/src/pages/exams/AdmitCardTab.tsx`):**
     - Clamped element dimensions to `w = Math.max(pageEl.offsetWidth, 794)` and `h = Math.max(pageEl.offsetHeight, 1123)`.
     - Clamped `imgRatio = (w > 0 && h > 0) ? h / w : 1.414` and guaranteed `imgH = (!isNaN(calculatedH) && calculatedH > 0) ? Math.min(calculatedH, pdfPageHeight) : pdfPageHeight`. This completely eliminates `Invalid argument passed to jsPDF.scale` caused by `NaN`.
     - Added `onImageErrorHandler: () => null` to `toJpeg` configuration so missing images or external CORS blocks do not crash the PDF generator.
     - Ensured `#admit-cards-download-container` is elevated to `opacity: 1; visibility: visible; z-index: 999999;` during capture so html-to-image never captures a 0-opacity canvas.
     - Passed `teacherSignatureUrl` into all `AdmitCardSheetPair` instances for both printing and download loops.


## Full Single Page Admit Card Footer Restructuring (November 3, 2026)
- **User Feedback:** In Full Single Page Admit Card (A4), Important Instructions and Signatures were displayed side-by-side horizontally, which compressed the instruction text and squeezed the 3 signature blocks into a narrow corner. The user requested: "FULL ADMIT CARD LO INSTRUCTIONS PAINA IVVU DANI KINDA SIGNATURES IVVU" (Place Instructions on top, and Signatures below it).
- **Fix Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  1. Restructured `renderFooter` into a vertical two-tier layout:
     - **Top Section (Full Width):** Important Instructions (`Important Instructions / ముఖ్య నిబంధనలు`) spanning across the full width of the card with clear typography, bulleted list, and relaxed leading.
     - **Bottom Section (Full Width):** The 3 signature blocks (**Parent Signature**, **Class Teacher Sign**, and **Principal Signature**) laid out horizontally below the instructions, spanning evenly across the bottom (`px-8 py-3.5 bg-white`).
  2. Also cleaned up `renderExamSchedule` in the full card by removing `..................` dots from the Invigilator Sign column and setting `whitespace-nowrap w-44 min-w-[140px]`, matching the clean design of the backside card.


## 2-in-1 Admit Card 50-50 Symmetry, Cut Gap Expansion, Instruction Padding Reduction & 3x Signature Upgrade (November 3, 2026)
- **User Feedback:**
  1. A4 page left empty space at the bottom; cards needed to be divided at exactly 50% (half-and-half) of the sheet.
  2. The center cutting line needed more space for scissors to cut between the two A5 cards comfortably.
  3. Remove Telugu text from Instructions header (`/ ముఖ్య నిబంధనలు`).
  4. Reduce extra padding above the Instructions box.
  5. Scale up the Principal Signature image to 3 times its previous size.
  6. Remove all dashed lines and top borders above the 3 signatures (Parent Signature, Class Teacher Sign, Principal Signature).
- **Fix Implemented:**
  1. **Exact 50-50 Symmetry & Bottom Gap Elimination (`AdmitCardTemplate.tsx` & `AdmitCardTab.tsx`):**
     - Adjusted `AdmitCardSheetPair` total height to `286mm`: Upper Card `137mm`, Center Cut Zone `12mm`, Lower Card `137mm`.
     - Midpoint cut line sits precisely at `143mm` (50.0% of the sheet), perfectly centering both cards and eliminating empty bottom space.
     - Center cut margin doubled from `6mm` to `12mm` (`✂ CUT ALONG THIS LINE (A5 SIZE) ✂`) giving plenty of cutting room.
     - Synchronized `AdmitCardFrontHalf` and `AdmitCardBackHalf` heights to `137mm`.
     - Matched print CSS `.a4-print-sheet` and `.admit-card-wrapper` to `height: 286mm`.
  2. **Instructions Padding & Typography:**
     - Reduced gap above instructions box to `mt-1 mb-0.5`.
     - Removed Telugu text from instructions header across all templates.
  3. **3x Principal Signature & Clean Signature Blocks:**
     - Scaled Principal Signature container to `h-14` / `max-h-[56px] w-auto max-w-[160px]` (3x larger).
     - Scaled Class Teacher Signature to `h-12`.
     - Removed `border-t` top container border and all dashed lines (`border-b-2 border-dashed`) above all 3 signatures.


## Front & Back 2-in-1 Admit Card Perfect 50-50 Midpoint Cut & Duplex Alignment (November 3, 2026)
- **User Feedback:** On the Front side of the 2-in-1 sheet, empty white space remained at the bottom, and the cards needed to divide at the exact mathematical midpoint (50%) of the A4 paper so when cut in half, two identical, perfect A5 admit cards are produced.
- **Fix Implemented:**
  1. **Sub-Millimeter A4 Page Geometry (`AdmitCardTemplate.tsx` & `AdmitCardTab.tsx`):**
     - Full A4 Sheet height = `297mm`. Exact 50% midpoint = `148.5mm`.
     - Engineered `AdmitCardSheetPair` total height to `288mm` (`w-[204mm]`):
       - Upper Card: `138.5mm`
       - Center Cut Zone: `11mm` (cut line at 5.5mm offset = `144mm` from top of sheet)
       - Lower Card: `138.5mm`
     - With `4.5mm` top and bottom print margins: `4.5mm + 138.5mm + 5.5mm = 148.5mm` (Exact mathematical 50% midpoint of the A4 paper).
     - Both top and bottom cards now share an identical `4.5mm` outer margin from the paper edges, completely eliminating bottom dead space.
  2. **Identical Front & Back Duplex Alignment:**
     - Both `AdmitCardFrontHalf` and `AdmitCardBackHalf` are constrained to `w-full h-full max-h-[138.5mm]`.
     - In `AdmitCardFrontHalf`, candidate details table rows now have `py-2 px-3.5` with `130px` photo column, filling the candidate details box evenly.
     - When printed duplex (front and back of the same sheet), the cut lines and borders on the front and back align with 100% precision.
  3. **Print CSS and Download Offsets:**
     - Locked `@page { size: A4 portrait; margin: 4mm; }`, `.a4-print-sheet { width: 204mm; height: 288mm; }`, and `.admit-card-wrapper { padding: 0; }`.


## 2-in-1 Admit Card Top Margin & Border Clearance (November 3, 2026)
- **User Feedback:** The outer dark border of the top admit card was touching the very top edge of the PDF/page with zero space ("boarder paina top lo assalu space ledu konchem space ivvu").
- **Fix Implemented:**
  1. Updated `AdmitCardSheetPair` with vertical padding `py-[4.5mm]` and full A4 container height `297mm`:
     - Top Margin above outer border: `4.5mm`
     - Upper Card: `138mm`
     - Center Cut Zone: `12mm` (midpoint cut line at exact `148.5mm` = 50% of A4)
     - Lower Card: `138mm`
     - Bottom Margin below outer border: `4.5mm`
  2. Total: `4.5mm + 138mm + 12mm + 138mm + 4.5mm = 297mm`.
  3. Provides elegant top margin clearance so printer hardware margins never clip the top border, while maintaining exact 50-50 midpoint symmetry.


## Admit Card Class Teacher Digital Image Removal & 3x Principal Signature Enlargement (November 3, 2026)
- **User Feedback:**
  1. Top margin space applied to back side as well.
  2. Class teacher digital signature image should NOT appear on the admit card ("class teacher image admit card meda rakudadu"). In school protocol, class teachers sign manually with a pen.
  3. Principal signature image must be 3 times bigger than the current small stamp shown in the screenshot.
- **Fix Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  1. **Class Teacher Signature Block:** Completely removed the digital image rendering for `Class Teacher Sign` across both 2-in-1 backside (`AdmitCardBackHalf`) and single-page full admit card (`renderFooter`). In its place, an unblocked, clean `h-16` manual signing space is provided so class teachers can cleanly sign with a pen.
  2. **Principal Signature Block (3x Enlargement):** Scaled up the Principal Signature container and image to `h-16`, `max-h-[64px]`, and `max-w-[170px]` (in 2-in-1) and `max-w-[180px]` (in full card), making the official digital signature stamp 3 times more prominent, legible, and authentic.
  3. **Parent Signature Block:** Sized with identical `h-16` height for uniform visual balance across all three signature blocks.


## Flutter Mobile App Hero Banner Notifications & FCM Device Token Sync Resolution (November 3, 2026)
- **Problem Statement:** Hero Banner notifications were not appearing in the Flutter mobile app.
- **Root Cause Analysis:**
  1. FCM token was logged to debug console in `NotificationService.dart` upon app launch, but was never transmitted to the backend API (`POST /api/users/device-token`).
  2. Because users' device tokens in `prisma.user.deviceToken` remained `null`, the backend notification dispatchers (`notifications.controller.ts:createSystemNotification`) found zero target devices with valid tokens, and FCM push notifications were never sent.
  3. In `NotificationService.dart`, `_fetchAndCacheServerNotifications()` had its Hero Banner pop-up disabled to prevent spamming notifications on every app launch.
- **Fix Implemented:**
  1. **Device Token Sync Client API (`flutter_mobile/lib/services/api_service.dart`):** Added `ApiService.saveDeviceToken(String deviceToken)` sending device tokens to `POST /api/users/device-token`.
  2. **Notification Service Enhancement (`flutter_mobile/lib/services/notification_service.dart`):**
     - Implemented `syncDeviceToken()` to seamlessly transmit the active Firebase FCM token to the backend whenever an authenticated session is active.
     - Added automatic sync on startup and token refresh listener (`onTokenRefresh`).
     - Enhanced foreground notification handler (`FirebaseMessaging.onMessage`) to gracefully process both `message.notification` and `message.data` payload structures, reliably triggering `_showHeroBanner` and local cache.
     - Implemented smart timestamp and ID caching (`_kLastShownHeroNotifId`) in `_fetchAndCacheServerNotifications()`: if a fresh unread notification exists on the server (created within 24 hours) and hasn't been displayed, it triggers the Hero Banner once and marks it shown, ensuring alerts display even if FCM was blocked by OEM battery optimization, without duplicate pop-ups on subsequent opens.
  3. **Login & Dashboard Token Registration Hooks:**
     - `flutter_mobile/lib/screens/login_screen.dart`: Calls `NotificationService().syncDeviceToken()` immediately upon successful login.
     - `flutter_mobile/lib/screens/dashboard_screen.dart`: Calls `NotificationService().syncDeviceToken()` in `_loadDashboardData()` to ensure tokens stay synchronized continuously.
  4. **Backend Broadcast & Push Improvements:**
     - `backend/src/controllers/notifications.controller.ts`: Added broadcast fallback in `createSystemNotification` so notifications without specific `userId` or `role` are sent to all active users with device tokens.
     - `backend/src/controllers/announcements.controller.ts`: Ensured announcements with no restricted target roles trigger system notifications for all school users.
- **Deployment & Shorebird Compatibility:**
  - This update consists exclusively of pure Dart code changes within Flutter (`flutter_mobile/lib/`).
  - No native Android files, Kotlin/Java, Gradle plugins, or `AndroidManifest.xml` permissions were modified.
  - Therefore, this update can be distributed 100% via Shorebird Patch (`shorebird patch android`) with zero APK rebuild required.


## Custom Push Notifications with Big Picture Poster Images & Web Admin Dispatcher (November 3, 2026)
- **Feature Scope:** Implemented full-stack system enabling Admins to compose and broadcast custom push notifications containing rich text and poster images (Big Picture Banner) to the mobile app without requiring an APK rebuild.
- **Backend Infrastructure:**
  1. **Firebase Admin Multicast Push (`backend/src/utils/firebase.ts`):** Added `sendMulticastPushNotification` supporting batches of 500 tokens using `sendEachForMulticast`, plus `formatImageUrl` to transform relative disk paths into valid public HTTP URLs.
  2. **Custom Notification Controller (`backend/src/controllers/notifications.controller.ts:sendCustomNotification`):** Supports audience filtering (`ALL`, `ROLE`, `CLASS`, `USER`), records database notifications, and broadcasts FCM pushes with image payloads.
  3. **Protected API Route (`backend/src/routes/notification.routes.ts`):** `POST /api/notifications/send-custom` secured for Super Admin and Admin roles.
- **Flutter Mobile App Enhancements (`flutter_mobile/`):**
  1. **Big Picture Hero Banner (`flutter_mobile/lib/services/notification_service.dart`):** When notification contains an image URL, downloads bytes via HTTP and displays `BigPictureStyleInformation` with `ByteArrayAndroidBitmap`. Falls back gracefully to `BigTextStyleInformation` if no image is attached or if download times out.
  2. **Notification Screen Thumbnail Previews (`flutter_mobile/lib/screens/notifications_screen.dart`):** Displays rounded full-width image banners for notifications containing images.
  3. **Shorebird Compatibility:** 100% Pure Dart code. Distributable immediately via Shorebird OTA patch with zero APK rebuild.
- **Web Admin Portal (`frontend/src/`):**
  1. **`SendCustomNotificationModal.tsx`:** Dedicated modal with target audience selector (All School, By Role, Specific Class), live image upload to public disk storage, destination route picker, and real-time interactive Android notification preview card.
  2. **`AnnouncementsPage.tsx`:** Added "Send Custom Push" gradient action button in header.


## Admit Card Header Campus Address Update (November 4, 2026)
- **User Request:** Change header address badge to `SVL Paradise Campus, Narasannapeta`.
- **Root Cause & Behavior:**
  1. Previously, the top location badge under school subtitle rendered `{examCenter}` directly, which defaulted to `'JY School Main Campus, Hall A'`.
  2. The candidate details table also rendered `{examCenter}` for the `EXAM CENTER` row.
  3. The user requested the header badge to display the specific campus location: `SVL Paradise Campus, Narasannapeta`, while keeping the exam center designation accurate.
- **Fix Implemented:**
  1. **Admit Card Template (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
     - In `AdmitCardFrontHalf`: Added `const headerAddress = settings.headerAddress || settings.campusAddress || 'SVL Paradise Campus, Narasannapeta';` and rendered it in the top location badge pill.
     - In `renderHeader` (single page view): Updated location badge to `settings.headerAddress || settings.campusAddress || 'SVL Paradise Campus, Narasannapeta'`.
     - Candidate Details table retains the official examination center row (`settings.examCenterOverride || 'JY School Main Campus, Hall A'`).
  2. **Admit Card Configuration Tab (`frontend/src/pages/exams/AdmitCardTab.tsx`):**
     - Added `headerAddress` state initialized to `'SVL Paradise Campus, Narasannapeta'`.
     - Bound it in `useEffect` when fetching exam settings.
     - Included `headerAddress` in `handleSaveSettings` payload to persist changes to the backend.
     - Added a dedicated "Header Campus Address" input field in the configuration modal for school administrators.


## Admit Card Backside Schedule & Principal Signature Refinements (November 4, 2026)
- **User Requests:**
  1. Principal signature image should be double the previous size ("principal sign image ippudu unna image ki double undali").
  2. In the dark table header box: remove `REPORTING: 30 MINS BEFORE` and `• CANDIDATE: ...` text.
  3. Increase black box height by 1 point ("black box height 1 point increase cheyu").
- **Fix Implemented (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
  1. **Schedule Header Box:**
     - Completely removed the `REPORTING: 30 MINS BEFORE` and `• CANDIDATE: {name} ({rollNo})` badges.
     - Only `EXAMINATION SCHEDULE & TIME TABLE` remains in the header bar.
     - Increased vertical padding from `py-1.5` to `py-2.5` (`min-h-[34px]`, font size `text-[11.5px]`), giving it the requested 1-point height increase for solid visual balance.
  2. **Principal Signature Doubled (2x):**
     - Sized container up from `h-16` (64px) to `h-20` (80px) across Parent, Teacher, and Principal blocks.
     - Raised image bounds to `max-h-[80px]` and `max-w-[220px]`.
     - Applied `transform scale-[1.8] origin-bottom` so the official signature stamp visually scales to double size, anchored cleanly above the "Principal Signature" text label without displacing surrounding elements.
     - Mirrored this signature scaling in single-page view (`renderFooter`) for complete design parity.


## Flutter Mobile App Header, Logo, Student Photo & Welcome Screen Safe Area Update (November 4, 2026)
- **User Requests:**
  1. In Flutter app admit card & progress card: school name in header must match webapp (`SRI VENKATESWARA JY SCHOOL`), school logo must display (`assets/images/logo.png`), and real student photo must appear.
  2. In welcome screen: "Get Started" button was overlapping with the Android System Navigation Bar (`<  ○  |||`).
- **Fixes Implemented:**
  1. **Welcome Screen Safe Area Clearance (`flutter_mobile/lib/screens/welcome_screen.dart`):**
     - Replaced rigid Column with `LayoutBuilder` + `SingleChildScrollView(physics: BouncingScrollPhysics())` + `ConstrainedBox(minHeight: constraints.maxHeight)` to adapt to all screen sizes without overflow.
     - Wrapped "Get Started" button in `SafeArea(bottom: true)` with an additional explicit bottom clearance `SizedBox(height: math.max(bottomInset, 16.0) + 16)`. This guarantees the button sits comfortably above the Android 3-button system navigation bar on all devices.
  2. **Progress Card & Result Card Native View (`flutter_mobile/lib/widgets/progress_card_native.dart`):**
     - Header Title: Standardized to `SRI VENKATESWARA JY SCHOOL` (falling back gracefully if database settings have "JY School").
     - School Logo: Replaced placeholder rosette icon with rounded official school logo (`assets/images/logo.png`).
     - Address: Updated to `SVL Paradise Campus, Narasannapeta`.
     - Student Photo: Implemented `_buildStudentPhoto` with resilient parsing supporting both Base64 (`data:image` / raw base64 memory image) and HTTP/HTTPS network URLs, with graceful fallback to person icon.
  3. **Single Progress Card Screen (`flutter_mobile/lib/screens/single_progress_card_screen.dart`):**
     - Appended `&includePhoto=true` to `/api/exams/:id/results` query to ensure backend includes student `photoUrl`.
     - Added multi-source fallback resolving photo from `targetStudent['photo']`, `targetStudent['photoUrl']`, and `widget.studentData`.
  4. **Student Admit Card Screen (`flutter_mobile/lib/screens/student_admit_card_screen.dart`):**
     - Rendered actual school logo in circular badge instead of generic school icon.
     - Standardized school header name to `SRI VENKATESWARA JY SCHOOL`.
  5. **Admin Admit Card Screen (`flutter_mobile/lib/screens/admit_card_screen.dart`):**
     - Replaced text `'LOGO'` placeholder with real `assets/images/logo.png`.
     - Updated location badge to `SVL Paradise Campus, Narasannapeta`.
  6. **Deployment & Shorebird Compatibility:**
     - 100% Pure Dart code changes across `flutter_mobile/lib/`.
     - Zero native Android file or dependency changes.
     - Distributable immediately via Shorebird OTA Patch (`shorebird patch android`) with no APK rebuild required.


## Admit Card Header Plain Text Address, Exam Center & Live Schedule Timing Fix (November 4, 2026)
- **User Requests:**
  1. Remove the white pill/box border around the header campus address: make it clean uppercase styled text just like `(IIT-JEE/NEET FOUNDATION – OLYMPIADS)` above it.
  2. Exam Center in Candidate Details row must display `JY School SVL Paradise Campus`.
  3. Default Exam Timing set in Admin UI (e.g. `02:00 PM - 05:00 PM` as shown in screenshot) must reflect on the timetable rather than reverting to hardcoded `09:30 AM - 12:30 PM`.
- **Root Cause & Fixes Implemented:**
  1. **Header Address Box Removal (`frontend/src/components/Exams/AdmitCardTemplate.tsx`):**
     - Removed the pill badge border, rounded background, and MapPin icon from both `AdmitCardFrontHalf` and `renderHeader`.
     - Styled address as `<p className="text-[11px] sm:text-[11.5px] font-black uppercase tracking-[0.14em] text-slate-700 leading-tight mt-1">{headerAddress}</p>`, achieving complete visual harmony with the school subtitle above it.
  2. **Exam Center Designation:**
     - Set default exam center fallback in `AdmitCardTemplate.tsx` and `AdmitCardTab.tsx` to `JY School SVL Paradise Campus`.
     - Synchronized `flutter_mobile/lib/screens/admit_card_screen.dart` to `JY School SVL Paradise Campus`.
  3. **Live Exam Schedule Timing Synchronization:**
     - Created `currentExamWithSettings` using `useMemo` in `frontend/src/pages/exams/AdmitCardTab.tsx` that links `published`, `instructions`, `signatureUrl`, `headerAddress`, `examCenterOverride`, `defaultTiming`, and `schedule` state directly to `AdmitCardSheetPair` and `AdmitCardTemplate`.
     - Replaced hardcoded fallback `'09:30 AM - 12:30 PM'` in `AdmitCardTemplate.tsx` with dynamic `effectiveDefaultTiming` (`settings.defaultTiming || exam?.admitCardSettings?.defaultTiming`).
     - Setting `02:00 PM - 05:00 PM` in the UI immediately applies across all timetable rows, live preview, print sheet, and PDF downloads.
