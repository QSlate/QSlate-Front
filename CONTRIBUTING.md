# Contributing to QSlate

Thank you for contributing to QSlate! To ensure that our codebase remains of institutional quality, high performance, and strictly consistent, all contributions must adhere to our engineering standards.

## Quick Links

- **Engineering Standards & Code Guidelines:** Please read [CLAUDE.md](./CLAUDE.md) for full architectural guidelines, Next.js 16 / React 19 standards, TypeScript conventions, styling rules, and accessibility requirements.
- **AI Agent & LLM Developer Guide:** Please read [LLMS.md](./LLMS.md) for complete project context, backend microservices contracts, API endpoint specs, and step-by-step ticket onboarding instructions.

---

## Contribution Workflow

### 1. Branch Naming

All feature branches must be created from `main` using the following convention:

```text
<issue-number>-<short-description-in-kebab-case>
```

_Example:_ `118-connect-mini-ide-to-strategy-service`

### 2. Code Quality & Pre-Commit Gates

Before committing code, ensure all local verification checks pass:

```bash
# 1. Run unit & integration test suite
npm test

# 2. Run ESLint checks (import ordering and Next.js vitals)
npm run lint

# 3. Type-check TypeScript codebase
npx tsc --noEmit

# 4. Check formatting with Prettier
npx prettier --check .

# 5. Verify production build
npm run build
```

Husky and `lint-staged` run automatic linting and formatting on staged files. Do not bypass these hooks.

### 3. Git Commit Conventions

Commit messages must strictly follow the **Conventional Commits** specification:

```text
<type>(<scope>): <short description in imperative mood>

[optional body explaining motivation and details]

[optional footer: Closes #123]
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scopes:** `lab`, `ide`, `marketplace`, `auth`, `settings`, `charts`, `widgets`, `api`, `state`, `theme`, `a11y`, `security`, `deps`.
- **Imperative subject:** Use lower-case, no trailing period (e.g., `feat(ide): connect strategy linting diagnostics`).

### 4. Pull Requests

1. Rebase your branch onto `origin/main` before opening a PR.
2. Open a Pull Request referencing the GitHub Issue (e.g. `Closes #118`).
3. Ensure all CI checks pass.
