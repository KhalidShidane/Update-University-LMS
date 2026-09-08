import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { Alert, PageHeader, PageLoader, fileTypeBadge } from "../../components/ui";
import DocumentViewer from "../../components/DocumentViewer";
import { downloadLesson, formatBytes } from "../../utils/lessonFiles";
import { assetUrl } from "../../utils/assets";

export default function LessonViewer() {
  const { subjectId, lessonId } = useParams();
  const { data, loading, error } = useFetch(`/lessons/${lessonId}`);

  if (loading) return <PageLoader label="Loading lesson" />;
  if (error) return <Alert>{error}</Alert>;

  const lesson = data?.data;

  return (
    <div>
      <Link
        to={`/student/subjects/${subjectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to subject
      </Link>

      <PageHeader
        title={lesson.title}
        subtitle={lesson.subject?.subjectName}
        action={
          <button className="btn-primary" onClick={() => downloadLesson(lesson._id, lesson.fileName)}>
            <Download className="h-4 w-4" /> Download
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <span className={`badge ${fileTypeBadge(lesson.fileType)} uppercase`}>{lesson.fileType}</span>
        <span>{lesson.fileName}</span>
        <span>·</span>
        <span>{formatBytes(lesson.fileSize)}</span>
      </div>

      {lesson.coverUrl && (
        <img
          src={assetUrl(lesson.coverUrl)}
          alt=""
          className="mb-4 h-48 w-full rounded-2xl object-cover ring-1 ring-slate-200"
        />
      )}

      {lesson.description && (
        <div className="card mb-4">
          <p className="text-sm text-ink-soft">{lesson.description}</p>
        </div>
      )}

      <DocumentViewer lesson={lesson} height="80vh" />
    </div>
  );
}
