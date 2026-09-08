import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ClipboardList, Users } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import { Alert, ConfirmDialog, EmptyState, Modal, Spinner } from "../ui";
import Dropzone from "../Dropzone";
import SubmissionsModal from "./SubmissionsModal";
import { shortDate, dueInfo } from "../../utils/format";

const ACCEPT = ["pdf", "docx", "pptx", "xlsx", "zip", "txt", "csv"];
const toLocalInput = (d) => {
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60000).toISOString().slice(0, 16);
};
const emptyForm = { title: "", description: "", dueDate: "", subject: "", file: null, removeFile: false };

/**
 * Assignment manager.
 *  - subject-scoped:  pass `subjectId` (+ `subjectName`)  → panel embedded on the subject page
 *  - all-subjects:    pass `subjects` (array)             → standalone page
 */
export default function TeacherAssignmentsPanel({
  subjectId,
  subjectName,
  subjects,
  standalone = false,
}) {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/assignments");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [subsFor, setSubsFor] = useState(null);

  const allSubjects = subjects || [];

  const assignments = useMemo(() => {
    const list = data?.data || [];
    const filtered = subjectId
      ? list.filter((a) => String(a.subject?._id) === String(subjectId))
      : list;
    return [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [data, subjectId]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      subject: subjectId || allSubjects[0]?._id || "",
      dueDate: toLocalInput(Date.now() + 7 * 86400000),
    });
    setFormError("");
    setModal({ mode: "create" });
  };
  const openEdit = (a) => {
    setForm({
      title: a.title,
      description: a.description || "",
      dueDate: toLocalInput(a.dueDate),
      subject: a.subject?._id || "",
      file: null,
      removeFile: false,
    });
    setFormError("");
    setModal({ mode: "edit", assignment: a });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("dueDate", new Date(form.dueDate).toISOString());
    if (modal.mode === "create") fd.append("subject", subjectId || form.subject);
    if (form.file) fd.append("file", form.file);
    if (form.removeFile) fd.append("removeFile", "true");
    try {
      if (modal.mode === "create") {
        await api.post("/assignments", fd);
        toast.success("Assignment created");
      } else {
        await api.put(`/assignments/${modal.assignment._id}`, fd);
        toast.success("Assignment updated");
      }
      setModal(null);
      refetch();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/assignments/${toDelete._id}`);
      toast.success("Assignment deleted");
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className={standalone ? "" : "mt-10"}>
      <div className="mb-4 flex items-center justify-between">
        {!standalone && (
          <div>
            <h2 className="text-xl font-bold text-ink">Assignments</h2>
            <p className="text-sm text-ink-muted">Set work and deadlines for {subjectName}</p>
          </div>
        )}
        <button className={`btn-primary ${standalone ? "ml-auto" : ""}`} onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Assignment
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="card space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          subtitle="Create an assignment with a due date."
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const d = dueInfo(a.dueDate);
            return (
              <div
                key={a._id}
                className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink">{a.title}</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {!subjectId && a.subject?.subjectCode ? `${a.subject.subjectCode} · ` : ""}
                    Due {shortDate(a.dueDate)} ·{" "}
                    <span className={d.tone === "over" ? "font-semibold text-slate-900" : ""}>
                      {d.text}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button className="btn-secondary btn-sm" onClick={() => setSubsFor(a)}>
                    <Users className="h-3.5 w-3.5" /> {a.submissionCount || 0} submissions
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setToDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New Assignment" : "Edit Assignment"}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}

          {!subjectId && modal?.mode === "create" && (
            <div>
              <label className="label">Subject</label>
              <select
                required
                className="input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                <option value="">— Select a subject —</option>
                {allSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subjectCode} · {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Title</label>
            <input
              required
              className="input"
              placeholder="Assignment 01 — …"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea
              rows={3}
              className="input"
              placeholder="What students need to do…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Due date &amp; time</label>
            <input
              required
              type="datetime-local"
              className="input sm:max-w-xs"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              Brief file <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Dropzone value={form.file} onChange={(f) => setForm({ ...form, file: f })} accept={ACCEPT} />
            {modal?.mode === "edit" && modal.assignment.fileName && !form.file && (
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={form.removeFile}
                  onChange={(e) => setForm({ ...form, removeFile: e.target.checked })}
                />
                Remove current file ({modal.assignment.fileName})
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <SubmissionsModal
        assignment={subsFor}
        open={!!subsFor}
        onClose={() => setSubsFor(null)}
        onGraded={refetch}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete assignment"
        message={`Delete "${toDelete?.title}"? All student submissions for it will also be removed.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </section>
  );
}
