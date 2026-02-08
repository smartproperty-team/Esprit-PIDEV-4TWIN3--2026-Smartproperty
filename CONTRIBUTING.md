# Contributing to SmartProperty

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Docker** & Docker Compose
- **Python** 3.11+ (for AI services)
- **Git**

### First-Time Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-org>/smartproperty.git
cd smartproperty

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-services/.env.example ai-services/.env

# 3. Start infrastructure (MongoDB, Redis, MailHog)
docker compose up -d mongodb redis mailhog

# 4. Install dependencies (generates lock files)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 5. Install git hooks
npx husky install

# 6. Seed the database
npm run seed

# 7. Start development
npm run dev
```

## Git Workflow

We use **GitHub Flow** with branch protection on `main` and `develop`.

### Branch Naming

| Type    | Pattern                     | Example                   |
| ------- | --------------------------- | ------------------------- |
| Feature | `feature/short-description` | `feature/property-search` |
| Bug fix | `fix/short-description`     | `fix/login-redirect`      |
| Hotfix  | `hotfix/short-description`  | `hotfix/auth-crash`       |
| Chore   | `chore/short-description`   | `chore/update-deps`       |

### Development Flow

```
1. Pull latest from develop:     git checkout develop && git pull
2. Create your branch:           git checkout -b feature/my-feature
3. Make changes & commit often:  git add . && git commit -m "feat: add X"
4. Push & open a PR:             git push -u origin feature/my-feature
5. CI pipeline runs automatically
6. Get at least 1 code review approval
7. Squash merge into develop
8. develop → main via release PR
```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add property listing filter
fix: resolve map marker click issue
docs: update API documentation
chore: upgrade NestJS to v11
test: add unit tests for auth service
refactor: simplify pricing calculation
```

## Before Pushing

Run these checks locally:

```bash
# Backend
cd backend
npm run lint
npm run build
npm run test

# Frontend
cd frontend
npm run lint
npm run build

# AI Services
cd ai-services
ruff check app/
pytest tests/ -v
```

## Environment Variables

- **Never** commit `.env` files (they're in `.gitignore`)
- When you add a new env variable, **always update** the corresponding `.env.example`
- Document the variable's purpose in a comment

## Code Review Checklist

Before approving a PR, verify:

- [ ] CI pipeline passes (green check)
- [ ] Code follows existing patterns
- [ ] No hardcoded secrets or credentials
- [ ] New env variables are documented in `.env.example`
- [ ] Tests cover the change
- [ ] No `console.log` left in production code
