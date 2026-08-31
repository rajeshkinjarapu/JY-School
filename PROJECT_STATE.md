# Project State: JY-School ERP

## Last Updated: 2026-08-31

---

## Environment & Hosting Details

| Component | Details |
|---|---|
| Frontend (Web) | React/Vite — `frontend/` directory |
| Frontend (Mobile) | Flutter — `flutter_mobile/` directory |
| Backend (API) | Node.js/Express — `backend/` — VPS at `http://66.116.252.191:19998` |
| Main DB | Supabase (PostgreSQL) |
| Local DB | VPS PostgreSQL — `jy_school_local` (for Question Papers, Answer Keys) |
| SSH | `ssh root@66.116.252.191` |

### Backend Deploy Commands (VPS)
```
cd /root/JY-School/backend
git pull origin main
npx prisma generate
npx prisma generate --schema prisma/schema_local.prisma
npm run build
pm2 restart backend --update-env
```

---

## Outstanding Items (Pending for Next Session)
- **OMR Answer Sheet Scanner:** User requested Flutter app implementation. NOT STARTED.
- **Exam Architecture Refactor:** Migrate the global `subjects` array to a class-wise mapping structure to allow different subjects and max marks per class under the same Exam Name. (Postponed).
- **Teacher Live Classes Feature:** Jitsi/Agora integration. (Postponed).

---

## Session History

### Session: 2026-08-31 — Transport Module & UI Improvements
**Files Changed:** `transport.controller.ts`, `transport.routes.ts`, `VehiclesPage.tsx`, `RoutesPage.tsx`, `StudentTransportPage.tsx`, Flutter Transport screens, `StudentProfilePage.tsx`
**Backend Changes:** Yes — VPS deploy required

#### Completed
- **Transport Module** UI and backend logic fully fixed:
  - **VehiclesPage**: Added Status dropdown, Vehicle Capacity progress bars, and Edit/Delete APIs.
  - **RoutesPage**: Added Vehicle assignment dropdown, dynamic Stops creation form (pickup/drop time, monthly fee), and updated table UI.
  - **StudentTransportPage**: Limited API query size for students, implemented dynamic Stop fetching based on selected Route, and added a premium UI grid.
  - **Frontend Build Fix**: Removed React `createPortal` from `RoutesPage`, `VehiclesPage`, and `StudentTransportPage` because it caused `[plugin vite-plugin-pwa:build]` and `[builtin:vite-transform] Unexpected token` errors during the `npm run build` process on the VPS environment. Replaced with standard conditional rendering inline modals.
  - **Backend**: Implemented missing endpoints `PUT /vehicles/:id`, `DELETE /vehicles/:id`, `DELETE /routes/:id`, and `DELETE /students/:id` in `transport.controller.ts` and `transport.routes.ts`.
- **Flutter Transport Screens**: Built premium Flutter screens for transport module.
- **Student Profile - Fee Ledger Layout**: Moved Fee Ledger to be side-by-side with Demographics and Family Details (3-column grid).
- **Student Profile - Print Dossier Fixed**: Restructured DOM and added `print:hidden` selectively so the UI hides correctly for print.

---

### Session: 2026-08-29 — Flutter Fixes & New Features
**Git Commit:** `f200ae0` — `feat: Upload Question Paper screen, Fix Progress Card logo & signatures`
**Files Changed:** 15 files, 1553 insertions, 563 deletions
**New Files:** `change_password_screen.dart`, `upload_question_paper_screen.dart`
**Backend Changes:** None (Flutter-only session, no VPS deploy needed)

#### Bugs Fixed
1. **Progress Card – Logo Not Showing**
   - Root cause: Web app stores logo in `admitCardSettings.logoUrl` (exam-specific), but Flutter was reading from `_settingsData['logoUrl']` (global school settings only).
   - Fix: Updated `single_progress_card_screen.dart` to check `admitCardSettings.logoUrl` first, then fall back to global `_settingsData['logoUrl']`.

2. **Progress Card – Teacher & Principal Signatures Not Showing**
   - Root cause: `CustomNetworkImage` was missing the `ngrok-skip-browser-warning` header needed for VPS image URLs. Also, string type conversion was unreliable causing null checks to fail.
   - Fix: Added `headers: {'ngrok-skip-browser-warning': '69420'}` and `errorBuilder` to all signature `CustomNetworkImage` widgets in `single_progress_card_screen.dart`.

3. **Change Password – Opening Admin Settings Instead**
   - Root cause: Profile screen was navigating to Admin Settings screen on "Change Password" tap.
   - Fix: Created new `change_password_screen.dart` with dedicated UI calling `PUT /api/auth/change-password`, linked from `profile_screen.dart`.

4. **VPS Backend – PrismaClientInitializationError**
   - Root cause: `LOCAL_DATABASE_URL` was missing from VPS `.env` file after a server restart.
   - Fix: Added `LOCAL_DATABASE_URL` to `/root/JY-School/backend/.env` on VPS and restarted pm2 with `--update-env`.

5. **Announcement UI – "NEW" badge & content snippet cluttering cards**
   - Fix: Removed "NEW" badges and content snippets from announcement cards in `dashboard_screen.dart`. Now only the title shows; clicking opens the full announcement.

