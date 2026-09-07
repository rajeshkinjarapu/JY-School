# JY ERP Progress Log

## Date: 2026-09-07
- **Bug Fix**: "upload chesina marks ki vachina result marks assalu sambandam ledu" (Marks entry mismatch with results). 
  - **Issue identified**: Exam marksలో కొన్ని సబ్జెక్టులకు పాత duplicate records (same subject name, different subject ID) ఉండటం వల్ల, Results screen లో ఆ పాత రికార్డ్స్ (marks) డిస్ప్లే అవుతున్నాయి. కానీ Marks Entry screen లో కొత్త మార్క్స్ ఎంటర్ అవుతున్నాయి. 
  - **Resolution**: `backend/src/controllers/marks.controller.ts` లో `bulkCreate` (Submit Marks) ఫంక్షన్ దగ్గర duplicate subjects (same name, different id) ఉంటే వాటికి సంబంధించిన పాత మార్క్స్ ని ఆటోమేటిక్ గా డిలీట్ చేసేలా లాజిక్ రాశాను.
  - `backend/src/controllers/exams.controller.ts` లో `getResults` API ఎప్పుడూ లేటెస్ట్ (newly updated) మార్క్స్ నే తీసుకునేలా `createdAt` తో సార్టింగ్ (sorting) లాజిక్ అప్డేట్ చేశాను.
  - **Status**: Backend కోడ్ ఫిక్స్ అయిపోయింది. సర్వర్ లో ఈ కోడ్ ని పుల్ చేసి బిల్డ్ చేస్తే ప్రాబ్లం పర్మినెంట్ గా సాల్వ్ అవుతుంది. 
