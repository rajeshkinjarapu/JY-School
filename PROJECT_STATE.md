# Current Project State

## Recent Accomplishments
1. **Seamless In-App Direct APK Update System:**
   - Redesigned `UpdateService` (`lib/services/update_service.dart`) with a world-class, premium in-app update dialog.
   - **Zero External Links:** Download happens 100% inside the app on-screen with real-time download progress and MB counter.
   - **Direct APK Installation:** Uses `OpenFile.open` with Android `FileProvider` (`filepaths.xml`) and `REQUEST_INSTALL_PACKAGES` permission to launch the installer immediately on screen.
8. **Flutter App Names Update:**
   - Updated `AppConfig` (`app_config.dart`) to use concise names (`JY - Student`, `JY - Teacher`, `JY - Admin`) for better UI presentation.
   - Removed "ERP" text from the universal configuration to strictly display "JY School".
9. **Progress Card Address Update:**
   - Updated the header and location fields in `single_progress_card_screen.dart` (Flutter) and `ProgressCardTemplate.tsx` (Web) to show the full address: `Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta`.
10. **Progress Card PDF Export Name:**
    - Modified `_downloadPdf` and `_sharePdf` methods in `single_progress_card_screen.dart` to use the dynamic student name instead of student ID for the exported PDF filename (e.g., `Arangi_Lalitaksha_progress_card.pdf`).
2. **Multi-App Architecture (Student, Teacher, Admin Separate Apps):**
   - Created centralized `AppConfig` with distinct flavor configurations (`student`, `teacher`, `admin`, `universal`).
   - Created 3 dedicated entry points: `lib/main_student.dart`, `lib/main_teacher.dart`, and `lib/main_admin.dart`.
   - Updated `lib/screens/login_screen.dart` to dynamically adapt branding, fields, and enforce strict role verification.
   - Configured Android `productFlavors` and string resources in `build.gradle.kts` and `AndroidManifest.xml` (`com.jyschool.erp.student`, `com.jyschool.erp.teacher`, `com.jyschool.erp.admin`).
3. **Homework Screens UI Consistency:** Fixed the `homework_screen.dart` and `teacher_homework_screen.dart` AppBar designs to match the standard dark purple gradient across the JY School Flutter App.
4. **Announcements Visibility Bug Fix:** 
   - Fixed an issue where new announcements were not appearing instantly in the Student/Teacher dashboards due to an aggressive 3-minute in-memory cache (`clearDashboardCache`). Added cache clearing hooks on announcement create/update/delete.
   - Fixed a query bug in `dashboard.controller.ts` where general announcements (with empty `targetRoles` meant for everyone) were not being fetched by the Student/Teacher queries. Added `OR: [{ targetRoles: '' }]` fallback.
5. **Timetable Controller Bug Fix:**
   - Fixed a critical syntax error and removed large blocks of accidentally duplicated functions (`createSlot`, `updateSlot`, etc.) in `timetable.controller.ts` which was causing the backend build to fail on the VPS. 
6. **Student Exams Section Implementation:**
   - Added `StudentExamsDashboardScreen` with a 4-module grid.
   - Built `StudentAdmitCardScreen` (Hall Ticket UI).
   - Built `StudentQuestionPapersScreen` (PDF downloads).
   - Built `StudentResultsScreen` (Leaderboard/Notice Board).
   - Built `StudentProgressCardScreen` (Routes to `SingleProgressCardScreen` for PDF export).
   - Filtered all views strictly by student's `classId`/`studentId`.
7. **App Installation & Update Management:**
   - Added `isAppInstalled` and `lastAppLoginAt` tracking for Mobile App users.
   - Updated Web Admin Dashboard to display 'App Installs' statistics.
   - Served `app-version.json` and `app-release.apk` statically from the backend root URL.
   - Incremented Flutter app version to `1.0.1+2` in `pubspec.yaml`.

## Backend Deployment Context
Backend runs on `http://66.116.252.191:19998`. All backend fixes require pushing to GitHub and rebuilding on the VPS using SSH.

