/**
 * Tests for FanAssistantPage.
 * Verifies: renders without auth, aria-live on message list, language select has label, axe scan.
 */
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FanAssistantPage } from '../src/components/FanAssistantPage';

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

vi.mock('../src/api/client', () => ({
  fanAssist: vi.fn().mockResolvedValue({ response: 'Test response', language: 'en', source: 'gemini', fallback_used: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <FanAssistantPage />
    </MemoryRouter>,
  );
}

describe('FanAssistantPage', () => {
  it('renders without authentication', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /fan assistant/i })).toBeDefined();
  });

  it('has an aria-live polite region on the message list', () => {
    renderPage();
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('language selector has an accessible label', () => {
    renderPage();
    const select = screen.getByLabelText(/response language/i);
    expect(select).toBeDefined();
    expect(select.tagName).toBe('SELECT');
  });

  it('shows welcome message on load', () => {
    renderPage();
    expect(screen.getByText(/FIFA World Cup 2026/i)).toBeDefined();
  });

  it('chat input has accessible label', () => {
    renderPage();
    const input = screen.getByLabelText(/ask a question/i);
    expect(input).toBeDefined();
  });

  it('passes axe accessibility check', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
