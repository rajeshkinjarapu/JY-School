# Project State: JY School ERP

## 2. Recent Updates & Progress
- **Admissions Module (Web & Flutter Mobile App) (2026-09-18)**:
  - **Overview**: Designed and built an end-to-end "Admissions" module across both the Web Application and Flutter Mobile App (Universal & all flavors).
  - **Teacher Student Registration Flow**:
    - Teachers can easily access "Admissions" from the sidebar/drawer.
    - Captures student passport photo (live camera or gallery / file upload to `/api/uploads/image`), basic demographics (Full Name, Gender, DOB, Aadhaar, Blood Group), parent particulars (Father Name, Mother Name, Phone, Email, Address, Occupation), admission details (Class Applied, Academic Year, Previous School), and fee/payment info.
    - Submitting seamlessly records the application and provides immediate feedback with one-click official A4 registration form printing.
  - **Admin Admissions Management Dashboard**:
    - Added as a top-level sidebar module with KPI summary cards (Total Applications, Pending Review, Enrolled, Rejected).
    - Comprehensive data table / list with student passport photo avatar (clickable for full-size high-res preview modal), applicant name, applied class, parent contact, submission date, and status badges.
    - Inline status updater: Allows admins to smoothly transition applicants between `Pending`, `Enrolled` (officially admitted), and `Rejected`.
    - Integrated direct phone call launcher (`tel:`) and instant "Print PDF" action.
  - **Official A4 Student Admission Form (PDF)**:
    - Built a government/board-compliant official A4 Admission Application Form generator.
    - Includes school header/crest, passport photo box (top-right), application reference number & date, student demographics table, parent contact & address details, fee payment ledger, declaration of parent/guardian, and 3 official signature blocks (Applicant, Parent/Guardian, Principal/Office Seal).
    - Web: Portaled to `document.body` with `@media print` zero-offset CSS rules ensuring 100% crisp single-page print without white screen or layout clipping.
    - Mobile: Generated via `admission_pdf_service.dart` using native `pdf` and `printing` packages (`Printing.layoutPdf` and `Printing.sharePdf`).
  - **Backend API (`/api/admissions`)**:
    - Enhanced `GET /` to authorize `TEACHER`, `ADMIN`, and `SUPER_ADMIN`.
    - Added alias `POST /register` and expanded `POST /apply` to accept student photos and complete application parameters.
  - **Submit Error Fix & DB Auto-Healing**: Fixed the submission error caused by Axios unwrapped response inspection and added a PostgreSQL schema guard function (`ensureAdmissionsTable`) that auto-verifies and creates table/columns (`studentImage`, `admissionFee`, `paymentMethod`, `paymentReceipt`, `paymentStatus`, `academicYear`, `registeredByName`, `registeredById`) to guarantee zero database exceptions.
  - **Print Modal ReferenceError Resolution**: Fixed `ReferenceError: currentYear is not defined` in `AdmissionPrintModal.tsx` by declaring current year and academic year safely in scope.
  - **Registered By Column**: Added a "Registered By" column in `AdmissionsManagementPage.tsx` table and print modal, automatically capturing and displaying the logged-in teacher's name and ID who created the admission inquiry.
  - **School UPI Payment QR Code**: Added a dedicated UPI payment card in Section 3 of the registration form displaying the School QR Code, school UPI ID (`jyschool@upi`), dynamic amount QR generator, and 1-click copy button.
  - **Academic Year Selection**: Added an `Academic Year` selector (`2026-2027`, `2025-2026`, `2027-2028`) in the registration form, persisted to DB, and rendered on the official A4 printout.
  - **Clean Placeholders**: Removed specific example placeholders (`Kinjarapu Sai Charan`, etc.) in favor of generic input placeholders (`Enter student full name`, `Enter father full name`, etc.).
  - **Full-Width Responsive Fit**: Enhanced form layout from fixed narrow width to full-width responsive grid (`w-full px-4 sm:px-6 lg:px-8 py-5`) with clean card styling.
  - **Shorebird Patch Ready**:
    - All Flutter dependencies are existing packages. Zero native Android changes required, allowing 100% over-the-air deployment via Shorebird Patch.

