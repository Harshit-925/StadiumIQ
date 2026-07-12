import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyPanel } from '../src/components/EmergencyPanel';
import { describe, it, expect, vi } from 'vitest';
import { triageIncident } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  triageIncident: vi.fn(),
}));

describe('EmergencyPanel', () => {
  it('renders the form and submits correctly', async () => {
    (triageIncident as any).mockResolvedValueOnce({
      priority_level: 'Critical',
      action_plan: ['Dispatch team'],
      requires_police: true,
      requires_medical: true,
      ai_brief: 'Brief here',
    });

    render(<EmergencyPanel />);
    
    expect(screen.getByText('Emergency Triage')).toBeInTheDocument();
    
    const submitBtn = screen.getByText('Generate Action Plan');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Critical Priority')).toBeInTheDocument();
      expect(screen.getByText('Law Enforcement Required')).toBeInTheDocument();
      expect(screen.getByText('Medical Required')).toBeInTheDocument();
      expect(screen.getByText('Brief here')).toBeInTheDocument();
      expect(screen.getByText('Dispatch team')).toBeInTheDocument();
    });
  });
});
