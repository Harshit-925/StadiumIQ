/** Fan assistant request */
export interface FanAssistRequest {
  query: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja';
  venue_id?: string;
}

/** Fan assistant response */
export interface FanAssistResponse {
  response: string;
  language: string;
  source: string;
  fallback_used: boolean;
}

/** Chat message in fan assistant */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  timestamp: Date;
}

/** History entry for charting */
export interface HistoryEntry {
  id: string;
  venue: string;
  timestamp: string;
  average_density: number;
  crowd_score: number;
  overall_grade: string;
}

/** Supported languages */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ja: '日本語',
};
