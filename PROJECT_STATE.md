# Project State - JY ERP

## Latest Updates
- Fixed marks mismatch issue between Marks Entry and Results. The root cause was duplicate subject IDs in the DB with the same subject name, causing older marks to override newer ones during the `getResults` API call.
- Added duplicate cleanup logic in `marks.controller.ts` (`bulkCreate` function). Every time marks are saved, ghost duplicates are deleted.
- Added `createdAt` sorting in `exams.controller.ts` (`getResults`) to ensure the latest marks are always prioritized.

## Next Steps
- Inform the user to pull code on the VPS and run `npm run build` & PM2 restart for the backend.
