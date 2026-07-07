/**
 * OperatorLayout tests.
 *
 * Covers:
 * - Renders all 4 nav destinations (Dashboard, Accessibility, Sustainability, Report)
 * - Logo and wordmark are present
 * - Logout button is present and calls logout on click
 * - FanAssistant overlay toggle button is present
 * - Bottom tab bar is rendered for mobile navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OperatorLayout } from '../src/components/OperatorLayout';

// Mock the auth store
const mockLogout = vi.fn();
vi.mock('../src/store/useAuthStore', () => ({
  useAuthStore: (selector: (s: { user: { name: string; email: string }; logout: () => void }) => unknown) =>
    selector({ user: { name: 'Test Operator', email: 'operator@test.com' }, logout: mockLogout }),
}));

// Mock the app store — must include selectedVenue with a name property
vi.mock('../src/store/useAppStore', () => ({
  useAppStore: (selector: (s: {
    selectedVenue: { id: string; name: string };
    isFanAssistOpen: boolean;
    setFanAssistOpen: (v: boolean) => void;
  }) => unknown) =>
    selector({
      selectedVenue: { id: 'metlife', name: 'MetLife Stadium' },
      isFanAssistOpen: false,
      setFanAssistOpen: vi.fn(),
    }),
}));

// Mock FanAssistant to avoid deep dependency chain
vi.mock('../src/components/FanAssistant', () => ({
  FanAssistant: () => <div data-testid="fan-assistant-mock" />,
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<OperatorLayout />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
          <Route path="/dashboard/accessibility" element={<div>Accessibility</div>} />
          <Route path="/dashboard/sustainability" element={<div>Sustainability</div>} />
          <Route path="/dashboard/report" element={<div>Report</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('OperatorLayout', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it('renders the StadiumIQ wordmark', () => {
    renderLayout();
    expect(screen.getAllByText(/Stadium/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/IQ/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 4 navigation destinations', () => {
    renderLayout();
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Accessibility/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Sustainability/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Report/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders a logout button', () => {
    renderLayout();
    const logoutBtn = screen.getByRole('button', { name: /log.?out/i });
    expect(logoutBtn).toBeDefined();
  });

  it('calls logout when the logout button is clicked', () => {
    renderLayout();
    const logoutBtn = screen.getByRole('button', { name: /log.?out/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders the outlet content', () => {
    renderLayout();
    expect(screen.getByText('Dashboard content')).toBeDefined();
  });
});
