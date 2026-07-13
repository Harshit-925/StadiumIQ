export interface EmergencyResponse {
  priority_level: string;
  action_plan: string[];
  requires_police: boolean;
  requires_medical: boolean;
  ai_brief: string;
  escalated_due_to_crowd?: boolean;
  crowd_level?: string;
}
