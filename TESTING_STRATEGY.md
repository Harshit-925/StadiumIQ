# Testing Strategy — StadiumIQ

## Overview

StadiumIQ uses a multi-layer testing strategy targeting **85%+ backend coverage** and comprehensive frontend accessibility testing. Both Gemini AI and PocketBase are fully mocked in tests — no live services required.

## AI Model

The AI service uses **Gemini 2.5 Flash** (`gemini-2.5-flash`) for narrative generation from engine output. Flash was chosen over Pro because:
1. The AI task is narrative-from-a-number (summarizing already-computed engine results), not reasoning
2. Flash has substantially better free-tier RPM/RPD quotas
3. Pro's thin free-tier quota risks the exact rate-limit problem Flash was chosen to avoid

## Test Categories

### Backend (pytest)

| Test File | Category | What It Tests |
|-----------|----------|---------------|
| `test_engine.py` | Unit | Every calculator function with exact numeric assertions |
| `test_routes.py` | Integration | HTTP endpoints, status codes, auth boundaries, rate limiting |
| `test_ai_service.py` | Unit | AI narrative generation + 429/failure fallback path |
| `test_auth.py` | Unit | Token verification via PocketBase auth-refresh callback |

### Frontend (Vitest + jest-axe)

| Test File | Category | What It Tests |
|-----------|----------|---------------|
| `App.test.tsx` | Integration | App renders, skip link present, accessibility |
| `LandingPage.test.tsx` | Component | Renders, h1 heading, Fan Assistant CTA links to /assistant, axe scan |
| `FanAssistantPage.test.tsx` | Component | Renders without auth, aria-live region, language select label, axe scan |
| `LoginPage.test.tsx` | Component | h1 heading, email/password labels, signup link, axe scan |
| `ZoneCard.test.tsx` | Component | All 4 tiers render, aria-label, progressbar role, axe per tier |
| `StadiumPulse.test.tsx` | Component | Animated + static variants render, both aria-hidden, axe scans |
| `AccessibilityPanel.test.tsx` | Component | 16 venues, status text (not color-only), live badge, axe scans |
| `SustainabilityTracker.test.tsx` | Component | Empty + data states, honest metric labels, axe scans |
| `ResultsPanel.test.tsx` | Component | ARIA live regions, error alerts, data display |
| `CrowdDensityGauge.test.tsx` | Component | Visual gauge, role="img", aria-label |
| `FanAssistant.test.tsx` | Component | Floating overlay, language select, aria-live |
| `HistoryChart.test.tsx` | Component | Chart renders, axis labels |
| `ProtectedRoute.test.tsx` | Component | Redirects to /login when unauthed (Outlet API), renders content when authed |

## Mock Strategy

| External Service | Mock Location | What's Mocked |
|-----------------|---------------|---------------|
| Gemini AI | `backend/tests/conftest.py::mock_genai` | `google.genai` client — tests never hit live API |
| PocketBase | `backend/tests/conftest.py::mock_pocketbase` | `httpx` calls to PocketBase REST API |
| Auth | `backend/tests/conftest.py::mock_auth` | `get_current_user` returns fixed test user |
| PocketBase SDK | `frontend/tests/` | `pocketbase` module mocked in Vitest |
| Three.js / StadiumBowl3D | `frontend/tests/` | `StadiumBowl3D` lazy-import mocked with static div in LandingPage tests |
| Browser APIs | `frontend/tests/setup.ts` | `IntersectionObserver`, `ResizeObserver`, `scrollIntoView`, `URL.createObjectURL` |

## Coverage Targets

| Layer | Target | Enforcement |
|-------|--------|-------------|
| Backend | 85%+ | `pytest --cov-fail-under=85` in CI |
| Frontend | Component coverage | `vitest run` in CI |

## Coverage Exclusions

### StadiumBowl3D (`frontend/src/components/StadiumBowl3D.tsx`)
**Excluded from unit test coverage** — the Three.js WebGL scene requires a real browser context that jsdom cannot provide. Coverage for this component is deferred to:
- Manual visual QA in a real browser
- Future Playwright/Cypress E2E test with a WebGL-capable headless browser (`--headless=new` Chrome)

All surrounding logic (IntersectionObserver-based pause, static SVG fallback, lazy-load Suspense boundary) is tested via the LandingPage integration test.

## Running Tests

```bash
# Backend
cd backend
python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing -q

# Frontend
cd frontend
npm test
```

## Key Test Scenarios

### Auth Boundary (Most Critical)
- `POST /api/analyze` with no token → 401/422
- `POST /api/analyze` with valid mock token → 200
- Ensures auth-refresh verification works correctly

### Fan Assist Public Route (New)
- `POST /api/fan-assist` with no token → 200 (public endpoint)
- Rate limit applied: 5 req/min per IP
- Verified in `test_routes.py::test_fan_assist_unauthenticated`

### AI Fallback (Reliability)
- Gemini returns valid text → AI insights included
- Gemini raises 429 → fallback to engine output, `fallback_used: true`
- Gemini returns malformed response → graceful degradation

### Engine Correctness (Domain Accuracy)
- Crowd density boundary values: 1.9→safe, 2.0→moderate, 3.5→warning, 4.6→critical
- Evacuation time: exact formula verification against SGSA standard
- Accessibility: ADA 1% ratio calculation
- Composite grading: A+ through F scale

