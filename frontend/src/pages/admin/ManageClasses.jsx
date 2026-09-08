import { useState } from "react";
import { Plus, Pencil, Trash2, School, Users, BookOpen } from "lucide-react";
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

const empty = { className: "", academicYear: "" };

export default function ManageClasses() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/classes");
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
  const openEdit = (item) => {
    setForm({ className: item.className, academicYear: item.academicYear });
    setFormError("");
    setModal({ mode: "edit", item });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (modal.mode === "create") {
        await api.post("/classes", form);
        toast.success("Class created");
      } else {
        await api.put(`/classes/${modal.item._id}`, form);
        toast.success("Class updated");
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
      await api.delete(`/classes/${toDelete._id}`);
      toast.success("Class deleted");
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const classes = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={School}
        title="Classes"
        subtitle="Cohorts that students and subjects belong to"
        action={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Class
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <TableSkeleton cols={5} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classes yet"
          subtitle="Create your first class to start building the platform."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Class
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="th">Class name</th>
                  <th className="th">Academic year</th>
                  <th className="th">Students</th>
                  <th className="th">Subjects</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <tr key={c._id} className="row-hover">
                    <td className="td font-semibold text-ink">{c.className}</td>
                    <td className="td">{c.academicYear}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <Users className="h-3.5 w-3.5" /> {c.studentCount}
                      </span>
                    </td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <BookOpen className="h-3.5 w-3.5" /> {c.subjectCount}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setToDelete(c)}
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
        title={modal?.mode === "create" ? "New Class" : "Edit Class"}
        description="Give the class a clear name and academic year."
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <div>
            <label className="label">Class name</label>
            <input
              required
              className="input"
              placeholder="Computer Science Year 2"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Academic year</label>
            <input
              required
              className="input"
              placeholder="2024/2025"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            />
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
        title="Delete class"
        message={`Delete "${toDelete?.className}"? Students in it will be unassigned. This cannot be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
