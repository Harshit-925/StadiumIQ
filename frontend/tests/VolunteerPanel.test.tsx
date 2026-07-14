import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VolunteerPanel } from '../src/components/VolunteerPanel';

describe('VolunteerPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    window.fetch = global.fetch; // Ensure window.fetch is also mocked
  });

  it('renders correctly and submits allocation request', async () => {
    const mockData = {
      allocations: { gate_a: 10, gate_b: 5 },
      relocations: [
        { from_zone: 'gate_b', to_zone: 'gate_a', count: 2 }
      ],
      total_allocated: 15
    };
    (global.fetch as any).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData)
    }));

    render(<VolunteerPanel />);
    
    expect(screen.getByText('Volunteer Management')).toBeInTheDocument();
    
    const allocateBtn = screen.getByText('Run Allocation');
    fireEvent.click(allocateBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getAllByText(/Allocations/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/15 total assigned/i)).toBeInTheDocument();
      // Check allocations
      expect(screen.getAllByText('Gate B').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Gate A').length).toBeGreaterThan(0);
      expect(screen.getByText('2 volunteers')).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

    render(<VolunteerPanel />);
    
    const allocateBtn = screen.getByText('Run Allocation');
    fireEvent.click(allocateBtn);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });

  it('passes axe accessibility check on initial render', async () => {
    const { container } = render(<VolunteerPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe accessibility check with results displayed', async () => {
    const mockData = {
      allocations: { gate_a: 10, gate_b: 5 },
      relocations: [
        { from_zone: 'gate_b', to_zone: 'gate_a', count: 2 }
      ],
      total_allocated: 15
    };
    (global.fetch as any).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData)
    }));

    const { container } = render(<VolunteerPanel />);
    fireEvent.click(screen.getByText('Run Allocation'));

    await waitFor(() => {
      expect(screen.getAllByText(/Allocations/i).length).toBeGreaterThan(0);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
