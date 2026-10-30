# JY School Project State

## Attendance System Enhancements (October 30, 2026)

### 1. Daily Attendance Report (`/attendance/daily-report`)
- **Robust Isolated Iframe Print Engine:**
  - Resolved Chromium / Cốc Cốc print blank page clipping by implementing an isolated printing iframe (same battle-tested mechanism used in Question Paper Generator).
  - Eliminates DashboardLayout `overflow: hidden` parent clipping and ensures 100% full-page fidelity.
  - Generous row height and table padding (`7px 6px`), KPI 4-column layout, and 60px signature headroom fit the entire A4 sheet from top to bottom seamlessly.
- **Dynamic Academic Session:** Computed accurately (`2026-2027`) based on selected report date and class academic year data.
- **Header Clean-up:** Removed "Excellence in Quality Education" tagline from the school letterhead.
- **Section Categorization:** Fixed class separation regex with numeric checks (`num >= 1 && num <= 5`) so `10th-A` correctly routes to Secondary Section instead of Primary Section (Primary: 11 classes, Secondary: 13 classes).

### 2. Today Absentees Page (`/attendance/absentees-today`)
- Removed `Mobile Number` column from the interactive web table.
- Removed `Mobile Number` from the PDF autoTable export and re-proportioned remaining columns (`S.No`, `Student ID`, `Student Name`, `Class`, `Status`).

### 3. Deployment Architecture Reference
- Backend API: `http://66.116.252.191:19998`
- Frontend Web: `http://66.116.252.191:19999`
- VPS SSH: `ssh root@66.116.252.191`