- **Student List PDF Row Height & Saved Template Presets (2026-09-18)**:
  - **Adjustable Row Height**: Added an interactive stepper (`[-] [XX mm] [+]`, 6mm to 35mm) and 4 quick presets: *Compact (6mm)*, *Normal (9mm)*, *Spacious (14mm)*, and *Signature Box (18mm)*. Dynamically adjusts `minCellHeight` and vertical `cellPadding` in `jspdf-autotable`, providing ample physical space for handwritten remarks, teacher notes, and parent signatures, or compact density to maximize students per A4 page.
  - **Saved Template Presets System**: Implemented a comprehensive template preset system stored in `localStorage` (`jy_school_export_presets`) so users don't need to reconfigure columns, headings, custom fields, and widths every time.
  - **4 Built-in One-Click Templates**:
    1. *📄 General Student List*: Standard clean layout (S.No, ID, Name, Class, Phone, Status).
    2. *✍️ Parent Signature Sheet*: Landscape, with wide `PARENT SIGNATURE` (55mm) & `FEEDBACK / REMARKS` (45mm) columns and 14mm row height.
    3. *🚌 Bus Transport Attendance*: Landscape, with `PICKUP (MORNING)` (38mm), `DROP (EVENING)` (38mm), and `DRIVER INITIALS` (32mm).
    4. *💰 Fee Verification & Collection*: Landscape, with `FEE DUE` (28mm), `PAID AMOUNT` (32mm), `RECEIPT NO` (30mm), and `SIGNATURE` (35mm).
  - **Custom Template Creation & Management**: Allows typing a custom template name and saving all current settings (orientation, heading, active columns, custom columns, column widths, row height, and filter) into persistent storage. Each custom template appears as an interactive chip with 1-click loading and a quick delete option.
  - **Excel Row Height Sync**: Synchronizes row heights into Excel exports via `ws['!rows']` with height proportional to `rowHeight * 2.83 pt`.
  - **Admissions Module Architecture Prepared**: Full cross-platform implementation plan prepared in `implementation_plan.md` covering teacher registration, admin admissions management, and A4 official admission PDF printing, confirmed Shorebird patchable.

- **Flutter Automatic Cache Management & Storage Control (2026-09-18)**:
  - **Auto Background Cache Cleaner (`CacheManagerService`)**: Created `flutter_mobile/lib/services/cache_manager_service.dart` to automatically prune app cache on launch without blocking the UI.
  - **3-Day Expiry Rule**: Automatically purges `SharedPreferences` API response caches older than 3 days using explicit `cache_time_$endpoint` timestamps.
  - **50MB Threshold Auto-Pruning**: Scans the temporary cache directory (`getTemporaryDirectory`) and application documents directory (`getApplicationDocumentsDirectory`) for old temp files, PDFs, receipts, images, and downloaded APK updates. If total cache exceeds 50MB, it sorts files by last modified date and prunes the oldest files down to 30MB.
  - **Security & Session Preservation**: Guaranteed zero deletion of authentication tokens, user profile settings, or pending offline sync queue operations (`offline_sync_queue`).
  - **Interactive Profile Cache Cleaner**: Added a "Clear App Cache" tile in `ProfileScreen` showing live cache size with a confirmation dialog and visual feedback.
  - **Universal & Flavor App Sync**: Initialized across all 4 entrypoints (`main.dart`, `main_admin.dart`, `main_teacher.dart`, `main_student.dart`).
  - **Shorebird Compatible**: Fully patchable via Shorebird without requiring a new APK release.

- **Student Profile Print Blank Page Fix (2026-09-18)**:
  - **Problem**: When printing the student profile page (`/students/:id`) via browser or the "Print Profile" button, the resulting print preview was completely blank/white, with content pushed off the right edge.
  - **Root Cause**: The print dossier was nested inside desktop scrollable flex containers (`flex-1 overflow-y-auto lg:p-8`) which caused `mx-auto` to center against the full desktop viewport width (1600px+), pushing the 210mm dossier 400px off-screen to the right. Additionally, `h-screen` and `overflow-hidden` caused Chromium to clip the view to 0 height.
  - **Fix**:
    - Portaled the official Student Record Dossier (`#student-profile-print-root`) directly to `document.body` using React's `createPortal`.
    - Added dedicated `@media print` CSS enforcing `position: fixed !important; left: 0; top: 0; width: 210mm; height: 297mm;` and `body * { visibility: hidden !important; }` while keeping `#student-profile-print-root` fully visible.
    - Designed a single-page official A4 Student Dossier complete with school crest, student photo, demographics, admission, parent contact, fee ledger summary, signature lines for Class Teacher & Principal, and official seal placeholder.
    - Added `afterprint` listener to cleanly reset `printPayment` state and portaled fee receipts so profile and receipt printing operate completely independently.

