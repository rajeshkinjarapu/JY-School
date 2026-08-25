# Project State: JY-School ERP

## Recent Changes & Fixes
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
