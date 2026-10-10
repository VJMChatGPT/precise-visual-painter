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

## Project rules
- Game data lives in src/data/coins.json (generated from the uploaded CSV, all provenance fields kept); `referenceMarketCapUsd` = verified ?? observed ?? estimate. Why: real ATHs can be swapped in later without code changes.
- Game logic (src/game/*) is UI-free; branding lives only in src/config/brand.ts. Why: easy rebrand and Codex handoff.
- No backend: scores/prefs in localStorage. Why: MVP scope.