## Documentation & Guides
- **Mobile Apps Build & Deploy Guide:** [`APP_BUILD_GUIDE.md`](file:///c:/Users/Admin/Desktop/JY%20School/JY%20ERP/JY-School/APP_BUILD_GUIDE.md) contains complete build commands for Student, Teacher, Admin APKs, scp commands, and server update steps.

### 2. OMR Scanning System
- **Backend:** Python OpenCV script (`omr_scanner.py`) deployed on VPS for CPU-intensive scanning.
- **Flutter UI:** Added `omr_scanner_screen.dart` with a green "Scan OMR Sheet" button on the Exams Screen. Handles 75 questions (Maths, Physics, Chemistry) for 300 marks.
- **Integration:** API endpoint `/api/exams/scan-omr` processes the image and returns extracted marks.

### 3. Transport Module (Phase 1 & Phase 3)
- **Discovery:** Found that Phase 1 (Database schema, Backend APIs, and Web App UI) was already fully built in the codebase.
- **Flutter App UI Upgrades:**
  - Upgraded `transport_routes_screen.dart` and `transport_vehicles_screen.dart` from basic cards to a premium, glassmorphism UI with smooth animations.
- **New Flutter Features:**
  - Built `active_trip_screen.dart` for drivers to manage trips and student onboarding/attendance.
  - Built `live_tracking_screen.dart` with animated UI placeholders for parent real-time tracking (Google Maps integration ready).

### 4. Student Module UI Updates
- **Flutter App:** Created `student_dashboard_screen.dart` matching the premium layout without a sidebar, adding a curved top header, an announcements box, a pastel 6-grid for features, and a floating bottom navigation bar. Also added the "JY SCHOOL" branding to the header.

### 5. Web App Admin Improvements
- **Settings Page:** Updated the "Roles & Users" table in `frontend/src/pages/settings/SettingsPage.tsx`. Split user details to explicitly show "Name", "Login Details" (Email), and added a "Password" column displaying a secure encrypted placeholder to improve admin usability and clarity.

### 6. Progress Card Updates
- **Web App:** Renamed 'JEE Progress Cards' to 'Progress Cards'. Replaced hardcoded MAT, PHY, CHE subjects in the progress card table with dynamic exam subjects (handling primary classes properly without showing '-'). Improved table layout to be responsive and fit the screen without unnecessary gaps.
- **Flutter App:** Removed the 'IIT-JEE / NEET Foundation' subtitle from the PDF generation in single_progress_card_screen.dart to make it a generic progress card for all classes.

### 7. Progress Card (Flutter WebView Integration)
- **Web App:** Reverted `ProgressCardTemplate.tsx` to the standard professional design, removing the forced A4 layout which cut off signatures. Removed `crossOrigin="anonymous"` from signatures to fix rendering issues.
- **Flutter App:** Installed `webview_flutter` and completely refactored `single_progress_card_screen.dart` to directly embed the Web App's report card URL. This ensures 100% UI parity with the web app and eliminates the need for separate Flutter UI maintenance.

## Strict Architecture Rules (To Remember)
- **NO Direct DB Connections in Flutter:** Flutter must only call Node.js APIs.
- **VPS Code Deployment:** Changes to `backend` require manual SSH pull & build on the VPS (command provided to user).
- **Flutter UI Safe Area:** All bottom-sticky elements (buttons, nav bars) MUST have `SafeArea(bottom: true)` to avoid overlapping Android OS nav bars.
- **No Dummy Data:** Design UI to match the exact JSON responses from the real Backend APIs.
- **Premium Design:** Ensure highly polished, premium UI/UX aesthetics on every screen (Gradients, animations, proper typography).

## Open Issues / Next Steps
- Verify OMR backend Python script dependencies (`opencv-python`, `imutils`) on the VPS.
- Further integration of Flutter `Live Tracking` with actual WebSocket Server.
- Add fee integration for students assigned to transport stops.

## 2026-09-01 Update
Git pull was successful. Merged local states.
