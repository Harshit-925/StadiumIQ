import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OverviewPanel } from '../src/components/OverviewPanel';
import { describe, it, expect } from 'vitest';

describe('OverviewPanel', () => {
  it('renders all tiles correctly', () => {
    render(
      <MemoryRouter>
        <OverviewPanel />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Stadium Overview')).toBeInTheDocument();
    expect(screen.getByText('Crowd Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Zone Navigation')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Emergency Triage')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Sustainability')).toBeInTheDocument();
  });
});
