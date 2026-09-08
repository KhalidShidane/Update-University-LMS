import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import { Modal, Spinner } from "../ui";
import { downloadFrom } from "../../utils/lessonFiles";
import { shortDateTime } from "../../utils/format";

export default function SubmissionsModal({ assignment, open, onClose, onGraded }) {
  const toast = useToast();
  const { data, loading, refetch } = useFetch(
    open && assignment ? `/assignments/${assignment._id}` : null,
    [assignment?._id, open]
  );
  const [gradeFor, setGradeFor] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const submissions = data?.data?.submissions || [];

  const submitGrade = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/assignments/submissions/${gradeFor._id}/grade`, { grade, feedback });
      toast.success("Marked as reviewed");
      setGradeFor(null);
      setGrade("");
      setFeedback("");
      refetch();
      onGraded?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submissions" description={assignment?.title} wide>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-muted">No submissions yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {submissions.map((s) => (
            <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{s.student?.user?.fullName || "Student"}</p>
                <p className="text-xs text-ink-muted">
                  {s.fileName} · {shortDateTime(s.submittedAt)}
                  {s.graded && (
                    <span className="ml-2 text-brand-700">
                      · Reviewed{s.grade ? ` (${s.grade})` : ""}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() =>
                    downloadFrom(`/assignments/submissions/${s._id}/download`, s.fileName).catch((e) =>
                      toast.error(e.message)
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" /> File
                </button>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => {
                    setGradeFor(s);
                    setGrade(s.grade || "");
                    setFeedback(s.feedback || "");
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> {s.graded ? "Update" : "Mark reviewed"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {gradeFor && (
        <form onSubmit={submitGrade} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-ink">
            Review — {gradeFor.student?.user?.fullName}
          </p>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <div>
              <label className="label">Grade (optional)</label>
              <input
                className="input"
                placeholder="A / 85"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Feedback (optional)</label>
              <input
                className="input"
                placeholder="Short comment…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setGradeFor(null)}>
              Cancel
            </button>
            <button className="btn-primary btn-sm" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : "Save review"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
