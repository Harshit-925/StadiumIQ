import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransportPanel } from '../src/components/TransportPanel';
import { describe, it, expect, vi } from 'vitest';
import { getTransportOptions } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  getTransportOptions: vi.fn(),
}));

describe('TransportPanel', () => {
  it('renders and fetches options', async () => {
    (getTransportOptions as any).mockResolvedValueOnce({
      parking: [
        { id: '1', name: 'Lot A', capacity: 100, occupancy_pct: 50, walk_time_mins: 5, accessible_spaces: 10, status: 'Open' }
      ],
      transit: [
        { id: 't1', name: 'Bus 42', type: 'Bus', frequency_mins: 15, crowd_level: 'Low', accessible: true, status: 'On Time' }
      ],
    });

    render(<TransportPanel />);
    
    expect(screen.getByText('Transport Options')).toBeInTheDocument();
    
    const fetchBtn = screen.getByText('Refresh');
    fireEvent.click(fetchBtn);

    await waitFor(() => {
      expect(screen.getByText('Lot A')).toBeInTheDocument();
      expect(screen.getByText('Bus 42')).toBeInTheDocument();
    });
  });
});
