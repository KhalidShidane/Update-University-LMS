import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Download, FileText, User } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useToast } from "../../context/ToastContext";
import { Alert, EmptyState, PageHeader, PageLoader } from "../../components/ui";
import LessonCard from "../../components/LessonCard";
import { downloadLesson } from "../../utils/lessonFiles";
import { assetUrl } from "../../utils/assets";

export default function StudentSubjectDetails() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error } = useFetch(`/subjects/${id}`);

  if (loading) return <PageLoader label="Loading subject" />;
  if (error) return <Alert>{error}</Alert>;

  const subject = data?.data;
  const lessons = subject?.lessons || [];

  const handleDownload = async (lesson) => {
    try {
      await downloadLesson(lesson._id, lesson.fileName);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Link
        to="/student/subjects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> My subjects
      </Link>

      <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        {subject.imageUrl && (
          <img
            src={assetUrl(subject.imageUrl)}
            alt=""
            className="h-44 w-full object-cover sm:h-56"
          />
        )}
        <div className="p-6">
          <span className="badge bg-slate-100 font-mono text-[11px] text-ink-muted">
            {subject.subjectCode}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-ink">{subject.subjectName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {subject.teacher?.user?.fullName || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            </span>
          </p>
          {subject.description && (
            <p className="mt-3 max-w-2xl text-sm text-ink-soft">{subject.description}</p>
          )}
        </div>
      </div>

      <PageHeader title="Lesson materials" subtitle="View lessons in your browser or download them" />

      {lessons.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No lessons yet"
          subtitle="Your teacher has not uploaded any materials for this subject."
        />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              actions={
                <>
                  <Link
                    to={`/student/subjects/${id}/lessons/${lesson._id}`}
                    className="btn-primary btn-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <button className="btn-secondary btn-sm" onClick={() => handleDownload(lesson)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
