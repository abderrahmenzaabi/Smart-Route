import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/types";
import { fetchRoadRoutes } from "@/lib/routing";
import { cn } from "@/lib/utils";

const START_CENTER: Coordinates = { lat: 36.8065, lng: 10.1815 };

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fromIcon = new L.Icon({
  ...defaultIcon.options,
  className: "leaflet-marker-from",
});

const toIcon = new L.Icon({
  ...defaultIcon.options,
  className: "leaflet-marker-to",
});

interface FitBoundsProps {
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  routePoints: Coordinates[];
}

const FitBounds = ({ fromCoords, toCoords, routePoints }: FitBoundsProps) => {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length > 0) {
      map.fitBounds(routePoints.map((point) => [point.lat, point.lng] as [number, number]), {
        padding: [36, 36],
      });
      return;
    }

    if (fromCoords && toCoords) {
      map.fitBounds(
        [
          [fromCoords.lat, fromCoords.lng],
          [toCoords.lat, toCoords.lng],
        ],
        { padding: [36, 36] },
      );
    }
  }, [fromCoords, map, routePoints, toCoords]);

  return null;
};

interface MapClickHandlerProps {
  activeTarget: "from" | "to";
  onMapPick: (target: "from" | "to", coords: Coordinates) => void;
}

const MapClickHandler = ({ activeTarget, onMapPick }: MapClickHandlerProps) => {
  useMapEvents({
    click: (event) => {
      onMapPick(activeTarget, { lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

interface LocationPickerMapProps {
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
  activeTarget: "from" | "to";
  onMapPick: (target: "from" | "to", coords: Coordinates) => void;
  onDragEnd: (target: "from" | "to", coords: Coordinates) => void;
}

const LocationPickerMap = ({
  fromCoords,
  toCoords,
  activeTarget,
  onMapPick,
  onDragEnd,
}: LocationPickerMapProps) => {
  const [routePoints, setRoutePoints] = useState<Coordinates[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | undefined>();

  useEffect(() => {
    if (!fromCoords || !toCoords) {
      setRoutePoints([]);
      setRouteError(undefined);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadRoutePreview = async () => {
      setRouteLoading(true);
      setRouteError(undefined);

      try {
        const routes = await fetchRoadRoutes(fromCoords, toCoords, "driving", controller.signal);

        if (cancelled) {
          return;
        }

        setRoutePoints(routes[0]?.geometry || []);
      } catch {
        if (!cancelled) {
          setRoutePoints([]);
          setRouteError("Unable to load a real road route preview.");
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    void loadRoutePreview();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fromCoords, toCoords]);

  const center = fromCoords || toCoords || START_CENTER;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Click the map to set <span className="font-semibold text-foreground">{activeTarget === "from" ? "From" : "To"}</span>.
        </p>
        <p>{routeLoading ? "Loading route..." : "Markers are draggable."}</p>
      </div>
      {routeError && <p className="text-xs text-destructive">{routeError}</p>}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        className={cn("h-[300px] w-full rounded-lg border border-border")}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler activeTarget={activeTarget} onMapPick={onMapPick} />
          <FitBounds fromCoords={fromCoords} toCoords={toCoords} routePoints={routePoints} />

        {fromCoords && (
          <Marker
            icon={fromIcon}
            position={[fromCoords.lat, fromCoords.lng]}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const latLng = marker.getLatLng();
                onDragEnd("from", { lat: latLng.lat, lng: latLng.lng });
              },
            }}
          />
        )}

        {toCoords && (
          <Marker
            icon={toIcon}
            position={[toCoords.lat, toCoords.lng]}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const latLng = marker.getLatLng();
                onDragEnd("to", { lat: latLng.lat, lng: latLng.lng });
              },
            }}
          />
        )}

        {fromCoords && toCoords && (
          <Polyline
            positions={
              routePoints.length > 0
                ? routePoints.map((point) => [point.lat, point.lng] as [number, number])
                : [
                    [fromCoords.lat, fromCoords.lng],
                    [toCoords.lat, toCoords.lng],
                  ]
            }
            pathOptions={{
              color: "hsl(var(--primary))",
              weight: 4,
              dashArray: routePoints.length > 0 ? undefined : "6 8",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;
