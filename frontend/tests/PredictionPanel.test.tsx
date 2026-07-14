import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PredictionPanel } from '../src/components/PredictionPanel';

describe('PredictionPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    window.fetch = global.fetch;
  });

  it('renders correctly and submits prediction request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        projected_density: 3.2,
        estimated_wait_minutes: 15,
        minutes_ahead: 15,
        methodology_note: 'Test methodology note'
      })
    });

    render(<PredictionPanel />);
    
    expect(screen.getByText('Crowd Trend Forecast')).toBeInTheDocument();
    
    const predictBtn = screen.getByText('Project Trend');
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText('3.20')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Test methodology note')).toBeInTheDocument();
    });
  });

  it('displays error message if not enough history provided', async () => {
    render(<PredictionPanel />);
    
    const input = screen.getByLabelText(/Historical Densities/i);
    fireEvent.change(input, { target: { value: '1.2' } }); // only 1 reading
    
    const predictBtn = screen.getByText('Project Trend');
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText('Enter at least 2 comma-separated density readings.')).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Failure'));

    render(<PredictionPanel />);
    
    // Default is '1.2, 1.5, 1.8, 2.1', which is valid (4 readings)
    const predictBtn = screen.getByText('Project Trend');
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText('API Failure')).toBeInTheDocument();
    });
  });
});
