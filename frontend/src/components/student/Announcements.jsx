import { useState } from "react";
import { Megaphone } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { EmptyState, Alert } from "../ui";
import AnnouncementItem from "../AnnouncementItem";

export default function Announcements() {
  const { data, loading, error } = useFetch("/announcements");
  const [expanded, setExpanded] = useState(false);
  const items = data?.data || [];
  const shown = expanded ? items : items.slice(0, 4);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Announcements</h2>
        {items.length > 4 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {expanded ? "Show less" : `Show all (${items.length})`}
          </button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          subtitle="University and class announcements will appear here."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <AnnouncementItem key={a._id} a={a} />
          ))}
        </div>
      )}
    </section>
  );
}
