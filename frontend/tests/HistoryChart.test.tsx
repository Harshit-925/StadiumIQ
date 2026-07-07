/**
 * Tests for HistoryChart.
 *
 * Key axis claims verified here:
 * - Accessibility: Table-view fallback gives screen-reader users the same data
 *   as the visual chart (plan §6 "Non-visual data access").
 * - Accessibility: Toggle button is keyboard-operable (plan §6 "Full keyboard navigation").
 * - Empty state renders without error.
 * - Passes axe in both chart and table modes.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryChart } from '../src/components/HistoryChart';
import { useAppStore } from '../src/store/useAppStore';
import type { HistoryEntry } from '../src/types';

// Stub recharts — jsdom doesn't render SVG layouts correctly
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    venue: 'MetLife Stadium',
    timestamp: new Date().toISOString(),
    average_density: 2.1,
    crowd_score: 78.0,
    overall_grade: 'C',
  },
  {
    id: '2',
    venue: 'SoFi Stadium',
    timestamp: new Date().toISOString(),
    average_density: 1.5,
    crowd_score: 91.0,
    overall_grade: 'A',
  },
];

describe('HistoryChart', () => {
  beforeEach(() => {
    useAppStore.setState({ history: [] });
  });

  describe('Empty state', () => {
    it('renders a "no history" message', () => {
      render(<HistoryChart />);
      expect(screen.getByText(/no history yet/i)).toBeInTheDocument();
    });

    it('passes axe in empty state', async () => {
      const { container } = render(<HistoryChart />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('With data', () => {
    beforeEach(() => {
      useAppStore.setState({ history: SAMPLE_HISTORY });
    });

    it('renders reading count', () => {
      render(<HistoryChart />);
      expect(screen.getByText(/2 readings/i)).toBeInTheDocument();
    });

    it('renders the table-view toggle button', () => {
      render(<HistoryChart />);
      const btn = screen.getByRole('button', { name: /table/i });
      expect(btn).toBeInTheDocument();
    });

    it('toggle button is keyboard-operable (Enter key)', async () => {
      const user = userEvent.setup();
      render(<HistoryChart />);
      const btn = screen.getByRole('button', { name: /table/i });
      btn.focus();
      await user.keyboard('{Enter}');
      // After pressing Enter, we should be in table mode
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('table view shows venue names — same data as chart', async () => {
      const user = userEvent.setup();
      render(<HistoryChart />);
      await user.click(screen.getByRole('button', { name: /table/i }));
      expect(screen.getByText('MetLife Stadium')).toBeInTheDocument();
      expect(screen.getByText('SoFi Stadium')).toBeInTheDocument();
    });

    it('table has a caption for screen readers', async () => {
      const user = userEvent.setup();
      render(<HistoryChart />);
      await user.click(screen.getByRole('button', { name: /table/i }));
      expect(screen.getByText(/analysis history data table/i)).toBeInTheDocument();
    });

    it('passes axe in chart mode', async () => {
      const { container } = render(<HistoryChart />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe in table mode', async () => {
      const user = userEvent.setup();
      const { container } = render(<HistoryChart />);
      await user.click(screen.getByRole('button', { name: /table/i }));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
