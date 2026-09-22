# PROJECT STATE - JY School ERP

## Last Updated: 2026-09-22

---

## Session: 2026-09-22 Fixes

### 1. Print 2 Pages Design - Complete Redesign
**File:** `frontend/src/pages/admissions/AdmissionPrintModal.tsx`
- **Problem:** Print preview design was not displaying properly, pages not scaling in modal
- **Fix:** Complete redesign to match school's traditional admission form format:
  - **Page 1:** School header + logo + "ADMISSION FORM" dark box + photo box + 13 numbered fields with underlines + Acknowledgement slip with dotted lines + signatures
  - **Page 2:** Sibling Details table + 11 Terms & Conditions + Declaration by Parent/Guardian + Fee Payment Schedule + signatures
  - **Design:** Double border (thick outer + thin inner), Times New Roman font, professional layout
  - **Preview:** Side-by-side scaled (47%) preview in modal, both pages visible simultaneously
  - **Print:** Proper A4 print with page-break between pages

### 2. View Receipt - Bug Fix
**Files:**
- `frontend/src/pages/admissions/AdmissionRegistrationPage.tsx`
- `frontend/src/pages/admissions/AdmissionsManagementPage.tsx`
- `backend/src/routes/uploads.ts`

**Problem:** "View Receipt" button click cheste uploaded payment receipt open avvatam ledu
**Root Cause:**
1. Receipt was uploaded to `/api/uploads/image` which returns base64 data URL
2. `<a href="data:...">` links are blocked by browser security
3. `/api/uploads/share` was behind authenticate middleware

**Fixes:**
1. Changed receipt upload to use `/api/uploads/share` (saves to disk, returns `/uploads/filename` URL)
2. `View Receipt` changed from `<a>` to `<button>` with smart handler:
   - Old base64 records → opens in new window with document.write
   - New /uploads/ URLs → direct window.open()
3. Moved `/share` endpoint before authenticate middleware (public access)

---

## Architecture
- **Backend:** VPS `http://66.116.252.191:19998` | PM2 | `/root/JY-School/backend`
- **Frontend:** VPS `http://66.116.252.191:19999` | PM2 | `/root/JY-School/frontend`
- **DB:** Supabase (primary) + local Postgres `jy_school_local` (heavy items)

## Deploy Commands
```bash
ssh root@66.116.252.191
cd /root/JY-School/backend && git pull origin main && npm run build && pm2 restart backend
cd /root/JY-School/frontend && git pull origin main && npm run build && pm2 restart frontend
```
