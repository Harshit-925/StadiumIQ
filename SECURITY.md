# Security Policy

## Reporting a Vulnerability

If you discover a security issue in StadiumIQ, please open a GitHub issue
or contact the maintainer directly rather than disclosing it publicly.
We'll aim to acknowledge reports within a reasonable timeframe given this
is a hackathon submission, not a production service handling real user data.

## Security Measures in Place

- JWT verification (HS256, pinned algorithm) with required `sub`/`exp` claims
- Strict Content-Security-Policy (`script-src 'self'`, no inline scripts,
  no third-party script origins)
- Security headers: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff,
  Permissions-Policy
- CORS restricted to an explicit origin whitelist (no wildcard)
- Rate limiting enforced on all POST routes (verified by an automated
  structural test — see backend/tests/test_rate_limits.py)
- Dependency scanning: `pip-audit` (backend) and `npm audit` (frontend)
  run as part of local verification
- No secrets committed to the repository; all credentials are environment-
  variable driven (see .env.example)
- Docker container runs as a non-root user

## Known, Accepted Trade-offs

- Session tokens are stored via Supabase's default client-side
  `persistSession` (localStorage), not httpOnly cookies. This is
  Supabase's standard client pattern; XSS risk is mitigated by the
  strict CSP above (no inline/third-party script execution).
- Frontend dev tooling (Vite/Vitest) has known CVEs in transitive
  dependencies that affect only the local dev/test server, never the
  production build. A fix requires a major version upgrade (Vite 5→8,
  Vitest 1→4) that was deferred to avoid destabilizing a passing test
  suite this close to submission.
