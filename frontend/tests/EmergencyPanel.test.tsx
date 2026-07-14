import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
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

  it('passes axe accessibility check on initial render', async () => {
    const { container } = render(<EmergencyPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe accessibility check with results displayed', async () => {
    (triageIncident as any).mockResolvedValueOnce({
      priority_level: 'Critical',
      action_plan: ['Dispatch team'],
      requires_police: true,
      requires_medical: true,
      ai_brief: 'Brief here',
    });

    const { container } = render(<EmergencyPanel />);
    fireEvent.click(screen.getByText('Generate Action Plan'));

    await waitFor(() => {
      expect(screen.getByText('Critical Priority')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
