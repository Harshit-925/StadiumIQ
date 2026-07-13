/**
 * Shared chat constants for FanAssistant and FanAssistantPage.
 *
 * Canonical version: FanAssistantPage.tsx (includes more complete copy
 * and the accessible hint-text with rate limit information).
 */
import type { SupportedLanguage } from '../../types';

export const LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'pt', 'ja'];

export const BUBBLE_VARIANTS = {
  hidden:  { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/** Welcome messages — canonical FanAssistantPage.tsx version */
export const WELCOME_MESSAGES: Record<SupportedLanguage, string> = {
  en: "Hello! I'm your FIFA World Cup 2026 assistant. Ask me anything about venues, match schedules, transport, accessibility, or facilities.",
  es: '¡Hola! Soy tu asistente para la Copa Mundial FIFA 2026. Pregúntame sobre estadios, horarios, transporte o accesibilidad.',
  fr: 'Bonjour ! Je suis votre assistant pour la Coupe du Monde FIFA 2026. Posez-moi toutes vos questions sur les stades, horaires et transports.',
  de: 'Hallo! Ich bin Ihr Assistent für die FIFA Weltmeisterschaft 2026. Fragen Sie mich nach Stadien, Spielplänen oder Transport.',
  pt: 'Olá! Sou seu assistente para a Copa do Mundo FIFA 2026. Pergunte sobre estádios, horários de jogos, transporte e acessibilidade.',
  ja: 'こんにちは！FIFA ワールドカップ 2026 のアシスタントです。会場、試合スケジュール、交通機関についてお気軽にどうぞ。',
};

export const INPUT_PLACEHOLDERS: Record<SupportedLanguage, string> = {
  en: "Ask about venues, schedules, transport…",
  es: "Pregunte sobre estadios, horarios, transporte…",
  fr: "Demandez sur les stades, horaires, transports…",
  de: "Fragen Sie nach Stadien, Spielplänen, Transport…",
  pt: "Pergunte sobre estádios, horários, transporte…",
  ja: "会場、スケジュール、交通機関について聞く…",
};

export const HINT_TEXTS: Record<SupportedLanguage, string> = {
  en: "Press Enter to send · No login required · 5 requests per minute",
  es: "Presione Enter para enviar · No requiere inicio de sesión · 5 solicitudes por minuto",
  fr: "Appuyez sur Entrée pour envoyer · Aucune connexion requise · 5 requêtes par minute",
  de: "Drücken Sie die Eingabetaste zum Senden · Kein Login erforderlich · 5 Anfragen pro Minute",
  pt: "Pressione Enter para enviar · Não é necessário login · 5 solicitações por minuto",
  ja: "Enterを押して送信 · ログイン不要 · 1分間に5回のリクエスト",
};

export const ERROR_MESSAGES: Record<SupportedLanguage, string> = {
  en: "I'm having trouble connecting right now. For immediate assistance, please visit the stadium's guest services desk.",
  es: "Tengo problemas para conectarme en este momento. Para asistencia inmediata, visite el mostrador de servicios para huéspedes del estadio.",
  fr: "J'ai du mal à me connecter en ce moment. Pour une assistance immédiate, veuillez visiter le bureau des services aux invités du stade.",
  de: "Ich habe gerade Verbindungsprobleme. Für sofortige Hilfe besuchen Sie bitte den Gästeservice im Stadion.",
  pt: "Estou tendo problemas de conexão no momento. Para assistência imediata, visite o balcão de serviços de hóspedes do estádio.",
  ja: "現在接続に問題があります。すぐのサポートが必要な場合は、スタジアムのゲストサービスデスクにお越しください。",
};
