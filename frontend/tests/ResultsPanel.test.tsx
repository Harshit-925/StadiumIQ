/**
 * Tests for ResultsPanel.
 *
 * Verifies:
 * 1. Empty state renders placeholder (no crash).
 * 2. Loading state renders skeleton without aria violations.
 * 3. Error state renders with role="alert".
 * 4. Full result renders all expected data sections.
 * 5. aria-live="polite" region present for screen-reader announcements.
 * 6. Passes axe WCAG 2.1 AA for all three states.
 * 7. AI fallback badge is visible when fallback_used=true.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResultsPanel } from '../src/components/ResultsPanel';
import { useAppStore } from '../src/store/useAppStore';
import type { VenueAnalysisResponse } from '../src/types';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
    motion: {
      div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    },
  };
});

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

const SAMPLE_RESULT: VenueAnalysisResponse = {
  venue: 'MetLife Stadium',
  timestamp: new Date().toISOString(),
  overall_grade: 'B',
  crowd_score: 82.5,
  average_density: 1.8,
  zone_analyses: [
    { zone_id: 1, density: 1.5, classification: { level: 'safe', description: 'Free movement', action_required: false, color: 'green' } },
    { zone_id: 2, density: 2.3, classification: { level: 'moderate', description: 'Restricted', action_required: false, color: 'yellow' } },
  ],
  evacuation_time_minutes: 22.4,
  evacuation_feasible: false,
  accessibility_compliance: true,
  wheelchair_ratio: 0.0109,
  sustainability_score: 72.0,
  recycling_rate: 0.65,
  ai_insights: 'Operations are within acceptable parameters.',
  ai_fallback: false,
  route_recommendation: {
    recommended_zone_index: 0,
    recommended_zone_density: 1.5,
    reason: 'The entry gate with the lowest current density (1.50 pax/m²) — recommended route for entry, exit, or transport connections.',
  },
};

function resetStore() {
  useAppStore.setState({
    analysisResult: null,
    isLoading: false,
    error: null,
  });
}

describe('ResultsPanel', () => {
  beforeEach(resetStore);

  describe('Empty state', () => {
    it('renders placeholder text when no result', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/select a venue/i)).toBeInTheDocument();
    });

    it('passes axe in empty state', async () => {
      const { container } = render(<ResultsPanel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading state', () => {
    it('renders skeleton with role=status', () => {
      useAppStore.setState({ isLoading: true });
      render(<ResultsPanel />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('passes axe in loading state', async () => {
      useAppStore.setState({ isLoading: true });
      const { container } = render(<ResultsPanel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Error state', () => {
    it('renders error with role=alert', () => {
      useAppStore.setState({ error: 'Analysis failed. Please retry.' });
      render(<ResultsPanel />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
    });

    it('passes axe in error state', async () => {
      useAppStore.setState({ error: 'Analysis failed. Please retry.' });
      const { container } = render(<ResultsPanel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Results state', () => {
    beforeEach(() => {
      useAppStore.setState({ analysisResult: SAMPLE_RESULT });
    });

    it('renders the overall grade', () => {
      render(<ResultsPanel />);
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('renders zone analyses', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/Zone 1/)).toBeInTheDocument();
      expect(screen.getByText(/Zone 2/)).toBeInTheDocument();
    });

    it('shows evacuation time', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/22\.4/)).toBeInTheDocument();
    });

    it('shows evacuation status as text — not colour alone', () => {
      render(<ResultsPanel />);
      // Colour + text both present for colorblind users
      expect(screen.getByText(/exceeds safe limits/i)).toBeInTheDocument();
    });

    it('shows accessibility compliance as text', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/ADA compliant/i)).toBeInTheDocument();
    });

    it('renders AI insights section', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/AI Insights/i)).toBeInTheDocument();
      expect(screen.getByText(/acceptable parameters/i)).toBeInTheDocument();
    });

    it('renders route recommendation', () => {
      render(<ResultsPanel />);
      expect(screen.getByText(/Route Recommendation/i)).toBeInTheDocument();
      expect(screen.getByText(/The entry gate with the lowest current density/i)).toBeInTheDocument();
    });

    it('has aria-live="polite" for screen-reader announcements', () => {
      render(<ResultsPanel />);
      // The plan §6 requires aria-live updates for crowd status changes
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });

    it('passes axe in results state', async () => {
      const { container } = render(<ResultsPanel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AI fallback state', () => {
    it('shows fallback badge when ai_fallback=true', () => {
      useAppStore.setState({
        analysisResult: { ...SAMPLE_RESULT, ai_fallback: true },
      });
      render(<ResultsPanel />);
      expect(screen.getByText(/fallback/i)).toBeInTheDocument();
    });
  });
});
