import { supabase } from './supabase';
import type {
  VenueAnalysisRequest,
  VenueAnalysisResponse,
  FanAssistRequest,
  FanAssistResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface FetchOptions {
  method: 'GET' | 'POST';
  body?: unknown;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach the Supabase JWT as a Bearer token for protected backend routes
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method,
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(
      (errorData as { detail?: string }).detail ||
        `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

/** Analyze crowd density and safety for a venue */
export async function analyzeVenue(
  data: VenueAnalysisRequest,
): Promise<VenueAnalysisResponse> {
  return apiFetch<VenueAnalysisResponse>('/analyze', {
    method: 'POST',
    body: data,
  });
}

/** Get multilingual fan assistance response */
export async function fanAssist(
  data: FanAssistRequest,
): Promise<FanAssistResponse> {
  return apiFetch<FanAssistResponse>('/fan-assist', {
    method: 'POST',
    body: data,
  });
}
