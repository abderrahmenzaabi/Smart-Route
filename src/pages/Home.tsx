import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, Search, Car, Bookmark, Sparkles } from "lucide-react";
import type { Coordinates, RouteSearchState } from "@/types";
import LocationPickerMap from "@/components/LocationPickerMap";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";
import type { GeocodingResult } from "@/lib/geocoding";

const Home = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoords, setFromCoords] = useState<Coordinates | undefined>();
  const [toCoords, setToCoords] = useState<Coordinates | undefined>();
  const [fromSuggestions, setFromSuggestions] = useState<GeocodingResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodingResult[]>([]);
  const [activeTarget, setActiveTarget] = useState<"from" | "to">("from");
  const [geoLoading, setGeoLoading] = useState(false);
  const [errors, setErrors] = useState<{
    from?: string;
    to?: string;
  }>({});
  const [budget, setBudget] = useState([10]);
  const [departTime, setDepartTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [walking, setWalking] = useState([1500]);

  useEffect(() => {
    const clean = from.trim();
    if (clean.length < 3) {
      setFromSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await geocodeAddress(clean, 5, controller.signal);
        setFromSuggestions(results);
      } catch {
        if (!controller.signal.aborted) {
          setErrors((prev) => ({ ...prev, from: "Could not search this location right now." }));
        }
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [from]);

  useEffect(() => {
    const clean = to.trim();
    if (clean.length < 3) {
      setToSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await geocodeAddress(clean, 5, controller.signal);
        setToSuggestions(results);
      } catch {
        if (!controller.signal.aborted) {
          setErrors((prev) => ({ ...prev, to: "Could not search this location right now." }));
        }
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [to]);

  const applySelection = (target: "from" | "to", selection: GeocodingResult) => {
    if (target === "from") {
      setFrom(selection.label);
      setFromCoords(selection.coords);
      setFromSuggestions([]);
      setErrors((prev) => ({ ...prev, from: undefined }));
      return;
    }

    setTo(selection.label);
    setToCoords(selection.coords);
    setToSuggestions([]);
    setErrors((prev) => ({ ...prev, to: undefined }));
  };

  const setPointFromMap = async (target: "from" | "to", coords: Coordinates) => {
    const label = (await reverseGeocode(coords)) || `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
    applySelection(target, { label, coords });
  };

  const resolveTypedLocation = async (target: "from" | "to") => {
    const value = (target === "from" ? from : to).trim();
    if (value.length < 3) {
      return;
    }

    try {
      const results = await geocodeAddress(value, 1);
      const first = results[0];

      if (!first) {
        setErrors((prev) => ({
          ...prev,
          [target]: "Could not resolve this address to a map location.",
        }));
        return;
      }

      if (target === "from") {
        setFromCoords(first.coords);
        setFromSuggestions([]);
      } else {
        setToCoords(first.coords);
        setToSuggestions([]);
      }

      setErrors((prev) => ({ ...prev, [target]: undefined }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [target]: "Could not resolve this address right now.",
      }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const finalFrom = from || "Current Location";
    const finalTo = to || "Downtown Office";

    const state: RouteSearchState = {
      from: finalFrom,
      to: finalTo,
      fromLabel: finalFrom,
      toLabel: finalTo,
      fromCoords,
      toCoords,
      budget: budget[0],
      departTime: departTime || undefined,
      arrivalTime: arrivalTime || undefined,
      walking: walking[0],
    };

    navigate("/routes", {
      state,
    });
  };

  const useGPS = async () => {
    setGeoLoading(true);
    setErrors((prev) => ({ ...prev, from: undefined }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const coords: Coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Try to reverse geocode for a human-readable label
      const label = (await reverseGeocode(coords)) || `Current Location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;

      setFromCoords(coords);
      setFrom(label);
      setFromSuggestions([]);
    } catch (error) {
      const errorMsg = error instanceof GeolocationPositionError
        ? error.message === "User denied geolocation"
          ? "Location access denied. Please enable location permissions."
          : "Could not retrieve your location. Please try again."
        : "Could not retrieve your location.";
      
      setErrors((prev) => ({ ...prev, from: errorMsg }));
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <div className="mb-6 md:mb-8 animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Smart multi-modal routing
        </span>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Plan your journey</h1>
        <p className="text-muted-foreground md:text-lg">
          Combine walking, transit and carpools to get there faster and cheaper.
        </p>
      </div>

      <Card className="p-5 md:p-6 shadow-xl border-t-4 border-t-primary animate-slide-up relative overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="from" className="font-medium">From</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="from"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setFromCoords(undefined);
                  setActiveTarget("from");
                  setErrors((prev) => ({ ...prev, from: undefined }));
                }}
                onBlur={() => {
                  void resolveTypedLocation("from");
                }}
                placeholder="Starting point"
                className="pl-9 pr-24 h-11"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={useGPS}
                disabled={geoLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 gap-1 text-primary hover:text-primary"
              >
                <Navigation className="w-3.5 h-3.5" /> {geoLoading ? "..." : "GPS"}
              </Button>
            </div>
            {errors.from && <p className="text-sm text-destructive">{errors.from}</p>}
            {fromSuggestions.length > 0 && (
              <div className="rounded-md border border-border bg-background">
                {fromSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.coords.lat}-${suggestion.coords.lng}`}
                    type="button"
                    onClick={() => applySelection("from", suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}

            {fromCoords && (
              <p className="text-xs text-muted-foreground">
                Latitude: {fromCoords.lat.toFixed(6)}, Longitude: {fromCoords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="font-medium">To</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="to"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setToCoords(undefined);
                  setActiveTarget("to");
                  setErrors((prev) => ({ ...prev, to: undefined }));
                }}
                onBlur={() => {
                  void resolveTypedLocation("to");
                }}
                placeholder="Destination"
                className="pl-9 h-11"
              />
            </div>
            {errors.to && <p className="text-sm text-destructive">{errors.to}</p>}
            {toSuggestions.length > 0 && (
              <div className="rounded-md border border-border bg-background">
                {toSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.coords.lat}-${suggestion.coords.lng}`}
                    type="button"
                    onClick={() => applySelection("to", suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}

            {toCoords && (
              <p className="text-xs text-muted-foreground">
                Latitude: {toCoords.lat.toFixed(6)}, Longitude: {toCoords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Map picker</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={activeTarget === "from" ? "default" : "outline"}
                onClick={() => setActiveTarget("from")}
              >
                Set From
              </Button>
              <Button
                type="button"
                variant={activeTarget === "to" ? "default" : "outline"}
                onClick={() => setActiveTarget("to")}
              >
                Set To
              </Button>
            </div>

            <LocationPickerMap
              fromCoords={fromCoords}
              toCoords={toCoords}
              activeTarget={activeTarget}
              onMapPick={setPointFromMap}
              onDragEnd={setPointFromMap}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <Label className="font-medium">Budget</Label>
              <span className="font-mono text-sm text-primary font-semibold">
              {budget[0]} TND
              </span>
            </div>
            <Slider value={budget} onValueChange={setBudget} max={50} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0 TND</span>
              <span>50 TND</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-medium">Time preferences</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="depart-time" className="text-sm text-muted-foreground">Depart at</Label>
                <Input
                  id="depart-time"
                  type="time"
                  value={departTime}
                  onChange={(e) => setDepartTime(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival-time" className="text-sm text-muted-foreground">Arrive by</Label>
                <Input
                  id="arrival-time"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <Label className="font-medium">Max walking</Label>
              <span className="font-mono text-sm text-primary font-semibold">
                {walking[0] >= 1000 ? `${(walking[0] / 1000).toFixed(1)}km` : `${walking[0]}m`}
              </span>
            </div>
            <Slider value={walking} onValueChange={setWalking} min={100} max={5000} step={100} />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>100m</span>
              <span>5km</span>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 bg-gradient-to-r from-primary to-sky-500 hover:opacity-90 text-primary-foreground font-display font-semibold gap-2 transition-all hover:-translate-y-0.5 shadow-md hover:shadow-xl border-0"
          >
            <Search className="w-4 h-4" /> Find Routes
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button
          variant="outline"
          onClick={() => navigate("/carpools")}
          className="h-12 gap-2 font-display font-semibold"
        >
          <Car className="w-4 h-4" /> Browse Carpools
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/profile")}
          className="h-12 gap-2 font-display font-semibold"
        >
          <Bookmark className="w-4 h-4" /> My Saved Routes
        </Button>
      </div>
    </div>
  );
};

export default Home;
