# Performance Report — StadiumIQ

## Architecture Performance Characteristics

### Backend (FastAPI)
- **Async I/O**: All routes use `async/await` for non-blocking request handling
- **Pure engine**: `calculator.py` is CPU-only (no I/O) — sub-millisecond for all computations
- **AI caching**: 60-second in-memory cache on insight generation to minimize Gemini API calls

### Frontend (Vite + React 18)
- **Tree-shaking**: Vite automatically eliminates dead code in production builds
- **Code splitting**: Dynamic imports for heavy components
- **Memoized components**: React.memo on expensive render paths
- **Efficient animations**: Only `transform` and `opacity` animated (GPU-composited, no reflow)

## Bundle Optimization

| Technique | Implementation |
|-----------|----------------|
| Tree-shaking | Vite production build with ESM |
| CSS purging | Tailwind JIT purges unused styles |
| Font optimization | Google Fonts with `display=swap` (no FOIT) |
| Image format | SVG icons (Lucide) — no raster assets |
| Lazy loading | `React.lazy()` for below-fold components |

## Runtime Performance

| Metric | Target | Approach |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | Critical CSS inlined, fonts preloaded |
| Largest Contentful Paint | < 2.5s | No large images; SVG + CSS-only design |
| Cumulative Layout Shift | < 0.1 | Reserved space for async content |
| Total Blocking Time | < 200ms | Async routes, no heavy JS on main thread |

## Rate Limiting as Performance Guard

| Route | Limit | Purpose |
|-------|-------|---------|
| `/api/analyze` | 10/min | Prevents Gemini API throttling cascade |
| `/api/fan-assist` | 10/min | Prevents Gemini API throttling cascade |
| Reads | 60/min | Prevents database overload |

## Logging & Observability

- **Structured JSON logging**: Every request logged with method, path, status, duration, request_id
- **Request ID**: UUID per request, echoed as `X-Request-Id` header for distributed tracing
- **AI monitoring**: Every fallback event logged with reason and duration
- **Rate limit monitoring**: Every 429 response logged for capacity planning

## Supabase Efficiency

- **Managed cloud database**: Supabase runs PostgreSQL on dedicated infra — no overhead of managing a local database process
- **Row-Level Security**: Authorization enforced at the DB layer, not the application layer — efficient and tamper-proof
- **Anon key / service key separation**: Frontend uses the rate-limited anon key; sensitive writes go through the backend service role key only