#### New Features Added
1. **Upload Question Paper Screen (`upload_question_paper_screen.dart`)**
   - Full premium form with fields: Paper Title, Exam (optional), Class (required), Subject (optional), File URL (PDF/Word), Answer Key URL (optional), Typed Answer Key (optional).
   - Calls `POST /api/question-papers` via new `ApiService.createQuestionPaper()` method.
   - Added `FloatingActionButton.extended` ("Upload Paper") to `question_papers_screen.dart`, visible only to TEACHER, ADMIN, SUPER_ADMIN roles.

2. **Question Papers – Premium Empty State**
   - Replaced plain text with premium design: large indigo circle icon + bold heading + descriptive subtitle.

---

### Session: 2026-08-29 (Earlier) — Announcement System & Backend
#### Completed
- **Advanced Announcement System:**
  - Image Upload for announcements (Admin/Super Admin only).
  - Read Tracking with `AnnouncementRead` model in backend.
  - Read Receipts modal in Web App (shows which Students/Teachers viewed).
  - Dual Push Notifications (target users on post, admin on first read).
  - Flutter: Real announcement data in `dashboard_screen.dart`, `markAsRead` API integrated in `AnnouncementDetailScreen`.

---

### Earlier Sessions — Completed Work

#### Flutter APK Fixes
- App icon replaced with official JY School logo using `flutter_launcher_icons`.
- Removed `.timeout()` limits from `api_service.dart` to prevent false offline fallbacks.
- `MarksUploadScreen` now shows "No Exams Found" instead of disabled state.
- `ExamStatusScreen` redesigned to show premium subject table (S.No, Subject, Status).
- Dynamic maxMarks validation integrated; legacy `TeacherMarksScreen` deleted.

#### Flutter Examination Module
- Question Bank module fully migrated to Flutter app.
- Question Papers:
  - Fixed 404 API route mismatch (`/api/questionPapers` → `/api/question-papers`).
  - Linked `QuestionPapersScreen` to Teacher Dashboard (replaced "Answer Keys" tile).
  - Answer Keys viewable via bottom sheet inside Question Papers screen.

#### Flutter Finance Module Overhaul
- `finance_screen.dart`: Glassmorphism wallet-style dashboard with KPI cards.
- `fee_receipts_screen.dart`: New screen listing payments + PDF receipt generation.
- `finance_reports_screen.dart`: Added "Cash-in-Hand Settlement" metric.
- `transactions_screen.dart`: Edit & Delete payments from mobile app.
- `student_fee_details_screen.dart`: Class/Status filtering, balances, PDF/CSV export, WhatsApp fee reminders.

#### Flutter Gate Pass Module Overhaul
- FAB added to `gate_pass_screen.dart` for issuing gate passes.
- `GatePassViewScreen`: Full-page premium view with QR code.
- QR Scanner completely rewritten using `mobile_scanner` (Paytm-style full-screen layout).

#### Flutter Attendance & Fee Fixes
- `mark_staff_attendance_screen.dart`: Fixed system nav bar overlap (MediaQuery bottom padding).
- `record_fee_payment_screen.dart`: Premium redesign, SafeArea bottomNavigationBar, retroactive date picker.
- `edit_transaction_screen.dart`: Migrated from bottom sheet to standalone screen.

#### Backend – Max Marks Data Integrity
- `marks.controller.ts`: Pre-fetch ExamPlans, enforce subject-specific `maxMarks` from DB.
- `fixMarks.ts`: Cleanup script to fix corrupted records (batched, crash-safe).

#### Subject Ordering Fix
- Removed conflicting sort logic from: `exams.controller.ts`, `ResultsTab.tsx`, `single_progress_card_screen.dart`.
- System now strictly respects `exam.subjects` JSON order.

#### Flutter Progress Card Overhaul
- `single_progress_card_screen.dart`: Premium redesign matching web app.
- Added Mobile, Location fields; fixed Row-based Academic Rating layout.
- Fixed percentage calculation bug in `exams.controller.ts`.
- Fixed cross-platform backslash formatting bug in `api_service.dart` for image URLs.

#### Flutter Fee Module
- `record_fee_payment_screen.dart`: Premium redesign + retroactive date picker.
- Fixed `fees.controller.ts` bug (classId OR logic returning wrong fee structures).

#### Flutter UI General
- Dashboard grid: 8 items, single screen, no background images.
- `edit_transaction_screen.dart` + Date Picker.
- `leave_dashboard_screen.dart`: TabBar `labelColor: Colors.white` fix.
- `create_gate_pass_screen.dart`: Class & Section dropdown filters.
- Dashboard: Fee Reminder button routes to correct `FeeReminderSearchScreen`.
- Admin Dashboard UI: Premium statistics row with Indian currency formatting.
- Custom Notification Sound (Flutter): `jyschool_chime.wav` implemented for Android push notifications.

---

## Infrastructure & Hosting Migration (Completed)
- VPS: BigRock Ubuntu 22.04 fully provisioned.
- `jy_school_local` PostgreSQL on VPS for heavy data (Question Papers, Answer Keys).
- `schema_local.prisma` + `prismaLocal` Prisma client created.
- `questionPapers.controller.ts` uses `prismaLocal` for read/write, `prisma` for relational data.
- Nginx serving `/var/www/uploads/` on port `8081`.
