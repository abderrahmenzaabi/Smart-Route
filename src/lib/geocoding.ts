import type { Coordinates } from "@/types";

export interface GeocodingResult {
  label: string;
  coords: Coordinates;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MIN_QUERY_LENGTH = 3;

let lastRequestAt = 0;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export async function geocodeAddress(
  query: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const clean = query.trim();
  if (clean.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 300) {
    await wait(300 - elapsed);
  }
  lastRequestAt = Date.now();

  const params = new URLSearchParams({
    q: clean,
    format: "jsonv2",
    addressdetails: "0",
    limit: String(limit),
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch location results.");
  }

  const data = (await response.json()) as NominatimResult[];

  return data
    .map((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);

      if (!isValidCoords(lat, lng)) {
        return undefined;
      }

      return {
        label: item.display_name,
        coords: { lat, lng },
      } satisfies GeocodingResult;
    })
    .filter((item): item is GeocodingResult => Boolean(item));
}

export async function reverseGeocode(
  coords: Coordinates,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const params = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lng),
    format: "jsonv2",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return undefined;
  }

  const result = (await response.json()) as { display_name?: string };
  return result.display_name;
}
