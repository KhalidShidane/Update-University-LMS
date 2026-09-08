import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import useFetch from "../../hooks/useFetch";
import { EmptyState, Alert } from "../ui";
import AssignmentStatusBadge from "../AssignmentStatusBadge";
import AssignmentSubmitModal from "../AssignmentSubmitModal";
import { shortDate, dueInfo } from "../../utils/format";

const dueToneClass = {
  ok: "text-ink-muted",
  soon: "text-accent-700 font-semibold",
  today: "text-slate-900 font-semibold",
  over: "text-slate-900 font-semibold",
};

export default function AssignmentsDeadlines({ limit = 6, showViewAll = true, heading = "Assignments & Deadlines" }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/assignments");
  const [submitFor, setSubmitFor] = useState(null);

  const assignments = useMemo(() => {
    const list = data?.data || [];
    // upcoming / actionable first, completed & old last
    const rank = (a) =>
      a.status === "completed" ? 3 : a.status === "submitted" ? 2 : a.status === "late" ? 1 : 0;
    return [...list].sort((a, b) => rank(a) - rank(b) || new Date(a.dueDate) - new Date(b.dueDate));
  }, [data]);

  const shown = limit ? assignments.slice(0, limit) : assignments;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">{heading}</h2>
        {showViewAll && assignments.length > shown.length && (
          <Link
            to="/student/assignments"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            View all ({assignments.length})
          </Link>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="card space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments"
          subtitle="Assignments set by your lecturers will show up here with their deadlines."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => {
            const d = dueInfo(a.dueDate);
            return (
              <div key={a._id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/student/assignments/${a._id}`}
                      className="font-semibold text-ink hover:text-brand-700 hover:underline"
                    >
                      {a.title}
                    </Link>
                    <AssignmentStatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {a.subject?.subjectName || "Subject"}
                    {a.subject?.subjectCode ? ` · ${a.subject.subjectCode}` : ""}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className="text-ink-muted">Due {shortDate(a.dueDate)}</span>
                    {" — "}
                    <span className={dueToneClass[d.tone]}>{d.text}</span>
                    {a.submission?.grade ? (
                      <span className="ml-2 text-brand-700">· Grade: {a.submission.grade}</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {a.status !== "completed" && (
                    <button className="btn-secondary btn-sm" onClick={() => setSubmitFor(a)}>
                      <Upload className="h-3.5 w-3.5" />
                      {a.submission ? "Replace" : "Submit"}
                    </button>
                  )}
                  <Link to={`/student/assignments/${a._id}`} className="btn-primary btn-sm">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignmentSubmitModal
        assignment={submitFor}
        open={!!submitFor}
        onClose={() => setSubmitFor(null)}
        onDone={() => {
          toast.success("Assignment submitted");
          refetch();
        }}
      />
    </section>
  );
}
