import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  Loader2,
  WifiOff,
  ShieldCheck,
  MapPinOff,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { mockRoutes } from "@/data/mockData";
import RouteCard from "@/components/RouteCard";
import { useState, useEffect } from "react";
import type { RouteSearchState, Route, CoverageStatus } from "@/types";
import { fetchRoutes } from "@/lib/api";

const coverageMessages: Record<CoverageStatus, { icon: typeof ShieldCheck; text: string; color: string }> = {
  full: {
    icon: ShieldCheck,
    text: "Full transit coverage — bus & train routes available for both origin and destination",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  origin_only: {
    icon: MapPinOff,
    text: "Limited coverage — no transit stops near your destination. Results may include taxi/carpool only.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  destination_only: {
    icon: MapPinOff,
    text: "Limited coverage — no transit stops near your starting point. Results may include taxi/carpool only.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  none: {
    icon: AlertTriangle,
    text: "No transit coverage — neither origin nor destination is near a bus or train stop. Only taxi and carpool options available.",
    color: "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

const RouteResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as RouteSearchState | null) || null;
  const from = state?.fromLabel || state?.from || "Current Location";
  const to = state?.toLabel || state?.to || "Downtown Office";
  const departTime = state?.departTime;
  const arrivalTime = state?.arrivalTime;
  const budget = state?.budget;
  const [save, setSave] = useState(false);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [coverage, setCoverage] = useState<CoverageStatus>("full");
  const [safetyMargin, setSafetyMargin] = useState(15);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setUsingMock(false);

      if (!state?.fromCoords || !state?.toCoords) {
        // No coordinates — fall back to mock
        setRoutes(mockRoutes);
        setUsingMock(true);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchRoutes(state);
        if (!cancelled) {
          if (result && result.routes.length > 0) {
            setRoutes(result.routes);
            setCoverage(result.meta.coverage);
            setSafetyMargin(result.meta.safety_margin_min);
          } else {
            setRoutes(mockRoutes);
            setUsingMock(true);
          }
        }
      } catch {
        if (!cancelled) {
          // API unavailable — fall back to mock data gracefully
          setRoutes(mockRoutes);
          setUsingMock(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const coverageInfo = coverageMessages[coverage];
  const CoverageIcon = coverageInfo.icon;

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/planner")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl md:text-3xl text-foreground mb-1">Routes</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          <span className="font-medium text-foreground">{from}</span> →{" "}
          <span className="font-medium text-foreground">{to}</span>
        </p>
        {(departTime || arrivalTime) && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {departTime ? `Depart at ${departTime}` : ""}
            {departTime && arrivalTime ? " • " : ""}
            {arrivalTime ? `Arrive by ${arrivalTime}` : ""}
          </p>
        )}
        {budget !== undefined && (
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Budget: <span className="font-semibold text-foreground">{budget} TND</span>
          </p>
        )}

        {/* Demo mode banner */}
        {usingMock && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            <WifiOff className="w-3 h-3" />
            Demo mode — start the backend to get real routes
          </div>
        )}

        {/* Coverage status */}
        {!usingMock && (
          <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${coverageInfo.color}`}>
            <CoverageIcon className="w-3 h-3" />
            {coverageInfo.text}
          </div>
        )}

        {/* Safety margin info */}
        {!usingMock && arrivalTime && (
          <div className="mt-2 ml-1 inline-flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 dark:bg-sky-950/20 dark:text-sky-400 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
            <Clock className="w-3 h-3" />
            {safetyMargin}-min safety margin applied — routes arrive by{" "}
            {(() => {
              const [h, m] = arrivalTime.split(":").map(Number);
              const total = h * 60 + m - safetyMargin;
              const rh = Math.floor(total / 60) % 24;
              const rm = total % 60;
              return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
            })()}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Calculating best routes…</p>
        </div>
      ) : (
        <>
          {routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-center">
                No routes found within your budget and time constraints.<br />
                Try increasing your budget or adjusting the arrival time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {routes.map((r, i) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  index={i}
                  fromLabel={from}
                  toLabel={to}
                  fromCoords={state?.fromCoords}
                  toCoords={state?.toCoords}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-6 flex items-center gap-2 p-4 rounded-lg bg-muted/50">
        <Checkbox id="save" checked={save} onCheckedChange={(v) => setSave(!!v)} />
        <Label htmlFor="save" className="flex items-center gap-2 cursor-pointer text-sm">
          <Bookmark className="w-4 h-4 text-primary" />
          Save my favorite route for quick access
        </Label>
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => navigate("/carpools")} className="font-display">
          Or browse carpools instead
        </Button>
      </div>
    </div>
  );
};

export default RouteResults;
