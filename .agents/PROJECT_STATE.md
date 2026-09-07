# Project State

## Recent Activity
- **Backend Performance Fix (2026-09-07)**: Fixed memory leak in `students.controller.ts`.
- **Marks Excel Template Update (2026-09-07)**: Modified `ExamListPage.tsx` in frontend.
- **Flutter Profile Bug Fix (2026-09-07)**: Fixed Prisma query syntax and error handling.
- **Marks Submit Frozen Bug Fix (2026-09-07)**: Fixed a bug in `MarksEntryPage.tsx` where clicking "Submit Marks" for an unfrozen class would silently send marks of OTHER frozen classes back to the server, causing the backend to block the update with "Access Denied".

### 📌 Recent Accomplishments
1. **Study Certificate Generator**: Built `StudyCertificatePage.tsx` with print/PDF features.
2. **JEE Progress Card UI**: Fixed button wrapping and added borders.
3. **Global Settings (Logo/Signatures)**: Made the progress card logo, principal signature, and teacher signature globally saved in the database (so they load automatically for all future exams without needing re-upload).
4. **Duplicate Subject Fix**: Fixed the issue where "CHE" (Chemistry) subject was showing twice in the Class Rank List due to case sensitivity.
5. **Total and Percentage Calculation Fix**: Fixed a bug where duplicate subject marks (due to case sensitivity like Chemistry vs chemistry) were being double-counted in the Total Marks and Percentage in the backend calculations.
6. **Flutter Progress Card Web Sync**: Integrated the exact Web App Progress Card PDF directly into the Flutter mobile app using `url_launcher`, completely eliminating the need for a separate custom Flutter design.

## Current Pending Task
- User needs to rebuild frontend PM2 instance to test the new Progress Card.
- User needs to build and release the Shorebird patch for the Flutter app.
