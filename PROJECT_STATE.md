# Project State: JY School ERP

## Latest Updates (2026-09-10)
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
- **AI Paper Generator Header Toggle**: Added a "Show Paper Header" toggle in Paper Settings for the AI Paper Generator, giving users the ability to hide the school logo, name, and instructions for a cleaner preview or book formatting.

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
