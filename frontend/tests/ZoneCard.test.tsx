/**
 * Tests for ZoneCard.
 * Verifies: renders all 4 tiers without crash, label changes, axe scan per tier.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { ZoneCard } from '../src/components/ZoneCard';

const TIERS = ['safe', 'moderate', 'warning', 'critical'] as const;
const TIER_LABELS = { safe: 'Safe', moderate: 'Moderate', warning: 'Warning', critical: 'Critical' };

describe('ZoneCard', () => {
  it.each(TIERS)('renders tier "%s" without crashing', (tier) => {
    render(<ZoneCard zoneId='gate_a' density={2.5} tier={tier} />);
    expect(screen.getByText(TIER_LABELS[tier])).toBeDefined();
  });

  it('shows zone ID in article label', () => {
    render(<ZoneCard zoneId='gate_c' density={1.2} tier="safe" />);
    const article = screen.getByRole('article');
    expect(article.getAttribute('aria-label')).toMatch(/Zone gate_c/);
  });

  it('shows density value', () => {
    render(<ZoneCard zoneId='gate_a' density={3.75} tier="warning" />);
    expect(screen.getByText('3.75')).toBeDefined();
  });

  it('density bar has correct progressbar role', () => {
    render(<ZoneCard zoneId='gate_a' density={2.0} tier="moderate" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeDefined();
  });

  it.each(TIERS)('passes axe for tier "%s"', async (tier) => {
    const { container } = render(<ZoneCard zoneId='gate_a' density={2.0} tier={tier} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
