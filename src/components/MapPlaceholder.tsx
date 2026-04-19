import { MapPin } from "lucide-react";

const MapPlaceholder = () => {
  return (
    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-muted to-secondary/5">
      {/* Faux grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Faux route line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="none">
        <path
          d="M 40 200 Q 120 180 160 130 T 280 80 L 360 50"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
      </svg>
      <div className="absolute left-4 bottom-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur shadow-md text-xs font-medium">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        Live tracking preview
      </div>
      <div className="absolute right-4 top-4 w-3 h-3 rounded-full bg-primary animate-soft-pulse" />
    </div>
  );
};

export default MapPlaceholder;
