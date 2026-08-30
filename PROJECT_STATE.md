# JY School ERP - Project State

## Recent Conversation Summary (Logo Missing Fixes & Flutter Errors)
- **Bug Fixed**: Backend was calculating total percentage incorrectly because `mark.maxMarks` was being wrongly saved as the total exam max marks (e.g. 300) when teachers entered marks. Fixed in `exams.controller.ts` to read the correct `maxMarks` from `exam.subjects` config.
- **Backend Deployed**: User successfully deployed the percentage calculation fix to the VPS production server.
- **Flutter UI Fix**: The Progress Card UI was compressing/stretching and not matching the exact A4 size. Modified `single_progress_card_screen.dart` to strictly use a container of `width: 794, height: 1123` with `Spacer` to push the signatures footer precisely to the bottom of the A4 layout. This fixes PDF export and UI view to be perfectly uncompressed.
- **Location Hardcode**: As requested, changed the location string on the Flutter card to just `'Narasannapeta'`.
- **Signature Images**: Fixed cross-platform backslash formatting bug in `api_service.dart` where `getImageUrl` was generating incorrect URLs, causing the teacher and principal signatures to show up as blank placeholder lines.
- **Logo Fixes**: Added logic to `JEEProgressCardTab.tsx`, `ProgressCardTab.tsx`, and `AdmitCardTab.tsx` in the WebApp to automatically use the global `SchoolSettings` logo and signatures if they are not explicitly set for a specific exam.
- **Flutter Syntax Fixes**: Resolved hot-reload compiler errors (missing bracket and type mismatch for `stats`) in `single_progress_card_screen.dart` and `exam_status_screen.dart`.
- **Flutter UI Alignment**: Fixed empty space issue in `single_progress_card_screen.dart` by increasing table row padding from 6px to 12px for better readability, and anchoring the signatures directly above the bottom note.
- **Result Detail Screen**: Added `fatherName` to the backend `getExamResults` API and enabled `includePhoto: true` in the Flutter API call so that the Student Image and Father Name load correctly with live data instead of dummy placeholders.
- **Share Result Layout**: Fixed the layout for the "Share Full Result" feature by adding padding inside the `RepaintBoundary` so the exported image has a beautiful, clean margin instead of being tightly cropped.
- **Admin Dashboard UI**: Wrapped the top statistics row (Students, Teachers, Revenue) in a premium, beautifully styled container card with shadows, and applied Indian currency formatting to the Revenue number to match a professional UI design.

## Pending Action Items
- Run `fix_duplicate_subjects.sql` in the production DB to remove duplicated subjects.
- Ensure all frontend changes are pulled onto the VPS server and rebuilt using `npm run build`.
- Make sure any further Flutter UI changes follow the strict rule of mirroring the web app layout with premium mobile aesthetics.