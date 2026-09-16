# Project State: JY School ERP

## Latest Updates (2026-09-16)
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
