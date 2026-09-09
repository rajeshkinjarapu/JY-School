# JY School Project State

## Recent Accomplishments
1. **Competitive Exams Revamp**: Converted UI to a premium layout. Added `getAllCompetitiveExams` API for admins to view all exams globally.
2. **Master Question Bank (Eduracle Style)**: 
   - Architected a centralized `MasterQuestion` schema in Prisma.
   - Built backend APIs to fetch, add, and AI-generate questions.
   - Built a frontend `MasterQuestionBankPage` for Admins/Teachers to manage reusable questions.
   - Designed a highly premium, dedicated `AddMasterQuestionPage` route with a large editor and integrated AI Question Generation.
   - Integrated the "Import from Question Bank" feature into `ManageExamQuestions.tsx` so teachers can directly pull pre-saved questions into JEE/NEET competitive exams.

## Important Configurations
- **VPS IP**: `66.116.252.191`
- **Backend Port**: `19998`
- **Frontend Port**: `19999`
- **Database**: PostgreSQL (Supabase / Local)
- **Deployment**: Must use Git to push locally, then pull on VPS, run `npm run build` and `pm2 restart` on both frontend and backend.
- **Language**: Interactions must be strictly in Telugu.

## Next Steps
- Implement Bulk Excel Upload for Master Questions if requested.
- Check flutter app to ensure feature parity for Student mock tests.
