import { pb } from './pocketbase';
import type {
  VenueAnalysisRequest,
  VenueAnalysisResponse,
  FanAssistRequest,
  FanAssistResponse,
  HealthResponse,
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

  const token = pb.authStore.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method,
    headers,
    // 'include' forwards the HttpOnly stadiumiq_token cookie the server sets
    // on login, so cookie-based auth works across the entire API surface.
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

/** Check API health status */
export async function healthCheck(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health', {
    method: 'GET',
  });
}
