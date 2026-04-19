import { Link } from "react-router-dom";
import { ArrowRight, Car, ChartNoAxesCombined, Clock3, Leaf, Route as RouteIcon, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const featureHighlights = [
  {
    icon: RouteIcon,
    title: "Adaptive Route Composer",
    description: "Generate multi-modal plans that balance travel time, transfer comfort, and budget targets in one view.",
  },
  {
    icon: Users2,
    title: "Trusted Carpool Network",
    description: "Pair riders through verified profiles and synchronized schedules to increase confidence and occupancy.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Operational Visibility",
    description: "Monitor route quality and commute trends with clean metrics that help teams improve mobility programs.",
  },
];

const trustStats = [
  { value: "42%", label: "Lower monthly travel cost" },
  { value: "31 min", label: "Average commute time saved weekly" },
  { value: "18k+", label: "Trips coordinated every month" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.24),transparent_30%),radial-gradient(circle_at_90%_8%,hsl(var(--secondary)/0.26),transparent_26%),radial-gradient(circle_at_80%_78%,hsl(var(--primary)/0.12),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(210_40%_96%))]" />
      <div className="absolute inset-x-0 top-[28rem] -z-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/70">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-glow">
              <RouteIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display text-lg leading-none">Smart Route</p>
              <p className="text-xs text-muted-foreground">Urban mobility for modern teams</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-full px-5">
              <Link to="/planner">Try Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 md:px-8 pt-14 md:pt-24 pb-12 md:pb-16">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div className="animate-fade-in">
              <p className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                AI-assisted urban mobility
              </p>
              <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">
                A commute platform
                <span className="block text-primary">that people actually enjoy using</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Transform fragmented transport options into one premium experience. Smart Route unifies planning, ridesharing, and coordination with a design your users trust from first click.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full px-7 shadow-glow h-12">
                  <Link to="/login" className="gap-2">
                    Start Free Demo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-7 h-12 border-primary/25">
                  <Link to="/planner">Explore Planner</Link>
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Enterprise-ready UX</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4 text-primary" /> Quick setup in minutes</span>
                <span className="inline-flex items-center gap-2"><Leaf className="w-4 h-4 text-primary" /> Sustainable mobility</span>
              </div>
            </div>

            <div className="grid gap-4 animate-slide-up">
              <Card className="relative overflow-hidden border-border/60 bg-card/90 backdrop-blur shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(140deg,hsl(var(--primary)/0.12),transparent_40%),linear-gradient(320deg,hsl(var(--secondary)/0.1),transparent_45%)]" />
                <div className="relative p-6 md:p-7 space-y-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mobility impact</p>
                  <div className="space-y-3">
                    {trustStats.map((stat) => (
                      <div key={stat.label} className="flex items-start justify-between gap-4 border-b border-border/70 pb-3">
                        <p className="text-3xl font-display text-primary">{stat.value}</p>
                        <p className="text-right text-sm text-muted-foreground max-w-[16rem]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Snapshot values are demo numbers for your prototype experience.
                  </p>
                </div>
              </Card>

              <Card className="p-5 border-border/70 bg-card/85 backdrop-blur shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-base">This morning's best route</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/15 text-secondary-dark">Recommended</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-left">
                    <p className="text-xs text-muted-foreground">Transit + Walk</p>
                    <p className="font-semibold">34 min</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-left">
                    <p className="text-xs text-muted-foreground">Carpool</p>
                    <p className="font-semibold">$2.80</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-left">
                    <p className="text-xs text-muted-foreground">CO2 Saved</p>
                    <p className="font-semibold">-24%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-8 pb-14 md:pb-20">
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {featureHighlights.map((item, index) => (
              <Card
                key={item.title}
                className="p-6 border-border/70 bg-card/90 backdrop-blur shadow-md hover:-translate-y-1 transition-transform animate-slide-up"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h2 className="font-display text-xl mb-2">{item.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <Card className="relative overflow-hidden border-0 bg-[linear-gradient(145deg,hsl(var(--primary-dark)),hsl(var(--primary)))] text-primary-foreground shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,hsl(var(--secondary)/0.35),transparent_35%)]" />
            <div className="relative px-6 md:px-10 py-10 md:py-12 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
              <div className="flex-1">
                <p className="text-primary-foreground/75 text-xs tracking-[0.2em] uppercase mb-3">Designed for client-ready demos</p>
                <h3 className="font-display text-3xl md:text-4xl mb-3">Show a premium mobility experience from day one</h3>
                <p className="text-primary-foreground/85 max-w-xl">
                  This frontend gives you a launch-ready visual foundation. Add your backend services later without redesigning the interface.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Trusted riders
                </div>
                <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Lower emissions
                </div>
                <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Better occupancy
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Landing;