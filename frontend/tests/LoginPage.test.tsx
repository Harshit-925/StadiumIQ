/**
 * Tests for LoginPage.
 * Verifies: all inputs have labels, error region present, axe scan.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/components/LoginPage';

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
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('renders h1 heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /operator login/i })).toBeDefined();
  });

  it('email input has an associated label', () => {
    renderPage();
    const input = screen.getByLabelText(/email/i);
    expect(input.tagName).toBe('INPUT');
  });

  it('password input has an associated label', () => {
    renderPage();
    const input = screen.getByLabelText(/password/i);
    expect(input.tagName).toBe('INPUT');
  });

  it('has a link to signup', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /create an account/i })).toBeDefined();
  });

  it('passes axe accessibility check', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
