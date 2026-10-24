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
- **Classes Restricted Strictly to Nursery through 10th Class:**
  - Removed database `/api/classes` query and removed merging of dynamic/database class names (such as NUR, PP1, PP2, 1st, 2nd, 3rd, etc.).
  - The Class dropdown and entry modal datalist now strictly contain only the 13 standard classes:
    `Nursery`, `LKG`, `UKG`, `1st Class`, `2nd Class`, `3rd Class`, `4th Class`, `5th Class`, `6th Class`, `7th Class`, `8th Class`, `9th Class`, `10th Class`.
  - Class filter logic updated to case-insensitive uppercase matching.
- **Capital Letters (UPPERCASE) Requirement:**
  - All text fields (`studentName`, `className`, `fatherName`, `village`, `mandal`, `referenceTeacherName`) are strictly displayed, processed, and stored in **UPPERCASE**.
  - **Inputs:** Added CSS `uppercase` to input fields on both Admin and Teacher forms for real-time uppercase rendering as user types.
  - **Backend Controller:** In `backend/src/controllers/addressCollection.controller.ts`, `addAddressCollection`, `updateAddressCollection`, and `bulkAddAddressCollection` convert all string fields to `.toUpperCase()`. `getAddressCollections` maps all existing database records to `.toUpperCase()`.
  - **Exports:** Both Excel and PDF exports in Admin and Teacher views format all string columns to `.toUpperCase()`.
  - **Excel Import:** In `processExcelFile`, parsed records are converted to `.toUpperCase()` before submitting to bulk API.
- **Edit Option Added:**
  - Added Edit (Pencil icon) button in Admin table and Teacher table.
  - Admin modal and Teacher form dynamically switch to edit mode and call `PUT /api/address-collection/:id`.
  - Teacher can edit their own submissions; Admin can edit any record.
- **Class Field Added:**
  - Added `className String?` to `StudentAddressCollection` model in Prisma.
  - Added Class selector/input with datalist in Admin and Teacher entry forms.
  - Added Class filter in Admin view and Class column in Excel/PDF exports.
- **PDF Print & Formatting Fix:**
  - Configured A4 Landscape PDF with exact 15 rows per page padding to prevent awkward overflow or large empty spaces.

## 3. VPS Deployment Guide
Always connect via SSH:
```bash
ssh root@66.116.252.191
cd /root/JY-School
git pull origin main
cd /root/JY-School/backend
npm run build
cd /root/JY-School/frontend
npm run build
pm2 restart all
```