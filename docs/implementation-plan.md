# Nurturing Implementation Plan

Project goal: Build a health system across web + iPhone app to track food, workouts, and menstrual cycle/symptoms, with phase-aware recommendations and Azure-powered AI assistance.

## Progress Tracker
- [x] Product name finalized: Nurturing
- [x] Package manager finalized: Yarn
- [x] Workspace folder created
- [x] Phase 1 - Foundation complete (web + api scaffold, shared packages, tooling, initial repo setup)
- [x] Phase 2 - Tracking MVP (initial) complete (food/workout/cycle/symptom flows + dashboard + phase display)
- [x] Phase 2 - Tracking MVP hardening complete (Prisma/Postgres persistence + strict DB mode + API tests + header-based auth)
- [x] Deploy auth milestone complete (Clerk sign-in/sign-up flow wired for web + API token verification mode)
- [x] Workout logging robustness update complete (notes optional save path fixed and covered by API test)
- [ ] Phase 3 - AI enablement not started (Azure calorie estimation + phase-aware recommendations)
- [ ] Phase 4 - Mobile iOS not started (Expo app aligned with web flows)
- [ ] Phase 5 - Deployment and release in progress (Render setup checklist pending)

## Architecture
- apps/web: React + Vite + TypeScript + Tailwind
- apps/mobile: Expo React Native + TypeScript (iOS-first, Android-capable)
- apps/api: Node.js + Express + TypeScript
- packages/core: shared types and cycle phase logic
- packages/schemas: shared Zod schemas
- Package manager: Yarn workspaces
- Database: PostgreSQL
- Authentication: Dual mode
  - Local development: `header` mode using `x-user-id`
  - Deployment target: `clerk` mode (web Clerk UI + API bearer token verification)
- AI: Azure model APIs for calorie estimation and cycle-aware recommendations

## Decisions Made
- Name/package manager: Nurturing + Yarn workspaces
- Persistence strategy: strict Postgres persistence (no in-memory fallback)
- Local database strategy: isolated local Postgres cluster in repo on port `5433`
- Auth strategy: Clerk for deployment, header auth for local dev speed
- Current sequencing: web + API hardening first, then AI, then mobile, then release pipeline

## Feature Scope (v1)
- Food tracking
  - Manual meal logging
  - Calories/macros totals
  - Optional AI-assisted meal estimation from text/image
- Workout tracking
  - Workout type, duration, effort, notes
  - Weekly trend summaries
- Cycle tracking
  - Period start/end
  - Current phase indicator
  - Symptom logging and history
- Cross-feature intelligence
  - Phase-aware food and workout suggestions
  - Explainable recommendation cards with confidence labels

## AI Plan (Azure)
- Calorie estimation
  - Input: meal text or image
  - Output: structured estimate (foods, portions, calories, confidence)
  - UX rule: user must be able to edit before save
- Cycle insights
  - Input: cycle day/phase + recent food/workout/symptoms
  - Output: phase-aware food/workout guidance
  - Safety rule: no diagnosis/treatment language; show disclaimer
- Reliability
  - Rule-based fallback when AI is unavailable
  - Per-user rate limits and usage logging

## Delivery Phases
1. Foundation
- Scaffold monorepo and tooling
- Shared package contracts
- Basic auth and environment setup
- Status: Complete

2. Tracking MVP
- Food/workout/cycle/symptom CRUD
- Dashboard with daily/weekly summaries
- Phase calculation and display
- Status: Complete (CRUD + dashboard + phase display + Prisma/Postgres persistence + strict DB mode + API tests + header-based auth)

3. AI Enablement
- Azure integration for calorie estimation and recommendations
- Confidence scoring + fallback behavior
- Status: Not started

4. Mobile iOS
- Expo app aligned with web features
- Camera upload for meal estimation
- Device QA on iPhone
- Status: Not started

5. Deployment + Release
- Render for web/api/postgres
- CI/CD and migration workflow
- TestFlight and App Store release flow
- Status: In progress (auth-ready app and deployment checklist prepared; infra rollout pending)

## Deployment Checklist
### Render (Web + API)
- [ ] Create staging services: web, api, postgres
- [ ] Configure env vars and secrets
- [ ] Run migrations on deploy
- [ ] Add health checks and alerts
- [ ] Promote to production after smoke tests

### iOS (Expo + Apple)
- [ ] Apple Developer/App Store Connect setup
- [ ] EAS build profiles for dev + prod
- [ ] TestFlight internal testing
- [ ] App Privacy + disclaimer copy finalized
- [ ] App Store submission
- [ ] Wearables integration

## Guardrails
- Guidance only; no medical diagnosis
- Visible disclaimer on cycle/health insight views
- Sensitive data minimization and retention policy
- Export/delete account data support in later phase

## Working Method
- Implement in thin vertical slices
- Sequence by priority: web + API first, mobile after web stability
- Run `yarn typecheck` before each commit
- Keep all new work behind checkboxes in this file
- Update status at the end of each implementation session
