# Project State & Architecture Summary

## 1. Hosting & Architecture
- **Backend (Node.js API):** Runs on VPS at `http://66.116.252.191:19998` via PM2.
- **Frontend (Web App):** Runs on VPS at `http://66.116.252.191:19999` via PM2 / serve.
- **Databases:**
  - Primary DB: Supabase PostgreSQL (`postgresql://postgres.iqffyuxkffxidugtqjox:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`).
  - Secondary DB: Local PostgreSQL on VPS (`jy_school_local`).
- **Mobile Apps (Flutter):**
  - Universal App, Student App, Teacher App, Admin App in `flutter_mobile/`.
  - Deployment via Shorebird (OTA patch or full release).

## 2. Recent Updates & Fixes (Address Collection Module)
- **Table Grid Borders & School Name Column:**
  - Replaced horizontal divide with complete grid borders (`border-collapse border border-gray-300` / `border-slate-300` on table, th, and td) to look like an official, clean table form.
  - Added dedicated `schoolName String?` field to `StudentAddressCollection` in `backend/prisma/schema.prisma`.
  - Added `School Name` column in both Admin and Teacher tables, Excel exports, and PDF reports.
  - Added `School Name` input in Add/Edit modal and Teacher entry form.
  - Added `schoolName` parsing in Excel import.
- **Classes Restricted Strictly to Nursery through 10th Class:**
  - Removed database `/api/classes` query and removed merging of dynamic/database class names.
  - The Class dropdown and entry modal datalist now strictly contain only the 13 standard classes:
    `Nursery`, `LKG`, `UKG`, `1st Class`, `2nd Class`, `3rd Class`, `4th Class`, `5th Class`, `6th Class`, `7th Class`, `8th Class`, `9th Class`, `10th Class`.
  - Class filter logic updated to case-insensitive uppercase matching.
- **Capital Letters (UPPERCASE) Requirement:**
  - All text fields (`studentName`, `className`, `schoolName`, `fatherName`, `village`, `mandal`, `referenceTeacherName`) are strictly displayed, processed, and stored in **UPPERCASE**.
- **Edit Option Added:**
  - Added Edit (Pencil icon) button in Admin table and Teacher table.
  - Admin modal and Teacher form dynamically switch to edit mode and call `PUT /api/address-collection/:id`.

## 3. VPS Deployment Guide
Always connect via SSH:
```bash
ssh root@66.116.252.191
cd /root/JY-School
git pull origin main
cd /root/JY-School/backend
npx prisma db push
npm run build
cd /root/JY-School/frontend
npm run build
pm2 restart all
```