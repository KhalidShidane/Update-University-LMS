import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Eye, Download, Pencil, Trash2, FileText, Users } from "lucide-react";
import api from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  PageLoader,
  Spinner,
} from "../../components/ui";
import Dropzone from "../../components/Dropzone";
import ImagePicker from "../../components/ImagePicker";
import LessonCard from "../../components/LessonCard";
import LessonPreviewModal from "../../components/LessonPreviewModal";
import TeacherAssignmentsPanel from "../../components/teacher/TeacherAssignmentsPanel";
import TeacherAnnouncementsPanel from "../../components/teacher/TeacherAnnouncementsPanel";
import { downloadLesson } from "../../utils/lessonFiles";
import { assetUrl } from "../../utils/assets";

const emptyForm = { title: "", description: "", file: null, cover: null, removeCover: false };

export default function TeacherSubjectDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(`/subjects/${id}`);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (loading) return <PageLoader label="Loading subject" />;
  if (error) return <Alert>{error}</Alert>;

  const subject = data?.data;
  const lessons = subject?.lessons || [];

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModal({ mode: "create" });
  };
  const openEdit = (lesson) => {
    setForm({
      title: lesson.title,
      description: lesson.description || "",
      file: null,
      cover: null,
      removeCover: false,
    });
    setFormError("");
    setModal({ mode: "edit", lesson });
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError("");
    if (modal.mode === "create" && !form.file) {
      setFormError("Please choose a PDF, DOCX or PPTX file.");
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    if (modal.mode === "create") fd.append("subject", id);
    if (form.file) fd.append("file", form.file);
    if (form.cover) fd.append("cover", form.cover);
    if (form.removeCover) fd.append("removeCover", "true");

    setSaving(true);
    try {
      if (modal.mode === "create") {
        await api.post("/lessons", fd);
        toast.success("Lesson uploaded");
      } else {
        await api.put(`/lessons/${modal.lesson._id}`, fd);
        toast.success("Lesson updated");
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
      await api.delete(`/lessons/${toDelete._id}`);
      toast.success("Lesson deleted");
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
      <Link
        to="/teacher/subjects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> My subjects
      </Link>

      <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        {subject.imageUrl && (
          <img src={assetUrl(subject.imageUrl)} alt="" className="h-40 w-full object-cover sm:h-52" />
        )}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-slate-100 font-mono text-[11px] text-ink-muted">
                {subject.subjectCode}
              </span>
              {subject.status === "inactive" && (
                <span className="badge bg-slate-100 text-slate-600">Inactive</span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-ink">{subject.subjectName}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {subject.class?.className} · {subject.class?.academicYear}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
              </span>
            </p>
            {subject.description && (
              <p className="mt-3 max-w-2xl text-sm text-ink-soft">{subject.description}</p>
            )}
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <Upload className="h-4 w-4" /> Upload Lesson
          </button>
        </div>
      </div>

      <PageHeader title="Lesson materials" subtitle="Students in the assigned class can view and download these" />

      {lessons.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No lessons yet"
          subtitle="Upload your first PDF, DOCX or PPTX for this subject."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Upload className="h-4 w-4" /> Upload Lesson
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              actions={
                <>
                  <button className="btn-secondary btn-sm" onClick={() => setPreview(lesson)}>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => downloadLesson(lesson._id, lesson.fileName)}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(lesson)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="btn-ghost btn-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setToDelete(lesson)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "create" ? "Upload Lesson" : "Edit Lesson"}
        description={
          modal?.mode === "create"
            ? `New lesson material for ${subject.subjectName}`
            : "Update the lesson details or replace its file"
        }
        wide
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <Alert>{formError}</Alert>}
          <div>
            <label className="label">Lesson title</label>
            <input
              required
              className="input"
              placeholder="Week 1 — Introduction"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input"
              placeholder="Short summary of what this lesson covers…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">
              Lesson file{" "}
              {modal?.mode === "edit" && (
                <span className="font-normal text-slate-400">(optional — replaces current)</span>
              )}
            </label>
            <Dropzone
              value={form.file}
              onChange={(file) => setForm({ ...form, file })}
              currentName={modal?.mode === "edit" ? modal.lesson.fileName : undefined}
            />
          </div>
          <div>
            <label className="label">Cover photo</label>
            <ImagePicker
              title="Add a cover photo"
              value={form.cover}
              onChange={(cover) => setForm({ ...form, cover, removeCover: false })}
              currentUrl={modal?.mode === "edit" && !form.removeCover ? modal.lesson.coverUrl : ""}
              onClear={() => setForm((f) => ({ ...f, cover: null, removeCover: true }))}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="h-4 w-4" /> {modal?.mode === "create" ? "Uploading…" : "Saving…"}
                </>
              ) : modal?.mode === "create" ? (
                "Upload lesson"
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      <LessonPreviewModal lesson={preview} open={!!preview} onClose={() => setPreview(null)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete lesson"
        message={`Delete "${toDelete?.title}"? The file will be removed permanently.`}
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
      />

      <TeacherAssignmentsPanel subjectId={id} subjectName={subject.subjectName} />
      <TeacherAnnouncementsPanel subject={subject} />
    </div>
  );
}
