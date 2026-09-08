import { Megaphone, AlertTriangle } from "lucide-react";
import { timeAgo } from "../utils/format";

function sourceLabel(a) {
  if (a.authorRole === "admin") return "University Admin";
  if (a.subject?.subjectCode) return `${a.author?.fullName || "Lecturer"} · ${a.subject.subjectCode}`;
  return a.author?.fullName || "Faculty";
}

export default function AnnouncementItem({ a, actions }) {
  const important = a.priority === "important";
  return (
    <div
      className={`card flex gap-3.5 ${
        important ? "border-accent-200 bg-accent-50/40" : ""
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          important ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {important ? <AlertTriangle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{a.title}</h3>
          {important && <span className="badge bg-accent-100 text-accent-700">Important</span>}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{a.body}</p>
        <p className="mt-2 text-xs text-ink-muted">
          {sourceLabel(a)} · {timeAgo(a.createdAt)}
        </p>
        {actions && <div className="mt-3 flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
