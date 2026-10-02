import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4">
        <p className="font-display text-6xl font-bold text-muted-foreground/40">404</p>
        <h1 className="font-display text-xl font-semibold">Page not found</h1>
        <Link to="/" className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium select-none">
          Back to tracker
        </Link>
      </div>
    </div>
  );
}
