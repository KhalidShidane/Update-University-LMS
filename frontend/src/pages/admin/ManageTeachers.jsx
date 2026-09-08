import { useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, BookOpen } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  TableSkeleton,
  Spinner,
} from "../../components/ui";
import Avatar from "../../components/Avatar";

const empty = { fullName: "", email: "", password: "", department: "" };

export default function ManageTeachers() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/teachers");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm(empty);
    setFormError("");
    setModal({ mode: "create" });
  };
  const openEdit = (t) => {
    setForm({
      fullName: t.user?.fullName || "",
      email: t.user?.email || "",
      password: "",
      department: t.department || "",
    });
    setFormError("");
    setModal({ mode: "edit", item: t });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = { ...form };
    if (modal.mode === "edit" && !payload.password) delete payload.password;
    try {
      if (modal.mode === "create") {
        await api.post("/teachers", payload);
        toast.success("Teacher created");
      } else {
        await api.put(`/teachers/${modal.item._id}`, payload);
        toast.success("Teacher updated");
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
      await api.delete(`/teachers/${toDelete._id}`);
      toast.success("Teacher deleted");
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const teachers = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="Teachers"
        subtitle="Create teacher accounts to assign to subjects"
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Teacher
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <TableSkeleton cols={4} />
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          subtitle="Add your first teacher account."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Teacher
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="th">Teacher</th>
                  <th className="th">Department</th>
                  <th className="th">Subjects</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t._id} className="row-hover">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.user?.fullName} src={t.user?.avatarUrl} size="sm" />
                        <div>
                          <p className="font-semibold text-ink">{t.user?.fullName}</p>
                          <p className="text-xs text-ink-muted">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">{t.department || "—"}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <BookOpen className="h-3.5 w-3.5" /> {t.subjectCount}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setToDelete(t)}
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
        title={modal?.mode === "create" ? "New Teacher" : "Edit Teacher"}
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
              <label className="label">Department</label>
              <input
                className="input"
                placeholder="Computer Science"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
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
        title="Delete teacher"
        message={`Delete "${toDelete?.user?.fullName}"? This is blocked while they still have subjects assigned.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
