import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Compass className="h-8 w-8" />
      </span>
      <p className="font-display text-5xl font-extrabold text-ink">404</p>
      <p className="max-w-sm text-ink-muted">
        The page you are looking for doesn’t exist or you don’t have access to it.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
