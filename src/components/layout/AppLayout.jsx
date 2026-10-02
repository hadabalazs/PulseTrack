import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, BarChart3, Dumbbell, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Tracker", icon: CalendarCheck },
  { path: "/stats", label: "Stats", icon: BarChart3 },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {!isRoot && (
              <button
                onClick={() => navigate(-1)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors select-none"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">PulseTrack</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 select-none",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12">
        <Outlet />
      </main>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (location.pathname !== item.path) navigate(item.path);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors select-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
