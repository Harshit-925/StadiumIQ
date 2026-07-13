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
