/** Venue information for FIFA World Cup 2026 stadiums */
export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  country: 'USA' | 'Mexico' | 'Canada';
  capacity: number;
  exit_width_m: number;
  zones: number;
  wheelchair_seats: number;
}

/** Crowd density classification levels */
export interface CrowdClassification {
  level: 'safe' | 'moderate' | 'warning' | 'critical';
  description: string;
  action_required: boolean;
  color: string;
}

/** Request payload for venue crowd analysis */
export interface VenueAnalysisRequest {
  venue_id: string;
  zone_densities: number[];
  waste_recycled_kg: number;
  waste_total_kg: number;
}

/** Zone-level analysis result */
export interface ZoneAnalysis {
  zone_id: number;
  density: number;
  classification: CrowdClassification;
}

/** Recommended route for navigation/transportation */
export interface RouteRecommendation {
  recommended_zone_index: number | null;
  recommended_zone_density: number | null;
  reason: string;
}

/** Overall venue analysis response */
export interface VenueAnalysisResponse {
  venue: string;
  timestamp: string;
  overall_grade: string;
  crowd_score: number;
  average_density: number;
  zone_analyses: ZoneAnalysis[];
  evacuation_time_minutes: number;
  evacuation_feasible: boolean;
  accessibility_compliance: boolean;
  wheelchair_ratio: number;
  sustainability_score: number;
  recycling_rate: number;
  ai_insights: string;
  ai_fallback: boolean;
  route_recommendation: RouteRecommendation;
}

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

/** Health check response */
export interface HealthResponse {
  status: string;
  supabase: string;
  version: string;
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

export interface NavigationStep {
  instruction: string;
  minutes: number;
}

export interface NavigationResponse {
  steps: NavigationStep[];
  total_minutes: number;
  accessible: boolean;
  narrative: string;
  source: string;
}

export interface ParkingOption {
  id: string;
  name: string;
  capacity: number;
  accessible_spaces: number;
  occupancy_pct: number;
  walk_time_mins: number;
  status: string;
}

export interface TransitOption {
  id: string;
  name: string;
  type: string;
  frequency_mins: number;
  crowd_level: string;
  accessible: boolean;
  status: string;
}

export interface TransportResponse {
  parking: ParkingOption[];
  transit: TransitOption[];
}

export interface EmergencyResponse {
  priority_level: string;
  action_plan: string[];
  requires_police: boolean;
  requires_medical: boolean;
  ai_brief: string;
  escalated_due_to_crowd?: boolean;
  crowd_level?: string;
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

/** All 16 FIFA World Cup 2026 venues */
export const VENUES: Record<string, VenueInfo> = {
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    exit_width_m: 45.0,
    zones: 8,
    wheelchair_seats: 650,
  },
  rosebowl: {
    id: 'rosebowl',
    name: 'Rose Bowl Stadium',
    city: 'Pasadena, CA',
    country: 'USA',
    capacity: 88432,
    exit_width_m: 42.0,
    zones: 8,
    wheelchair_seats: 600,
  },
  att: {
    id: 'att',
    name: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'USA',
    capacity: 80000,
    exit_width_m: 48.0,
    zones: 8,
    wheelchair_seats: 580,
  },
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    exit_width_m: 50.0,
    zones: 6,
    wheelchair_seats: 550,
  },
  levis: {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'Santa Clara, CA',
    country: 'USA',
    capacity: 68500,
    exit_width_m: 40.0,
    zones: 6,
    wheelchair_seats: 500,
  },
  nrg: {
    id: 'nrg',
    name: 'NRG Stadium',
    city: 'Houston, TX',
    country: 'USA',
    capacity: 72220,
    exit_width_m: 44.0,
    zones: 6,
    wheelchair_seats: 520,
  },
  mercedes: {
    id: 'mercedes',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta, GA',
    country: 'USA',
    capacity: 71000,
    exit_width_m: 52.0,
    zones: 6,
    wheelchair_seats: 540,
  },
  arrowhead: {
    id: 'arrowhead',
    name: 'GEHA Field at Arrowhead Stadium',
    city: 'Kansas City, MO',
    country: 'USA',
    capacity: 76416,
    exit_width_m: 38.0,
    zones: 6,
    wheelchair_seats: 480,
  },
  lincoln: {
    id: 'lincoln',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    country: 'USA',
    capacity: 69328,
    exit_width_m: 36.0,
    zones: 6,
    wheelchair_seats: 490,
  },
  lumen: {
    id: 'lumen',
    name: 'Lumen Field',
    city: 'Seattle, WA',
    country: 'USA',
    capacity: 68740,
    exit_width_m: 38.0,
    zones: 6,
    wheelchair_seats: 470,
  },
  gillette: {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Foxborough, MA',
    country: 'USA',
    capacity: 65878,
    exit_width_m: 35.0,
    zones: 6,
    wheelchair_seats: 450,
  },
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    exit_width_m: 40.0,
    zones: 8,
    wheelchair_seats: 400,
  },
  akron: {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49850,
    exit_width_m: 32.0,
    zones: 4,
    wheelchair_seats: 300,
  },
  bbva: {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53500,
    exit_width_m: 34.0,
    zones: 4,
    wheelchair_seats: 320,
  },
  bmo: {
    id: 'bmo',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45736,
    exit_width_m: 28.0,
    zones: 4,
    wheelchair_seats: 280,
  },
  bc_place: {
    id: 'bc_place',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    exit_width_m: 36.0,
    zones: 4,
    wheelchair_seats: 350,
  },
} as const;

/** Group venues by country for the selector */
export const VENUE_GROUPS: Record<string, VenueInfo[]> = {
  USA: Object.values(VENUES).filter((v) => v.country === 'USA'),
  Mexico: Object.values(VENUES).filter((v) => v.country === 'Mexico'),
  Canada: Object.values(VENUES).filter((v) => v.country === 'Canada'),
};
