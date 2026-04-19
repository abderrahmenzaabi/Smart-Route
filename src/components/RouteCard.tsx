import { Route } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Footprints, Bus, TrainFront, Car, Zap, Leaf, DollarSign, Scale, CarTaxiFront, ShieldCheck, AlertTriangle, Clock, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { Coordinates, RouteSearchState } from "@/types";

const modeIcon = {
  walk: Footprints,
  bus: Bus,
  train: TrainFront,
  carpool: Car,
  taxi: CarTaxiFront,
};

const modeColor: Record<Route["segments"][number]["mode"], string> = {
  walk: "text-rose-500 bg-rose-50 dark:bg-rose-950/30",
  bus: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  train: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  carpool: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  taxi: "text-sky-500 bg-sky-50 dark:bg-sky-950/30",
};

const typeMeta: Record<Route["type"], { label: string; icon: LucideIcon; accent: string; btn: string }> = {
  fastest: {
    label: "Fastest",
    icon: Zap,
    accent: "border-t-primary",
    btn: "bg-primary hover:bg-primary-dark text-primary-foreground",
  },
  cheapest: {
    label: "Cheapest",
    icon: DollarSign,
    accent: "border-t-secondary",
    btn: "bg-secondary hover:bg-secondary-dark text-secondary-foreground",
  },
  balanced: {
    label: "Balanced",
    icon: Scale,
    accent: "border-t-muted-foreground",
    btn: "bg-foreground hover:bg-foreground/90 text-background",
  },
};

interface Props {
  route: Route;
  index: number;
  fromLabel: string;
  toLabel: string;
  fromCoords?: Coordinates;
  toCoords?: Coordinates;
}

const RouteCard = ({ route, index, fromLabel, toLabel, fromCoords, toCoords }: Props) => {
  const navigate = useNavigate();
  const meta = typeMeta[route.type];
  const Icon = meta.icon;

  return (
    <Card
      className={cn(
        "border-t-4 shadow-md hover:shadow-xl transition-all duration-300 p-5 animate-slide-up group relative overflow-hidden",
        meta.accent
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Subtle background glow effect */}
      <div className={cn("absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40", meta.btn.split(" ")[0])} />
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-display font-semibold uppercase tracking-wide">
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </span>
      </div>

      <div className="flex items-baseline gap-3 font-mono text-sm text-muted-foreground mb-4 flex-wrap">
        <span className="text-foreground font-semibold text-base">{route.totalTime} min</span>
        <span>·</span>
        <span className="text-foreground font-semibold text-base">{route.totalCost === 0 ? 'Free' : `${route.totalCost.toFixed(2)} TND`}</span>
        <span>·</span>
        <span>{route.walkingDistance}m walk</span>
      </div>

      <div className="space-y-2 mb-4 pb-4 border-b border-border">
        {route.segments.map((seg, i) => {
          const M = modeIcon[seg.mode];
          const colorClass = modeColor[seg.mode];
          return (
            <div key={i} className="flex items-center gap-3 text-sm group/seg">
              <div className={cn("w-8 h-8 rounded-md grid place-items-center shrink-0 transition-transform group-hover/seg:scale-110", colorClass)}>
                <M className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{seg.details}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {seg.duration} min
                  {seg.depart_at && seg.arrive_at && ` · ${seg.depart_at}→${seg.arrive_at}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {route.badges.includes("within-budget") && (
          <Badge variant="outline" className="gap-1 border-success text-success bg-success/5">
            <Check className="w-3 h-3" /> Within Budget
          </Badge>
        )}
        {route.badges.includes("over-budget") && (
          <Badge variant="outline" className="gap-1 border-destructive text-destructive bg-destructive/5">
            <AlertTriangle className="w-3 h-3" /> Over Budget
          </Badge>
        )}
        {route.badges.includes("eco-friendly") && (
          <Badge variant="outline" className="gap-1 border-secondary text-secondary bg-secondary/5">
            <Leaf className="w-3 h-3" /> Eco-Friendly
          </Badge>
        )}
        {route.badges.includes("lowest-price") && (
          <Badge variant="outline" className="gap-1 border-warning text-warning bg-warning/5">
            <DollarSign className="w-3 h-3" /> Lowest Price
          </Badge>
        )}
        {route.badges.includes("safe-arrival") && (
          <Badge variant="outline" className="gap-1 border-sky-500 text-sky-600 bg-sky-50 dark:bg-sky-950/20">
            <ShieldCheck className="w-3 h-3" /> Safe Arrival
          </Badge>
        )}
        {route.badges.includes("tight-arrival") && (
          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="w-3 h-3" /> Tight Arrival
          </Badge>
        )}
        {route.badges.includes("free-ride") && (
          <Badge variant="outline" className="gap-1 border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
            <Gift className="w-3 h-3" /> Free Ride
          </Badge>
        )}
      </div>

      <Button
        onClick={() =>
          navigate("/ride", {
            state: {
              route,
              from: fromLabel,
              to: toLabel,
              fromLabel,
              toLabel,
              fromCoords,
              toCoords,
            } satisfies RouteSearchState & { route: Route },
          })
        }
        className={cn("w-full font-display font-semibold gap-2 transition-all hover:-translate-y-0.5", meta.btn)}
      >
        Select Route <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  );
};

export default RouteCard;
