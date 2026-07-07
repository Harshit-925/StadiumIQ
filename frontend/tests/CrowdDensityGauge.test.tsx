/**
 * Tests for CrowdDensityGauge.
 *
 * Verifies:
 * 1. Correct density level labels (Safe / Moderate / Warning / Critical) render.
 * 2. The component never relies on colour alone — text/icon label always present.
 * 3. Passes axe WCAG 2.1 AA accessibility check.
 * 4. Handles boundary values correctly (1.99, 2.0, 3.5, 4.5, 4.6).
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { CrowdDensityGauge } from '../src/components/CrowdDensityGauge';

// Mock framer-motion to avoid animation timing issues in jsdom
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
    motion: {
      div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
      svg: ({ children, ...props }: React.ComponentProps<'svg'>) => <svg {...props}>{children}</svg>,
      circle: ({ children, ...props }: React.ComponentProps<'circle'>) => <circle {...props}>{children}</circle>,
      line: ({ children, ...props }: React.ComponentProps<'line'>) => <line {...props}>{children}</line>,
    },
  };
});

const CASES: Array<{ density: number; expectedLevel: string }> = [
  { density: 0.0, expectedLevel: 'Safe' },
  { density: 1.99, expectedLevel: 'Safe' },
  { density: 2.0, expectedLevel: 'Moderate' },
  { density: 3.49, expectedLevel: 'Moderate' },
  { density: 3.5, expectedLevel: 'Warning' },
  { density: 4.49, expectedLevel: 'Warning' },
  { density: 4.5, expectedLevel: 'Critical' },
  { density: 6.0, expectedLevel: 'Critical' },
];

describe('CrowdDensityGauge', () => {
  it.each(CASES)(
    'density $density → label "$expectedLevel"',
    ({ density, expectedLevel }) => {
      render(<CrowdDensityGauge density={density} />);
      // The component must render the level as text (not colour-only)
      expect(
        screen.getByText(new RegExp(expectedLevel, 'i')),
      ).toBeInTheDocument();
    },
  );

  it('displays the raw density value', () => {
    render(<CrowdDensityGauge density={2.75} />);
    expect(screen.getByText(/2\.75/)).toBeInTheDocument();
  });

  it('passes axe at Safe density', async () => {
    const { container } = render(<CrowdDensityGauge density={1.0} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe at Critical density', async () => {
    const { container } = render(<CrowdDensityGauge density={5.0} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders an action label — never colour-alone', () => {
    render(<CrowdDensityGauge density={5.0} />);
    // Some text describing the required action should be visible
    // (plan §6: "Never Color-Alone for safety-critical state")
    const el = screen.getByText(/critical/i);
    expect(el).toBeInTheDocument();
  });
});
