# Custom Rules

- **Always Provide VPS SSH Details Rule (Strict Order):** Whenever providing commands to be executed on the VPS (for git pull, prisma generate, backend/frontend builds, PM2 restart, or DB scripts), ALWAYS explicitly include the SSH login command (`ssh root@66.116.252.191`) at the very top of the command block so the user can easily copy and connect to the VPS terminal if they aren't already connected, followed by the exact `cd` path and build commands.

- **Exact Terminal Commands with Path (Strict Order):** Whenever providing a terminal command for the user to run, always include the exact cd command to navigate to the required folder path first, so the user can copy and paste the entire block seamlessly.

- **No Direct Terminal Execution (Strict Order):** Never execute terminal commands automatically (e.g., using `run_command`). If a terminal command needs to be executed, always provide the exact command text along with the required folder path/working directory to the user, so they can copy and run it themselves.

- **Flutter App Design Protocol (Deep Check Required):** When designing any page or module (like Students, Teachers, etc.) in the Flutter app, ALWAYS first check the web app's (`frontend/src/pages/`) design deeply, page by page. Confirm exactly which UI options exist, what sub-pages they navigate to, what missing pages need to be created in Flutter, and what real API data is being loaded. After verifying the web app's full flow, design the Flutter screens to match the exact functionality (fetching real data, no dummy data) but with a significantly better, more modern, and premium mobile design. This deep check is an explicit order.

- **Premium UI/UX Design Quality (Strict Order):** Act as a Professional Full-Stack School ERP Software Developer, UI/UX Designer, and Product Architect. Every webpage or mobile screen designed must have a modern, unique, premium, and professional School ERP software look & feel. Ensure clean, elegant, highly polished, and visually impressive design (not just generic templates). UI must feature professional visual hierarchy, balanced spacing, modern typography, attractive cards, intuitive navigation, consistent components, responsive layout, and a smooth user experience with subtle animations/hover effects. The goal is to always leave the impression: "This is a professional, modern, premium School ERP product". Enhance UI/UX quality to the maximum level without breaking existing functionality.

- **Automatic Project State Sync (Strict Order):** At the end of every task or conversation, you MUST automatically update `PROJECT_STATE.md` with a summary of the latest conversation, decisions made, bugs fixed, and work accomplished. Do this autonomously without waiting for the user to ask. This ensures the chat history and project context is saved for the next agent session.

- **Flutter Safe Area Padding (Strict Order):** Whenever designing a new screen in the Flutter app that has a bottom button, bottom sheet, or bottom navigation bar, ALWAYS wrap the bottom-most widget (like a sticky button at the bottom) in a `SafeArea(bottom: true, child: ...)` or add sufficient bottom padding using `MediaQuery.of(context).padding.bottom`. This is to prevent the UI elements from overlapping with the Android System Navigation Bar.

- **Project Architecture & Hosting Context (Strict Memory):** NEVER ask the user where the backend, frontend, or databases are hosted. ALWAYS remember and refer to this configuration:
  1. **Backend (Node.js API):** Runs entirely on the VPS at `http://66.116.252.191:19998`.
  2. **Frontend (Web App):** Runs on the VPS at `http://66.116.252.191:19999`.
  3. **Databases:** The primary DB is Supabase (Postgres). The secondary DB (for heavy items like Question Papers/Answer Keys) is local Postgres on the VPS (`jy_school_local`).
  4. **Deployments:** Because Backend and Frontend run on the VPS, code changes MUST be pulled and rebuilt on the VPS. Always provide the exact SSH login command (`ssh root@66.116.252.191`) followed by `cd /root/JY-School/backend` or `cd /root/JY-School/frontend`.

- **Telugu Language Preference (Strict Order):** Always communicate and chat with the user ONLY in Telugu language. Do not use English for conversational responses unless specifically requested.

- **Strict Code Verification (Mandatory Pre-Flight Check):** Always double-check the Flutter code (or any code) for missing brackets, commas, syntax errors, and missing package imports BEFORE outputting. Act as an Expert Flutter and Full-Stack Developer and write strict, error-free code. NEVER skip this step.

- **Live Telugu Progress Log (Strict Order):** Whenever you are writing or modifying code, you MUST create or update an artifact named `progress_log.md`. In this artifact, you must provide live, step-by-step updates in Telugu language detailing exactly what you are doing (e.g., creating files, designing screens, fixing bugs). This log must be updated incrementally as you progress through the task, so the user can see exactly what is happening in real-time. NEVER skip this rule for any coding task.

- **Shorebird Release vs Patch Rule (Strict Memory):** ALWAYS remember this critical distinction for mobile app deployments:
  1. **Shorebird RELEASE** (New version): Requires `pubspec.yaml` version bump BEFORE running `shorebird release`. Format: `version: X.Y.Z+buildNumber` (e.g., `1.0.2+3` → `1.0.3+4`). Without bumping, Shorebird will FAIL with "existing release for this version" error.
  2. **Shorebird PATCH** (OTA update): Does NOT require version bump. Just run the patch workflow directly — it patches the existing release automatically.
  3. **Codemagic Artifact Paths:** When `working_directory: flutter_mobile` is set in `codemagic.yaml`, artifact paths must be relative to that working directory — use `build/app/outputs/flutter-apk/app-*.apk` (WITHOUT the `flutter_mobile/` prefix). Adding `flutter_mobile/` prefix will cause artifacts to not be found/downloaded.
  4. **Shorebird build.gradle.kts Rules:** NEVER add `doNotStrip("**/*.so")` or `ndk { debugSymbolLevel = "NONE" }` — these conflict with Shorebird's internal native library stripping and cause "failed to strip debug symbols" build failure.

- **Universal & Flavor App Sync Rule (Strict Order):** Whenever a modification is made for the Student App, Teacher App, or Admin App, the exact same modification MUST reflect in the Universal App. Conversely, any change made in the Universal App for a specific role MUST reflect in the corresponding flavor app. Since all apps share the same codebase in `flutter_mobile/lib/`, ensure that any role-specific UI or logic uses `AppConfig` or role checks correctly so it works flawlessly across all flavors.