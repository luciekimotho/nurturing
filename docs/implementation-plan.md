# Nurturing Implementation Plan

Project goal: Build a health system across web + iPhone app to track food, workouts, and menstrual cycle/symptoms, with phase-aware recommendations and Azure-powered AI assistance.

## Progress Tracker
- [x] Product name finalized: Nurturing
- [x] Package manager finalized: Yarn
- [x] Workspace folder created
- [x] Phase 1 - Foundation complete (web + api scaffold, shared packages, tooling, initial repo setup)
- [x] Phase 2 - Tracking MVP (initial) complete (food/workout/cycle/symptom flows + dashboard + phase display)
- [ ] Phase 2 - Tracking MVP hardening in progress (Prisma/Postgres persistence + API tests started; auth pending)
- [ ] Phase 3 - AI enablement not started (Azure calorie estimation + phase-aware recommendations)
- [ ] Phase 4 - Mobile iOS not started (Expo app aligned with web flows)
- [ ] Phase 5 - Deployment and release not started (Render + TestFlight/App Store)

## Architecture
- apps/web: React + Vite + TypeScript + Tailwind
- apps/mobile: Expo React Native + TypeScript (iOS-first, Android-capable)
- apps/api: Node.js + Express + TypeScript
- packages/core: shared types and cycle phase logic
- packages/schemas: shared Zod schemas
- Package manager: Yarn workspaces
- Database: PostgreSQL
- AI: Azure model APIs for calorie estimation and cycle-aware recommendations

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
- Status: In progress (scaffold/contracts done; auth pending)

2. Tracking MVP
- Food/workout/cycle/symptom CRUD
- Dashboard with daily/weekly summaries
- Phase calculation and display
- Status: In progress (initial CRUD + dashboard + phase display done; Prisma/Postgres persistence + API tests started; auth still pending)

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
- Status: Not started

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
