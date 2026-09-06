# Project State Sync

## Latest Conversation Summary
- Fixed frontend API routes that were missing the `/api` prefix, causing "Failed to load pending approvals" errors.
- Clarified the difference between Shorebird Patch and Release for Flutter app updates.
- Added a strict rule to `AGENTS.md` ensuring the user is informed about Shorebird vs APK Release requirements before writing code for Flutter app updates.
- User reported missing heads-up notifications (hero banners) and sounds in all 4 Flutter apps.
- User opted for **Option 1 (Shorebird Patch)** which uses the default system notification sound instead of a custom native sound (which would require a new APK release).
- Updated `notification_service.dart` in the Flutter mobile app to remove references to the custom `jyschool_chime` sound and bumped the notification channel ID to `jyschool_alerts_v2` to force Android to recreate the channel with `Importance.max` and `Priority.high`. This ensures heads-up banners and default system sounds will now work correctly.

## Work Accomplished
- **Frontend Fixes**: Added `/api` prefix to `/fees/admin/pending`, `/fees/admin/approve/:id`, and `/users/app-installs` routes.
- **Flutter App**: Fixed notification channel creation in `notification_service.dart` by bumping the channel ID and reverting to default sound.
- **Rules**: Appended a new strict rule to `AGENTS.md` regarding Flutter App Update pre-approvals.

## Next Steps
- User needs to commit and push the Flutter changes locally.
- User needs to trigger Shorebird Patch in Codemagic for all 4 flavor apps.
