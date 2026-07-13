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
  zone_densities: Record<string, number>;
  waste_recycled_kg: number;
  waste_total_kg: number;
}

/** Zone-level analysis result */
export interface ZoneAnalysis {
  zone_id: string;
  density: number;
  classification: CrowdClassification;
}

/** Recommended route for navigation/transportation */
export interface RouteRecommendation {
  recommended_zone_id: string | null;
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
