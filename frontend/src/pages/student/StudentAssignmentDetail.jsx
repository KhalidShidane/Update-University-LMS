import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Upload, CheckCircle2, CalendarClock } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import { Alert, PageLoader, Spinner } from "../../components/ui";
import AssignmentStatusBadge from "../../components/AssignmentStatusBadge";
import Dropzone from "../../components/Dropzone";
import { downloadFrom } from "../../utils/lessonFiles";
import { shortDate, shortDateTime, dueInfo } from "../../utils/format";

const ACCEPT = ["pdf", "docx", "pptx", "xlsx", "zip", "txt", "csv"];

export default function StudentAssignmentDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(`/assignments/${id}`, [id]);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (loading) return <PageLoader label="Loading assignment" />;
  if (error) return <Alert>{error}</Alert>;

  const a = data?.data;
  const sub = a?.submission;
  const d = dueInfo(a.dueDate);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!file) return setSubmitError("Choose the file you want to submit.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/assignments/${a._id}/submit`, fd);
      toast.success(sub ? "Submission replaced" : "Assignment submitted");
      setFile(null);
      refetch();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link
        to="/student/assignments"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> My Assignments
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{a.title}</h1>
              <AssignmentStatusBadge status={a.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {a.subject?.subjectName}
              {a.subject?.subjectCode ? ` · ${a.subject.subjectCode}` : ""}
            </p>
          </div>
          {a.fileUrl && (
            <button
              className="btn-secondary btn-sm"
              onClick={() =>
                downloadFrom(`/assignments/${a._id}/brief`, a.fileName).catch((e) =>
                  toast.error(e.message)
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Assignment brief
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm">
          <CalendarClock className="h-4 w-4 text-ink-muted" />
          <span className="text-ink-soft">Due {shortDate(a.dueDate)}</span>
          <span className="text-ink-muted">·</span>
          <span
            className={
              d.tone === "over"
                ? "font-semibold text-slate-900"
                : d.tone === "soon" || d.tone === "today"
                  ? "font-semibold text-accent-700"
                  : "text-ink-muted"
            }
          >
            {d.text}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="card mb-6">
        <h2 className="mb-2 font-semibold text-ink">Instructions</h2>
        {a.description ? (
          <p className="whitespace-pre-wrap text-sm text-ink-soft">{a.description}</p>
        ) : (
          <p className="text-sm text-ink-muted">
            No written instructions.{a.fileUrl ? " See the assignment brief above." : ""}
          </p>
        )}
      </div>

      {/* Submission */}
      <div className="card">
        <h2 className="mb-1 font-semibold text-ink">Your submission</h2>

        {sub && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <span className="font-medium text-ink">{sub.fileName}</span>
                <span className="text-ink-muted">· {shortDateTime(sub.submittedAt)}</span>
              </div>
              <button
                className="btn-secondary btn-sm"
                onClick={() =>
                  downloadFrom(
                    `/assignments/submissions/${sub._id}/download`,
                    sub.fileName
                  ).catch((e) => toast.error(e.message))
                }
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
            {sub.graded && (
              <div className="mt-2 border-t border-slate-200 pt-2 text-sm">
                <p className="font-semibold text-brand-700">
                  Reviewed{sub.grade ? ` — ${sub.grade}` : ""}
                </p>
                {sub.feedback && <p className="mt-0.5 text-ink-soft">{sub.feedback}</p>}
              </div>
            )}
          </div>
        )}

        {a.status === "completed" ? (
          <p className="text-sm text-ink-muted">
            This assignment has been reviewed by your lecturer and is now closed.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-ink-muted">
              {sub
                ? "Upload a new file to replace your current submission."
                : "Attach your completed work and submit it before the deadline."}
            </p>
            {submitError && <Alert>{submitError}</Alert>}
            <Dropzone value={file} onChange={setFile} accept={ACCEPT} maxSizeMB={15} />
            <div className="flex justify-end">
              <button className="btn-primary" disabled={busy}>
                {busy ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> {sub ? "Replace submission" : "Submit assignment"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
