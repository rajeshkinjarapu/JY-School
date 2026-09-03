# Project State

- వినియోగదారు అభ్యర్థన మేరకు `git pull` కమాండ్ అందించబడింది. (Updates downloaded from Git).
- `build.gradle.kts` ఫైల్ లో `ndkVersion = "28.2.13676358"` సెట్ చేసి, `codemagic.yaml` లో ఆ NDK ని ఇన్‌స్టాల్ చేసేలా కమాండ్స్ అప్‌డేట్ చేయడం ద్వారా Codemagic లో వస్తున్న "strip debug symbols" ఎర్రర్ పర్మినెంట్ గా సాల్వ్ చేయబడింది.
- MCQ Paper Generator లో ఉన్న స్టేట్ బ్లీడింగ్ బగ్ (పాత పేపర్ కంటెంట్ కొత్త పేపర్‌కి రావడం) `useEffect` లో రీసెట్ లాజిక్ జోడించడం ద్వారా పరిష్కరించబడింది.
- `codemagic.yaml` లో Flutter artifacts paths ని సరిచేసి, Shorebird ద్వారా Teacher App (APK & Release 1.0.3+4) విజయవంతంగా పబ్లిష్ చేయబడింది.
- Student App, Admin App, Universal App లకు కూడా Shorebird Release & Patch workflows ని కరెక్ట్ గా కన్ఫిగర్ చేసి ధృవీకరించడం జరిగింది.
- Students కి డీఫాల్ట్ పాస్‌వర్డ్ ని `Student2026` గా మార్చడం జరిగింది (Manual & Bulk Import రెండింటిలోనూ).
- Flutter App Results Screen లో అనవసరంగా వస్తున్న `MATHEMATICS` బగ్ (Max 210) డేటాబేస్ లోని dirty data వల్ల వస్తుందని గుర్తించి, దాన్ని VPS లో నేరుగా SQL/Prisma స్క్రిప్ట్ ద్వారా తొలగించడం జరిగింది.
