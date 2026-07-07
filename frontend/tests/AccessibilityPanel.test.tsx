/**
 * Tests for AccessibilityPanel.
 * Verifies: renders without analysis (static VENUES list), renders with analysis,
 * compliance status uses text+color not color alone, axe scan.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccessibilityPanel } from '../src/components/AccessibilityPanel';
import { useAppStore } from '../src/store/useAppStore';

vi.mock('../src/api/pocketbase', () => ({
  pb: { authStore: { isValid: false, model: null, token: '', clear: vi.fn(), onChange: vi.fn() } },
}));

const MOCK_RESULT = {
  venue: 'MetLife Stadium',
  timestamp: new Date().toISOString(),
  overall_grade: 'A',
  crowd_score: 85,
  average_density: 2.1,
  zone_analyses: [],
  evacuation_time_minutes: 6.2,
  evacuation_feasible: true,
  accessibility_compliance: true,
  wheelchair_ratio: 0.012,
  sustainability_score: 78,
  recycling_rate: 0.82,
  ai_insights: 'Good conditions.',
  ai_fallback: false,
};

describe('AccessibilityPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ analysisResult: null });
  });

  it('renders all 16 venues without analysis data', () => {
    render(<AccessibilityPanel />);
    expect(screen.getByText('MetLife Stadium')).toBeDefined();
    expect(screen.getByText('Estadio Azteca')).toBeDefined();
    expect(screen.getByText('BC Place')).toBeDefined();
  });

  it('renders compliance status text (not color alone)', () => {
    render(<AccessibilityPanel />);
    // Status MUST be conveyed in text, not only via color
    const compliant = screen.getAllByText(/ADA Compliant|Below Threshold/i);
    expect(compliant.length).toBeGreaterThan(0);
  });

  it('renders live badge when analysis result is present', () => {
    useAppStore.setState({ analysisResult: MOCK_RESULT });
    render(<AccessibilityPanel />);
    expect(screen.getByText('Live')).toBeDefined();
  });

  it('passes axe without analysis', async () => {
    const { container } = render(<AccessibilityPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with analysis result', async () => {
    useAppStore.setState({ analysisResult: MOCK_RESULT });
    const { container } = render(<AccessibilityPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
