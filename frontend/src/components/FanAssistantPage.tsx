/**
 * FanAssistantPage — Public fan-facing full-page chat experience.
 *
 * Route: /assistant (PUBLIC — no login required)
 *
 * Reuses fanAssist() from api/client.ts. The backend endpoint now allows
 * unauthenticated access (5 req/min per IP rate limit).
 *
 * Warm, welcoming tone distinct from the operator dashboard.
 */
import { useState, useRef, useEffect, memo } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  Globe2,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatMessage, SupportedLanguage } from '../types';
import { LANGUAGE_LABELS, VENUES } from '../types';
import { fanAssist } from '../api/client';
import {
  LANGUAGES,
  WELCOME_MESSAGES,
  INPUT_PLACEHOLDERS,
  HINT_TEXTS,
  ERROR_MESSAGES,
} from './chat/constants';
import { MessageBubble } from './chat/MessageBubble';



export const FanAssistantPage = memo(function FanAssistantPage() {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('metlife');
  const shouldReduceMotion = useReducedMotion() ?? false;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGES.en,
      language: 'en',
      timestamp: new Date(),
    },
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGES[language],
      language,
      timestamp: new Date(),
    }]);
  }, [language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'instant' : 'smooth',
    });
  }, [messages, shouldReduceMotion]);

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  async function handleSend() {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      language,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const data = await fanAssist({
        query: trimmed,
        language,
        venue_id: selectedVenueId,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          language: data.language,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: ERROR_MESSAGES[language],
          language,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-bg">
      {/* ── Top Nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-body-sm text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Back to StadiumIQ home"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>StadiumIQ</span>
          </Link>

          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-stadium-green" aria-hidden="true" />
            <h1 className="text-heading-sm text-text-primary">Fan Assistant</h1>
            <span className="flex items-center gap-1 rounded-pill bg-stadium-green/10 px-2.5 py-0.5 text-label-sm text-stadium-green">
              <span className="status-dot-live" aria-hidden="true" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            <label htmlFor="fan-page-lang" className="sr-only">
              Response language
            </label>
            <select
              id="fan-page-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="rounded-input border border-gray-200 bg-surface px-2 py-1 text-body-sm text-text-primary focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Chat Area ────────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="flex flex-1 flex-col"
        aria-label="Fan assistant chat"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
          {/* Venue selector */}
          <div className="mb-4 mt-4">
            <label htmlFor="fan-page-venue" className="sr-only">
              Select venue for context
            </label>
            <select
              id="fan-page-venue"
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="w-full rounded-input border border-gray-200 bg-surface px-3 py-2 text-body-sm text-text-primary focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
              aria-label="Select venue for fan assistant context"
            >
              {Object.values(VENUES).map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} — {venue.city}
                </option>
              ))}
            </select>
          </div>

          {/* Message list */}
          <div
            className="flex-1 space-y-4 overflow-y-auto py-4"
            role="list"
            aria-label="Chat messages"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </AnimatePresence>

            {isLoading && (
              <div
                className="flex items-center gap-2"
                role="status"
                aria-label="Assistant is thinking…"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stadium-green/10">
                  <Loader2
                    className="h-4 w-4 animate-spin text-stadium-green"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-body-sm text-text-secondary">
                  Thinking…
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      {/* ── Input Area ───────────────────────────────────────────────── */}
      <div className="sticky bottom-0 border-t border-gray-200 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <label htmlFor="fan-page-input" className="sr-only">
              Ask a question about the World Cup
            </label>
            <div className="relative flex-1">
              <MessageCircle
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
              <input
                id="fan-page-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={INPUT_PLACEHOLDERS[language]}
                maxLength={500}
                disabled={isLoading}
                aria-describedby="fan-page-hint"
                className="form-input !pl-10 pr-4"
              />
            </div>
            <button
              onClick={() => void handleSend()}
              disabled={!query.trim() || isLoading}
              aria-label="Send message"
              className="btn-primary flex-shrink-0 rounded-input px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p id="fan-page-hint" className="mt-1.5 text-label-sm text-text-secondary">
            {HINT_TEXTS[language]}
          </p>
        </div>
      </div>
    </div>
  );
});

export default FanAssistantPage;
