# SmartProperty Copilot Instructions

## Project Context

SmartProperty is a monorepo with three main applications:

- frontend: React 19 + Vite + TypeScript + TailwindCSS
- backend: NestJS 11 + TypeScript + MongoDB (TypeORM)
- ai-services: FastAPI + Python for AI features

Primary product areas are authentication, user and verification workflows, properties, uploads, notifications, and AI-assisted matching/pricing.

## Repository Layout

- frontend/src: UI pages, components, stores, hooks, service clients
- backend/src/modules: feature modules (auth, users, properties, upload, notifications, verification)
- ai-services/app: FastAPI routers, core connections, service layer
- docs: roadmap and technical documentation
- scripts: local PowerShell and shell scripts for setup/testing

## Non-Negotiable Rules

- Keep changes scoped to the relevant app(s); do not refactor unrelated modules.
- Preserve existing architecture boundaries:
  - Controllers/routers stay thin.
  - Business logic belongs in services.
  - Shared concerns go in common/core layers.
- Do not hardcode credentials, tokens, or environment values.
- Respect existing role-based access and security guards; never bypass auth in protected flows.
- Keep API behavior backward-compatible unless explicitly asked to change contracts.

## Backend (NestJS) Conventions

- Keep endpoints under the global api prefix used by bootstrap.
- Use DTOs with class-validator/class-transformer for request validation.
- Use decorators consistently: Public, Roles, CurrentUser, ApiBearerAuth where appropriate.
- For MongoDB entities and queries:
  - Validate/convert ObjectId inputs safely.
  - Maintain soft-delete behavior using deletedAt/status patterns when present.
  - Avoid writing undefined values into persisted documents.
- Add Swagger decorators for new endpoints and response cases.
- Follow existing module structure:
  - module.ts wiring
  - controller.ts for HTTP layer
  - service.ts for logic
  - dto and entities folders for contracts and persistence

## Frontend (React) Conventions

- Use TypeScript strict patterns; avoid introducing any unless unavoidable.
- Reuse existing app patterns:
  - Routing in App.tsx
  - Auth protection with ProtectedRoute
  - API access through src/services (especially api.ts interceptor setup)
  - Global state via existing Zustand/Jotai stores
- Use TailwindCSS as the primary styling approach for UI changes.
- Prefer utility-first classes and existing design tokens; avoid creating new global CSS unless necessary.
- Reuse existing class composition patterns (cva/clsx/tailwind-merge) where already used.
- Use path aliases from tsconfig/vite config when importing.
- Keep UI consistent with existing component primitives and current page structure.
- For auth flows, keep token lifecycle aligned with interceptor-based refresh behavior.

## AI Services (FastAPI) Conventions

- Keep endpoints versioned under app/api/v1.
- Prefer async handlers/services where existing code is async.
- Reuse core connections/config modules for MongoDB and Redis.
- Keep model/service boundaries clear:
  - Router for transport
  - Service for business logic
  - Core for infrastructure concerns

## Testing and Verification

When modifying code, run only the smallest relevant checks first, then broader checks if needed.

Recommended commands:

- Root development: npm run dev
- Backend:
  - npm run start:dev --prefix backend
  - npm run test --prefix backend
  - npm run test:e2e --prefix backend
  - npm run lint --prefix backend
- Frontend:
  - npm run dev --prefix frontend
  - npm run test --prefix frontend
  - npm run lint --prefix frontend
- AI services:
  - pip install -r ai-services/requirements.txt
  - pytest ai-services/tests

If tests are missing for the touched area, add focused tests when practical.

## Feature Delivery Checklist

For substantial features touching product behavior:

1. Update backend API and validation.
2. Update frontend integration and user-facing states.
3. Wire role/permission behavior explicitly.
4. Add or update tests for changed paths.
5. Update relevant documentation in docs and/or README sections.

## Preferred Change Style

- Make minimal, reversible, and well-scoped edits.
- Keep naming consistent with existing domain terms.
- Add brief comments only when logic is non-obvious.
- Do not introduce new dependencies unless necessary and justified.

## Roadmap Alignment

Before implementing major features, check docs/features-roadmap.md and keep new work aligned with current phase priorities and planned AI/compliance scope.