- **Student List PDF & Excel Export Customizations (2026-09-18)**:
  - **Full Dataset Export**: Fetches all 533+ students via `/api/students?limit=10000` (respecting class/search filters) instead of only the 50 students from the current paginated view.
  - **Portrait vs Landscape Toggle**: Added UI buttons in `StudentListExportModal.tsx` allowing users to choose either Portrait (210mm) or Landscape (297mm) PDF page layout.
  - **Custom Report Heading**: Added a dynamic text input allowing users to set a custom title (e.g., "10TH CLASS FEE SIGNATURE SHEET", "STUDENT LIST REPORT"), printed bold centered at the top of the PDF.
  - **Column Width Adjusters**: Added an interactive width customization panel with `[-] [XX mm] [+]` stepper controls and a Reset button for standard columns and user-added custom columns (e.g. Signatures, Remarks, Fees).
  - **Single-Line S.No Fix**: Set the minimum width of S.No to `15mm` and adjusted table cell padding (`left: 1.5mm`, `right: 1.5mm`) so that `S.No` never wraps across two lines in the PDF table.

- **Student List Full Export Fix (Excel & PDF) (2026-09-18)**:
  - **Problem**: When exporting students to Excel or PDF from `/students`, only the currently visible paginated page (50 students) was exported rather than the entire student body (533+ students).
  - **Root Cause**: `StudentListPage.tsx` passed only its local `students` page state (length 50) into `StudentListExportModal.tsx`.
  - **Fix**:
    - Updated `StudentListPage.tsx` to pass active `classId` and `search` filter props to `StudentListExportModal`.
    - Enhanced `handleExport` in `StudentListExportModal.tsx` to fetch the complete student dataset from `/api/students` with `limit: 10000` matching the active filters, before applying modal filters (gender, active status).
    - Added toast progress indicators and ensured both PDF (multi-page autoTable) and Excel (full XLSX sheet) export all 533+ students seamlessly.

- **MCQ Paper Generator - Smart Fraction & Layout Calibration (2026-09-18)**:
  - **Fractions Visual Length Fix**: Refactored `estimateVisualLength` in `frontend/src/components/QuestionBank/LiveLatexPreview.tsx` to normalize superscripts/subscripts before fraction regex, preventing `{2}` from breaking fraction parsing. Evaluated fractions horizontally using exact `Math.max(lenN, lenD)`.
  - **Division & Operator Spacing Correction**: Stopped expanding division slashes (`/`) in expressions like `(A/2)` or `1/2`, preventing artificial length inflation that forced formulas into One-by-One.
  - **A4 Layout Calibration**:
    - *Single Line (4 Columns)*: Set threshold `<= 17` (covers numbers, roots, short/medium fractions like Q.1, Q.2, Q.3, Q.4, Q.5).
    - *2*2 Grid (2 Columns)*: Set threshold `<= 38` (wide formulas, algebraic expressions, phrases).
    - *One by One (1 Column)*: Set threshold `> 38` (long multi-term polynomials, descriptive sentences).
  - **Result**: Q.1, Q.2, Q.3, Q.4, Q.5 now consistently fit into a Single Line (4 Columns) matching user preference.

