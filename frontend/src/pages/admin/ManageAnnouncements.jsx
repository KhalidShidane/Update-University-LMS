import { useState } from "react";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  TableSkeleton,
} from "../../components/ui";
import AnnouncementItem from "../../components/AnnouncementItem";
import AnnouncementComposer from "../../components/AnnouncementComposer";

export default function ManageAnnouncements() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch("/announcements");
  const classesRes = useFetch("/classes");
  const subjectsRes = useFetch("/subjects");

  const [composer, setComposer] = useState(null); // { editing } | { editing: null }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const items = data?.data || [];

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
    <div>
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        subtitle="Post updates to the whole university, a class, or a single subject"
        action={
          <button className="btn-primary" onClick={() => setComposer({ editing: null })}>
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          subtitle="Create your first announcement."
          action={
            <button className="btn-primary" onClick={() => setComposer({ editing: null })}>
              <Plus className="h-4 w-4" /> New Announcement
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AnnouncementItem
              key={a._id}
              a={a}
              actions={
                <>
                  <span className="badge bg-slate-100 text-slate-600">
                    {a.audience === "all"
                      ? "University-wide"
                      : a.audience === "class"
                        ? `Class · ${a.class?.className || ""}`
                        : `Subject · ${a.subject?.subjectCode || ""}`}
                  </span>
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => setComposer({ editing: a })}
                  >
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
        mode="admin"
        classes={classesRes.data?.data || []}
        subjects={subjectsRes.data?.data || []}
        onClose={() => setComposer(null)}
        onSaved={() => {
          toast.success(composer?.editing ? "Announcement updated" : "Announcement posted");
          refetch();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete announcement"
        message={`Delete "${toDelete?.title}"? Students will no longer see it.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
