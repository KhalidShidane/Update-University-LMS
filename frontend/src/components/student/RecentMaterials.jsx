import { Link } from "react-router-dom";
import { Eye, Download } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import useFetch from "../../hooks/useFetch";
import { EmptyState, Alert } from "../ui";
import FileIcon, { isViewable } from "../FileIcon";
import { downloadLesson } from "../../utils/lessonFiles";
import { timeAgo } from "../../utils/format";

export default function RecentMaterials() {
  const toast = useToast();
  const { data, loading, error } = useFetch("/lessons?limit=6");
  const materials = data?.data || [];

  const download = async (m) => {
    try {
      await downloadLesson(m._id, m.fileName);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Recent Materials</h2>
        <Link to="/student/subjects" className="text-sm font-semibold text-brand-600 hover:underline">
          All subjects
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="card space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials yet"
          subtitle="New materials uploaded by your lecturers will appear here."
        />
      ) : (
        <div className="table-wrap divide-y divide-slate-100">
          {materials.map((m) => (
            <div
              key={m._id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <FileIcon type={m.fileType} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{m.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    <span className="font-semibold uppercase">{m.fileType}</span>
                    {" · "}
                    {m.subject?.subjectName || "Subject"}
                    {" · "}
                    Uploaded {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {isViewable(m.fileType) && m.subject?._id && (
                  <Link
                    to={`/student/subjects/${m.subject._id}/lessons/${m._id}`}
                    className="btn-secondary btn-sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                )}
                <button className="btn-secondary btn-sm" onClick={() => download(m)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
