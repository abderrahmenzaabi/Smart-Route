import { Carpool } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import RatingStars from "./RatingStars";
import { Car, Clock, MapPin, DollarSign, Check, Loader2, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import RatingModal from "./RatingModal";

interface Props {
  carpool: Carpool;
  index: number;
}

type RequestState = "idle" | "loading" | "success";

const CarpoolCard = ({ carpool, index }: Props) => {
  const [state, setState] = useState<RequestState>("idle");
  const [showRating, setShowRating] = useState(false);

  const handleRequest = () => {
    setState("loading");
    setTimeout(() => {
      setState("success");
      setTimeout(() => setShowRating(true), 600);
    }, 1100);
  };

  return (
    <>
      <Card
        className="p-5 shadow-md hover:shadow-xl transition-all duration-300 animate-slide-up group border-l-4 border-l-transparent hover:border-l-primary"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
              {carpool.driver.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-semibold text-base truncate">{carpool.driver.name}</h3>
              {carpool.driver.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{carpool.driver.bio}</p>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars value={Math.round(carpool.driver.rating)} size="sm" />
              <span className="text-xs font-mono text-muted-foreground">
                {carpool.driver.rating.toFixed(1)} · {carpool.driver.reviews} reviews
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="w-4 h-4 shrink-0" />
            <span>{carpool.vehicle}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {carpool.seatsAvailable} {carpool.seatsAvailable === 1 ? "seat" : "seats"} left
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {carpool.route.from} → {carpool.route.to}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="font-mono">{carpool.schedule}</span>
            <span className="text-xs">({carpool.recurrence})</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <DollarSign className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono font-semibold text-primary text-base">
              {carpool.pricePerSeat === 0 ? "Free" : `${carpool.pricePerSeat.toFixed(2)} TND`}
            </span>
            <span className="text-xs text-muted-foreground">per seat</span>
          </div>
        </div>

        <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-3 mb-4">
          "{carpool.reviewSnippet}"
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handleRequest}
            disabled={state !== "idle"}
            className={cn(
              "flex-1 font-display font-semibold gap-2 transition-all",
              state === "success"
                ? "bg-success hover:bg-success text-success-foreground"
                : "bg-secondary hover:bg-secondary-dark text-secondary-foreground"
            )}
          >
            {state === "idle" && "Request to Join"}
            {state === "loading" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </>
            )}
            {state === "success" && (
              <>
                <Check className="w-4 h-4 animate-pop-in" /> Requested
              </>
            )}
          </Button>
          <Button variant="outline" className="font-display">
            View Profile
          </Button>
        </div>
      </Card>

      <RatingModal
        open={showRating}
        onOpenChange={setShowRating}
        driverName={carpool.driver.name}
      />
    </>
  );
};

export default CarpoolCard;
