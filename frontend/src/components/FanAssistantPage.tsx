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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User,
  Globe2,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatMessage, SupportedLanguage } from '../types';
import { LANGUAGE_LABELS, VENUES } from '../types';
import { fanAssist } from '../api/client';

const LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'pt', 'ja'];

const BUBBLE_VARIANTS = {
  hidden:  { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const WELCOME_MESSAGES: Record<SupportedLanguage, string> = {
  en: "Hello! I'm your FIFA World Cup 2026 assistant. Ask me anything about venues, match schedules, transport, accessibility, or facilities.",
  es: '¡Hola! Soy tu asistente para la Copa Mundial FIFA 2026. Pregúntame sobre estadios, horarios, transporte o accesibilidad.',
  fr: 'Bonjour ! Je suis votre assistant pour la Coupe du Monde FIFA 2026. Posez-moi toutes vos questions sur les stades, horaires et transports.',
  de: 'Hallo! Ich bin Ihr Assistent für die FIFA Weltmeisterschaft 2026. Fragen Sie mich nach Stadien, Spielplänen oder Transport.',
  pt: 'Olá! Sou seu assistente para a Copa do Mundo FIFA 2026. Pergunte sobre estádios, horários de jogos, transporte e acessibilidade.',
  ja: 'こんにちは！FIFA ワールドカップ 2026 のアシスタントです。会場、試合スケジュール、交通機関についてお気軽にどうぞ。',
};

const INPUT_PLACEHOLDERS: Record<SupportedLanguage, string> = {
  en: "Ask about venues, schedules, transport…",
  es: "Pregunte sobre estadios, horarios, transporte…",
  fr: "Demandez sur les stades, horaires, transports…",
  de: "Fragen Sie nach Stadien, Spielplänen, Transport…",
  pt: "Pergunte sobre estádios, horários, transporte…",
  ja: "会場、スケジュール、交通機関について聞く…"
};

const HINT_TEXTS: Record<SupportedLanguage, string> = {
  en: "Press Enter to send · No login required · 5 requests per minute",
  es: "Presione Enter para enviar · No requiere inicio de sesión · 5 solicitudes por minuto",
  fr: "Appuyez sur Entrée pour envoyer · Aucune connexion requise · 5 requêtes par minute",
  de: "Drücken Sie die Eingabetaste zum Senden · Kein Login erforderlich · 5 Anfragen pro Minute",
  pt: "Pressione Enter para enviar · Não é necessário login · 5 solicitações por minuto",
  ja: "Enterを押して送信 · ログイン不要 · 1分間に5回のリクエスト"
};

const ERROR_MESSAGES: Record<SupportedLanguage, string> = {
  en: "I'm having trouble connecting right now. For immediate assistance, please visit the stadium's guest services desk.",
  es: "Tengo problemas para conectarme en este momento. Para asistencia inmediata, visite el mostrador de servicios para huéspedes del estadio.",
  fr: "J'ai du mal à me connecter en ce moment. Pour une assistance immédiate, veuillez visiter le bureau des services aux invités du stade.",
  de: "Ich habe gerade Verbindungsprobleme. Für sofortige Hilfe besuchen Sie bitte den Gästeservice im Stadion.",
  pt: "Estou tendo problemas de conexão no momento. Para assistência imediata, visite o balcão de serviços de hóspedes do estádio.",
  ja: "現在接続に問題があります。すぐのサポートが必要な場合は、スタジアムのゲストサービスデスクにお越しください。"
};

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : BUBBLE_VARIANTS}
      initial="hidden"
      animate="visible"
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="listitem"
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-pitch-blue' : 'bg-stadium-green/10'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-4 w-4 text-text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-stadium-green" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-pitch-blue text-white'
            : 'rounded-bl-sm bg-gray-100 text-text-primary'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

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
