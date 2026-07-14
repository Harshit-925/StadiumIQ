import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, Globe2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage, SupportedLanguage } from '../types';
import { LANGUAGE_LABELS } from '../types';
import { fanAssist } from '../api/client';
import {
  LANGUAGES,
  WELCOME_MESSAGES,
  INPUT_PLACEHOLDERS,
  HINT_TEXTS,
  ERROR_MESSAGES,
} from './chat/constants';
import { MessageBubble } from './chat/MessageBubble';

// Drawer slide-up animation (specific to the floating panel — not shared)
const DRAWER_VARIANTS = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 24, scale: 0.97 },
};

export const FanAssistant = memo(function FanAssistant() {
  const isOpen = useAppStore((s) => s.isFanAssistOpen);
  const toggle = useAppStore((s) => s.toggleFanAssist);
  const setFanAssistOpen = useAppStore((s) => s.setFanAssistOpen);
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const globalLanguage = useAppStore((s) => s.language);
  const setGlobalLanguage = useAppStore((s) => s.setLanguage);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGES[globalLanguage],
      language: globalLanguage,
      timestamp: new Date(),
    },
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'instant' : 'smooth' });
  }, [messages, shouldReduceMotion]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGES[globalLanguage],
      language: globalLanguage,
      timestamp: new Date(),
    }]);
  }, [globalLanguage]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        // Ignore clicks on the toggle button itself (toggle handles its own state)
        const toggleBtn = document.getElementById('fan-assistant-toggle');
        if (toggleBtn && toggleBtn.contains(event.target as Node)) {
          return;
        }
        setFanAssistOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setFanAssistOpen]);

  async function handleSend() {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      language: globalLanguage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const data = await fanAssist({
        query: trimmed,
        language: globalLanguage,
        venue_id: selectedVenue.id,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        language: data.language,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: ERROR_MESSAGES[globalLanguage],
        language: globalLanguage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
    <>
      {/* Floating action button */}
      <button
        id="fan-assistant-toggle"
        onClick={toggle}
        aria-label={isOpen ? 'Close fan assistant' : 'Open fan assistant'}
        aria-expanded={isOpen}
        aria-controls="fan-assistant-panel"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-stadium-blue shadow-lg shadow-stadium-blue/40 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" aria-hidden="true" />
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="fan-assistant-panel"
            ref={panelRef}
            role="dialog"
            aria-label="Fan assistant chat"
            aria-modal="true"
            initial={shouldReduceMotion ? { opacity: 0 } : DRAWER_VARIANTS.hidden}
            animate={shouldReduceMotion ? { opacity: 1 } : DRAWER_VARIANTS.visible}
            exit={shouldReduceMotion ? { opacity: 0 } : DRAWER_VARIANTS.exit}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="glass-surface fixed bottom-24 right-6 z-40 flex w-80 flex-col overflow-hidden sm:w-96"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-fifa-gold" aria-hidden="true" />
                <span className="text-sm font-semibold text-text-primary">Fan Assistant</span>
                <span className="rounded-pill bg-crowd-safe/20 px-2 py-0.5 text-xs text-crowd-safe">
                  Live
                </span>
              </div>

              {/* Language selector */}
              <div className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                <label htmlFor="fan-assist-lang" className="sr-only">
                  Response language
                </label>
                <select
                  id="fan-assist-lang"
                  value={globalLanguage}
                  onChange={(e) => setGlobalLanguage(e.target.value as SupportedLanguage)}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stadium-blue"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_LABELS[lang]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message list */}
            <div
              className="flex-1 space-y-4 overflow-y-auto p-4"
              role="list"
              aria-label="Chat messages"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions"
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2" role="status" aria-label="Thinking…">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                    <Loader2 className="h-4 w-4 animate-spin text-fifa-gold" aria-hidden="true" />
                  </div>
                  <span className="text-xs text-text-secondary">Thinking…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <label htmlFor="fan-assist-input" className="sr-only">
                  Ask a question
                </label>
                <input
                  id="fan-assist-input"
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={INPUT_PLACEHOLDERS[globalLanguage]}
                  maxLength={500}
                  disabled={isLoading}
                  aria-describedby="fan-assist-hint"
                  className="flex-1 rounded-input border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus-visible:border-stadium-blue focus-visible:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!query.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-input bg-stadium-blue text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stadium-blue focus-visible:ring-offset-1"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p id="fan-assist-hint" className="mt-1 text-xs text-text-secondary">
                {HINT_TEXTS[globalLanguage]} · {selectedVenue.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
