/**
 * SignupPage tests.
 *
 * Covers:
 * - Renders "Create Account" heading and subheading
 * - Renders the StadiumIQ logo wordmark
 * - Renders a link back to Sign In (/login)
 * - Renders a link to Fan Assistant (/assistant)
 * - Renders a link back to home (/)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SignupPage } from '../src/components/SignupPage';

// vi.mock calls must be top-level (vitest hoists them)
vi.mock('../src/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));

vi.mock('../src/components/SignupForm', () => ({
  SignupForm: () => <form data-testid="signup-form" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderSignupPage() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignupPage', () => {
  it('renders the Create Account heading', () => {
    renderSignupPage();
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeDefined();
  });

  it('renders the StadiumIQ wordmark', () => {
    renderSignupPage();
    expect(screen.getAllByText(/Stadium/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/IQ/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders the signup form', () => {
    renderSignupPage();
    expect(screen.getByTestId('signup-form')).toBeDefined();
  });

  it('renders a link to the login page', () => {
    renderSignupPage();
    const signInLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signInLink).toBeDefined();
    expect(signInLink.getAttribute('href')).toBe('/login');
  });

  it('renders a link to the Fan Assistant', () => {
    renderSignupPage();
    const fanLink = screen.getByRole('link', { name: /Fan Assistant/i });
    expect(fanLink).toBeDefined();
    expect(fanLink.getAttribute('href')).toBe('/assistant');
  });

  it('renders a back-to-home link', () => {
    renderSignupPage();
    const homeLink = screen.getByRole('link', { name: /Back to home/i });
    expect(homeLink).toBeDefined();
    expect(homeLink.getAttribute('href')).toBe('/');
  });
});
