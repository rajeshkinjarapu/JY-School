# Project State

## Recent Activity
- **Backend Performance Fix (2026-09-07)**: Fixed memory leak in `students.controller.ts`.
- **Marks Excel Template Update (2026-09-07)**: Modified `ExamListPage.tsx` in frontend.
- **Flutter Profile Bug Fix (2026-09-07)**: Fixed Prisma query syntax and error handling.
- **Marks Submit Frozen Bug Fix (2026-09-07)**: Fixed a bug in `MarksEntryPage.tsx` where clicking "Submit Marks" for an unfrozen class would silently send marks of OTHER frozen classes back to the server, causing the backend to block the update with "Access Denied".

## Current Pending Task
- User needs to rebuild frontend PM2 instance to test the new MarksEntryPage fix.
