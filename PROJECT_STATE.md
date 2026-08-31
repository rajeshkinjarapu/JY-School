# Project State & Context

## Application Overview
- **Name:** JY School ERP
- **Type:** Full-Stack School ERP (React Web Admin + Flutter Mobile App + Node.js API)
- **Infrastructure:** Hosted on VPS (`66.116.252.191:19998`).
- **Database:** Supabase (PostgreSQL) for Relational Data, Local Postgres for Heavy Data (Question Papers/Images).

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
