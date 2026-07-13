/** Venue information for FIFA World Cup 2026 stadiums */
export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  country: 'USA' | 'Mexico' | 'Canada';
  capacity: number;
  exit_width_m: number;
  wheelchair_seats: number;
}

/** All 16 FIFA World Cup 2026 venues */
export const VENUES: Record<string, VenueInfo> = {
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    exit_width_m: 45.0,
    wheelchair_seats: 650,
  },
  rosebowl: {
    id: 'rosebowl',
    name: 'Rose Bowl Stadium',
    city: 'Pasadena, CA',
    country: 'USA',
    capacity: 88432,
    exit_width_m: 42.0,
    wheelchair_seats: 600,
  },
  att: {
    id: 'att',
    name: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'USA',
    capacity: 80000,
    exit_width_m: 48.0,
    wheelchair_seats: 580,
  },
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    exit_width_m: 50.0,
    wheelchair_seats: 550,
  },
  levis: {
    id: 'levis',
    name: "Levi's Stadium",
    city: 'Santa Clara, CA',
    country: 'USA',
    capacity: 68500,
    exit_width_m: 40.0,
    wheelchair_seats: 500,
  },
  nrg: {
    id: 'nrg',
    name: 'NRG Stadium',
    city: 'Houston, TX',
    country: 'USA',
    capacity: 72220,
    exit_width_m: 44.0,
    wheelchair_seats: 520,
  },
  mercedes: {
    id: 'mercedes',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta, GA',
    country: 'USA',
    capacity: 71000,
    exit_width_m: 52.0,
    wheelchair_seats: 540,
  },
  arrowhead: {
    id: 'arrowhead',
    name: 'GEHA Field at Arrowhead Stadium',
    city: 'Kansas City, MO',
    country: 'USA',
    capacity: 76416,
    exit_width_m: 38.0,
    wheelchair_seats: 480,
  },
  lincoln: {
    id: 'lincoln',
    name: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    country: 'USA',
    capacity: 69328,
    exit_width_m: 36.0,
    wheelchair_seats: 490,
  },
  lumen: {
    id: 'lumen',
    name: 'Lumen Field',
    city: 'Seattle, WA',
    country: 'USA',
    capacity: 68740,
    exit_width_m: 38.0,
    wheelchair_seats: 470,
  },
  gillette: {
    id: 'gillette',
    name: 'Gillette Stadium',
    city: 'Foxborough, MA',
    country: 'USA',
    capacity: 65878,
    exit_width_m: 35.0,
    wheelchair_seats: 450,
  },
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    exit_width_m: 40.0,
    wheelchair_seats: 400,
  },
  akron: {
    id: 'akron',
    name: 'Estadio Akron',
    city: 'Guadalajara',
    country: 'Mexico',
    capacity: 49850,
    exit_width_m: 32.0,
    wheelchair_seats: 300,
  },
  bbva: {
    id: 'bbva',
    name: 'Estadio BBVA',
    city: 'Monterrey',
    country: 'Mexico',
    capacity: 53500,
    exit_width_m: 34.0,
    wheelchair_seats: 320,
  },
  bmo: {
    id: 'bmo',
    name: 'BMO Field',
    city: 'Toronto',
    country: 'Canada',
    capacity: 45736,
    exit_width_m: 28.0,
    wheelchair_seats: 280,
  },
  bc_place: {
    id: 'bc_place',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    capacity: 54500,
    exit_width_m: 36.0,
    wheelchair_seats: 350,
  },
} as const;

/** Group venues by country for the selector */
export const VENUE_GROUPS: Record<string, VenueInfo[]> = {
  USA: Object.values(VENUES).filter((v) => v.country === 'USA'),
  Mexico: Object.values(VENUES).filter((v) => v.country === 'Mexico'),
  Canada: Object.values(VENUES).filter((v) => v.country === 'Canada'),
};

/** Shared standard zones across all venues */
export const SHARED_ZONES = [
  { id: 'gate_a', name: 'Gate A' },
  { id: 'gate_b', name: 'Gate B' },
  { id: 'gate_c', name: 'Gate C' },
  { id: 'concourse_north', name: 'North Concourse' },
  { id: 'concourse_south', name: 'South Concourse' },
  { id: 'bowl_lower', name: 'Lower Bowl' },
  { id: 'bowl_upper', name: 'Upper Bowl' },
] as const;
