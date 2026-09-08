const RTF = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** "2 hours ago", "3 days ago", "just now" */
export function timeAgo(date) {
  if (!date) return "";
  const diff = (new Date(date).getTime() - Date.now()) / 1000; // seconds, negative = past
  const abs = Math.abs(diff);
  const steps = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of steps) {
    if (abs >= secs) return RTF.format(Math.round(diff / secs), unit);
  }
  return "just now";
}

/** { text, tone } describing time until a due date. tone: 'ok' | 'soon' | 'today' | 'over' */
export function dueInfo(date) {
  if (!date) return { text: "", tone: "ok" };
  const due = new Date(date).getTime();
  const now = Date.now();
  const dayMs = 86400000;
  const days = Math.ceil((due - now) / dayMs);

  if (due < now) {
    const over = Math.floor((now - due) / dayMs);
    return { text: over <= 0 ? "Overdue" : `Overdue by ${over} day${over === 1 ? "" : "s"}`, tone: "over" };
  }
  if (days <= 0) return { text: "Due today", tone: "today" };
  if (days === 1) return { text: "1 day remaining", tone: "soon" };
  if (days <= 3) return { text: `${days} days remaining`, tone: "soon" };
  return { text: `${days} days remaining`, tone: "ok" };
}

/** "Sep 12, 2026" */
export function shortDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function shortDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
