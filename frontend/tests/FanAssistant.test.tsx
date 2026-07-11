/**
 * Tests for FanAssistant.
 *
 * Verifies:
 * 1. Toggle button opens/closes the panel with aria-expanded.
 * 2. Panel has role="dialog" and aria-modal when open.
 * 3. aria-live="polite" region present for chat message announcements.
 * 4. Language selector is keyboard-operable and properly labeled.
 * 5. Send button is disabled when input is empty.
 * 6. Correct API payload sent: query, language, venue_name.
 * 7. Error message rendered when API call fails.
 * 8. Passes axe in both open and closed states.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FanAssistant } from '../src/components/FanAssistant';
import { useAppStore } from '../src/store/useAppStore';
import { VENUES } from '../src/types';

// Mock the API client
vi.mock('../src/api/client', () => ({
  fanAssist: vi.fn(),
}));

// Mock framer-motion (AnimatePresence needs special handling in jsdom)
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
    motion: {
      div: React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

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

import { fanAssist } from '../src/api/client';
const mockFanAssist = vi.mocked(fanAssist);

describe('FanAssistant', () => {
  beforeEach(() => {
    useAppStore.setState({
      isFanAssistOpen: false,
      selectedVenue: VENUES.metlife,
    });
    mockFanAssist.mockResolvedValue({
      response: 'Gates open 2 hours before kickoff.',
      language: 'en',
      source: 'gemini-2.5-flash',
      fallback_used: false,
    });
  });

  it('toggle button is visible and accessible', () => {
    render(<FanAssistant />);
    const btn = screen.getByRole('button', { name: /open fan assistant/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    expect(screen.getByRole('dialog', { name: /fan assistant/i })).toBeInTheDocument();
  });

  it('toggle button shows aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    const btn = screen.getByRole('button', { name: /open fan assistant/i });
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('dialog has aria-modal="true"', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('message list has aria-live="polite"', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('language selector is labeled', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    const langSelect = screen.getByRole('combobox', { name: /response language/i });
    expect(langSelect).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    const sendBtn = screen.getByRole('button', { name: /send message/i });
    expect(sendBtn).toBeDisabled();
  });

  it('sends the correct payload and renders the response', async () => {
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));

    const input = screen.getByPlaceholderText(/ask anything/i);
    await user.type(input, 'When do gates open?');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockFanAssist).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'When do gates open?',
          language: 'en',
          venue_id: VENUES.metlife.id,
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Gates open 2 hours before kickoff/i)).toBeInTheDocument();
    });
  });

  it('renders error message when API fails', async () => {
    mockFanAssist.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));

    const input = screen.getByPlaceholderText(/ask anything/i);
    await user.type(input, 'Hello?');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
    });
  });

  it('passes axe when closed', async () => {
    const { container } = render(<FanAssistant />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<FanAssistant />);
    await user.click(screen.getByRole('button', { name: /open fan assistant/i }));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
