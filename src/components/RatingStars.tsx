import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (v: number) => void;
}

const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

const RatingStars = ({ value, max = 5, interactive = false, size = "md", onChange }: Props) => {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= display;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(idx)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(idx)}
            className={cn(
              "transition-transform",
              interactive && "hover:scale-110 cursor-pointer",
              !interactive && "cursor-default"
            )}
            aria-label={`${idx} star${idx > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? "fill-warning text-warning" : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
