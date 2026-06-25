# Ultron

A standalone prototype of **Ultron** — a workforce-operations AI agent surface — extracted from the Teambridge module into its own Vite + React + TypeScript app. It demonstrates how an autonomous ops agent triages live cases (call-outs, no-shows, payroll exceptions, coverage risks), reasons through them, and either recommends or auto-executes a resolution.

> **Demo only.** All state is local/in-memory — there is no backend. The data is fixtures.

## What's in it

- **Full app chrome** — `AppShell` with `PrimaryNav` / `SecondaryNav` / `TopNav` and a responsive mobile sheet layout.
- **Ultron is the app** — Ultron is the only wired primary-nav module (its icon is the Circle agent mark, and it's the default view). The other rail items render for visual fidelity but are inert.
- **The case feed** — cases grouped by lifecycle in the sidebar (New → Working → Done), each with an identity card, a docked decision surface (Approve / Other), and an **accumulating activity trail** that appends new reasoning/working steps under the existing ones as Ultron acts (it never clears and re-grows).
- **Design system** — built on the local [Alloy](../Alloy) design system (`alloy-design-system`), styled-components, and Geist.

## Getting started

This project depends on the local Alloy design system via a `file:` path:

```jsonc
"alloy-design-system": "file:/Users/unassignedlaptop9/Documents/MyClaudeFolder/Alloy"
```

So a fresh clone needs Alloy checked out at that path (or the dependency repointed) before installing.

```bash
npm install
npm run dev      # http://localhost:5174
```

## Scripts

| Script            | Description                                         |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 5174.             |
| `npm run build`   | Type-check (`tsc -b`) and build to `dist/`.         |
| `npm run preview` | Preview the production build locally.               |
| `npm run deploy`  | Build and publish `dist/` to the `gh-pages` branch. |

## Deployment

Deployed to GitHub Pages from the `gh-pages` branch:

**https://yizzy-gif.github.io/Ultron/**

The Vite `base` is set to `/Ultron/` to match the project-site path.

## Project structure

```
src/
├── App.tsx                 # Shell wiring; Ultron-only nav
├── components/             # AppShell, PrimaryNav, SecondaryNav, TopNav (+ mobile)
├── pages/Ultron/           # The Ultron experience
│   ├── UltronPage.tsx      # Sectioned case feed
│   ├── UltronCard.tsx      # Case card, action surface, activity trail
│   ├── ActivityTrail.tsx   # Reasoning/working step cards
│   ├── store.tsx           # In-memory case store (lifecycle transitions)
│   └── fixtures.ts         # Demo cases, milestones, working sequences
├── hooks/  ·  nav/  ·  types/  ·  data/
```
