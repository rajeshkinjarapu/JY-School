# JY School Project State

## Recent Accomplishments
1. **Master Question Bank - Professional Re-architecture**:
   - **Phase 1 (API & Dropdowns)**: Fixed `?limit=5000` pagination issue for `classes` and `subjects`. Implemented Smart Dependent Dropdowns (Subjects load dynamically based on selected Class) in both Add Question and Master Bank pages.
   - **Phase 2 (Premium Dashboard UI)**: Completely redesigned `MasterQuestionBankPage.tsx`. Built a two-column layout with a sleek Sidebar for Filters & Bank Stats. Transformed the questions list into a premium Accordion/Card layout that expands to reveal detailed options, diagrams, and explanations. Added client-side real-time Search.
   - **AI Question Generation Upgrades**: Designed a split Tab UI for Manual vs AI. Added support for **Document / PDF uploads** in AI mode via `multer` in backend and `FormData` in frontend.
   - **Rich Media Options**: Per-option Text / Image toggle. Compact Image Upload buttons.

## Important Configurations
- **VPS IP**: `66.116.252.191`
- **Backend Port**: `19998`
- **Frontend Port**: `19999`
- **Database**: PostgreSQL (Supabase / Local)
- **Deployment**: Must use Git to push locally, then pull on VPS, run `npm run build` and `pm2 restart` on both frontend and backend.
- **Language**: Interactions must be strictly in Telugu.

## Next Steps
- **Phase 3**: Advanced Paper Generator integration (building exams directly from the Master Bank).
- Implement Bulk Excel Upload for Master Questions if requested.
- Check flutter app to ensure feature parity for Student mock tests.
