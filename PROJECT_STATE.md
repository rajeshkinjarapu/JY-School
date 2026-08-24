# JY-School Project State & Memory

**Last Updated:** August 24, 2026
**Purpose:** This file acts as a persistent memory bank for the AI agent. Whenever a new session starts, the AI should read this file to understand the project architecture, recent work, open issues, and the user's specific rules.

---

## 1. Project Overview & Architecture
* **Project Name:** JY School ERP
* **Frontend:** React + Vite, Tailwind CSS v4, Lucide React (Icons).
* **Backend:** Node.js (Express) + Prisma ORM.
* **Database:** PostgreSQL (hosted on Supabase).
* **Hosting Configuration:**
  * **Frontend:** Deployed on Vercel (`jy-school.vercel.app`).
  * **Backend:** Hosted on a dedicated Ubuntu VPS (`148.113.9.103`) using PM2. Currently uses Ngrok for tunneling (e.g., `oxidize-entangled-spendable.ngrok-free.dev`), but we are planning to switch to a permanent Custom Domain + Nginx reverse proxy with SSL.

## 2. User Preferences & Strict Rules
1. **Professional UI/UX:** The user demands modern, premium, and highly polished designs. Avoid generic basic styles. Use subtle gradients, hover animations, and proper spacing. The goal is to feel like a "Professional School ERP Software."
2. **Flutter App Design Protocol:** Before writing Flutter UI code, the AI MUST strictly check the corresponding web app pages (`frontend/src/pages/`) to understand the exact flow, features, and API usage. The mobile design must match the functionality but look even more premium.
3. **No Automatic Terminal Execution:** Do not execute terminal commands automatically that modify systems. Instead, provide the exact commands (including the `cd` to the right folder) for the user to copy-paste.
4. **Context Continuity:** The AI must always consult this `PROJECT_STATE.md` file to resume work seamlessly across different days and devices.

## 3. Recently Completed Work (August 2026)
* **PDF Download Bug Fixed:** Replaced `html2canvas` with `html-to-image` (`toJpeg`) in `ProgressCardTab.tsx` and `JEEProgressCardTab.tsx`. This fixed the `Failed to generate zip: Attempting to parse an unsupported color function "oklch"` error caused by Tailwind v4's default OKLCH color palette.
* **Print Black Shade Bug Fixed:** Removed `height: 100vh` and added `min-height: 100% !important; height: auto !important;` to `html, body` in print CSS media queries across all Question Paper Generator pages to prevent dark mode backgrounds from showing up at the bottom of printed pages.
* **Marks Entry Missing Subjects Bug Fixed:** Updated `MarksEntryPage.tsx` to stop filtering out exam subjects that aren't mapped to the class. Updated `marks.controller.ts` (`bulkCreate`) to automatically create missing `Subject` records on-the-fly to prevent data loss.
* **Flutter Mobile App Initialization:** Changed app name to "JY School" in `AndroidManifest.xml` and `Info.plist`. Added `mobile_scanner` dependency to `pubspec.yaml` and generated app icons using `flutter_launcher_icons`. 
* **Gate Pass Redesign (Flutter):** Completely revamped the Gate Pass module in the Flutter app. Added role-based top tabs (Students/Teachers), integrated live backend stats for both groups (updated `gatePass.controller.ts` and deployed to VPS), added a beautiful Gate Pass Slip popup, masked phone numbers (xxxx 1234), added approver names, and integrated `qr_flutter` for stunning on-screen and PDF QR codes.
* **Leave Module Redesign (Flutter):** Completely rebuilt `leave_screen.dart` to match the Gate Pass module's premium standards. Replaced the basic view with a multi-tab Scaffold (Dashboard, Approvals, History), Top Tabs for Students and Staff (for admins), dynamic stat grids, beautiful history cards with Approver/Rejector controls, and a modern bottom-sheet Apply Leave form.
* **Ngrok Deprecation Fix:** Updated PM2 VPS command for Ngrok to use the new `--url` flag instead of the deprecated `--domain` flag to prevent connection errors (`ERR_NGROK_3200`).

## 4. Pending / Next Steps
1. **Backend Permanent Hosting:** Setup Nginx + SSL (Certbot) on the VPS (`148.113.9.103`) and link a Custom Domain so the user no longer has to rely on Ngrok, Render, or Koyeb for the backend API.
2. **Flutter App Setup:** Continue building the Flutter mobile app ensuring it syncs perfectly with the existing web APIs and has a premium design.
