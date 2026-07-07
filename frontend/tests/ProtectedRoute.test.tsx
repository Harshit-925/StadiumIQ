/**
 * Tests for ProtectedRoute.
 *
 * ProtectedRoute now uses React Router v6's <Outlet /> pattern (layout route).
 * Tests wrap it in <MemoryRouter> with <Routes> to simulate navigation.
 *
 * Verifies that:
 * 1. Unauthenticated users are redirected to /login.
 * 2. Authenticated users see the outlet content.
 * 3. The component passes axe accessibility checks.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock pocketbase so tests don't need a live server
vi.mock('../src/api/pocketbase', () => ({
  pb: {
    authStore: {
      isValid: false,
      model: null,
      token: '',
      clear: vi.fn(),
      onChange: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div data-testid="secret">Secret content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('redirects to /login when unauthenticated', () => {
    renderWithRouter('/dashboard');
    // User is redirected — the login page should be rendered, not the secret content
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders outlet content when authenticated', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderWithRouter('/dashboard');
    expect(screen.getByTestId('secret')).toBeInTheDocument();
  });

  it('passes axe accessibility check when rendering outlet content', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <main>
                  <h1>Dashboard</h1>
                  <p>Content</p>
                </main>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
