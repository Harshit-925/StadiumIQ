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
  ai_insights?: string;
}
