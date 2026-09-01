# Project State: JY School ERP System

## Current Focus (As of 2026-09-01)
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

## Next Action Items for User
- Check the updated "Collect Fee" option on the Web App Finance dashboard.
- Commit the Flutter and React code:
  ```bash
  cd "c:\Users\SRI\Desktop\JY School\JY-School-main"
  git add .
  git commit -m "Phase 3: Student Finance Flow Redesign"
  git push origin main
  ```
- Deploy the updated Backend changes (made in Phase 2 & Phase 3) to the VPS.
  ```bash
  ssh root@66.116.252.191
  cd /root/JY-School/backend
  git pull origin main
  npx prisma generate
  npm run build
  pm2 restart backend
  ```
- Test end-to-end fee payment using the mobile app and verify the receipt on the admin dashboard.
