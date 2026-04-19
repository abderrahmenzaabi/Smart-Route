import { NavLink, Outlet } from "react-router-dom";
import { Home, Car, Navigation as NavIcon, User, Route as RouteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/carpools", label: "Carpools", icon: Car },
  { to: "/ride", label: "Rides", icon: NavIcon },
  { to: "/profile", label: "Profile", icon: User },
];

const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-sidebar shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-glow">
            <RouteIcon className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">Smart Route</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-muted-foreground border-t border-sidebar-border">
          v1.0 · Hackathon MVP
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center gap-2 px-4 border-b border-border bg-card sticky top-0 z-30">
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <RouteIcon className="w-4 h-4" />
          </div>
          <span className="font-display font-bold">Smart Route</span>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border z-40 grid grid-cols-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110 transition-transform")} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
