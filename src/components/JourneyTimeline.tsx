import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStatus = "completed" | "in-progress" | "upcoming";

export interface TimelineItem {
  time: string;
  label: string;
  status: TimelineStatus;
}

interface Props {
  items: TimelineItem[];
}

const JourneyTimeline = ({ items }: Props) => {
  return (
    <ol className="relative">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const lineColor =
          item.status === "completed"
            ? "bg-success"
            : item.status === "in-progress"
            ? "bg-primary"
            : "bg-border";

        return (
          <li key={i} className="relative pl-12 pb-8 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className={cn("absolute left-[11px] top-6 w-0.5 h-full", lineColor)}
              />
            )}
            {/* Dot */}
            <span
              className={cn(
                "absolute left-0 top-0 w-6 h-6 rounded-full grid place-items-center shrink-0",
                item.status === "completed" && "bg-success text-success-foreground",
                item.status === "in-progress" &&
                  "bg-primary text-primary-foreground animate-soft-pulse ring-4 ring-primary/20",
                item.status === "upcoming" && "bg-muted text-muted-foreground border border-border"
              )}
            >
              {item.status === "completed" && <Check className="w-3.5 h-3.5" />}
              {item.status === "in-progress" && <ArrowRight className="w-3.5 h-3.5" />}
              {item.status === "upcoming" && <HelpCircle className="w-3.5 h-3.5" />}
            </span>

            <div className="flex flex-col">
              <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  item.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {item.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default JourneyTimeline;
