import { Link } from "react-router-dom";
import { BookOpen, FileText, ClipboardList, User, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import { Alert, PageHeader, StatCard, CardsSkeleton, EmptyState } from "../../components/ui";
import { assetUrl } from "../../utils/assets";
import RecentMaterials from "../../components/student/RecentMaterials";
import StudentCharts from "../../components/student/StudentCharts";
import Announcements from "../../components/student/Announcements";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch("/subjects");
  const assignmentsRes = useFetch("/assignments");
  const klass = user?.student?.class;

  const subjects = data?.data || [];
  const assignments = assignmentsRes.data?.data || [];
  const totalLessons = subjects.reduce((n, s) => n + (s.lessonCount || 0), 0);
  const openAssignments = assignments.filter(
    (a) => a.status === "pending" || a.status === "late"
  ).length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(" ")[0]}`}
        subtitle={klass ? `${klass.className} · ${klass.academicYear}` : "Awaiting class assignment"}
      />

      {error && <Alert>{error}</Alert>}

      {!klass ? (
        <Alert type="info">
          An administrator has not assigned you to a class yet. Once you are assigned, your subjects
          and lesson materials will appear here.
        </Alert>
      ) : loading ? (
        <CardsSkeleton count={3} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <Link to="/student/assignments" className="block">
              <StatCard
                label="My Assignments"
                value={assignments.length}
                hint={openAssignments ? `${openAssignments} still to submit` : "All caught up"}
                icon={ClipboardList}
                tone="brand"
              />
            </Link>
            <StatCard label="Subjects" value={subjects.length} icon={BookOpen} tone="accent" />
            <StatCard label="Lessons available" value={totalLessons} icon={FileText} tone="brand" />
          </div>

          <div className="mt-9 mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Your subjects</h2>
            <Link to="/student/subjects" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              subtitle="Your class has no subjects assigned yet. Check back soon."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <Link
                  key={s._id}
                  to={`/student/subjects/${s._id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  {/* Subject image */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
                    {s.imageUrl ? (
                      <img
                        src={assetUrl(s.imageUrl)}
                        alt={s.subjectName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-400">
                        <BookOpen className="h-9 w-9" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 badge bg-white/90 font-mono text-[11px] text-ink-soft shadow-sm">
                      {s.subjectCode}
                    </span>
                  </div>

                  {/* Name + teacher */}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="font-semibold text-ink">{s.subjectName}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <User className="h-3.5 w-3.5" />
                      {s.teacher?.user?.fullName || "Instructor not assigned"}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <FileText className="h-3.5 w-3.5" />
                        {s.lessonCount || 0} lesson{(s.lessonCount || 0) === 1 ? "" : "s"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-brand-500 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* --- Academic sections --- */}
          <div className="mt-10">
            <StudentCharts
              assignments={assignments}
              subjects={subjects}
              loading={assignmentsRes.loading}
            />
          </div>
          <div className="mt-10">
            <RecentMaterials />
          </div>
          <div className="mt-10">
            <Announcements />
          </div>
        </>
      )}
    </div>
  );
}