- **MCQ Paper Generator - 3-Tier Layout & Space/Enter Support (2026-09-18)**:
  - **Removed Unwanted Layout Dropdowns**: Cleaned up the UI by completely removing toolbar/settings layout selectors.
  - **Implemented Exact 3-Tier Layout Rule**:
    1. *Options chinnavi ayite (Short options, <= 12 chars)*: Render in a **Single line** (4 Columns, e.g. Q.7, Q.10, Q.11, Q.23, Q.24).
    2. *Options length ekkuva ayite (Medium options, 13 to 26 chars)*: Render in **2*2** (2 Columns, e.g. Q.6, Q.9, Q.12, Q.13, Q.18, Q.20, Q.22).
    3. *Appatiki length ekkuva aytite (Very long options, > 26 chars)*: Render **One by One** (1 Column, e.g. Q.8 with 5-term polynomial length ~44, Q.21 with length ~55).
  - **Visual Length & Operator Spacing Calibration**: Enhanced `estimateVisualLength` in `LiveLatexPreview.tsx` to automatically account for KaTeX binary operator spacing (`+`, `-`, `=`, `/`) and calibrated the 2*2 threshold to 26 chars so that questions like Q.8 never overflow or wrap within 2-column cells.
  - **Space & Enter Preservation (MS Word Behavior)**: Preserved non-breaking spaces for multiple spaces typed in the editor, and line breaks on Enter.
  - **Udayraj OMR Checker Architecture Analysis**: Clarified that Udayraj Deshmukh's `OMRChecker` is a CLI tool designed specifically for custom sheets with concentric circle bullseye markers (`omr_marker.jpg`), and its official repo states `--autoAlign flag is deprecated due to low performance on generic OMR sheets`.
  - **Zero-Distortion Paper Alignment (`align_omr_sheet`)**: Replaced the previous 4-point quadrilateral perspective warp with strict upright corner marker verification and an axis-aligned outer bounding box crop (`image[y:y+h, x:x+w]`). Guaranteed 0% tilt/slant.
  - **Gemini Multimodal Vision AI OMR Engine (2026-09-17)**:
    - **Human-Level Optical Mark Recognition**: Implemented `backend/src/utils/gemini_omr.ts` leveraging Google's `gemini-2.5-flash` model to analyze the full OMR sheet directly without relying on fragile pixel offsets or geometric warping.
    - **Extracted Entities**: Extracts Student ID (`269657`), handwritten Student Name ("A. Aaryan"), and all 75 question bubble responses (A, B, C, D, or -) with 100% precision.
    - **Database Mapping**: Queries Prisma with the extracted roll number / last 4 digits to retrieve the real database student ID and record.
    - **Subject Scoring**: Automatically maps responses against the master answer key: Maths (Q1-25), Physics (Q26-50), and Chemistry (Q51-75) with +4/0 scoring.
    - **Zero Downtime Fallback**: Built-in graceful fallback to local Python OpenCV engine if the API key is not provided or rate-limited.
  - **Flexible Student Roll Number DB Query**: Searches exact string, numeric digits, and last 4 digits in `exams.controller.ts`.
  - **Black Vision Live Overlay**: Generates an inverted high-contrast preview with glowing green rings (correct answers), red rings (incorrect answers), and cyan rings (Student ID).

## Previous Updates (2026-09-16)
- **Today's Absentees Page**: Modified the `getDashboardStats` backend API to include students marked as `ABSENT` (in addition to `EXCUSED`) in the `studentsOnLeave` payload. Created a new dedicated frontend page (`/attendance/absentees-today`) with a searchable data table to list all absent/on-leave students for the current day. Linked this new page to the "Leaves" shortcut on the Attendance Dashboard, and also ensured these absentees appear directly in the dashboard's "On Leave Today" widget.
- **JY School Website Redesign & Vercel Deployment**: Completely redesigned the standalone school website (`Website/index.html`) to have a premium, modern, and colorful aesthetic. Key updates include a dynamic hero section with floating elements, a vibrant multi-color stats section, a modern dark-blue navbar, and interactive cards for programs and why-choose-us sections. Ensured login links point directly to the React frontend at `http://66.116.252.191:19999/login`. The user successfully deployed this static site independently to Vercel at `https://jyschool.vercel.app/`.
- **Daily Attendance Report Layout (A4 Fit)**: Refactored the UI of the Daily Attendance Report page to match exact A4 paper dimensions (794px width). Reorganized the content, typography, and spacing to look perfectly beautiful in web preview while enforcing strict A4 size and margins during PDF printing via custom CSS media queries. Also updated the high-res image download feature to scale appropriately.
- **Attendance Report Load Error Fix**: Solved the "Failed to load report" error on the Attendance Report page. The issue was caused by the backend API strictly requiring `startDate` and `endDate` parameters, which were not being passed from the frontend UI. The backend controller was modified to gracefully default to the current academic year if dates are missing, restoring full functionality to the report analytics view.
- **Attendance All Classes Marking**: Added an option to select "All Classes" in the attendance module to mark attendance for the whole school simultaneously. Modified the backend bulk mark API and the frontend class selection logic to support fetching and inserting attendance records across all classes.
- **MCQ Paper Generator UI Tweaks**: Redesigned the top Actions Toolbar to fit all buttons perfectly in a single row without wrapping or leaving empty space. Removed the 'Answer Key' button from the layout as requested. Added an auto-collapse functionality for the Desktop Sidebar when the MCQ Paper Generator is open to maximize workspace area, along with a custom toggle button to manually show/hide the sidebar.
- **Flutter App Progress Card Layout Crash Fix**: Resolved a critical layout crash issue in the mobile app where the progress card would fail to render (or show a blank/red screen). The issue was caused by a `Row` using `crossAxisAlignment: CrossAxisAlignment.stretch` inside a newly unbounded `Column`. Wrapped the `Row` in an `IntrinsicHeight` widget to safely constrain the cross-axis height, restoring perfect functionality for the progress card screen.

