/**
 * Typed API client for the Urban Transit Hub backend.
 * Base URL: http://localhost:8000
 */
import type {
  Route,
  RouteSearchState,
  CarpoolOffer,
  CarpoolOfferCreate,
  CoverageStatus,
  RouteSearchResponseMeta,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface RoutesApiRequest {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  budget?: number;
  depart_time?: string;
  arrival_time?: string;
  max_walking_m?: number;
}

export interface RoutesApiResponse {
  routes: Route[];
  coverage: CoverageStatus;
  safety_margin_min: number;
}

export interface StopOut {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

/**
 * Fetch best routes from the backend routing engine.
 * Now returns routes + metadata (coverage status, safety margin).
 */
export async function fetchRoutes(
  state: RouteSearchState
): Promise<{ routes: Route[]; meta: RouteSearchResponseMeta } | null> {
  if (!state.fromCoords || !state.toCoords) {
    return null;
  }

  const body: RoutesApiRequest = {
    from_lat: state.fromCoords.lat,
    from_lng: state.fromCoords.lng,
    to_lat: state.toCoords.lat,
    to_lng: state.toCoords.lng,
    budget: state.budget,
    depart_time: state.departTime,
    arrival_time: state.arrivalTime,
    max_walking_m: state.walking,
  };

  const res = await fetch(`${API_BASE}/api/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data: RoutesApiResponse = await res.json();
  return {
    routes: data.routes,
    meta: {
      coverage: data.coverage,
      safety_margin_min: data.safety_margin_min,
    },
  };
}

/**
 * Fetch all transit stops (for map overlay).
 */
export async function fetchStops(): Promise<StopOut[]> {
  const res = await fetch(`${API_BASE}/api/stops`);
  if (!res.ok) throw new Error("Failed to fetch stops");
  return res.json();
}

// ── Carpool Offers ────────────────────────────────────────────────────────────

/**
 * Fetch all active carpool offers, optionally filtered by search term.
 */
export async function fetchCarpools(search?: string): Promise<CarpoolOffer[]> {
  const params = new URLSearchParams({ active_only: "true" });
  if (search) params.set("search", search);

  const res = await fetch(`${API_BASE}/api/carpools?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch carpools");
  return res.json();
}

/**
 * Create a new carpool offer. Free feature — no login required.
 */
export async function createCarpool(
  data: CarpoolOfferCreate
): Promise<CarpoolOffer> {
  const res = await fetch(`${API_BASE}/api/carpools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to create carpool: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Delete (deactivate) a carpool offer.
 */
export async function deleteCarpool(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/carpools/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete carpool: ${res.statusText}`);
  }
}
