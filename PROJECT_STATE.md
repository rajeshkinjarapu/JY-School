# Project State - JY ERP

## Latest Updates
- Fixed 20+ issues in Examination section.
- **Marks Entry Issue:** Fixed the bug where deleted marks (empty fields) were not deleting from the DB. Handled `isDeleted` flag in `frontend/src/pages/exams/MarksEntryPage.tsx` and processed deletion in `backend/src/controllers/marks.controller.ts`.
- **Ghost Subjects:** Disabled automatic creation of fake subjects in DB during marks saving in `marks.controller.ts` by adding strict ID matching to prevent duplicate subjects in the DB.
- **Absent (AB) Marks:** Fixed the logic so that 'AB' students' marks are properly saved and fetched. In Progress Cards, 'AB' is shown (but not in RED for fail), and their Max Marks are included in the total for correct percentage calculation.
- **Progress/Admit Card Settings:** Made Admit/Progress card logos and signatures dynamic by falling back to the global settings (`/api/settings`) if they are missing from the exam's individual configuration (`ProgressCardTab.tsx`, `ProgressCardTemplate.tsx`, `AdmitCardTemplate.tsx`).
- **Frozen Classes Error:** Fixed JSON string parsing for frozen classes array in `exams.controller.ts` (`toggleFreezeClass`).
- **OMR Scanner:** Updated `exams.controller.ts` (`scanOmr`) to read the `answerKey` from the API request rather than using hardcoded values.

## Next Steps
- Push the local code changes to Git and deploy to the VPS server (`http://66.116.252.191`) for backend and frontend.










