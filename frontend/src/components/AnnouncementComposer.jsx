import { useState, useEffect } from "react";
import api from "../api/axios";
import { Modal, Alert, Spinner } from "./ui";

const empty = { title: "", body: "", priority: "normal", audience: "all", class: "", subject: "" };

/**
 * Create / edit an announcement.
 * props:
 *   open, onClose, onSaved
 *   editing        announcement being edited (or null to create)
 *   mode           "admin" | "teacher"
 *   lockSubject    { _id, subjectName } — teacher composing for one subject (audience forced to subject)
 *   classes        [{_id, className}]  (admin only)
 *   subjects       [{_id, subjectName, subjectCode}] (admin only)
 */
export default function AnnouncementComposer({
  open,
  onClose,
  onSaved,
  editing,
  mode = "admin",
  lockSubject,
  classes = [],
  subjects = [],
}) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        body: editing.body,
        priority: editing.priority,
        audience: editing.audience,
        class: editing.class?._id || editing.class || "",
        subject: editing.subject?._id || editing.subject || "",
      });
    } else if (lockSubject) {
      setForm({ ...empty, audience: "subject", subject: lockSubject._id });
    } else {
      setForm(empty);
    }
    setError("");
  }, [open, editing, lockSubject]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        priority: form.priority,
      };
      if (!editing) {
        payload.audience = lockSubject ? "subject" : form.audience;
        if (payload.audience === "class") payload.class = form.class;
        if (payload.audience === "subject") payload.subject = lockSubject?._id || form.subject;
      }
      if (editing) await api.put(`/announcements/${editing._id}`, payload);
      else await api.post("/announcements", payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit announcement" : "New announcement"}
      description={lockSubject ? `Posted to ${lockSubject.subjectName}` : undefined}
    >
      <form onSubmit={save} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div>
          <label className="label">Title</label>
          <input
            required
            className="input"
            placeholder="Midterm exam schedule published"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Message</label>
          <textarea
            required
            rows={4}
            className="input"
            placeholder="Write the announcement details…"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>

        {!editing && !lockSubject && (
          <div>
            <label className="label">Audience</label>
            <select
              className="input"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              {mode === "admin" && <option value="all">Whole university</option>}
              <option value="class">A specific class</option>
              <option value="subject">A specific subject</option>
            </select>
          </div>
        )}

        {!editing && !lockSubject && form.audience === "class" && (
          <div>
            <label className="label">Class</label>
            <select
              required
              className="input"
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
            >
              <option value="">— Select a class —</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>
        )}

        {!editing && !lockSubject && form.audience === "subject" && (
          <div>
            <label className="label">Subject</label>
            <select
              required
              className="input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              <option value="">— Select a subject —</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subjectCode} · {s.subjectName}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={form.priority === "important"}
            onChange={(e) => setForm({ ...form, priority: e.target.checked ? "important" : "normal" })}
          />
          Mark as important
        </label>

        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : editing ? "Save" : "Post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
