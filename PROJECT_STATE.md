# Project State: JY School ERP System

## Current Focus (As of 2026-09-02)
- **Phase 3:** Mobile App Payment Integration (Completed)
- **Finance Module (Web):** Added "Collect Fee" shortcut card in Finance Dashboard.
- **Student Dashboards (Flutter & Web):** Designed and isolated the Examination and Finance dashboards for Student logins, ensuring clean UI and restricted access to relevant features.

## Accomplished Features
### 1. Phase 1 & 2 (Web & Backend)
- Set up Supabase + Local Postgres hybrid architecture on VPS.
- Implemented backend settings route for dynamically storing `bankName`, `bankAccountNumber`, `bankIfsc`, `upiId`, and `qrCodeUrl` (`SettingsController`).
- Configured file upload (multer) in the backend to store QR Code images.
- Implemented Admin Web App Payment Settings Panel.
- **Finance Dashboard:** Added a dynamic "Collect Fee" card that routes directly to `/collect-payment` using `react-router-dom`'s `useNavigate`.

### 2. Phase 3 (Flutter Mobile App)
- **API Services:** Connected the Flutter mobile app to the real backend (`http://66.116.252.191:19998`).
  - Added methods for Fee Payment, Fetching Settings (QR Code), Pending Approvals, and Processing Approvals in `api_service.dart`. No dummy data is used.
- **Student Flow Screens:**
  - `StudentDashboardScreen`: Added "Fees" quick access button.
  - `StudentExamsDashboardScreen`: Created a dedicated, restricted exams dashboard with a premium white-card UI showing only Admit Card, Question Papers, Results, and Progress Card.
  - `StudentFinanceDashboardScreen`: Created a dedicated finance dashboard with premium UI featuring Pay Fees, Fee Receipts, Fee Structure, and Transactions, along with a support section.
  - `StudentFeeOverviewScreen`: Fetches live Total/Paid/Due stats with a dynamic Circular Chart.
  - `StudentPayFeeScreen`: Fully redesigned to include fee structure Dropdown, Amount selection, QR code display, and Image Picker on a single screen. Sends `feeStructureId` to backend.
  - **Fees & Receipts**: Updated `fees_screen.dart` with a clean white card for dues, and a Receipts tab that pulls real individual `FeePayment` records via new `/fees/payments` route. Shows `PROCESSING` for pending verifications and `SUCCESS` for approved payments.
- **Progress Card PDF Export Name:**
  - Modified `_downloadPdf` and `_sharePdf` methods in `single_progress_card_screen.dart` to use the dynamic student name instead of student ID for the exported PDF filename (e.g., `Arangi_Lalitaksha_progress_card.pdf`).
- **Admin App Installs Screen (Flutter):**
  - Built a premium dashboard screen in Flutter to track app installations (`admin_app_installs_screen.dart`).
  - Syncs perfectly with WebApp logic, integrating `GET /users/app-installs` API in `api_service.dart`.
  - Features a tabbed UI for Students and Teachers, displaying device models, app versions, and online/offline status indicators.
  - Added to the Academic & Management grid in `dashboard_screen.dart`.
- **Admin Flow Screens:**
  - `FinanceScreen` (Admin Dashboard): Added modules for "Pending Approvals" and "Payment Setup".
  - `AdminPendingFeesScreen`: Displays a list of all fee payments waiting for manual approval. Features an interactive image viewer (zoom in on the screenshot) and Approve/Reject controls.
  - `AdminPaymentSettingsScreen`: Allows the admin to directly update the Bank details and upload a new QR Code image right from the Flutter mobile app.

## Infrastructure Details
- **Backend Node.js API:** Running on `66.116.252.191` at port `19998`.
- **Database:** Supabase for main data, local Postgres for heavy blobs (Question papers).
- **Deployment Strategy:** `ssh root@66.116.252.191`, `git pull origin main`, `npx prisma generate`, `npm run build`, `pm2 restart backend`.
- **Terminal Execution:** No direct terminal execution commands by the agent. Always providing exact `cd` path and manual run commands to the user.
- **UI UX Rule:** Safe Area explicitly handled on all Flutter bottom bars. High-quality UI guidelines enforced.

## Recent Accomplishments
1. **Flutter App Architecture Overhaul (Monorepo Setup):**
   - Successfully converted the monolithic `flutter_mobile` app (160MB+) into a modular **Melos Monorepo** inside `flutter_workspace`.
   - Created isolated packages: `core`, `admin_feature`, `teacher_feature`, and `student_feature`.
   - Created individual entry apps: `admin_app`, `teacher_app`, `student_app`, and `universal_app`.
   - **App Size Optimization:** Moved heavy dependencies like `mobile_scanner` (Admin only) and `flutter_tex` (Student only) out of `core`. This ensures individual apps compile at a significantly reduced size without carrying unnecessary heavy native libraries.
   - Bootstrapped successfully using `dart pub global run melos bootstrap`.

2. **GitHub Actions for APK Generation:**
   - Created a `.github/workflows/flutter_build.yml` script in the monorepo to automatically build and release the `teacher_app`, `admin_app`, and `student_app` APKs via GitHub Actions upon push.
   
3. **Progress Card Dynamic Academic Year Bug Fix:**
   - Fixed a bug where `2023-2024` was hardcoded or incorrectly displayed in the web app Progress Card.
   - Updated `exams.controller.ts` to fetch `academicYear` straight from the `Student -> Class` table and return it via the results API.
   - Mapped `academicYear` in `JEEProgressCardTab.tsx` and `ProgressCardTab.tsx` so `ProgressCardTemplate.tsx` dynamically prints the exact year saved for that class in the DB.
   - Updated defaults in the codebase to fall back to `2026-2027` instead of `2024-2025`.
   - Ran a one-time script (`update_year.js`) to migrate all existing classes in the database (24 classes) to `2026-2027`.
