### Recent Updates (Question Paper Generator - Web)
- **Multi-Section Board Exam Templates**: Re-engineered the Question Paper Generator in the Web App (`NavodayaPaperGeneratorPage.tsx` and `LiveLatexPreview.tsx`) to support a "Section Mode". Users can now create professional board-style papers with multiple sections (e.g., Section-I, Section-II), each with distinct instructions and marks configurations.
- **AI Integration Enhancement**: Updated the AI question generation and Word Doc import modules to append questions directly to the *currently active section* rather than the global document, allowing for granular section-by-section construction.
- **Backward Compatibility**: Designed a clever serialization strategy (`<!--BOARD_EXAM_JSON:...-->`) that stores the complex multi-section JSON inside the existing Prisma `content` string field, completely avoiding database migrations and keeping old papers intact.

### Recent Updates (Transport Module)

### Recent Updates (Transport Modules 2)
- **Student Transport Tabs**: Restructured transport_screen.dart into a Tabbed view for students (Bus Details, Live Tracking) with a fixed non-scrolling AppBar. Modified live_tracking_screen.dart to support isEmbedded parameter to prevent nested AppBars.

### Recent Updates (Attendance)
- **Student Attendance Screen**: Completely overhauled attendance_screen.dart with a premium design, including a custom Monthly Calendar, Today's Status Banner, and a dynamic Absence Alert (that links to Leave Request).

- **UI Polish**: Enhanced My Attendance screen with premium vibrant colors, gradient appbar matching the theme, indigo tab selection, and colorful stat cards.

### Recent Deployment Updates
- Pushed changes to Github: "Fix: Exam Plan timetable class selection bug in webapp and remove logo in results screen".
- Successfully pulled from origin and deployed the latest changes to the VPS server, built the backend and restarted using pm2.

### App Installs Tracking
- **Backend**: Updated User model in `prisma/schema.prisma` with `deviceModel`, `appVersion`, `lastIpAddress`, and `lastAppLoginAt`. Added `/api/users/app-info` to save device details and `/api/users/app-installs` for admin reporting.
- **Frontend Webapp**: Created a premium `AppInstallsPage.tsx` with a beautifully designed table, added a route `/app-installs`, and linked the App- **Codemagic CI/CD Fix**: Resolved Shorebird build failures for new apps by pointing `working_directory` to `flutter_workspace/apps/*` instead of `flutter_mobile`. Removed `--flavor` flags as apps are now separated. Also fixed Windows backslash issue by removing and gitignoring `pubspec_overrides.yaml`.
- **Backend Fixes (Render & VPS)**: Fixed Prisma runtime error for Linux (`debian-openssl-3.0.x`) and missing `schema_local.prisma` generation in `package.json` build scripts. Clarified that actual backend runs on VPS, and Render deployment failures can be ignored.a into two elegant toggle tabs.
- **Flutter App**: Integrated `device_info_plus` and `package_info_plus` plugins in `pubspec.yaml`. Created `device_info_service.dart` to securely send device model and app version to the backend. Configured `main.dart` and `login_screen.dart` to automatically update device info after successful authentication.

### Bug Fixes & UI Improvements (Homework)
- **Teacher Homework Screen**: Fixed a bug where the subject dropdown showed all subjects duplicated across classes. Subjects are now dynamically filtered. 
- **Homework Screens UI Redesign**: Overhauled `teacher_homework_screen.dart` and `homework_screen.dart` with a very premium and colorful design. Replaced the "Due Date" label with "Submission Deadline" and removed the inappropriate "Overdue" label, replacing it with "Deadline Passed" and showing the assigning teacher's name on the card.
- **Student Dashboard Integration**: Added the missing "Homework" module link to the Student Dashboard grid (`student_dashboard_screen.dart`) and configured the `/student/homework` route in `main.dart` so students can view published homework.
- **Teacher/Admin Dashboard Update**: Replaced "My Salary" with "Home Work" in the main dashboard grid for teachers/admins, and moved "My Salary" to the "More Options" (`modules_screen.dart`) screen.

### Web App & Student Login Fixes
- **Vite Preload Loop Fix**: Added `retry_preload` URL parameter check in `main.tsx` `vite:preloadError` event listener to stop the infinite reload loop that occurred when chunk loading failed.
- **Student Passwords Reset**: Discovered that student passwords were set to their phone numbers instead of the expected `Student2026`. Ran a script to reset all student passwords to `Student2026`.
- **Student Transport Screen Fix**: Updated the "Live Tracking" tab in `transport_screen.dart` to correctly show "Live tracking is unavailable because you are not assigned to any school transport route" when `_studentTransportInfo` is null, removing the dummy data.

### Password Visibility & PDF Export
- Added `plainPassword String?` to `User` model in `schema.prisma`.
- Updated `users.controller.ts` and `students.controller.ts` to save and return `plainPassword`.
- Added `/api/students/export-credentials` API endpoint to fetch all student credentials ordered by class name and roll number.
- Updated `frontend/src/pages/settings/SettingsPage.tsx`:
  - Displayed `plainPassword` directly in the Roles & Users table.
  - Added an "Export Passwords PDF" button generating a class-wise PDF report with `S.No`, `Student Name`, `Login Details`, and `Password`.
  - Added show/hide eye toggle for password editing in the User Edit modal.

### Student Gate Pass Dashboard Fix
- Updated `gate_pass_screen.dart` to grant access to `STUDENT` role, rendering dedicated `Dashboard` and `My Passes` tabs with an `Apply Pass` FAB.
- Added `Gate Pass` grid item to `student_dashboard_screen.dart` linking to `GatePassScreen()`.
- Updated `dashboard_screen.dart` to navigate directly to `GatePassScreen()` when `Gate Pass` card is tapped.

### Student Fee Payment Submission Fix
- Fixed `"Missing required fields"` API error in `fees.controller.ts` by auto-resolving `studentId` from `req.user.id` when not provided in the payload and supporting both `amount`/`amountPaid` and `referenceNumber`/`utrNumber` parameters.
- Updated `studentPayFeeWithScreenshot` in `api_service.dart` to populate all fallback field names for multipart request payload compatibility.
