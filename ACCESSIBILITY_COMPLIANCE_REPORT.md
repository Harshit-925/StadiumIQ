# Accessibility Compliance Report — StadiumIQ

## Standard: WCAG 2.1 Level AA

StadiumIQ is designed and tested against WCAG 2.1 AA success criteria.

## Automated Testing

- **Tool**: `jest-axe` integrated into Vitest test suite
- **Target**: Zero violations on every component
- **CI Enforcement**: Tests run on every push via `.github/workflows/ci.yml`

## Checklist

### Perceivable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.1.1 Non-text Content | ✅ Pass | All images have `alt` text; chart has `role="img"` + `aria-label` |
| 1.3.1 Info and Relationships | ✅ Pass | Semantic HTML5 elements; proper heading hierarchy (h1→h2→h3) |
| 1.3.2 Meaningful Sequence | ✅ Pass | DOM order matches visual order |
| 1.4.1 Use of Color | ✅ Pass | Color never sole indicator — icons/text accompany all status colors |
| 1.4.3 Contrast (Minimum) | ✅ Pass | All text meets 4.5:1 ratio; tested in dark mode |
| 1.4.11 Non-text Contrast | ✅ Pass | UI components meet 3:1 against adjacent colors |

### Operable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.1.1 Keyboard | ✅ Pass | All interactive elements keyboard accessible |
| 2.1.2 No Keyboard Trap | ✅ Pass | Vaul drawer closes on Escape; focus returns to trigger |
| 2.4.1 Bypass Blocks | ✅ Pass | "Skip to main content" link in `App.tsx` |
| 2.4.2 Page Titled | ✅ Pass | Descriptive `<title>` in `index.html` |
| 2.4.3 Focus Order | ✅ Pass | Logical tab order follows visual layout |
| 2.4.6 Headings and Labels | ✅ Pass | Descriptive headings; all form inputs have labels |
| 2.4.7 Focus Visible | ✅ Pass | Focus rings preserved on all interactive elements |

### Understandable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 3.1.1 Language of Page | ✅ Pass | `lang="en"` on `<html>` |
| 3.2.1 On Focus | ✅ Pass | No context change on focus |
| 3.3.1 Error Identification | ✅ Pass | Errors via `role="alert"` + `toast.error()` |
| 3.3.2 Labels or Instructions | ✅ Pass | All inputs have visible labels; required fields marked |

### Robust

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 4.1.2 Name, Role, Value | ✅ Pass | ARIA attributes on all dynamic content |
| 4.1.3 Status Messages | ✅ Pass | `aria-live="polite"` on results; `aria-live="assertive"` on errors |

## Component-Specific Accessibility

| Component | Features |
|-----------|----------|
| `App.tsx` | Skip link, single `<main>`, heading hierarchy |
| `ResultsPanel.tsx` | `aria-live="polite"`, `role="alert"` for errors |
| `CrowdDensityGauge.tsx` | `role="img"` with descriptive `aria-label` |
| `HistoryChart.tsx` | Visually-hidden `<table>` fallback for screen readers |
| `GoalTracker.tsx` | `role="progressbar"` with `aria-valuenow/min/max` |
| `InputForm.tsx` | `label htmlFor`, `aria-describedby`, `aria-required` |
| `LoginForm.tsx` | `aria-busy` on submit, error `role="alert"` |
| `FanAssistant.tsx` | Keyboard close (Escape), `aria-label` on all controls |
| `LandingHero.tsx` | `prefers-reduced-motion` respected; static gradient fallback |

## Motion Accessibility

- All animations respect `prefers-reduced-motion: reduce`
- CSS custom property `--motion-duration` set to `0s` when reduced motion preferred
- Framer Motion checks `useReducedMotion()` hook
- Ambient gradient layer uses static fallback (no drift animation)
