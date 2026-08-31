# Project State & Context

## Application Overview
- **Name:** JY School ERP
- **Type:** Full-Stack School ERP (React Web Admin + Flutter Mobile App + Node.js API)
- **Infrastructure:** Hosted on VPS (`66.116.252.191:19998`).
- **Database:** Supabase (PostgreSQL) for Relational Data, Local Postgres for Heavy Data (Question Papers/Images).

## Recent Conversation Summary (Logo Missing Fixes & Flutter Errors)
- **Bug Fixed**: Backend was calculating total percentage incorrectly because `mark.maxMarks` was being wrongly saved as the total exam max marks (e.g. 300) when teachers entered marks. Fixed in `exams.controller.ts` to read the correct `maxMarks` from `exam.subjects` config.
- **Backend Deployed**: User successfully deployed the percentage calculation fix to the VPS production server.
- **Flutter UI Fix**: The Progress Card UI was compressing/stretching and not matching the exact A4 size. Modified `single_progress_card_screen.dart` to strictly use a container of `width: 794, height: 1123` with `Spacer` to push the signatures footer precisely to the bottom of the A4 layout. This fixes PDF export and UI view to be perfectly uncompressed.
- **Location Hardcode**: As requested, changed the location string on the Flutter card to just `'Narasannapeta'`.
- **Signature Images**: Fixed cross-platform backslash formatting bug in `api_service.dart` where `getImageUrl` was generating incorrect URLs, causing the teacher and principal signatures to show up as blank placeholder lines.
- **Logo Fixes**: Added logic to `JEEProgressCardTab.tsx`, `ProgressCardTab.tsx`, and `AdmitCardTab.tsx` in the WebApp to automatically use the global `SchoolSettings` logo and signatures if they are not explicitly set for a specific exam.
- **Flutter Syntax Fixes**: Resolved hot-reload compiler errors (missing bracket and type mismatch for `stats`) in `single_progress_card_screen.dart` and `exam_status_screen.dart`.
- **Flutter UI Alignment**: Fixed empty space issue in `single_progress_card_screen.dart` by increasing table row padding from 6px to 12px for better readability, and anchoring the signatures directly above the bottom note.
- **Result Detail Screen**: Added `fatherName` to the backend `getExamResults` API and enabled `includePhoto: true` in the Flutter API call so that the Student Image and Father Name load correctly with live data instead of dummy placeholders.
- **Share Result Layout**: Fixed the layout for the "Share Full Result" feature by adding padding inside the `RepaintBoundary` so the exported image has a beautiful, clean margin instead of being tightly cropped.
- **Admin Dashboard UI**: Wrapped the top statistics row (Students, Teachers, Revenue) in a premium, beautifully styled container card with shadows, and applied Indian currency formatting to the Revenue number to match a professional UI design.
- **Custom Notification Sound (Flutter)**: Successfully implemented a custom background push notification sound (`jyschool_chime.wav`) that exactly matches the WebApp's Web Audio API synthesized chime. Generated the wave file programmatically, bundled it in the Android `res/raw` directory, updated the `flutter_local_notifications` channel, and configured the backend FCM payload to play it.
- **Git Updates**: Provided the user with the terminal commands to pull the latest updates from Git to the local workspace.

## Recent Work Accomplished

### 1. In-App Updates System
- **Flutter App:** Added `update_service.dart` using `Dio` and `open_file` to download and install APKs silently within the app without redirecting to a browser.
- **Backend:** Created endpoints to serve the latest version metadata and the APK file.

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

## Strict Architecture Rules (To Remember)
- **NO Direct DB Connections in Flutter:** Flutter must only call Node.js APIs.
- **VPS Code Deployment:** Changes to `backend` require manual SSH pull & build on the VPS (command provided to user).
- **Flutter UI Safe Area:** All bottom-sticky elements (buttons, nav bars) MUST have `SafeArea(bottom: true)` to avoid overlapping Android OS nav bars.
- **No Dummy Data:** Design UI to match the exact JSON responses from the real Backend APIs.
- **Premium Design:** Ensure highly polished, premium UI/UX aesthetics on every screen (Gradients, animations, proper typography).

## Next Steps Pending
- Verify OMR backend Python script dependencies (`opencv-python`, `imutils`) on the VPS.
- Further integration of Flutter `Live Tracking` with actual WebSocket Server.
- Add fee integration for students assigned to transport stops.

### 6. Progress Card Updates
- **Web App:** Renamed 'JEE Progress Cards' to 'Progress Cards'. Replaced hardcoded MAT, PHY, CHE subjects in the progress card table with dynamic exam subjects (handling primary classes properly without showing '-'). Improved table layout to be responsive and fit the screen without unnecessary gaps.
- **Flutter App:** Removed the 'IIT-JEE / NEET Foundation' subtitle from the PDF generation in single_progress_card_screen.dart to make it a generic progress card for all classes.

### 7. Progress Card (Flutter WebView Integration)
- **Web App:** Reverted `ProgressCardTemplate.tsx` to the standard professional design, removing the forced A4 layout which cut off signatures. Removed `crossOrigin="anonymous"` from signatures to fix rendering issues.
- **Flutter App:** Installed `webview_flutter` and completely refactored `single_progress_card_screen.dart` to directly embed the Web App's report card URL. This ensures 100% UI parity with the web app and eliminates the need for separate Flutter UI maintenance.
