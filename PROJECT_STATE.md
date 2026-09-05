# Project State

- Student Profile Page లో వస్తున్న `Student profile not found` ఎర్రర్‌ను సరిచేయడానికి backend controller లో `id`, `userId`, `rollNo` ఆధారంగా ప్రొఫైల్ లోడ్ అయ్యేలా `getById` అప్‌డేట్ చేయబడింది.
- Flutter Mobile App లో `teacher_attendance_screen.dart` లోని "Submit Attendance" బటన్ ఆండ్రాయిడ్ System Navigation Bar తో ఓవర్‌లాప్ కాకుండా `SafeArea(bottom: true)` జోడించి ఫిక్స్ చేయబడింది.
- Backend Build & Deployment VPS సర్వర్‌లో 100% విజయవంతంగా పూర్తయింది. PM2 backend రన్నింగ్‌లో ఉంది.
- Teachers & Students ఫొటోలు లోడ్ కాకపోవడం అనే సమస్య `photoUrl: true` గా మార్చి పర్మినెంట్ గా ఫిక్స్ చేయబడింది.
- Flutter App నెట్‌వర్క్ ఎర్రర్ (`SocketException`) పరిష్కరించబడింది, లాగిన్ విజయవంతంగా పనిచేస్తోంది.
- "FORMATIVE ASSESSMENT - 1" ఎగ్జామ్ క్రియేషన్‌లో ప్రతి తరగతికి (Class) సబ్జెక్టులు వేర్వేరుగా ఉన్నప్పటికీ, డేటాబేస్ నుండి ఆయా క్లాస్ సబ్జెక్ట్‌లను ఆటో-ఫెచ్ చేసి సబ్జెక్ట్-వైజ్ Max Marks కాన్ఫిగర్ చేసేలా `implementation_plan.md` సిద్ధం చేయబడింది.
- `build.gradle.kts` ఫైల్ లో `ndkVersion = "28.2.13676358"` సెట్ చేసి, `codemagic.yaml` లో ఆ NDK ని ఇన్‌స్టాల్ చేసేలా కమాండ్స్ అప్‌డేట్ చేయడం ద్వారా Codemagic లో వస్తున్న "strip debug symbols" ఎర్రర్ పర్మినెంట్ గా సాల్వ్ చేయబడింది.
- MCQ Paper Generator లో ఉన్న స్టేట్ బ్లీడింగ్ బగ్ (పాత పేపర్ కంటెంట్ కొత్త పేపర్‌కి రావడం) `useEffect` లో రీసెట్ లాజిక్ జోడించడం ద్వారా పరిష్కరించబడింది.
- `codemagic.yaml` లో Flutter artifacts paths ని సరిచేసి, Shorebird ద్వారా Teacher App (APK & Release 1.0.3+4) విజయవంతంగా పబ్లిష్ చేయబడింది.
- Student App, Admin App, Universal App లకు కూడా Shorebird Release & Patch workflows ని కరెక్ట్ గా కన్ఫిగర్ చేసి ధృవీకరించడం జరిగింది.
- Students కి డీఫాల్ట్ పాస్‌వర్డ్ ని `Student2026` గా మార్చడం జరిగింది (Manual & Bulk Import రెండింటిలోనూ).
- Flutter App Results Screen లో అనవసరంగా వస్తున్న `MATHEMATICS` బగ్ (Max 210) డేటాబేస్ లోని dirty data వల్ల వస్తుందని గుర్తించి, దాన్ని VPS లో నేరుగా SQL/Prisma స్క్రిప్ట్ ద్వారా తొలగించడం జరిగింది.







- Codemagic లో shorebird patch విఫలమైతే `--allow-asset-changes` వాడాలని నిర్ధారించబడింది. అన్ని ఫ్లేవర్స్ (teacher, student, admin, universal) కి `--allow-asset-diffs` జోడించి అప్‌డేట్ చేయబడింది.
- flutter_mobile లోని `gate_pass_screen.dart` ని స్టూడెంట్స్ కి, టీచర్స్ కి వేరువేరుగా (Role-based) కనిపించేలా రీడిజైన్ చేయబడింది. స్టూడెంట్స్ కి టీచర్స్/స్టాఫ్ ట్యాబ్స్ కనిపించకుండా హైడ్ చేయబడింది.
- టీచర్స్ కి "Gate Pass" అప్లై చేసే స్క్రీన్ లో 'Teacher Self Request' మరియు 'Staff' ఆప్షన్లు జోడించబడ్డాయి. ఇది వాళ్ళని అడ్మిన్ అప్రూవల్ కి పంపడానికి అనుమతిస్తుంది.
- అడ్మిన్ లాగిన్ అయినప్పుడు "Gate Pass" లోని `Approvals` మరియు `History` ట్యాబ్స్ లో రిక్వెస్ట్ ని డిలీట్ చేసే ఆప్షన్ (Delete button with confirmation popup) జోడించబడింది. `ApiService.deleteGatePass` ఫంక్షన్ సృష్టించబడింది. ఈ ఫీచర్ కేవలం `ADMIN` రోల్ కి మాత్రమే పని చేస్తుంది.