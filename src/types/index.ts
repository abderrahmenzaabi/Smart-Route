export type TransportMode = "walk" | "bus" | "train" | "carpool" | "taxi";
export type RouteType = "fastest" | "cheapest" | "balanced";
export type CoverageStatus = "full" | "origin_only" | "destination_only" | "none";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationSelection {
  label: string;
  coords?: Coordinates;
}

export interface RouteSearchState {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  budget?: number;
  urgency?: "any" | "soon" | "urgent";
  departTime?: string;
  arrivalTime?: string;
  walking?: number;
}

export interface RideNavigationState {
  route: Route;
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
}

export interface RouteSegment {
  mode: TransportMode;
  duration: number; // minutes
  distance: number; // meters
  details: string;
  // Optional enrichment from backend
  line_name?: string;
  depart_at?: string; // "HH:MM"
  arrive_at?: string; // "HH:MM"
  from_lat?: number;
  from_lng?: number;
  to_lat?: number;
  to_lng?: number;
}

export interface Route {
  id: string;
  type: RouteType;
  totalTime: number;
  totalCost: number;
  walkingDistance: number;
  segments: RouteSegment[];
  badges: string[];
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  initials: string;
  verified: boolean;
  bio: string;
}

export interface Carpool {
  id: string;
  driver: Driver;
  route: { from: string; to: string };
  schedule: string;
  recurrence: string;
  vehicle: string;
  seatsAvailable: number;
  pricePerSeat: number;
  reviewSnippet: string;
}

export interface SavedRoute {
  id: string;
  label: string;
  from: string;
  to: string;
  usedCount: number;
  monthlySavings: number;
}

export interface Journey {
  id: string;
  date: string;
  routeLabel: string;
  cost: number;
  durationMin: number;
  rating: number;
}

// ── Carpool Offers (from API) ────────────────────────────────────────────────

export interface CarpoolOffer {
  id: number;
  author_name: string;
  phone?: string;
  from_label: string;
  to_label: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  departure_time: string;
  seats_available: number;
  price_per_seat: number;
  vehicle_desc?: string;
  recurrence: string;
  is_active: boolean;
  created_at?: string;
}

export interface CarpoolOfferCreate {
  author_name: string;
  phone?: string;
  from_label: string;
  to_label: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  departure_time: string;
  seats_available: number;
  price_per_seat: number;
  vehicle_desc?: string;
  recurrence: string;
}

export interface RouteSearchResponseMeta {
  coverage: CoverageStatus;
  safety_margin_min: number;
}
