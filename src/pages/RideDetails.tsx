import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Phone, Share2, X } from "lucide-react";
import RideLeafletMap from "@/components/RideLeafletMap";
import JourneyTimeline, { TimelineItem } from "@/components/JourneyTimeline";
import type { RideNavigationState, Route } from "@/types";
import { mockRoutes } from "@/data/mockData";
import { toast } from "sonner";

const RideDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideState = (location.state as RideNavigationState | null) || null;
  const route: Route = rideState?.route || mockRoutes[0];
  const fromLabel = rideState?.fromLabel || rideState?.from || "Start";
  const toLabel = rideState?.toLabel || rideState?.to || "Destination";

  const items: TimelineItem[] = [
    { time: "9:00 AM", label: "Picked up", status: "completed" },
    { time: "9:07 AM", label: "In route — heading to City Center", status: "in-progress" },
    { time: "9:22 AM", label: "Arrive at destination", status: "upcoming" },
  ];

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-5 animate-fade-in">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 mb-2 capitalize">
          {route.type} route
        </Badge>
        <h1 className="font-display text-2xl md:text-3xl text-foreground">Your ride is live</h1>
      </div>

      <div className="mb-5 animate-slide-up">
        <RideLeafletMap
          fromCoords={rideState?.fromCoords}
          toCoords={rideState?.toCoords}
          fromLabel={fromLabel}
          toLabel={toLabel}
          route={route}
        />
      </div>

      <Card className="p-4 mb-5 flex items-start gap-3 border-warning/30 bg-warning/5 animate-fade-in">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Driver is 5 min away</p>
          <p className="text-xs text-muted-foreground">We'll notify you when they arrive.</p>
        </div>
      </Card>

      <Card className="p-5 mb-5 animate-slide-up">
        <h2 className="font-display font-semibold text-lg mb-4">Journey timeline</h2>
        <JourneyTimeline items={items} />
      </Card>

      <Card className="p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="font-mono font-semibold text-2xl text-primary">
            {route.totalCost === 0 ? "Free" : `${route.totalCost.toFixed(2)} TND`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">ETA</p>
          <p className="font-mono font-semibold text-2xl">{route.totalTime} min</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Button
          variant="outline"
          onClick={() => toast.success("Ride details shared")}
          className="gap-2 font-display"
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Ride cancelled")}
          className="gap-2 font-display border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="w-4 h-4" /> Cancel
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={() => toast("Calling emergency contact…")}
        className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/20"
      >
        <Phone className="w-4 h-4" /> Emergency contact
      </Button>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => navigate("/planner")} className="text-muted-foreground">
          Plan another trip
        </Button>
      </div>
    </div>
  );
};

export default RideDetails;
