import { create } from 'zustand';
import type { VenueAnalysisResponse, VenueInfo, HistoryEntry, SupportedLanguage } from '../types';
import { VENUES } from '../types';

interface AppState {
  /** Currently selected venue */
  selectedVenue: VenueInfo;
  /** Latest analysis result */
  analysisResult: VenueAnalysisResponse | null;
  /** Loading state for analysis */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** History of analyses for charting */
  history: HistoryEntry[];
  /** Fan assistant panel open state */
  isFanAssistOpen: boolean;

  /** Currently selected language */
  language: SupportedLanguage;
  
  /** Actions */
  setSelectedVenue: (venueId: string) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setAnalysisResult: (result: VenueAnalysisResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setHistory: (history: HistoryEntry[]) => void;
  toggleFanAssist: () => void;
  setFanAssistOpen: (open: boolean) => void;
  clearResults: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedVenue: VENUES.metlife,
  analysisResult: null,
  isLoading: false,
  error: null,
  history: [],
  isFanAssistOpen: false,
  language: 'en',

  setSelectedVenue: (venueId: string) => {
    const venue = VENUES[venueId];
    if (venue) {
      set({ selectedVenue: venue, analysisResult: null, error: null });
    }
  },

  setLanguage: (lang: SupportedLanguage) => {
    set({ language: lang });
  },

  setAnalysisResult: (result: VenueAnalysisResponse) => {
    set({ analysisResult: result, isLoading: false, error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  addHistoryEntry: (entry: HistoryEntry) => {
    set((state) => ({
      history: [...state.history.slice(-49), entry],
    }));
  },

  setHistory: (history: HistoryEntry[]) => {
    set({ history });
  },

  toggleFanAssist: () => {
    set((state) => ({ isFanAssistOpen: !state.isFanAssistOpen }));
  },

  setFanAssistOpen: (open: boolean) => {
    set({ isFanAssistOpen: open });
  },

  clearResults: () => {
    set({ analysisResult: null, error: null });
  },
}));
