import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
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
import Avatar from "../../components/Avatar";

const empty = { fullName: "", email: "", password: "", studentId: "", class: "" };

export default function ManageStudents() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/students");
  const classesRes = useFetch("/classes");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");

  const classes = classesRes.data?.data || [];
  const students = data?.data || [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;
    return students.filter(
      (x) =>
        x.user?.fullName?.toLowerCase().includes(s) ||
        x.user?.email?.toLowerCase().includes(s) ||
        x.studentId?.toLowerCase().includes(s) ||
        x.class?.className?.toLowerCase().includes(s)
    );
  }, [students, q]);

  const openCreate = () => {
    setForm(empty);
    setFormError("");
    setModal({ mode: "create" });
  };
  const openEdit = (s) => {
    setForm({
      fullName: s.user?.fullName || "",
      email: s.user?.email || "",
      password: "",
      studentId: s.studentId,
      class: s.class?._id || "",
    });
    setFormError("");
    setModal({ mode: "edit", item: s });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = { ...form, class: form.class || null };
    if (modal.mode === "edit" && !payload.password) delete payload.password;
    try {
      if (modal.mode === "create") {
        await api.post("/students", payload);
        toast.success("Student created");
      } else {
        await api.put(`/students/${modal.item._id}`, payload);
        toast.success("Student updated");
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
      await api.delete(`/students/${toDelete._id}`);
      toast.success("Student deleted");
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Students"
        subtitle="Create student accounts and assign them to classes"
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Student
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <TableSkeleton cols={5} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          subtitle="Add your first student, then assign them to a class."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Student
            </button>
          }
        />
      ) : (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search students…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr>
                    <th className="th">Student</th>
                    <th className="th">Student ID</th>
                    <th className="th">Class</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s._id} className="row-hover">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.user?.fullName} src={s.user?.avatarUrl} size="sm" />
                          <div>
                            <p className="font-semibold text-ink">{s.user?.fullName}</p>
                            <p className="text-xs text-ink-muted">{s.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td font-mono text-xs">{s.studentId}</td>
                      <td className="td">
                        {s.class ? (
                          <Badge color="brand">{s.class.className}</Badge>
                        ) : (
                          <Badge color="slate">Unassigned</Badge>
                        )}
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
                  {filtered.length === 0 && (
                    <tr>
                      <td className="td text-center text-ink-muted" colSpan={4}>
                        No students match “{q}”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "New Student" : "Edit Student"}
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <div>
            <label className="label">Full name</label>
            <input
              required
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Student ID</label>
              <input
                required
                className="input"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Password{" "}
                {modal?.mode === "edit" && <span className="font-normal text-slate-400">(blank = keep)</span>}
              </label>
              <input
                type="password"
                required={modal?.mode === "create"}
                minLength={6}
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Class</label>
              <select
                className="input"
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
              >
                <option value="">— Unassigned —</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>
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
        title="Delete student"
        message={`Delete "${toDelete?.user?.fullName}"? Their account will be removed permanently.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
