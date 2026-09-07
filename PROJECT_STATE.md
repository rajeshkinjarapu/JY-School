# Project State - JY ERP

## Latest Updates
- Fixed 20+ issues in Examination section.
- **Marks Entry Issue:** Fixed the bug where deleted marks (empty fields) were not deleting from the DB. Handled `isDeleted` flag in `frontend/src/pages/exams/MarksEntryPage.tsx` and processed deletion in `backend/src/controllers/marks.controller.ts`.
- **Ghost Subjects:** Disabled automatic creation of fake subjects in DB during marks saving in `marks.controller.ts` by adding strict ID matching to prevent duplicate subjects in the DB.
- **Absent (AB) Marks:** Fixed the logic so that 'AB' students' marks are properly saved and fetched. In Progress Cards, 'AB' is shown (but not in RED for fail), and their Max Marks are included in the total for correct percentage calculation.
- **Progress/Admit Card Settings:** Made Admit/Progress card logos and signatures dynamic by falling back to the global settings (`/api/settings`) if they are missing from the exam's individual configuration (`ProgressCardTab.tsx`, `ProgressCardTemplate.tsx`, `AdmitCardTemplate.tsx`).
- **Frozen Classes Error:** Fixed JSON string parsing for frozen classes array in `exams.controller.ts` (`toggleFreezeClass`).
- **OMR Scanner:** Updated `exams.controller.ts` (`scanOmr`) to read the `answerKey` from the API request rather than using hardcoded values.

## Next Steps
- Push the local code changes to Git and deploy to the VPS server (`http://66.116.252.191`) for backend and frontend.