- Codemagic లో shorebird patch విఫలమైతే `--allow-asset-changes` వాడాలని నిర్ధారించబడింది. అన్ని ఫ్లేవర్స్ (teacher, student, admin, universal) కి `--allow-asset-diffs` జోడించి అప్‌డేట్ చేయబడింది.
- flutter_mobile లోని `gate_pass_screen.dart` ని స్టూడెంట్స్ కి, టీచర్స్ కి వేరువేరుగా (Role-based) కనిపించేలా రీడిజైన్ చేయబడింది. స్టూడెంట్స్ కి టీచర్స్/స్టాఫ్ ట్యాబ్స్ కనిపించకుండా హైడ్ చేయబడింది.
- టీచర్స్ కి "Gate Pass" అప్లై చేసే స్క్రీన్ లో 'Teacher Self Request' మరియు 'Staff' ఆప్షన్లు జోడించబడ్డాయి. ఇది వాళ్ళని అడ్మిన్ అప్రూవల్ కి పంపడానికి అనుమతిస్తుంది.
- అడ్మిన్ లాగిన్ అయినప్పుడు "Gate Pass" లోని `Approvals` మరియు `History` ట్యాబ్స్ లో రిక్వెస్ట్ ని డిలీట్ చేసే ఆప్షన్ (Delete button with confirmation popup) జోడించబడింది. `ApiService.deleteGatePass` ఫంక్షన్ సృష్టించబడింది. ఈ ఫీచర్ కేవలం `ADMIN` రోల్ కి మాత్రమే పని చేస్తుంది.
- 5 రకాల విభిన్నమైన FA-1 ఎగ్జామ్ వేరియేషన్లు (`FA-1 (6,7)`, `FA- 1 (8,9,10)`, `FA-1 (1,2)`, `FA - 1 (3,4,5)`, `FORMATIVE ASSESSMENT - 1`) లను ఏ ఒక్క విద్యార్థి మార్కులు కోల్పోకుండా ఒకే ఒక్క `"FORMATIVE ASSESSMENT - 1"` ఎగ్జామ్ గా విజయవంతంగా మర్జ్ చేయడం జరిగింది (1,920 మార్కుల రికార్డులు పర్‌ఫెక్ట్‌గా రీ-అసైన్ అయ్యాయి).
- ఎగ్జామ్స్ యొక్క క్రియేషన్ లో కన్ఫ్యూజన్ లేకుండా డిఫాల్ట్ గా permanent Class-Wise Tabs విత్ మ్యాన్యువల్ సబ్జెక్ట్ ఎంట్రీ & బల్క్ అప్లై ప్రాసెస్ ని locked view గా మార్చడం జరిగింది.
- పాఠశాలలోని అన్ని తరగతులు నాచురల్ ఎడ్యుకేషనల్ సీక్వెన్స్ ఆర్డర్ లో (`Nur` $\rightarrow$ `PP1` $\rightarrow$ `PP2` $\rightarrow$ `1st` నుండి `10th` క్లాస్, మరియు సెక్షన్ల ఆర్డర్ `A, B, C...`) కనిపించేలా backend మరియు frontend లలో `sortClasses` సదుపాయం అమలు చేయబడింది. Marks Entry, Admit Cards, Results Entry, Progress Cards, Exam Creation లలో ప్రతి ఎగ్జామ్ కి తరగతులు ఒకే ఖచ్చితమైన వరుస క్రమంలో ప్రదర్శించబడతాయి.
- **Exam Percentage > 100% (117% Bug) పర్మినెంట్ ఫిక్స్**: 9th-A లోని 7 సబ్జెక్టుల మార్కులు (234/350) ఉన్నప్పుడు Total Max Marks 200 గా పొరపాటున ప్రాసెస్ అవ్వడం వల్ల 117% అని తప్పుగా వచ్చే సమస్య మూలకారణం కనుగొనబడి backend కంట్రోలర్లలో పర్మినెంట్ గా సరిచేయబడింది. ఇప్పుడు ప్రతీ విద్యార్థి విద్యార్థికి $234 / 350 = 66.86\%$ (Grade C+) పర్‌ఫెక్ట్‌గా లెక్కించబడుతుంది మరియు పర్సంటేజీ 100% పరిమితిని దాటకుండా క్యాపింగ్ రక్షణ కల్పించబడింది.
- **Question Bank Hub Name Update**: Question Bank Hub (Web) మరియు మోబైల్ యాప్‌లో "Navodaya Paper Generator" పేరును **"Question Paper Generator"** అని మార్చడం జరిగింది.- **Marks Entry Subjects Not Visible Bug**: Fixed an issue in MarksEntryPage.tsx and ExamListPage.tsx where subjects were not loading during marks entry and question paper assignment. The bug was caused by a change in the exam.subjects JSON structure from a simple array to a complex object ({ classConfigs: [...], globalSubjects: [...] }). The frontend code has been updated to parse the new structure correctly and display subjects.
- **App Installs Not Visible Bug**: Fixed an issue in AppInstallsPage.tsx where app installs by admins were not shown. Added 'All Users' and 'Admins' tabs and set 'All Users' as the default view.
- **Staff Attendance Redesign**: Revamped the TeacherAttendancePage.tsx Admin View with Dashboard summary cards, a Mark All Present feature, search functionality, colorful status buttons in a grid layout, and a sticky bottom save bar.
- **Staff Attendance Layout Fix**: Expanded the layout container to utilize the full screen width and adjusted grid column counts for ultra-wide screens.
- **Mobile App Load Fix**: Modified \DashboardScreen\ to load UI instantly using cached SharedPreferences data, eliminating the blank loading spinner delay on app startup.
- **Flutter Web Image Upload Fix**: Replaced \Image.file\ with a conditional \kIsWeb ? Image.network : Image.file\ in all payment screens and updated file handling to use \XFile\ to prevent UnsupportedError on Web.
- **Push Notifications Fix (Flutter & Backend)**: Renamed the Android Notification Channel ID to \jyschool_alerts_v1\ across the Flutter App and Backend to bypass Android channel caching. This ensures the app recreates the channel with \Importance.max\ and custom sound enabled, fixing the missing sounds and missing heads-up hero banners.
- **Made UTR Optional**: Removed the required validation for the UTR field in both student fee payment screens and added '(Optional)' to the label, making only the screenshot mandatory.
- **Fixed Fee Payment Submission Error**: Corrected the \eeStructureId\ extraction logic in \student_pay_fee_screen.dart\ to ensure the backend does not throw a validation error.
- **Fixed Student Results Screen Data Mapping**: Corrected the mapping logic in \exams_screen.dart\ because the backend API already grouped the results by exam. Results now display the original subject marks instead of 'Unknown'.
- **Fixed Syntax Errors**: Fixed missing parenthesis in \student_payment_submission_screen.dart\ and avoided ternary operator for \Image.file\ in \student_pay_fee_screen.dart\ to prevent Web assertion errors.

- Provided user with exact commands to download latest updates from Git (local and VPS).
- **Duplicate Subjects Bug in Results**: Fixed an issue in `ResultsTab.tsx` where subjects with slight variations (like trailing spaces or casing) were appearing as multiple duplicate columns (e.g., "PHYSICS" showing twice). Normalized subjects using `.trim().toUpperCase()` to ensure exact matching and deduplication.
- **Flutter Progress Card Fix**: Replaced `url_launcher` with `webview_flutter` in `single_progress_card_screen.dart`. Progress cards now open directly inside the Flutter app with 100% identical design to the web app, allowing PDF downloads without browser redirection issues.
