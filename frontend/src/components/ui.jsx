import { useEffect } from "react";
import { Loader2, X, Inbox, AlertCircle, CheckCircle2, Info } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Loading                                                            */
/* ------------------------------------------------------------------ */
export function Spinner({ className = "h-5 w-5" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function PageLoader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-muted">
      <Spinner className="h-7 w-7 text-brand-500" />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap p-4">
      <Skeleton className="mb-4 h-8 w-full" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((__, j) => (
              <Skeleton key={j} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Alerts & empty states                                              */
/* ------------------------------------------------------------------ */
const alertStyles = {
  error: { wrap: "bg-slate-100 text-slate-700 border-slate-200", Icon: AlertCircle, ic: "text-slate-500" },
  success: { wrap: "bg-brand-50 text-brand-800 border-brand-200", Icon: CheckCircle2, ic: "text-brand-600" },
  info: { wrap: "bg-accent-50 text-accent-800 border-accent-200", Icon: Info, ic: "text-accent-600" },
};

export function Alert({ type = "error", children, onClose }) {
  const s = alertStyles[type] || alertStyles.info;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${s.wrap}`}>
      <s.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.ic}`} />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="rounded p-0.5 opacity-60 transition hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-base font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-ink-muted">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                        */
/* ------------------------------------------------------------------ */
export function PageHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                              */
/* ------------------------------------------------------------------ */
export function Modal({ open, onClose, title, description, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative my-8 w-full animate-slide-up rounded-2xl bg-white shadow-pop ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */
const roleBadge = {
  admin: "bg-slate-200 text-slate-700",
  teacher: "bg-accent-100 text-accent-700",
  student: "bg-brand-100 text-brand-700",
};
export function RoleBadge({ role, className = "" }) {
  return (
    <span className={`badge capitalize ${roleBadge[role] || "bg-slate-100 text-slate-700"} ${className}`}>
      {role}
    </span>
  );
}

export function Badge({ children, color = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-brand-100 text-brand-700",
    green: "bg-brand-100 text-brand-700",
    accent: "bg-accent-100 text-accent-700",
    amber: "bg-slate-100 text-slate-600",
    red: "bg-slate-100 text-slate-600",
  };
  return <span className={`badge ${map[color] || map.slate}`}>{children}</span>;
}

export function fileTypeBadge(type) {
  const map = {
    pdf: "bg-brand-100 text-brand-700",
    docx: "bg-accent-100 text-accent-700",
    pptx: "bg-slate-100 text-slate-600",
  };
  return map[type] || "bg-slate-100 text-slate-700";
}

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */
export function StatCard({ label, value, icon: Icon, tone = "brand", hint }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    accent: "bg-accent-50 text-accent-600",
    // legacy aliases → mapped onto the two-color system
    green: "bg-brand-50 text-brand-600",
    violet: "bg-accent-50 text-accent-600",
    amber: "bg-accent-50 text-accent-600",
  };
  return (
    <div className="card flex items-center gap-4">
      {Icon && (
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-ink">{value}</p>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
