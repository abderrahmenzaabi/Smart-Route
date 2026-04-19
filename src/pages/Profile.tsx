import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import RatingStars from "@/components/RatingStars";
import { mockUser, mockSavedRoutes, mockJourneys } from "@/data/mockData";
import { Bookmark, Plus, Mail, Phone, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-6">
      <Card className="p-5 md:p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-xl">
              {mockUser.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl md:text-2xl text-foreground">{mockUser.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars value={Math.round(mockUser.rating)} size="sm" />
              <span className="text-xs font-mono text-muted-foreground">
                {mockUser.rating.toFixed(1)}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {mockUser.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {mockUser.phone}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Member since {mockUser.memberSince}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="font-display">
            Edit
          </Button>
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" /> Saved routes
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-primary gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {mockSavedRoutes.map((r) => (
            <Card
              key={r.id}
              className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/routes", { state: { from: r.from, to: r.to } })}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Used {r.usedCount}× · Saved ${r.monthlySavings}/mo
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3">Recent journeys</h2>
        <Card className="divide-y divide-border">
          {mockJourneys.map((j) => (
            <div key={j.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{j.routeLabel}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {j.date} · ${j.cost.toFixed(2)} · {j.durationMin} min
                </p>
              </div>
              <Badge variant="secondary" className="gap-1 font-mono">
                {j.rating}★
              </Badge>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
};

export default Profile;
