# Project State: JY School ERP

## Latest Updates (2026-09-10)
- **Progress Card Data Fix**: Fixed the issue in Flutter where the marks table was not rendering properly. The app was looking for `maxMarks` instead of `max` from the API. The `ProgressCardNative` widget has been updated to handle both `max` and `maxMarks` safely, along with correct 'AB' (Absent) calculation.
- **Progress Card PDF Export**: The PDF generation in `SingleProgressCardScreen` now dynamically creates the filename using the student's name (e.g. `ALLAMSETTY_LIKHITHA_ProgressCard.pdf`).
- **Null Safety Fixes**: Fixed a crash in `SingleProgressCardScreen` when the `className` was null or missing a hyphen separator.
- **Marks Entry Screen Redesign**: Completely redesigned the `SingleSubjectMarksEntryScreen` (All Subjects Marks) to have a premium, beautiful, and colorful UI with vibrant gradients, custom student avatars, and a modern card-based layout.
- **OpenRouter (stealth/ox-alpha)**: Integrated OpenRouter and `stealth/ox-alpha` model for the backend MCQ Generation service.
- **MCQ Generator Image Tagging**: Fixed how the backend parses MCQ generator image texts, wrapping them safely in `[IMAGE:id]` markers.

## Pending Manual Actions for User
- **VPS Backend Schema Deployment**: The local Prisma schema was updated with `status` and `scheduledFor` fields. These changes must be deployed to the VPS database using:
  ```bash
  ssh root@66.116.252.191
  cd /root/JY-School/backend
  git pull origin main
  npx prisma generate
  npx prisma db push
  npm run build
  pm2 restart backend
  ```
- **Flutter App Update**: The new UI and progress card fixes need to be patched to users using Shorebird:
  ```bash
  cd "c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_mobile"
  shorebird patch android --flavor student --target lib/main_student.dart
  shorebird patch android --flavor teacher --target lib/main_teacher.dart
  shorebird patch android --flavor admin --target lib/main_admin.dart
  ```

## Known Architecture Context
- **Backend (Node.js API)**: Hosted on VPS at `http://66.116.252.191:19998`
- **Frontend (Web App)**: Hosted on VPS at `http://66.116.252.191:19999`
- **Databases**: Supabase (Postgres) primary; local Postgres on VPS (`jy_school_local`) for heavy items (Question Papers).
- **Mobile Apps**: Built with Flutter and managed via Shorebird for OTA patches.