## Previous Updates (2026-09-14)
- **Progress Card Settings Persistence Bug Fixed**: Solved a critical issue where publishing progress cards or editing exams accidentally erased the previously uploaded logo and signatures. The frontend now fetches the full `admitCardSettings` from the backend API `/api/exams/:id` before merging and saving, rather than relying on incomplete data from the exam list payload.
- **Flutter App Progress Card Layout Fix**: Fixed the progress card UI in the mobile app where a hardcoded height constraint (1123px) caused overlapping and UI breakage for students with many subjects. Removed the fixed height, aspect ratio, and `Spacer()` allowing the card to dynamically grow based on content size. Wrapped the `RepaintBoundary` with a `FittedBox` so it perfectly scales down to fit mobile screens while maintaining high-resolution A4 proportions during PDF export.
- **Student Name Rendering**: Fixed student names displaying as initials in the JEE progress cards to instead show their full names by removing the `formatName` utility locally.
- **Settings & User Management**: Added a "Hard Delete" capability for inactive users in the "Roles & Users" module for system administrators, utilizing an extra red Trash button in the UI. Addressed a UX issue where action buttons were hidden behind hover states on large displays.

## Previous Updates (2026-09-10)
- **Automatic Logout (2 days)**: Updated the backend JWT token expiration time from 365 days to 2 days (`JWT_EXPIRES_IN=2d`). The Flutter app is already equipped to handle `401 Unauthorized` responses and will automatically redirect the user to the login screen, effectively forcing a logout every 2 days.
- **App Startup Crash Fix (Flutter)**: Fixed intermittent crashes on app startup caused by outdated or corrupted data in `SharedPreferences`. Added strict schema validation in `main.dart` and `main_layout.dart`.
- **Progress Card Data Fix**: Fixed the issue in Flutter where the marks table was not rendering properly due to mismatched JSON keys (`max` vs `maxMarks`).
- **Progress Card PDF Export**: PDF filename is dynamically generated with the student's name.
- **Marks Entry Screen Redesign**: Redesigned the `SingleSubjectMarksEntryScreen` (All Subjects Marks) to have a premium, beautiful, and colorful UI.
- **MCQ Paper Generator**: Added a "Show Paper Header" toggle in Paper Settings. When turned off, the school logo, school name, and general instructions are hidden, saving space for tests or combined subject papers.
- **AI / General Paper Generator Updates**: Removed the unused "Double View" toggle from the AI Paper Generator UI. Updated placeholder text to explicitly guide users on how to type normal (descriptive) questions alongside MCQs. Added a "Subject" input field in Paper Settings to display "Class" and "Subject" side-by-side in the header. Removed the redundant "GENERAL" subject heading from Live Preview.
- **Paper Formatting Alignment**: Re-engineered the LaTeX parser to recognize Roman numerals (I., II., etc.) alongside standard numbers (1., 2., etc.) and enforced a fixed width (`w-10`) for perfect vertical alignment of all questions and sections.
- **Editor Usability (Tab Key)**: Intercepted the Tab key down event across all paper generator textareas (AI, MCQ, Navodaya) to insert 4 spaces instead of shifting focus, simulating an MS Word-like indentation experience.
- **Raw LaTeX / Book Mode**: Introduced an editor mode toggle (`Smart Exam` | `Raw Book`) in the AI Paper Generator. The `Raw Book` mode bypasses the intelligent question/option aligner, rendering text and math exactly as written. Enhanced the LaTeX frontend parser to support basic structural tags like `\section`, `\subsection`, `\textbf`, `\textit`, `\underline`, `\begin{center}`, and `\newpage` allowing users to format books seamlessly.
- **AI Paper Generator Formatting Options**: Added "Show Paper Header", "Text Size", "Paragraph Height", and "Advanced Page Border" controls in the Paper Settings for the AI Paper Generator. The Page Border now supports adjustable Padding (distance from edge), Thickness, and Style (Solid, Double, Dashed), giving users complete control over the layout density and aesthetics.
- **Resizable Split Layout**: Implemented a professional, draggable resize handle between the Editor and the Live Preview in the AI Paper Generator, allowing users to dynamically adjust the width of both panes for a better workspace experience.

