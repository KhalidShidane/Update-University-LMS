import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Megaphone, FileText, AlertTriangle } from "lucide-react";
import api from "../api/axios";
import { timeAgo } from "../utils/format";

const typeIcon = (item) => {
  if (item.type === "material") return FileText;
  if (item.priority === "important") return AlertTriangle;
  return Megaphone;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/summary");
      setItems(data.data || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((list) => list.map((i) => ({ ...i, unread: false })));
      api.post("/notifications/seen").catch(() => {});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-soft shadow-sm transition hover:bg-slate-50"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">You're all caught up.</p>
            ) : (
              items.map((it) => {
                const Icon = typeIcon(it);
                return (
                  <button
                    key={it._id}
                    onClick={() => {
                      setOpen(false);
                      if (it.link) navigate(it.link);
                    }}
                    className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        it.priority === "important"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{it.title}</span>
                        {it.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">
                        {it.subtitle}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {timeAgo(it.date)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
