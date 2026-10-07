<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The ML model is trained offline by `ml/train_model.py` and exported as JSON trees to `src/data/model.json`; the app runs inference in the browser (`src/lib/model.ts`) — keeps predictions real without a Python server.
- Financial math and the readiness score live in `src/lib/loan.ts` as deterministic rules, kept separate from ML output so the UI can label each honestly.
- User data (current analysis, history, scenarios) is stored in localStorage via `src/lib/store.tsx` — no backend needed for this prototype.
