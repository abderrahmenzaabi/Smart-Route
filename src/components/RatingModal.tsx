import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RatingStars from "./RatingStars";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  driverName: string;
}

const categories = ["Friendliness", "Cleanliness", "Safety", "On-time"];

const RatingModal = ({ open, onOpenChange, driverName }: Props) => {
  const [overall, setOverall] = useState(0);
  const [subRatings, setSubRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!overall) {
      toast.error("Please give an overall rating");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        onOpenChange(false);
        setOverall(0);
        setSubRatings({});
        setComment("");
        setSubmitted(false);
        toast.success("Review submitted — thanks!");
      }, 900);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            How was your ride with {driverName}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Overall</span>
            <RatingStars value={overall} interactive size="lg" onChange={setOverall} />
          </div>

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c} className="flex items-center justify-between">
                <span className="text-sm">{c}</span>
                <RatingStars
                  value={subRatings[c] || 0}
                  interactive
                  size="sm"
                  onChange={(v) => setSubRatings((p) => ({ ...p, [c]: v }))}
                />
              </div>
            ))}
          </div>

          <Textarea
            placeholder="Add a comment (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground font-display"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {submitted && <Check className="w-4 h-4 mr-2 animate-pop-in" />}
              {!submitting && !submitted && "Submit Review"}
              {submitting && "Submitting…"}
              {submitted && "Submitted"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
