import { create } from 'zustand';
import { pb } from '../api/pocketbase';
import type { RecordModel } from 'pocketbase';
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
  logout: () => void;
  clearError: () => void;
}

function mapRecordToUser(record: RecordModel): AuthUser {
  return {
    id: record.id,
    email: String(record['email'] ?? ''),
    name: String(record['name'] ?? ''),
  };
}

async function syncHistoryFromPB() {
  try {
    const records = await pb.collection('history').getFullList({ sort: 'created' });
    const historyEntries: HistoryEntry[] = records.map((r) => {
      const engine = r.engine_result as any;
      return {
        id: r.id,
        venue: engine.venue || r.venue_id,
        timestamp: engine.timestamp,
        average_density: engine.average_density,
        crowd_score: engine.crowd_score,
        overall_grade: engine.overall_grade,
      };
    });
    useAppStore.getState().setHistory(historyEntries);
  } catch (err) {
    console.error('Failed to sync history from PocketBase:', err);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: pb.authStore.isValid && pb.authStore.model
    ? mapRecordToUser(pb.authStore.model as RecordModel)
    : null,
  isAuthenticated: pb.authStore.isValid,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await pb
        .collection('users')
        .authWithPassword(email, password);
      set({
        user: mapRecordToUser(authData.record),
        isAuthenticated: true,
        isLoading: false,
      });
      syncHistoryFromPB();
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
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      // Auto-login after signup
      const authData = await pb
        .collection('users')
        .authWithPassword(email, password);
      set({
        user: mapRecordToUser(authData.record),
        isAuthenticated: true,
        isLoading: false,
      });
      syncHistoryFromPB();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Signup failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    pb.authStore.clear();
    set({ user: null, isAuthenticated: false, error: null });
    useAppStore.getState().setHistory([]);
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Listen for auth store changes from PocketBase
pb.authStore.onChange(() => {
  if (pb.authStore.isValid && pb.authStore.model) {
    useAuthStore.setState({
      user: mapRecordToUser(pb.authStore.model as RecordModel),
      isAuthenticated: true,
    });
    syncHistoryFromPB();
  } else {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
    useAppStore.getState().setHistory([]);
  }
});
