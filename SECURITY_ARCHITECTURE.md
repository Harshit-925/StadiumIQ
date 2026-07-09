# Security Architecture — StadiumIQ

## Overview

StadiumIQ implements defense-in-depth security across all layers: authentication, authorization, transport, application, and dependency management.

## Threat Model

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Unauthorized data access | Supabase GoTrue JWT auth + Row-Level Security | `backend/app/core/auth.py` |
| Cross-site scripting (XSS) | Content-Security-Policy header | `backend/app/core/security.py` |
| Clickjacking | X-Frame-Options: DENY | `backend/app/core/security.py` |
| MIME type sniffing | X-Content-Type-Options: nosniff | `backend/app/core/security.py` |
| API abuse / DDoS | Rate limiting via slowapi | `backend/app/core/rate_limit.py` |
| Secret exposure | Environment variables, .gitignore, gitleaks | `.env.example`, `.gitleaks.toml` |
| Dependency vulnerabilities | pip-audit, npm audit in CI | `.github/workflows/ci.yml` |
| Supply chain attacks | `npm ci --ignore-scripts` | `Dockerfile`, CI pipeline |
| CORS abuse | Strict origin allowlist | `backend/app/main.py` |
| Stack trace leakage | Try/except in all routes, no raw errors | `backend/app/routes/main.py` |

## Security Headers

All responses include these headers via `SecurityHeadersMiddleware`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Blocks unnecessary browser APIs |
| `Strict-Transport-Security` | `max-age=31536000` | Enforces HTTPS |
| `Content-Security-Policy` | See below | Prevents XSS and injection |

### CSP Breakdown

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';          # framer-motion uses inline style.transform
connect-src 'self'
  https://generativelanguage.googleapis.com  # Gemini API
  https://*.supabase.co;                     # Supabase Auth & DB
img-src 'self' data:;
font-src 'self' https://fonts.gstatic.com;
```

`style-src 'unsafe-inline'` is scoped to `style-src` only (not `script-src`) because `framer-motion` mutates `style.transform` directly. Tailwind CSS needs nothing inline.

## Authentication Model

- **Provider**: Supabase GoTrue (managed, battle-tested auth service)
- **No hand-rolled code**: Password hashing, token issuance, and session handling are all managed by Supabase
- **Token verification**: FastAPI verifies Supabase JWTs using the `SUPABASE_JWT_SECRET` environment variable
- **Frontend**: Uses `@supabase/supabase-js` with the anon key only; service role key stays backend-only
- **See**: `backend/app/core/auth.py`

## Authorization

Supabase Row-Level Security (RLS) is enabled on all tables. Policies enforce per-user ownership at the database layer:

```sql
CREATE POLICY "Users can only see their own data"
  ON history FOR ALL
  USING (auth.uid() = user_id);
```

This means a signed-in user can only ever see/modify their own data, enforced server-side.

## Rate Limiting

| Route | Limit | Purpose |
|-------|-------|---------|
| `POST /api/analyze` | 10/min | Protects Gemini API quota |
| `POST /api/fan-assist` | 10/min | Protects Gemini API quota |
| `GET /api/health` | No limit | Health check must always respond |

- Default storage: `memory://` (per-process)
- Production: Set `RATE_LIMIT_STORAGE_URI=redis://...` for multi-instance consistency
- Startup warning logged if production still uses `memory://`

## Dependency Security

- **Backend**: `pip-audit` in CI scans for known vulnerabilities
- **Frontend**: `npm audit --audit-level=high` in CI
- **Secrets**: `gitleaks` scans every commit for leaked credentials
- **Install**: `npm ci --ignore-scripts` blocks malicious postinstall scripts
