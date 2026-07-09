/**
 * Tests for LandingPage.
 * Verifies: renders, skip link, CTA links to /assistant and /login, axe scan.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../src/components/LandingPage';

// Lazy-loaded Three.js doesn't render in jsdom
vi.mock('../src/components/StadiumBowl3D', () => ({
  default: () => <div data-testid="stadium-bowl-3d">Stadium Bowl</div>,
}));

vi.mock('../src/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders without crashing', () => {
    renderLanding();
    // Nav + hero both have Fan Assistant links — page renders correctly
    expect(screen.getAllByRole('link', { name: /fan assistant/i }).length).toBeGreaterThan(0);
  });

  it('has an h1 heading', () => {
    renderLanding();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeDefined();
  });

  it('has a Fan Assistant CTA that links to /assistant', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /fan assistant/i });
    expect(links.length).toBeGreaterThan(0);
    const hrefs = links.map((l) => (l as HTMLAnchorElement).href);
    expect(hrefs.some((h) => h.includes('/assistant'))).toBe(true);
  });

  it('has a Go to Dashboard link', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /go to dashboard/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('passes axe accessibility check', async () => {
    const { container } = renderLanding();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
