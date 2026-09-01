
### Recent Updates (Transport Module)
- **Student Transport Dashboard**: Redesigned transport_screen.dart to check isStudent. Created a dedicated Student View featuring 'Live Bus Tracking' card, 'My Route Details' card (with placeholders for bus no, route, pickup/drop times), and 'Driver & Support' card. 1970 date issue in payments history also fixed.

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
- **Frontend Webapp**: Created a premium `AppInstallsPage.tsx` with a beautifully designed table, added a route `/app-installs`, and linked the App Installs stats card on the admin dashboard to the new page.
- **Flutter App**: Integrated `device_info_plus` and `package_info_plus` plugins in `pubspec.yaml`. Created `device_info_service.dart` to securely send device model and app version to the backend. Configured `main.dart` and `login_screen.dart` to automatically update device info after successful authentication.

### Bug Fixes
- **Teacher Homework Screen**: Fixed a bug where the subject dropdown showed all subjects duplicated across classes. Subjects are now dynamically filtered to only show those belonging to the currently selected class in both the "Assign New" and "My Homeworks" tabs (`teacher_homework_screen.dart`).
