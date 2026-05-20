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

## Auth modes
- Local dev (simple):
  - Web: `VITE_AUTH_MODE=header` and optional `VITE_USER_ID=demo`
  - API: `AUTH_MODE=header`
  - Uses `x-user-id` request header for per-user scoping
- Deploy (recommended):
  - Web: `VITE_AUTH_MODE=clerk` + `VITE_CLERK_PUBLISHABLE_KEY`
  - API: `AUTH_MODE=clerk` + `CLERK_SECRET_KEY`
  - Uses Clerk sign-in/sign-up UI and Bearer tokens on API requests

## Deployment checklist (Render + Clerk)
1. Create a Clerk application in the Clerk Dashboard.
2. In Clerk Dashboard, copy keys:
  - Publishable key (pk_...) for web
  - Secret key (sk_...) for API
3. Deploy API service with env vars:
  - `NODE_ENV=production`
  - `AUTH_MODE=clerk`
  - `CLERK_SECRET_KEY=<your clerk secret key>`
  - `DATABASE_URL=<your production postgres url>`
4. Deploy web service with env vars:
  - `VITE_AUTH_MODE=clerk`
  - `VITE_CLERK_PUBLISHABLE_KEY=<your clerk publishable key>`
  - `VITE_API_URL=<your api public url>`
5. Set CORS origin in API deployment to your web domain.
6. Configure Clerk allowed origins/redirect URLs for your deployed web domain.
7. Run Prisma migrations on the deployed database:
  - `yarn workspace @nurturing/api prisma:deploy`
8. Smoke test deployment:
  - Sign up/sign in works
  - Create food/workout/cycle entries
  - Dashboard phase endpoint returns data

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
Next phase: AI enablement (Phase 3)
- Azure AI features (calorie estimation + phase-aware recommendations)
- iOS app implementation with Expo
- Render deployment + TestFlight/App Store flow
