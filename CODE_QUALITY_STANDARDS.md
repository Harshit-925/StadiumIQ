# Code Quality Standards — StadiumIQ

## Language & Compiler Settings

### TypeScript (Frontend)
- **Strict mode**: `"strict": true` in `tsconfig.json`
- **No unused code**: `"noUnusedLocals": true`, `"noUnusedParameters": true`
- **Zero `any`**: ESLint rule `@typescript-eslint/no-explicit-any: error`
- **Target**: ES2020 with ESNext modules

### Python (Backend)
- **Type hints**: Every function parameter and return value is typed
- **Strict mypy**: `strict = true` in `pyproject.toml`
- **Pydantic v2**: All data models use Pydantic with explicit field constraints

## Linting & Formatting

| Tool | Scope | Config File |
|------|-------|------------|
| ESLint | Frontend TypeScript/React | `frontend/eslint.config.js` |
| `eslint-plugin-jsx-a11y` | Accessibility linting | `frontend/eslint.config.js` |
| Prettier | Frontend code formatting | `frontend/.prettierrc` |
| Ruff | Backend Python linting | `backend/pyproject.toml` |
| mypy | Backend type checking | `backend/pyproject.toml` |

## Architecture Principles

### Separation of Concerns
```
backend/
  app/
    core/       → Cross-cutting: config, security, auth, rate limiting, logging
    engine/     → Domain logic: pure functions, no I/O, no AI
    models/     → Data models: Pydantic schemas
    routes/     → HTTP layer: request handling, response formatting
    services/   → External integrations: Gemini AI, PocketBase
```

### Domain Engine Design
- **Pure functions**: `calculator.py` has zero side effects, no I/O, no external calls
- **Cited sources**: Every formula references a specific, named authority
- **Deterministic**: Same input always produces same output
- **Testable**: 100% unit testable without mocks
- **AI-independent**: Engine works without Gemini; AI is a narrative layer on top

### Naming Conventions
- **Files**: `snake_case.py` (Python), `PascalCase.tsx` (React components), `camelCase.ts` (utilities)
- **Variables**: `snake_case` (Python), `camelCase` (TypeScript)
- **Types/Classes**: `PascalCase` in both languages
- **Constants**: `UPPER_SNAKE_CASE` in both languages
- **CSS**: Tailwind utility classes; custom properties use `--kebab-case`

### Error Handling
- Backend routes: try/except with specific exception types; never leak stack traces
- Frontend: Error boundaries; `role="alert"` for user-facing errors
- AI service: Always returns `(result, fallback_used: bool)`; never crashes

### State Management
- **Global**: Zustand stores (`useAuthStore`, `useAppStore`) — minimal surface
- **Local**: Component state for UI-only concerns
- **Server**: PocketBase for persistence and realtime subscriptions

## CI Enforcement

All quality gates are enforced in `.github/workflows/ci.yml`:
- `ruff check .` — no Python lint errors
- `mypy .` — no type errors
- `npm run lint` — no TypeScript/accessibility lint errors
- `pytest --cov-fail-under=85` — minimum coverage
- `npm test` — all frontend tests pass
- `npm run build` — production build succeeds (catches unused imports/variables)
