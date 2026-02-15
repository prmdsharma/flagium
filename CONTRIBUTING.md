# Contributing to Flagium

Welcome, and thank you for contributing to Flagium! Please follow the guidelines below to ensure a smooth development process.

## Git Branching Strategy

We follow a structured branching model to maintain stability in production while allowing rapid development.

### Branches Overview

| Branch | Purpose | Protected? | Source | Merge Into |
| :--- | :--- | :--- | :--- | :--- |
| **`main`** | **Production** (Stable). Matches live deployment. | Yes | `dev` | N/A |
| **`dev`** | **Integration**. Working changes, pre-production testing. | Yes | `feature/*`, `hotfix/*` | `main` |
| **`feature/*`** | **New Work**. Individual features (e.g., `feature/login-page`). | No | `dev` | `dev` |
| **`hotfix/*`** | **Production Fixes**. Critical bugs (e.g., `hotfix/login-crash`). | No | `main` | `main` & `dev` |

### Workflow Examples

#### 1. Starting a New Feature
Always branch from `dev`.
```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-cool-feature
```

#### 2. Completing a Feature
Push your feature branch and open a Pull Request (PR) to `dev`.
```bash
git push origin feature/my-cool-feature
# Go to GitHub and open PR: feature/my-cool-feature -> dev
```

#### 3. Hotfix for Production
If a critical bug is found in `main`, branch from `main`.
```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
# ... fix bug ...
git push origin hotfix/critical-bug
# Open PR: hotfix/critical-bug -> main AND dev
```

## Pull Request Guidelines
- Keep PRs focused on a single feature or fix.
- Provide a clear description of changes.
- Ensure all tests pass before merging.
