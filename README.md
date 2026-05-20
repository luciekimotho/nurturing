# Nurturing

Nurturing is a cycle-aware health tracking platform with web and mobile targets.

Current stack:
- Web: React + Vite + TypeScript + Tailwind
- API: Node.js + Express + TypeScript
- Shared packages: core domain logic + Zod schemas
- Package manager: Yarn workspaces

## What is implemented
- Web app with routed pages:
  - Dashboard
  - Food Log
  - Workouts
  - Cycle Tracking
- API endpoints:
  - `GET /health`
  - `GET/POST/DELETE /api/food`
  - `GET/POST/DELETE /api/workouts`
  - `GET/POST /api/cycle`
  - `GET/POST /api/cycle/symptoms`
  - `GET /api/cycle/phase`
- Shared cycle phase logic and validation schemas

## Run locally
1. Install dependencies

```bash
yarn install
```

2. Start API

```bash
yarn dev:api
```

3. Start web app

```bash
yarn dev:web
```

- Web: http://localhost:5173
- API: http://localhost:4000

## Quality checks
Run full workspace typecheck before committing:

```bash
yarn typecheck
```

## Commit workflow
Recommended workflow for this repo:
1. Implement a focused slice.
2. Run `yarn typecheck`.
3. Commit only when typecheck passes.

## Roadmap (next phase)
Next phase: Tracking MVP hardening (Phase 2)
- Move API from in-memory storage to PostgreSQL
- Add authentication and user-scoped data
- Add edit/update endpoints and stronger error handling
- Add basic tests for API routes and core phase logic

Then after that:
- Azure AI features (calorie estimation + phase-aware recommendations)
- iOS app implementation with Expo
- Render deployment + TestFlight/App Store flow
