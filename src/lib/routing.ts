import type { Coordinates } from "@/types";

export type RoutingProfile = "driving" | "walking";

export interface RoadRoute {
  id: string;
  profile: RoutingProfile;
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinates[];
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
  message?: string;
}

function profileToOsrm(profile: RoutingProfile): string {
  return profile === "walking" ? "walking" : "driving";
}

function toCoordinates(points: [number, number][]): Coordinates[] {
  return points
    .map(([lng, lat]) => ({ lat, lng }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function timeoutSignal(timeoutMs: number, externalSignal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  controller.signal.addEventListener("abort", () => clearTimeout(timeout), { once: true });

  return controller.signal;
}

export async function fetchRoadRoutes(
  start: Coordinates,
  end: Coordinates,
  profile: RoutingProfile,
  signal?: AbortSignal,
): Promise<RoadRoute[]> {
  const profileSegment = profileToOsrm(profile);
  const points = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const params = new URLSearchParams({
    alternatives: "true",
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/${profileSegment}/${points}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: timeoutSignal(12000, signal),
    },
  );

  if (!response.ok) {
    throw new Error("Routing service is unavailable.");
  }

  const data = (await response.json()) as OsrmResponse;

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || "No valid routes found.");
  }

  return data.routes.slice(0, 3).map((route, index) => ({
    id: `${profile}-${index}`,
    profile,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: toCoordinates(route.geometry.coordinates),
  }));
}
