# Project State: JY-School ERP

## Recent Changes & Fixes
- **Record Fee Payment Flow (Mobile App & Backend):**
  - **Backend Fix**: Fixed a data fetch bug in `fees.controller.ts` where `getStudentFeeStatus` erroneously returned global fee structures *alongside* other individual students' fee structures due to improper `classId` OR logic.
  - **UI Overhaul**: Redesigned `record_fee_payment_screen.dart` to be highly premium and professional. Replaced the `bottomSheet` with a `SafeArea`-wrapped `bottomNavigationBar` to fix Android system navigation bar overlap.
  - **Date Picker**: Added a new Payment Date field in the "Record Payment" screen for retroactive entries.
- **Flutter UI Enhancements & Fixes:**
  - **Staff Attendance Screen**: Fixed a UI issue in `mark_staff_attendance_screen.dart` where the "Save Attendance" button overlapped with the Android System Navigation Bar by properly implementing `MediaQuery` bottom padding.
  - Scaled down the Dashboard Grid items to fit exactly 8 boxes on a single screen without scrolling, and removed background images for a cleaner look.
  - Migrated the "Edit Transaction" Bottom Sheet to a separate standalone screen (`edit_transaction_screen.dart`) to solve Navigation Bar overlap issues and improve UX.
  - Added a `Date Picker` to the Edit Transaction flow, enabling users to modify the transaction's `paymentDate`.
  - Applied `SafeArea` to the "Apply Discount" bottom sheet to prevent the "Apply" button from overlapping with the Android System Navigation Bar.
- **Gate Pass Mobile App Module Overhaul:**
  - **Issue Gate Pass:** Added a Floating Action Button in `gate_pass_screen.dart` to allow Admins and Teachers to issue gate passes easily.
  - **Premium View Screen:** Replaced the cramped bottom sheet in the History tab with a dedicated, beautifully designed full-page `GatePassViewScreen` displaying the photo, details, and large QR code.
  - **QR Scanner Redesign:** Completely rewrote the `_QRScannerTab` using `mobile_scanner` to feature a premium, Paytm-like full-screen layout with a central cutout overlay and scanning animation. The scanner now automatically processes codes, interacts with the backend to update status (IN/OUT), and shows professional dialogs.
- **Finance Mobile App Module Overhaul:**
  - **Wallet Dashboard:** Redesigned `finance_screen.dart` from a dull grid to a premium, glassmorphism-inspired "Wallet/Bank" style dashboard featuring beautiful KPI cards and quick-access circular icons. Added new quick-action cards: "Fee Category", "Transactions", and "Fee Details".
  - **Payment Receipts (New):** Created `fee_receipts_screen.dart`, a dedicated hub that lists all successful payments and generates professional PDF receipts for parents.
  - **Finance Reports Upgrade:** Upgraded `finance_reports_screen.dart` with a new "Cash-in-Hand Settlement" metric and better chart integrations, bringing the mobile analytics on par with the Web App.
  - **Transactions Management:** Upgraded the transactions screen (`transactions_screen.dart`) to support Editing and Deleting payments directly from the mobile app via a popup menu.
  - **Student Fee Details (New):** Developed `student_fee_details_screen.dart` to perfectly mirror the Web App's `StudentFeeDetailsTab`. Features advanced Class & Status filtering, live balances, PDF/CSV export (via `share_plus`), and 1-tap WhatsApp fee reminders.
- **Leave Apply / My History Tabs:** Fixed the UI contrast issue in the Teacher Mobile App (`leave_dashboard_screen.dart`) by setting `labelColor: Colors.white` for the TabBar.
- **Gate Pass Class/Section Filtering:** Added `Class` and `Section` Dropdown filters in the Gate Pass issuance screen (`create_gate_pass_screen.dart`).
- **Fee Reminder Navigation Fix:** Corrected a bug in the Teacher Mobile App (`dashboard_screen.dart`) where the 'Fee Reminder' button mistakenly routed to the 'Collect Fee' screen (`StudentFeeSearchScreen`) instead of the correct `FeeReminderSearchScreen`.
- **Max Marks Data Integrity (Backend):** 
  - Discovered a data inconsistency where marks entered via the Mobile App ignored subject-specific max marks (e.g., 20) and defaulted to the global exam max marks (100).
  - Modified `marks.controller.ts` in the backend to explicitly pre-fetch `ExamPlans` and strictly enforce the database truth for `maxMarks`, preventing the client (Web or Mobile) from manipulating it.
  - Wrote a batched database cleanup script (`fixMarks.ts`) to repair existing corrupted records (like the Hindi 100 maxMarks issue) without causing memory exhaustion.
- **Flutter Progress Card UI Overhaul:**
  - Redesigned `single_progress_card_screen.dart` in the Flutter mobile app to perfectly match the premium Web App design.
  - Added missing fields (Mobile, Location) and matched the Row-based layout of the Academic Rating Box.
- **Subject Ordering Bug Fix:**
  - Fixed an issue where the custom order of subjects entered during Exam Creation was ignored in Results, Progress Card, and Flutter App.
  - Removed conflicting hardcoded sorting logic from the backend (`exams.controller.ts` `getResults`), Web App (`ResultsTab.tsx`), and Flutter (`single_progress_card_screen.dart`).
  - The system now strictly respects the order of subjects as stored in `exam.subjects` JSON.
- **Max Marks Data Repair Script Fix:**
  - Fixed a critical bug in `fixMarks.ts` that caused it to crash and incorrectly assign the exam's total max marks to individual subjects. It now accurately extracts subject-specific max marks from the `exam.subjects` JSON array.

## Outstanding Items
- Teacher Live Classes Feature (Jitsi/Agora Integration).
- Admin Reporting of "Read" Status for Announcements.