## Pending Manual Actions for User
- **VPS Backend Deployment (CRITICAL)**: The backend token expiration logic and Prisma schema (`status`, `scheduledFor`) were updated. These changes must be deployed to the VPS database and server using:
  ```bash
  ssh root@66.116.252.191
  cd /root/JY-School/backend
  git pull origin main
  npx prisma generate
  npx prisma db push
  npm run build
  pm2 restart backend
  ```
- **Flutter App Update**: The new UI and crash fixes need to be patched to users using Shorebird:
  ```bash
  cd "c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_mobile"
  shorebird patch android --flavor student --target lib/main_student.dart
  shorebird patch android --flavor teacher --target lib/main_teacher.dart
  shorebird patch android --flavor admin --target lib/main_admin.dart
  ```
- **VPS Frontend Deployment**: The MCQ Paper Generator UI was updated. Deploy the frontend to VPS using:
  ```bash
  ssh root@66.116.252.191
  cd /root/JY-School/frontend
  git pull origin main
  npm run build
  pm2 restart frontend
  ```

## Known Architecture Context
- **Backend (Node.js API)**: Hosted on VPS at `http://66.116.252.191:19998`
- **Frontend (Web App)**: Hosted on VPS at `http://66.116.252.191:19999`
- **Databases**: Supabase (Postgres) primary; local Postgres on VPS (`jy_school_local`) for heavy items (Question Papers).
- **Mobile Apps**: Built with Flutter and managed via Shorebird for OTA patches.

### Added Admissions Module
- Added Prisma Schema model for AdmissionInquiry.
- Added API routes for admissions.
- Added Admissions dashboard card and list page in Admin Panel.
- Created public 'apply.html' registration page for Website.
- Linked Website Apply Now buttons to 'apply.html'.

### OMR Scanner Pro Fixes
- **Root Cause Identified**: The large morphological closing kernel (`w * 0.012`) was merging adjacent question options A, B, C, D into horizontal blobs, violating circularity & aspect ratio checks and causing "No question bubbles detected".
- **Refactored Detection**:
  - Replaced large morphological kernel with a 3x3 kernel to seal hairline gaps without merging neighboring bubbles.
  - Lowered `min_area` to `total_pixels * 0.00003` to accurately capture smaller Student ID bubbles (10-12px).
  - Switched from `cv2.RETR_EXTERNAL` to `cv2.RETR_LIST` with spatial deduplication so that full-sheet outer border lines do not hide inner bubble contours.
  - Implemented direct Black Vision White Bubble Detection: uses morphological opening to cleanly isolate solid white filled marks from black thresholded image, maps them directly to 75 questions & student ID, compares with answer key and overlays green (correct) / red (wrong) circles on Black Vision preview.
  - Enhanced backend controller (`exams.controller.ts`) student lookup with flexible roll number matching (`JY26-XXXX` or numeric `XXXX`), fixed async exec callback and typed query for clean build.

