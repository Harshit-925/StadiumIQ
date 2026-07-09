import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { useAppStore } from './useAppStore';
import type { HistoryEntry } from '../types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/** Fetch the user's analysis history from the Supabase history table */
async function syncHistoryFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('id, venue_id, engine_result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to sync history from Supabase:', error.message);
      return;
    }

    const historyEntries: HistoryEntry[] = (data ?? []).map((r) => {
      const engine = r.engine_result as {
        venue?: string;
        timestamp?: string;
        average_density?: number;
        crowd_score?: number;
        overall_grade?: string;
      };
      return {
        id: r.id,
        venue: engine.venue ?? r.venue_id,
        timestamp: engine.timestamp ?? r.created_at,
        average_density: engine.average_density ?? 0,
        crowd_score: engine.crowd_score ?? 0,
        overall_grade: engine.overall_grade ?? 'N/A',
      };
    });

    useAppStore.getState().setHistory(historyEntries);
  } catch (err) {
    console.error('Failed to sync history from Supabase:', err);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading — we'll resolve via onAuthStateChange
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const sbUser = data.user;
      set({
        user: {
          id: sbUser.id,
          email: sbUser.email ?? email,
          name: (sbUser.user_metadata?.['name'] as string | undefined) ?? '',
        },
        isAuthenticated: true,
        isLoading: false,
      });
      syncHistoryFromSupabase(sbUser.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      // Sign up — pass name in user_metadata so it's available without a separate profile table
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) throw signUpError;

      // Auto-login after signup
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;

      const sbUser = data.user;
      set({
        user: {
          id: sbUser.id,
          email: sbUser.email ?? email,
          name,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      syncHistoryFromSupabase(sbUser.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Signup failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, error: null });
    useAppStore.getState().setHistory([]);
  },

  clearError: () => {
    set({ error: null });
  },
}));

// ── Listen for auth state changes from Supabase (page refresh, token expiry) ──
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuthStore.setState({
      user: {
        id: session.user.id,
        email: session.user.email ?? '',
        name: (session.user.user_metadata?.['name'] as string | undefined) ?? '',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    syncHistoryFromSupabase(session.user.id);
  } else {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    useAppStore.getState().setHistory([]);
  }
});
