import { Link } from "react-router-dom";
import { BookOpen, FileText, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import { Alert, PageHeader, StatCard, CardsSkeleton, EmptyState } from "../../components/ui";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch("/subjects");

  const subjects = data?.data || [];
  const totalLessons = subjects.reduce((n, s) => n + (s.lessonCount || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(" ")[0]}`}
        subtitle="Your teaching overview and assigned subjects"
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <CardsSkeleton count={2} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-lg">
          <StatCard label="Assigned subjects" value={subjects.length} icon={BookOpen} tone="brand" />
          <StatCard label="Lessons uploaded" value={totalLessons} icon={FileText} tone="accent" />
        </div>
      )}

      <div className="mt-9 mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Your subjects</h2>
        <Link to="/teacher/subjects" className="text-sm font-semibold text-brand-600 hover:underline">
          View all
        </Link>
      </div>

      {!loading && subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects assigned yet"
          subtitle="An administrator assigns subjects to you. They will appear here once assigned."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => (
            <Link
              key={s._id}
              to={`/teacher/subjects/${s._id}`}
              className="group card flex items-center justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{s.subjectName}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {s.class?.className} · {s.lessonCount || 0} lesson{(s.lessonCount || 0) === 1 ? "" : "s"}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Upload className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
