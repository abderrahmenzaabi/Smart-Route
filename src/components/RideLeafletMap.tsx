import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { geocodeAddress } from "@/lib/geocoding";
import { cn } from "@/lib/utils";
import type { Coordinates, Route } from "@/types";

const FALLBACK_CENTER: Coordinates = { lat: 35.795, lng: 10.73 };

const MODE_COLORS: Record<string, string> = {
  walk: "#f43f5e",   // Rose 500
  bus: "#f59e0b",    // Amber 500
  train: "#10b981",  // Emerald 500
  carpool: "#a855f7",// Purple 500
  taxi: "#0ea5e9",   // Sky 500
};

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RideLeafletMapProps {
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  fromLabel: string;
  toLabel: string;
  route?: Route;
}

const FitBounds = ({ points }: { points: Coordinates[] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [32, 32] },
    );
  }, [map, points]);

  return null;
};

const RideLeafletMap = ({ fromCoords, toCoords, fromLabel, toLabel, route }: RideLeafletMapProps) => {
  const [resolvedStart, setResolvedStart] = useState<Coordinates | undefined>(fromCoords);
  const [resolvedEnd, setResolvedEnd] = useState<Coordinates | undefined>(toCoords);
  const [isResolvingPoints, setIsResolvingPoints] = useState(false);
  const [routeError, setRouteError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const resolvePoints = async () => {
      setIsResolvingPoints(true);
      setRouteError(undefined);

      try {
        const start = fromCoords || (await geocodeAddress(fromLabel, 1, controller.signal))[0]?.coords;
        const end = toCoords || (await geocodeAddress(toLabel, 1, controller.signal))[0]?.coords;

        if (cancelled) return;

        setResolvedStart(start);
        setResolvedEnd(end);

        if (!start || !end) {
          setRouteError("Could not resolve start or destination coordinates.");
        }
      } catch {
        if (!cancelled) {
          setResolvedStart(fromCoords);
          setResolvedEnd(toCoords);
          setRouteError("Could not resolve trip coordinates.");
        }
      } finally {
        if (!cancelled) setIsResolvingPoints(false);
      }
    };

    void resolvePoints();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fromCoords, fromLabel, toCoords, toLabel]);

  // Extract all points for bounding box
  const allPoints: Coordinates[] = [];
  if (resolvedStart) allPoints.push(resolvedStart);
  if (resolvedEnd) allPoints.push(resolvedEnd);
  
  if (route) {
    route.segments.forEach((seg) => {
      if (seg.from_lat && seg.from_lng) allPoints.push({ lat: seg.from_lat, lng: seg.from_lng });
      if (seg.to_lat && seg.to_lng) allPoints.push({ lat: seg.to_lat, lng: seg.to_lng });
    });
  }

  const center = resolvedStart || resolvedEnd || FALLBACK_CENTER;

  return (
    <div className="space-y-3">
      <MapContainer center={[center.lat, center.lng]} zoom={12} className="h-[320px] w-full rounded-xl border border-border overflow-hidden z-0 focus:outline-none">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPoints.length > 0 && <FitBounds points={allPoints} />}

        {resolvedStart && (
          <Marker position={[resolvedStart.lat, resolvedStart.lng]} icon={defaultIcon}>
            <Popup>{fromLabel || "Start"}</Popup>
          </Marker>
        )}

        {resolvedEnd && (
          <Marker position={[resolvedEnd.lat, resolvedEnd.lng]} icon={defaultIcon}>
            <Popup>{toLabel || "Destination"}</Popup>
          </Marker>
        )}

        {/* Draw the multi-modal segments */}
        {route?.segments.map((seg, index) => {
          if (!seg.from_lat || !seg.from_lng || !seg.to_lat || !seg.to_lng) return null;
          
          const isWalking = seg.mode === "walk";
          const color = MODE_COLORS[seg.mode] || "#6b7280";

          return (
            <Polyline
              key={index}
              positions={[
                [seg.from_lat, seg.from_lng],
                [seg.to_lat, seg.to_lng]
              ]}
              pathOptions={{
                color: color,
                weight: 5,
                opacity: 0.9,
                dashArray: isWalking ? "8 10" : undefined,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Popup className="font-display">
                <span className="font-semibold block capitalize">{seg.mode} Segment</span>
                <span className="text-muted-foreground">{seg.details}</span>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>

      {isResolvingPoints && (
        <p className="text-sm text-muted-foreground">Loading real route directions...</p>
      )}

      {routeError && (
        <Alert variant="destructive">
          <AlertDescription>{routeError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RideLeafletMap;
