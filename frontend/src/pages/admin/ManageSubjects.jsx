import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, FileText } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import {
  Alert,
  Badge,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  TableSkeleton,
  Spinner,
} from "../../components/ui";
import ImagePicker from "../../components/ImagePicker";
import { assetUrl } from "../../utils/assets";

const empty = {
  subjectName: "",
  subjectCode: "",
  description: "",
  status: "active",
  class: "",
  teacher: "",
  image: null,
  removeImage: false,
};

export default function ManageSubjects() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/subjects");
  const classesRes = useFetch("/classes");
  const teachersRes = useFetch("/teachers");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const classes = classesRes.data?.data || [];
  const teachers = teachersRes.data?.data || [];

  const openCreate = () => {
    setForm(empty);
    setFormError("");
    setModal({ mode: "create" });
  };
  const openEdit = (s) => {
    setForm({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      description: s.description || "",
      status: s.status || "active",
      class: s.class?._id || "",
      teacher: s.teacher?._id || "",
      image: null,
      removeImage: false,
    });
    setFormError("");
    setModal({ mode: "edit", item: s });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const fd = new FormData();
    fd.append("subjectName", form.subjectName);
    fd.append("subjectCode", form.subjectCode);
    fd.append("description", form.description);
    fd.append("status", form.status);
    fd.append("class", form.class);
    fd.append("teacher", form.teacher);
    if (form.image) fd.append("image", form.image);
    if (form.removeImage) fd.append("removeImage", "true");

    try {
      if (modal.mode === "create") {
        await api.post("/subjects", fd);
        toast.success("Subject created");
      } else {
        await api.put(`/subjects/${modal.item._id}`, fd);
        toast.success("Subject updated");
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
      await api.delete(`/subjects/${toDelete._id}`);
      toast.success("Subject deleted");
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const subjects = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="Subjects"
        subtitle="Each subject has an image, a description, a class and an assigned teacher"
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Subject
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <TableSkeleton cols={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          subtitle="Create a subject and assign a class and a teacher."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Subject
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="th">Subject</th>
                  <th className="th">Class</th>
                  <th className="th">Teacher</th>
                  <th className="th">Status</th>
                  <th className="th">Lessons</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s._id} className="row-hover">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        {s.imageUrl ? (
                          <img
                            src={assetUrl(s.imageUrl)}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                            <BookOpen className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{s.subjectName}</p>
                          <p className="font-mono text-xs text-ink-muted">{s.subjectCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">{s.class?.className || "—"}</td>
                    <td className="td">{s.teacher?.user?.fullName || "—"}</td>
                    <td className="td">
                      {s.status === "inactive" ? (
                        <Badge color="slate">Inactive</Badge>
                      ) : (
                        <Badge color="green">Active</Badge>
                      )}
                    </td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <FileText className="h-3.5 w-3.5" /> {s.lessonCount ?? 0}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setToDelete(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New Subject" : "Edit Subject"}
        description="Students see this subject as a visual card in their class."
        wide
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Subject name</label>
              <input
                required
                className="input"
                placeholder="Operating Systems"
                value={form.subjectName}
                onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Subject code</label>
              <input
                required
                className="input"
                placeholder="CS202"
                value={form.subjectCode}
                onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input"
              placeholder="What this subject covers…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Subject image</label>
            <ImagePicker
              title="Add a subject image"
              value={form.image}
              onChange={(image) => setForm({ ...form, image, removeImage: false })}
              currentUrl={modal?.mode === "edit" && !form.removeImage ? modal.item.imageUrl : ""}
              onClear={() => setForm((f) => ({ ...f, image: null, removeImage: true }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div>
              <label className="label">Teacher / Instructor</label>
              <select
                required
                className="input"
                value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              >
                <option value="">— Select a teacher —</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.user?.fullName}
                    {t.department ? ` · ${t.department}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="flex gap-2">
              {["active", "inactive"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setForm({ ...form, status: st })}
                  className={`btn-sm rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                    form.status === st
                      ? st === "active"
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-slate-400 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-ink-muted hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <p className="field-hint">Inactive subjects are hidden from students.</p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete subject"
        message={`Delete "${toDelete?.subjectName}"? This is blocked while it still has lessons.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
