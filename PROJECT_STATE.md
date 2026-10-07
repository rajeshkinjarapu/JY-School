# PROJECT STATE - JY School ERP

## Last Updated: 2026-10-06

---

## Session: 2026-10-06 Updates

### 1. Competitive Exams (Online Exams) Fix
- **Problem:** User reported that creating a Competitive Exam (JEE/NEET) was failing ("EXAM CREATE CHESINA AVVATAM LEDU"). Upon deep inspection, it was discovered that the previous developer built the API routes (`competitiveExams.routes.ts`) and controllers, and even added the relations in `Class`, `Teacher`, and `Student`, but completely forgot to add the core `CompetitiveExam` tables to `schema.prisma`. This caused Prisma to throw errors when creating exams.
- **Fix:** Provided the missing Prisma schema models (`CompetitiveExam`, `CompetitiveExamQuestion`, `CompetitiveExamSubmission`, `CompetitiveExamResponse`) and instructed the user to append them to `backend/prisma/schema.prisma` and push to the VPS.
- **Status:** Awaiting user execution to push DB schema and verify the Online Exam conduction flow.

### 2. Student Address Collection Feature
- **Updates:**
  - Added a "Teacher Filter" Dropdown in the Admin page.
  - Redesigned "Export to PDF" to **A4 Landscape** mode with intelligent padding for exactly 15 members per page.

### 3. Website Down Fix (Frontend Build)
- **Fix:** Guided user to SSH into VPS and rebuild the frontend via PM2.

---

## Architecture
- **Backend:** VPS `http://66.116.252.191:19998` | PM2 | `/root/JY-School/backend`
- **Frontend:** VPS `http://66.116.252.191:19999` | PM2 | `/root/JY-School/frontend`
- **DB:** Supabase (primary) + local Postgres `jy_school_local` (heavy items)

## Deploy Commands
```bash
ssh root@66.116.252.191
cd /root/JY-School/backend && git pull origin main && npx prisma db push && npx prisma generate && npm run build && pm2 restart backend
cd /root/JY-School/frontend && git pull origin main && npm run build && pm2 restart frontend
```
- Fixed ApiService syntax errors and restored getToken in flutter app.
- Fixed Icons.persons error in admission screen.
- Admin Address Data entry is accessible via Modules -> Address Data in Flutter app.
- Database push is pending for Competitive Exams.
- Fixed Shorebird patch build failure: Resolved `StreamedResponse` parsing issue in `admission_registration_screen.dart` for image/receipt uploads by explicitly decoding the response body using `http.Response.fromStream`.
- Fixed Exam Subject saving bug in `CreateExamPage.tsx`: The system was previously locking subjects only to those with marks entered and ignoring newly added subjects on page reload. Now it merges existing marks with saved subjects properly.
