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
  * **Backend:** Deployed on Railway (`jy-school-production-f159.up.railway.app`). No longer relying on Ngrok or VPS for the main API!

## 2. User Preferences & Strict Rules
1. **Professional UI/UX:** The user demands modern, premium, and highly polished designs. Avoid generic basic styles. Use subtle gradients, hover animations, and proper spacing. The goal is to feel like a "Professional School ERP Software."
2. **Flutter App Design Protocol:** Before writing Flutter UI code, the AI MUST strictly check the corresponding web app pages (`frontend/src/pages/`) to understand the exact flow, features, and API usage. The mobile design must match the functionality but look even more premium.
3. **No Automatic Terminal Execution:** Do not execute terminal commands automatically that modify systems. Instead, provide the exact commands (including the `cd` to the right folder) for the user to copy-paste.
4. **Context Continuity:** The AI must always consult this `PROJECT_STATE.md` file to resume work seamlessly across different days and devices.

## 3. Recently Completed Work (August 2026)
* **Permanent Backend Deployment:** Successfully migrated the backend from VPS+Ngrok to Railway. Updated Vercel rewrites, React `axios.ts`, and Flutter `api_service.dart` to use the permanent `jy-school-production-f159.up.railway.app` URL, solving all "Network Error" and "Direct IP access not allowed" issues permanently.
* **Leave Module Redesign (Flutter):** Completely rebuilt `leave_screen.dart` to match the Gate Pass module's premium standards. Replaced the basic view with a multi-tab Scaffold (Dashboard, Approvals, History), Top Tabs for Students and Staff (for admins), dynamic stat grids, beautiful history cards with Approver/Rejector controls, and a modern bottom-sheet Apply Leave form.
* **Gate Pass Redesign (Flutter):** Completely revamped the Gate Pass module in the Flutter app. Added role-based top tabs (Students/Teachers), integrated live backend stats for both groups (updated `gatePass.controller.ts` and deployed to VPS), added a beautiful Gate Pass Slip popup, masked phone numbers (xxxx 1234), added approver names, and integrated `qr_flutter` for stunning on-screen and PDF QR codes.

## 4. Pending / Next Steps
1. **Flutter App Features:** Continue building the Flutter mobile app ensuring it syncs perfectly with the existing web APIs and has a premium design.
2. **Verify Railway Stability:** Ensure SMS and Push Notifications work smoothly from the Railway backend.
