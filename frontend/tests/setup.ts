/**
 * Vitest global test setup.
 *
 * - Imports jest-dom matchers so tests can use `.toBeInTheDocument()` etc.
 * - Configures jest-axe so all components can be checked for a11y violations.
 * - Stubs browser APIs that jsdom doesn't implement.
 */
import '@testing-library/jest-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Register jest-axe custom matcher with Vitest's expect.
// Without this, `expect(results).toHaveNoViolations()` throws
// "Invalid Chai property: toHaveNoViolations".
expect.extend(toHaveNoViolations);

// Run @testing-library cleanup after every test
afterEach(() => {
  cleanup();
});

// Configure axe — enable WCAG 2.1 AA rules globally
configureAxe({
  rules: {
    // Best-practice rules promoted to violations for our purposes
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'aria-allowed-attr': { enabled: true },
  },
});

// Stub window.URL.createObjectURL (not implemented in jsdom)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Stub HTMLElement.scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Stub IntersectionObserver — required by framer-motion useInView
// and any component that uses scroll-triggered animations.
global.IntersectionObserver = vi.fn().mockImplementation(
  (_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) => ({
    root: null,
    rootMargin: '0px',
    thresholds: [],
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => [] as IntersectionObserverEntry[]),
  }),
) as unknown as typeof IntersectionObserver;

// Stub ResizeObserver — required by some Recharts / animation internals
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

