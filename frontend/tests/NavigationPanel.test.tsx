import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { NavigationPanel } from '../src/components/NavigationPanel';
import { describe, it, expect, vi } from 'vitest';
import { navigateVenue } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  navigateVenue: vi.fn(),
}));

describe('NavigationPanel', () => {
  it('renders and fetches navigation', async () => {
    (navigateVenue as any).mockResolvedValueOnce({
      total_minutes: 15,
      route: ['gate_a', 'concourse_north'],
      accessible_path: true,
      narrative: 'Narrative here',
      steps: [
        { instruction: 'Go straight', minutes: 5, accessible: true, zone_type: 'gate' }
      ]
    });

    render(<NavigationPanel />);
    
    expect(screen.getByText('Zone Navigation')).toBeInTheDocument();
    
    const fetchBtn = screen.getByText('Calculate Route');
    fireEvent.click(fetchBtn);

    await waitFor(() => {
      expect(screen.getByText('Narrative here')).toBeInTheDocument();
      expect(screen.getByText(/15\s*min/i)).toBeInTheDocument();
      expect(screen.getByText('Go straight')).toBeInTheDocument();
    });
  });

  it('passes axe accessibility check on initial render', async () => {
    const { container } = render(<NavigationPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe accessibility check with results displayed', async () => {
    (navigateVenue as any).mockResolvedValueOnce({
      total_minutes: 15,
      route: ['gate_a', 'concourse_north'],
      accessible_path: true,
      narrative: 'Narrative here',
      steps: [
        { instruction: 'Go straight', minutes: 5, accessible: true, zone_type: 'gate' }
      ]
    });

    const { container } = render(<NavigationPanel />);
    fireEvent.click(screen.getByText('Calculate Route'));

    await waitFor(() => {
      expect(screen.getByText('Narrative here')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
