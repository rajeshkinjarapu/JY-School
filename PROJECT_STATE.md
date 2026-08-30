# JY School ERP - Project State

## Recent Conversation Summary (Flutter Progress Card UI fixes)
- **Bug Fixed**: Backend was calculating total percentage incorrectly because `mark.maxMarks` was being wrongly saved as the total exam max marks (e.g. 300) when teachers entered marks. Fixed in `exams.controller.ts` to read the correct `maxMarks` from `exam.subjects` config.
- **Backend Deployed**: User successfully deployed the percentage calculation fix to the VPS production server.
- **Flutter UI Fix**: The Progress Card UI was compressing/stretching and not matching the exact A4 size. Modified `single_progress_card_screen.dart` to strictly use a container of `width: 794, height: 1123` with `Spacer` to push the signatures footer precisely to the bottom of the A4 layout. This fixes PDF export and UI view to be perfectly uncompressed.
- **Location Hardcode**: As requested, changed the location string on the Flutter card to just `'Narasannapeta'`.
- **Signature Images**: Fixed cross-platform backslash formatting bug in `api_service.dart` where `getImageUrl` was generating incorrect URLs, causing the teacher and principal signatures to show up as blank placeholder lines.

## Pending Action Items
- Monitor if the WebApp signatures appear correctly in the Flutter app now that `getImageUrl` is fixed and constraints are proper A4.
- Make sure any further Flutter UI changes follow the strict rule of mirroring the web app layout with premium mobile aesthetics.