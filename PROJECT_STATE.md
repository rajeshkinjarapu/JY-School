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
- **Exam Architecture Refactor:** Migrate the global `subjects` array in the Exam model to a class-wise mapping structure (Dynamic Class-Specific Subject Mapping) to allow different subjects and max marks for different classes under the same Exam Name. (Postponed until current marks entry period is completed).
- Teacher Live Classes Feature (Jitsi/Agora Integration).

## Latest Updates
- **Advanced Announcement System:**
  - **Image Upload:** Enabled Admins and Super Admins to optionally attach images to announcements.
  - **Read Tracking:** Implemented a new `AnnouncementRead` model in the backend and a new "Read Receipts" modal in the Web App to track exactly which Students and Teachers have viewed the announcement.
  - **Push Notifications:** Set up dual notifications: target users get a push when a new announcement is posted, and the Admin who created it gets a push notification immediately when a user views it for the first time.
  - **Flutter Integration:** Replaced hardcoded dummy text in `dashboard_screen.dart` with real latest announcement data, and fully integrated the `AnnouncementDetailScreen` with the backend `markAsRead` API, permanently hiding the "Mark as Read" button once tapped.
- Successfully pushed the latest Flutter UI enhancements and backend fixes to GitHub.
- **Flutter APK Fixes:** 
  - **App Icon Update:** Replaced the generic blue icon with the official original JY School logo (from the login screen) using `flutter_launcher_icons`.
  - Removed strict `.timeout(...)` limits from `api_service.dart` `_performGet` to prevent false offline fallbacks when the free Railway backend server takes too long to wake up.
  - Improved `MarksUploadScreen` UI by showing 'No Exams Found' instead of a confusing disabled state when no exams are returned.
  - Redesigned `ExamStatusScreen` (Status Overview) to display subjects in a highly premium table format instead of chips when a class is expanded, explicitly showing S.No, Subject, and Status (Entered vs Pending).
  - Implemented dynamic global maxMarks validation for every test/exam by fully integrating the new `MarksUploadScreen` across all dashboards and deleting the legacy `TeacherMarksScreen`.
- **Flutter Question Bank Migration:**
  - Successfully migrated the Question Bank module to the Flutter app.
  - Created a premium grid dashboard (question_bank_dashboard_screen.dart).
  - Added flutter_tex for precise LaTeX math equation rendering.
  - Created modular generator screens (AI Paper, MCQ, Navodaya, Saved Papers).
- **ID Card Generation Module (Full-Stack):**
  - **Web App**: Developed a complete module (`IdCardDashboard` & `IdCardGeneratorPage`) with 3 unique modern ID card templates (Standard, Corporate, Premium Gradient). Implemented live rendering, QR code generation (`qrcode.react`), and precise A4 printing capabilities (`react-to-print`).
  - **Mobile App (Flutter)**: Mirrored the web app's functionality with a highly premium mobile design. Created a swipeable Carousel for template selection (`id_card_templates_screen.dart`), a dynamic student search screen (`id_card_students_screen.dart`), and a 3D flip-animated ID card preview screen (`id_card_preview_screen.dart`). Integrated the module into the Admin Dashboards.
- **Question Bank LaTeX Rendering Fixes:**
  - Fixed a critical regex parsing bug in `LiveLatexPreview.tsx` where math formulas containing `(B)` (like `$n(A) - n(B)$`) were incorrectly split, breaking LaTeX rendering for multiple-choice options.
  - Improved the `maxLen` calculation logic for multiple-choice options by trimming inner spaces, fixing a bug where 4-column or 2-column layouts would incorrectly stack vertically (like in Question 25).
- Provided the user with the git pull command to fetch the latest updates from the repository.
- **BigRock VPS Server Deployment**: 
  - Created an automated `SETUP_BIGROCK.bat` script to deploy the JY-School ERP to a new BigRock Ubuntu 22 VPS (66.116.252.191). Successfully connected via SSH, installed Node.js 20, Git, PM2, and Unzip (for Puppeteer Chrome extraction), and deployed both the Node.js backend (Port 19998) and React frontend (Port 19999).
  - Fixed a `Network Error` on the frontend by updating `axios.ts` to respect `VITE_API_URL` instead of falling back to a hardcoded port 5000 logic for non-localhost IP domains.
  - Resolved a `PrismaClientKnownRequestError` (500 Error on Dashboard) by pushing un-migrated schema changes (`Announcement.image`) directly to the Supabase database using `npx prisma db push`.
- **Global Performance & Speed Optimization (Backend):**
  - **Database Indexing:** Added composite performance indexes to `prisma/schema.prisma` for `FeePayment`, `FeeDiscount`, `Mark`, and `Attendance` to drastically speed up database lookups.
  - **Eliminated N+1 Queries:** Refactored `fees.controller.ts` (`getStudentFeeStatus` and `getOverdue`). Replaced disastrous `O(N^2)` loops that executed thousands of database queries sequentially with highly efficient bulk `IN` queries and `groupBy` aggregations, ensuring the app opens in fractions of a second even with massive data.
- **Question Papers & Answer Keys Module:**
  - **Database Schema**: Upgraded the `QuestionPaper` model in Prisma to link directly to `Exam` (`examId`), added `answerKey` text and `answerKeyUrl` fields, and made `subjectId` optional for combined papers.
  - **Web App**: Integrated a new "Question Papers" tab inside the Admin Exams Module. Updated the Teacher's "Answer Key" sidebar link to route directly to this new module, allowing teachers to easily add typed answer keys or PDF links. Students can now directly access both Question Papers and Answer Keys from their "Downloads" tab.
  - **Flutter App**: Upgraded the `QuestionPapersScreen` with a premium glassmorphism card layout. Added `url_launcher` integration to download/view papers and PDFs, and built a sleek Bottom Sheet to view manually typed Answer Keys directly in the app.

 -   * * [ 2 0 2 6 - 0 8 - 2 9 ]   M o b i l e   A p p   C u r r e n c y   S y m b o l   F i x : * *   F i x e d   a n   e n c o d i n g   i s s u e   i n   t h e   F l u t t e r   a p p   w h e r e   t h e   R u p e e   s y m b o l   ( ¹ )   w a s   d i s p l a y i n g   a s   ' â  ¹ '   b y   e x p l i c i t l y   r e p l a c i n g   i t   w i t h   t h e   c o r r e c t   U T F - 8   c h a r a c t e r   ' ¹ '   i n   d a s h b o a r d _ s c r e e n . d a r t ,   s t u d e n t _ p r o f i l e _ s c r e e n . d a r t ,   a n d   f e e _ r e m i n d e r _ d e t a i l s _ s c r e e n . d a r t .  
 - **Mobile App Currency Symbol Fix:** Fixed an encoding issue in the Flutter app where the Rupee symbol was displaying incorrectly by explicitly replacing it with the correct UTF-8 character â‚¹.
- **Leave Request Enhancements:**
  - **Approval Fix:** Fixed an API route mismatch where the mobile app was sending a PUT request to /api/leave/:id/status while the backend expected a PATCH request to /api/leave/:id/approve. Added an alias route in the backend to ensure backward compatibility and fixed the bug.
  - **Admin Edit/Delete Capabilities:** Added full CRUD capabilities for Leaves in the backend API. Updated the Flutter mobile app (leave_screen.dart) to display "Edit" and "Delete" icons for Admins in the Leave Request History. Created a sleek bottom sheet dialog allowing Admins to directly edit a leave's Type, Status, and Reason.
