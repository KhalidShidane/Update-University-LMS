import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let counter = 0;

const config = {
  success: { icon: CheckCircle2, ring: "border-brand-200", bar: "bg-brand-600", iconColor: "text-brand-600" },
  error: { icon: XCircle, ring: "border-slate-200", bar: "bg-slate-500", iconColor: "text-slate-500" },
  info: { icon: Info, ring: "border-accent-200", bar: "bg-accent-500", iconColor: "text-accent-600" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, message, opts = {}) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, type, message, title: opts.title }]);
      const ttl = opts.duration ?? 4200;
      if (ttl > 0) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (m, o) => push("success", m, o),
    error: (m, o) => push("error", m, o),
    info: (m, o) => push("info", m, o),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const c = config[t.type] || config.info;
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex animate-toast-in items-start gap-3 overflow-hidden rounded-2xl border ${c.ring} bg-white p-3.5 pl-4 shadow-pop`}
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${c.bar}`} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${c.iconColor}`} />
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-semibold text-ink">{t.title}</p>}
                <p className="text-sm text-ink-soft">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
