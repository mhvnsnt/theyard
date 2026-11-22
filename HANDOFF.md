# HANDOFF — theyard

**Last updated: 2026-11-22 (America/New_York).**
**Repo:** `mhvnsnt/theyard` (PUBLIC), default branch `main`.
**Purpose of this file:** any agent that picks up work here reads this FIRST, then the linked docs. It states what we've done, where we're at, and what we're working toward — so the owner can say "go to this repo, pick up the work" and you just know. Update this file in the same PR whenever the state changes (add, don't delete).

## 1. What this repo is

The Yard — a TypeScript/Vite web app with a server, database migrations, and a Vercel deploy. The repo carries no description and no README statement of purpose, so what follows is only what the tree shows: `src/` + `server/` + `scripts/` (the app), `migrations/` (the database), `public/`, `artifacts/`, `docs/`, `screenshots/` (boot, after-click, and inputs shots: `yard-1-boot.png`, `yard-2-afterclick.png`, `yard-3-inputs.png`), `yard-notes.json`, `vercel.json`, `startup.sh`. Created 2026-09-28. Public.

**Plainly:** the repo does not say in its own words what The Yard is for. Whoever picks this up should read `docs/`, `yard-notes.json`, and the screenshots first and write the purpose down here before building more.

## 2. Where we're at

### DONE
- **Anti-clobber laws (2026-10-17, PR #5 merged):** the owner's anti-clobber laws landed after the DXMMII 54k-file wipe.
- **Working method statement (2026-10-27):** `WORKING-METHOD.md` landed.

### IN PROGRESS
- Nothing is actively in progress in this repo that the repo itself records. Last push was the 2026-10-27 sweep commit. No open PRs, no releases.

### BLOCKED
- Nothing recorded as blocked. The gap is a documentation gap, not a code block: the purpose is unstated (see §1).

## 3. What we're working toward

First: establish what The Yard is, from `docs/`, `yard-notes.json`, and the screenshots, and write it into this file and the README. Then: whatever the app is for, it works live on its deploy with the database migrated — verified, not assumed. The bar: the purpose is written down in the repo's own words before more features land.

## 4. Standing rules that apply here

- **Branch → PR → merge, always.** Never push to main directly. Add-only, zero-conflict PRs, no force pushes.
- **Checkpoint-and-save law:** CHECKPOINT.md first, update after every step; the repo is the save; resume, never restart.
- **No-temp-storage law:** nothing in /tmp or any wipeable location, ever.
- **Real-source-only:** build from the real sources, wired up fully — no hand-tooled lookalikes.
- **Never kill in-progress work.**
- **Anti-clobber:** never wipe or overwrite another lane's work.

## 5. Key files and paths

| What | Where |
|---|---|
| App source / server | `src/`, `server/`, `scripts/` |
| Database | `migrations/` |
| Notes (read first) | `yard-notes.json` |
| Screenshots | `yard-1-boot.png`, `yard-2-afterclick.png`, `yard-3-inputs.png`, `screenshots/` |
| Docs / artifacts | `docs/`, `artifacts/` |
| Deploy / startup | `vercel.json`, `startup.sh` |
| Agent rules | `AGENTS.md` |
| Method doc | `WORKING-METHOD.md` |

## 6. Open decisions needing the owner

- **What The Yard is for:** the repo does not state it. Once a pickup lane reads the notes and screenshots, the purpose still needs his confirmation before it is written in as fact.
- No other decisions are recorded in this repo.

## 7. How to pick up

1. Read this HANDOFF.md first, then `yard-notes.json`, `docs/`, and the three `yard-*.png` screenshots.
2. Write down what The Yard is (from those sources, not from guessing) and get the owner's confirmation before treating it as fact.
3. Check what other agents are already doing before starting anything.
4. Resume from the stated next step — never restart, never re-derive finished work.
5. Land work branch → PR → merge, add-only. Stage finished work to the repo as it lands.
6. Update this HANDOFF.md in the same PR when the state changes. Verify with your own eyes before claiming anything done.
