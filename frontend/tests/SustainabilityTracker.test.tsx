/**
 * Tests for SustainabilityTracker.
 * Verifies: renders in empty state, renders with analysis data, mono values present, axe scan.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SustainabilityTracker } from '../src/components/SustainabilityTracker';
import { useAppStore } from '../src/store/useAppStore';

vi.mock('../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const MOCK_RESULT = {
  venue: 'MetLife Stadium',
  timestamp: new Date().toISOString(),
  overall_grade: 'B',
  crowd_score: 72,
  average_density: 3.1,
  zone_analyses: [],
  evacuation_time_minutes: 7.5,
  evacuation_feasible: true,
  accessibility_compliance: true,
  wheelchair_ratio: 0.009,
  sustainability_score: 72.2,
  recycling_rate: 0.65,
  ai_insights: 'Moderate conditions.',
  ai_fallback: false,
};

describe('SustainabilityTracker', () => {
  beforeEach(() => {
    useAppStore.setState({ analysisResult: null });
  });

  it('renders in empty state without analysis', () => {
    render(<SustainabilityTracker />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    // Empty state message
    expect(screen.getAllByText(/Not tracked in current analysis/i).length).toBeGreaterThan(0);
  });

  it('renders with analysis data', () => {
    useAppStore.setState({ analysisResult: MOCK_RESULT });
    render(<SustainabilityTracker />);
    // Should show recycling rate value (65.0%)
    expect(screen.getByText('65.0')).toBeDefined();
  });

  it('shows EPA diversion target in description', () => {
    render(<SustainabilityTracker />);
    // Text appears in waste panel description (and possibly benchmark text) — at least one element
    expect(screen.getAllByText(/EPA 90% diversion target/i).length).toBeGreaterThan(0);
  });

  it('passes axe in empty state', async () => {
    const { container } = render(<SustainabilityTracker />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with analysis data', async () => {
    useAppStore.setState({ analysisResult: MOCK_RESULT });
    const { container } = render(<SustainabilityTracker />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
