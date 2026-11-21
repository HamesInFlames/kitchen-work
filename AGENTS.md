# AGENTS.md — project conventions

## Project
- Name: Tova's Bakery — Recipe Book
- Developer: James (Kim Consultant)
- Stack: React 19, TypeScript, Vite, Tailwind CSS 4, react-router-dom, motion, idb (IndexedDB), nosleep.js, vite-plugin-pwa (installable PWA)
- Repo: github.com/HamesInFlames/kitchen-work

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Test: none
- Lint: none
- Typecheck: `npm run typecheck`

## Code conventions
- TypeScript with tsconfig project references (`tsconfig.app.json`, `tsconfig.node.json`)
- Source is in `src/` (components, context, db, hooks, lib, pages, types, workers)
- Styling is Tailwind CSS 4 through the Vite plugin, plus `src/index.css`
- Local-first: data is stored in IndexedDB

## Workflow
- Read tasks/todo.md before starting work
- Update tasks/status.md after each session
- Log decisions in tasks/decisions.md
- Run `npm run build` before committing

## Do NOT
- Change existing styling, copy or behaviour the task did not ask about
- Install packages without documenting in tasks/decisions.md
- Modify deployment config without approval
- Delete .env files

## Lessons
<!-- added by /kc-workflow:reflect -->
