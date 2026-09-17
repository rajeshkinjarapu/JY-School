# Project State: JY School ERP

## 2. Recent Updates & Progress
- **OMR Scanner Alignment & Black Vision Fixes (2026-09-17)**:
  - **Udayraj OMR Checker Architecture Analysis**: Clarified that Udayraj Deshmukh's `OMRChecker` is a CLI tool designed specifically for custom sheets with concentric circle bullseye markers (`omr_marker.jpg`), and its official repo states `--autoAlign flag is deprecated due to low performance on generic OMR sheets`.
  - **Zero-Distortion Paper Alignment (`align_omr_sheet`)**: Replaced the previous 4-point quadrilateral perspective warp with strict upright corner marker verification and an axis-aligned outer bounding box crop (`image[y:y+h, x:x+w]`). Guaranteed 0% tilt/slant.
  - **Calibrated Grid Coordinates & OpenCV Type Fix**:
    - Student ID: Shifted X-origin from 120 to 172 to bypass printed 'J' and 'Y' header boxes. Calibrated 6 vertical columns (x=172, gap=32px, y=416, gap=25.5px) to accurately capture `269657`.
    - Question Blocks: Shifted block X-origins to `[140, 330, 520, 710, 900]` (+28px shift to eliminate overlap on Q.No) and row Y-start to 816 (gap=35.5px, bubbles gap=26.5px).
    - Reduced evaluation probe radius from 8 to 7px (with search window 2px) to prevent ring bleed and guarantee clean separation between filled and unfilled bubbles.
    - Wrapped all coordinates passed to `cv2.circle` with explicit `int(round(...))` to resolve OpenCV 5.0 float center overload error.
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

