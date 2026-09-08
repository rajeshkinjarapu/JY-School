# JY School ERP Project State

## Recent Accomplishments
1. **Accountant Role Integration (Web)**: 
   - Created `StaffManagement.tsx` for managing `ACCOUNTANT` users.
   - Updated `Sidebar.tsx` to include "Staff Roles".
   - Login routing correctly handles `ACCOUNTANT` users seamlessly through `/dashboard` handling.
   
2. **Accountant Role Integration (Mobile)**:
   - Configured `app_config.dart` to support `ACCOUNTANT` role.
   - Created `accountant_dashboard_screen.dart` with dedicated Finance & Operations UI.
   - Updated `main_layout.dart` bottom navigation routing specifically to show the Accountant Dashboard and Finance screen to Accountant users.

3. **Mobile Progress Card Rendering Fix & Native Implementation**: 
   - Fixed an issue where the webview inside the flutter app was redirecting to the login page. Modified `App.tsx` to only prefetch data when authenticated, preventing 401 interceptor redirects. 
   - Replaced the slow WebView implementation with a 100% Native Flutter Widget (`progress_card_native.dart`).
   - Integrated `RepaintBoundary` to capture the native layout and convert it to a high-quality PDF.
   - Added native "Share" and "Download" functionality using `share_plus` and `pdf` packages, making the progress card load instantly and exportable seamlessly.

4. **Performance Optimization (Database Migration)**:
   - User reported severe lag opening student profiles.
   - Discovered Supabase Free Tier quota was exhausted ("Services Restricted / Unhealthy").
   - Executed **Option 2 (Local VPS Database Migration)**: Successfully dumped data from Supabase using Postgres 17 client and restored it directly into a local PostgreSQL database (`jy_school_db`) on the VPS.
   - Updated VPS `.env` file to route all Backend API connections to the local `jy_school_db` database, eliminating cloud network latency completely.

5. **Local Database Migration Bug Fixes**:
   - **Cache Issue:** The backend was still returning stale empty arrays due to Upstash Redis URL remaining active in PM2's environment. Forcefully deleted the Upstash URL from `.env` and restarted PM2 with `--update-env`.
   - **Row Level Security (RLS) Issue:** The imported Supabase database dump unexpectedly included RLS policies. As a result, the `jy_admin` Postgres user was silently denied read access to tables like `Class`, returning 0 rows despite the data existing in the database. Executed a dynamic SQL script to `DISABLE ROW LEVEL SECURITY` on all tables in the `public` schema, completely resolving the "No classes configured yet" frontend issue.

6. **Question Bank (AI Paper Generator) Fixes**:
   - **Print Layout Fix:** Fixed an issue where floating LaTeX images were shifting out of place during print. The print iframe was incorrectly resizing the A4 container to `100%` width instead of `210mm`, causing text reflow which misaligned absolute-positioned images. Ensured all generator pages enforce `210mm` width and `margin: 0` during print.
   - **Saved Papers Preview Fix:** Fixed a bug where viewing a saved paper from the "Saved Papers" page showed a blank screen (because the JSON state `<!--MCQ_DATA_V2-->` was being injected into `dangerouslySetInnerHTML`). Removed the broken preview modal and routed users directly to the proper generator page in edit mode to view/print accurately.

7. **Flutter Mobile App Stability Fixes (Crash Prevention)**:
   - User reported frequent crashes requiring "clear app data" to resolve.
   - **Root Causes Fixed:** Handled expired session tokens (`401 Unauthorized`), corrupted local user data (parsing errors), and unhandled generic flutter exceptions.
   - **Implementation:** Added global error handlers (`FlutterError.onError`, `PlatformDispatcher.instance.onError`) in `main.dart`. Intercepted `SharedPreferences` corrupted JSON using a `try-catch` validation on boot that gracefully clears data instead of crashing. Added a global `401 / 403` interceptor in `api_service.dart` that triggers an automatic logout (`logout()`) and uses `navigatorKey` to safely redirect users back to the Welcome/Login screen instead of locking up the app on old cached tokens.

8. **Competitive Exams (JEE/NEET Mock Test) Module Integration**:
   - **Backend:** Created dedicated Prisma models (`CompetitiveExam`, `CompetitiveExamQuestion`, `CompetitiveExamSubmission`, `CompetitiveExamResponse`) specifically parallel to standard quizzes to ensure clean schema separation.
   - **Backend API:** Implemented detailed metrics tracking like `timeTakenSeconds` per question, negative marking evaluation, and AI-powered question generation inside `competitiveExams.controller.ts`.
   - **Frontend (Web App):** Developed an advanced Desktop Exam Engine matching the standard NTA (TCS iON) layout.
   - **Anti-Cheat:** Integrated full-screen API enforcement (`document.requestFullscreen`), and window/tab switch detection (`visibilitychange`, `blur` events). Implemented a 3-strike warning system before auto-submitting the test.
   - **Exam UI:** Added a comprehensive question palette grid with state tracking (Not Visited, Not Answered, Answered, Marked for Review, Answered & Marked for Review).

## Next Steps / Pending
- Confirm and test the Shorebird patch workflow integration on the VPS.
- End-to-end testing of Accountant role on VPS once backend code is pulled and updated.
- Verify that the new Local VPS Database completely resolves the lag when opening student profile pages.