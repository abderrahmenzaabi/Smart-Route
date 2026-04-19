import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate("/planner");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[0.95fr_1.05fr] bg-background">
      <section className="hidden lg:flex relative overflow-hidden text-primary-foreground bg-[linear-gradient(145deg,hsl(var(--primary-dark)),hsl(var(--primary)))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,hsl(var(--secondary)/0.35),transparent_34%),radial-gradient(circle_at_88%_78%,hsl(210_100%_80%/0.3),transparent_30%)]" />

        <div className="relative p-10 xl:p-14 flex flex-col justify-between w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 backdrop-blur grid place-items-center">
                <RouteIcon className="w-5 h-5" />
              </div>
              <span className="font-display text-xl">Smart Route</span>
            </Link>
          </div>

          <div className="max-w-md animate-fade-in">
            <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/75 mb-4">Welcome back</p>
            <h1 className="font-display text-4xl leading-tight mb-4">Coordinate smarter rides for teams and cities.</h1>
            <p className="text-primary-foreground/85">
              Log in to access journey planning, carpool matches, and route insights from one clean dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">Secure sessions</div>
            <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">Fast onboarding</div>
            <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">Mobile ready</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md shadow-xl border-border/60 animate-slide-up">
          <CardHeader className="space-y-2">
            <div className="lg:hidden inline-flex items-center gap-2 text-primary">
              <RouteIcon className="w-4 h-4" />
              <span className="font-display font-semibold">Smart Route</span>
            </div>
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>
              Frontend-only demo authentication. Any credentials will continue to the planner.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md grid place-items-center text-muted-foreground hover:bg-muted"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    id="remember-me"
                  />
                  Remember me
                </label>
                <span className="text-muted-foreground">Need help?</span>
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-semibold">
                Log in
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                New to Smart Route?{" "}
                <Link to="/" className="text-primary font-medium hover:underline">
                  Explore platform
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Login;
