# AGENTS.md — Agent Instructions for PriceTrail

These rules are mandatory for any AI agent working in this repository.

## Execution Rules

1. **Implement first.** The AI's primary job is to perform updates, write code, fix bugs, and do exactly what the user asks. Do this first, without side quests or extra steps the user did not ask for.

2. **Run / test / gates only on explicit request.** Running new files, starting servers, testing updates, and checking gates (typecheck, lint, build, tests, screenshots) may only be executed when the user explicitly mentions or asks for them.

3. **Remind, don't run.** In its response, the AI may remind the user that running or testing the new updates is available. It must only actually run them after the user acknowledges or explicitly proceeds with it.

4. **Save images to the project folder.** Any screenshot, crop, capture, or other image produced while working on this project must also be saved to `D:\projects\price-trail\artifacts\` (in addition to the working temp folder on C:). Keep file names descriptive (e.g. `final-light-desktop.png`).
5. **Commit and push every big change.** Significant work (features, redesigns, multi-file edits, rule updates) must be committed and pushed to `origin/main` as part of finishing it — and fast-forwarded onto `arena/01a030cf-price-trail` so both branches stay identical — without waiting for an explicit request. Only trivial typo-level tweaks may be batched into the next commit.

## Pending User Actions (remind until done)

- **Google Cloud Console — OAuth redirect URIs (required for the fast popup sign-in):** the OAuth client used by `GOOGLE_CLIENT_ID` must have these added under **Authorized redirect URIs**, otherwise the popup fails with `redirect_uri_mismatch`:
  - `https://price-trail-ruddy.vercel.app/auth/google/callback`
  - `http://localhost:3010/auth/google/callback`
  (Keep the existing `/api/auth/callback/google` entries.) Remind the user until they confirm this is done.

## Order of Operations

1. Read the user's request.
2. Update files / write code / fix bugs as asked.
3. Commit and push significant changes (rule 5); optionally offer — in the response text — to run or test them.
4. Stop and wait for the user's acknowledgment before running anything.
