import { EmptyState } from "./ui";

/* ------------------------------------------------------------------ *
 * Horizontal bar list — single series, magnitude by category.
 * Thin bars, 4px rounded data-end, recessive track, direct value labels.
 * data: [{ label, value, hint? }]
 * ------------------------------------------------------------------ */
export function BarList({ data = [], max, valueSuffix = "", emptyIcon, emptyTitle, emptyHint }) {
  if (!data.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptyHint} />;
  }
  const peak = max ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-3.5">
      {data.map((d) => {
        const pct = Math.round((d.value / peak) * 100);
        return (
          <li key={d.label} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink-soft" title={d.label}>
                {d.label}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {d.value}
                {valueSuffix}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500 group-hover:bg-brand-600"
                style={{ width: `${Math.max(pct, d.value > 0 ? 4 : 0)}%` }}
                title={`${d.label}: ${d.value}${valueSuffix}`}
              />
            </div>
            {d.hint && <p className="mt-1 text-xs text-ink-muted">{d.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Donut — part-to-whole for a small categorical set (<= 5 slices).
 * Legend + direct labels + center total. 2px surface gap between arcs.
 * data: [{ label, value, color }]
 * ------------------------------------------------------------------ */
export function Donut({ data = [], total, centerLabel = "total", size = 168, emptyTitle, emptyHint, emptyIcon }) {
  const sum = data.reduce((n, d) => n + d.value, 0);
  if (!sum) return <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptyHint} />;

  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 2; // px surface gap between arcs

  let cursor = 0;
  const arcs = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const len = (d.value / sum) * c;
      const draw = Math.max(len - gap, 1);
      const seg = { ...d, dash: `${draw} ${c - draw}`, start: cursor };
      cursor += len;
      return seg;
    });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={a.dash}
              strokeDashoffset={-a.start}
              strokeLinecap="butt"
            >
              <title>{`${a.label}: ${a.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total ?? sum}</span>
          <span className="text-xs text-ink-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="text-ink-soft">{d.label}</span>
            <span className="font-semibold tabular-nums text-ink">{d.value}</span>
            <span className="text-xs text-ink-muted">
              {sum ? Math.round((d.value / sum) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// file-type palette — two brand colors + a neutral gray for the third category
// (the donut ships direct labels + legend + %, satisfying secondary encoding)
export const FILE_TYPE_COLORS = {
  pdf: "#18A05A", // green
  docx: "#2b8bbb", // blue
  pptx: "#475569", // neutral gray
};
