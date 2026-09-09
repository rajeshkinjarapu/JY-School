# JY School Project State

## Recent Accomplishments
1. **Master Question Bank - Professional Re-architecture**:
   - **Phase 1 (API & Dropdowns)**: Fixed `?limit=5000` pagination issue for `classes` and `subjects`. Implemented Smart Dependent Dropdowns.
   - **Phase 2 (Premium Dashboard UI)**: Completely redesigned `MasterQuestionBankPage.tsx`. Built a two-column layout with a sleek Sidebar for Filters & Bank Stats. Transformed the questions list into a premium Accordion/Card layout.
   - **Phase 3 & 4 (Paper Generator Integration)**: Built a powerful bridge between the Master Bank and the MCQ Paper Generator. 
     - Added an "Import from Bank" Modal with advanced Class, Subject, and Difficulty filters.
     - Implemented a Text/Image Injection Engine that perfectly formats database questions (Q + Options) into LaTeX markdown.
     - Upgraded `LiveLatexPreview` to natively support `[IMAGE:url]` tags inside the generated paper, allowing diagrams from the bank to render seamlessly.
     - Implemented an Answer Key Modal that automatically tracks the correct options of all imported questions and saves them to the paper state for later printing.

## Important Configurations
- **VPS IP**: `66.116.252.191`
- **Backend Port**: `19998`
- **Frontend Port**: `19999`
- **Database**: PostgreSQL (Supabase / Local)
- **Deployment**: Must use Git to push locally, then pull on VPS, run `npm run build` and `pm2 restart` on both frontend and backend.
- **Language**: Interactions must be strictly in Telugu.

## Next Steps
- Implement Bulk Excel Upload for Master Questions if requested.
- Check Flutter app to ensure feature parity for Student mock tests.
