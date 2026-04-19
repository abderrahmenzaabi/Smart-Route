import { Search, Plus, X, MapPin, Clock, Car, Users, Coins, Loader2, WifiOff, Check, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockCarpools } from "@/data/mockData";
import CarpoolCard from "@/components/CarpoolCard";
import { useState, useEffect, useCallback } from "react";
import type { CarpoolOffer, CarpoolOfferCreate } from "@/types";
import { fetchCarpools, createCarpool, deleteCarpool } from "@/lib/api";

const CarpoolMarketplace = () => {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [apiOffers, setApiOffers] = useState<CarpoolOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formTime, setFormTime] = useState("08:00");
  const [formSeats, setFormSeats] = useState(1);
  const [formPrice, setFormPrice] = useState(0);
  const [formVehicle, setFormVehicle] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("one-time");

  // Known coordinates for common locations
  const locationCoords: Record<string, { lat: number; lng: number }> = {
    sousse: { lat: 35.8254, lng: 10.6370 },
    monastir: { lat: 35.7709, lng: 10.8264 },
    msaken: { lat: 35.7780, lng: 10.7000 },
    khnis: { lat: 35.7650, lng: 10.7900 },
    sahline: { lat: 35.7575, lng: 10.7167 },
  };

  const resolveCoords = (text: string) => {
    const lower = text.toLowerCase().trim();
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (lower.includes(key)) return coords;
    }
    // Default to center of the corridor
    return { lat: 35.80, lng: 10.73 };
  };

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const offers = await fetchCarpools(q || undefined);
      setApiOffers(offers);
      setUsingMock(false);
    } catch {
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOffers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadOffers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formFrom.trim() || !formTo.trim()) return;

    setSubmitting(true);
    try {
      const fromCoords = resolveCoords(formFrom);
      const toCoords = resolveCoords(formTo);

      const data: CarpoolOfferCreate = {
        author_name: formName.trim(),
        phone: formPhone.trim() || undefined,
        from_label: formFrom.trim(),
        to_label: formTo.trim(),
        from_lat: fromCoords.lat,
        from_lng: fromCoords.lng,
        to_lat: toCoords.lat,
        to_lng: toCoords.lng,
        departure_time: formTime,
        seats_available: formSeats,
        price_per_seat: formPrice,
        vehicle_desc: formVehicle.trim() || undefined,
        recurrence: formRecurrence,
      };

      await createCarpool(data);
      setSubmitSuccess(true);

      // Reset form
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
        setFormName("");
        setFormPhone("");
        setFormFrom("");
        setFormTo("");
        setFormTime("08:00");
        setFormSeats(1);
        setFormPrice(0);
        setFormVehicle("");
        setFormRecurrence("one-time");
        void loadOffers();
      }, 1200);
    } catch {
      alert("Failed to post carpool. Make sure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCarpool(id);
      void loadOffers();
    } catch {
      alert("Failed to delete offer.");
    }
  };

  // Filter mock carpools client-side
  const filteredMock = mockCarpools.filter(
    (c) =>
      c.driver.name.toLowerCase().includes(q.toLowerCase()) ||
      c.route.from.toLowerCase().includes(q.toLowerCase()) ||
      c.route.to.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-5 animate-fade-in">
        <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">Find a carpool</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Trusted drivers heading your way — split the cost, cut emissions. Or post your own ride for free!
        </p>
      </div>

      {/* Search + Post button */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search drivers, cities, destinations…"
            className="pl-9 h-11"
          />
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 gap-2 font-display font-semibold bg-primary hover:bg-primary/90"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Post a Ride"}
        </Button>
      </div>

      {/* Post a Ride Form */}
      {showForm && (
        <Card className="p-5 md:p-6 mb-6 shadow-lg animate-slide-up border-t-4 border-t-primary">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Post a free ride
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cp-name" className="font-medium">Your name *</Label>
                <Input
                  id="cp-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ahmed"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-phone" className="font-medium">Phone (optional)</Label>
                <Input
                  id="cp-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +216 XX XXX XXX"
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cp-from" className="font-medium">
                  <MapPin className="inline w-3.5 h-3.5 mr-1" /> From *
                </Label>
                <Input
                  id="cp-from"
                  value={formFrom}
                  onChange={(e) => setFormFrom(e.target.value)}
                  placeholder="e.g. Sousse"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-to" className="font-medium">
                  <MapPin className="inline w-3.5 h-3.5 mr-1" /> To *
                </Label>
                <Input
                  id="cp-to"
                  value={formTo}
                  onChange={(e) => setFormTo(e.target.value)}
                  placeholder="e.g. Monastir"
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cp-time" className="font-medium">
                  <Clock className="inline w-3.5 h-3.5 mr-1" /> Departure
                </Label>
                <Input
                  id="cp-time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-seats" className="font-medium">
                  <Users className="inline w-3.5 h-3.5 mr-1" /> Seats
                </Label>
                <Input
                  id="cp-seats"
                  type="number"
                  min={1}
                  max={7}
                  value={formSeats}
                  onChange={(e) => setFormSeats(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-price" className="font-medium">
                  <Coins className="inline w-3.5 h-3.5 mr-1" /> TND/seat
                </Label>
                <Input
                  id="cp-price"
                  type="number"
                  min={0}
                  step={0.5}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp-recurrence" className="font-medium">Recurrence</Label>
                <select
                  id="cp-recurrence"
                  value={formRecurrence}
                  onChange={(e) => setFormRecurrence(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="one-time">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Mon–Fri</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-vehicle" className="font-medium">Vehicle description (optional)</Label>
              <Input
                id="cp-vehicle"
                value={formVehicle}
                onChange={(e) => setFormVehicle(e.target.value)}
                placeholder="e.g. White Peugeot 208"
                className="h-10"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Badge variant="secondary" className="text-xs">Free</Badge>
              Posting rides is completely free. Help fellow commuters in the Sousse–Monastir corridor!
            </div>

            <Button
              type="submit"
              disabled={submitting || submitSuccess}
              className={`w-full h-11 font-display font-semibold gap-2 transition-all ${
                submitSuccess
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitSuccess && <Check className="w-4 h-4" />}
              {submitting ? "Posting…" : submitSuccess ? "Posted!" : "Publish Ride"}
            </Button>
          </form>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm">Loading carpools…</p>
        </div>
      )}

      {/* API carpool offers */}
      {!loading && apiOffers.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Published rides
            <Badge variant="secondary" className="text-xs">{apiOffers.length}</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {apiOffers.map((offer, i) => (
              <Card
                key={offer.id}
                className="p-5 shadow-md hover:shadow-lg transition-shadow animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-display font-semibold">
                      {offer.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sm">{offer.author_name}</h3>
                      {offer.phone && (
                        <p className="text-xs text-muted-foreground">{offer.phone}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(offer.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">{offer.from_label}</span>
                    <span>→</span>
                    <span className="font-medium text-foreground">{offer.to_label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-mono">{offer.departure_time}</span>
                    <span className="text-xs">({offer.recurrence})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{offer.seats_available} {offer.seats_available === 1 ? "seat" : "seats"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 shrink-0 text-primary" />
                      <span className="font-mono font-semibold text-primary">
                        {offer.price_per_seat === 0 ? "Free" : `${offer.price_per_seat.toFixed(1)} TND`}
                      </span>
                    </div>
                  </div>
                  {offer.vehicle_desc && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>{offer.vehicle_desc}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mock carpool section (always shown as fallback) */}
      {!loading && (
        <div>
          {usingMock && (
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              <WifiOff className="w-3 h-3" />
              Demo mode — start the backend to post & browse real rides
            </div>
          )}
          {(usingMock || apiOffers.length === 0) && (
            <>
              <h2 className="font-display font-semibold text-lg mb-3">
                {usingMock ? "Sample carpools" : "Community carpools"}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMock.map((c, i) => (
                  <CarpoolCard key={c.id} carpool={c} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && apiOffers.length === 0 && filteredMock.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No carpools match your search.</div>
      )}
    </div>
  );
};

export default CarpoolMarketplace;
