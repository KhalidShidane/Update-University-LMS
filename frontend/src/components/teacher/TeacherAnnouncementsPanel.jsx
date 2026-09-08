import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import { Alert, ConfirmDialog, EmptyState } from "../ui";
import AnnouncementItem from "../AnnouncementItem";
import AnnouncementComposer from "../AnnouncementComposer";

export default function TeacherAnnouncementsPanel({ subject }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/announcements");
  const [composer, setComposer] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(
    () => (data?.data || []).filter((a) => String(a.subject?._id) === String(subject._id)),
    [data, subject._id]
  );

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/announcements/${toDelete._id}`);
      toast.success("Announcement deleted");
      setToDelete(null);
      refetch();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Announcements</h2>
          <p className="text-sm text-ink-muted">Post updates to students taking {subject.subjectName}</p>
        </div>
        <button className="btn-primary" onClick={() => setComposer({ editing: null })}>
          <Plus className="h-4 w-4" /> Post Announcement
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          subtitle="Post an update and your students will see it on their dashboard."
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AnnouncementItem
              key={a._id}
              a={a}
              actions={
                <>
                  <button className="btn-ghost btn-sm" onClick={() => setComposer({ editing: a })}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setToDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      <AnnouncementComposer
        open={!!composer}
        editing={composer?.editing || null}
        mode="teacher"
        lockSubject={composer?.editing ? null : subject}
        onClose={() => setComposer(null)}
        onSaved={() => {
          toast.success(composer?.editing ? "Announcement updated" : "Announcement posted");
          refetch();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete announcement"
        message={`Delete "${toDelete?.title}"?`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </section>
  );
}
