import { Link } from "react-router-dom";
import { School, Users, GraduationCap, BookOpen, ArrowRight, PieChart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useFetch from "../../hooks/useFetch";
import { PageHeader, Alert, StatCard, CardsSkeleton } from "../../components/ui";
import { BarList, Donut, FILE_TYPE_COLORS } from "../../components/charts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const classes = useFetch("/classes");
  const students = useFetch("/students");
  const teachers = useFetch("/teachers");
  const subjects = useFetch("/subjects");
  const lessons = useFetch("/lessons");

  const loading =
    classes.loading || students.loading || teachers.loading || subjects.loading || lessons.loading;
  const error =
    classes.error || students.error || teachers.error || subjects.error || lessons.error;

  const classList = classes.data?.data || [];
  const lessonList = lessons.data?.data || [];

  const studentsPerClass = [...classList]
    .sort((a, b) => b.studentCount - a.studentCount)
    .map((c) => ({ label: c.className, value: c.studentCount || 0 }));

  const subjectsPerClass = [...classList]
    .sort((a, b) => b.subjectCount - a.subjectCount)
    .map((c) => ({ label: c.className, value: c.subjectCount || 0 }));

  const byType = ["pdf", "docx", "pptx"].map((t) => ({
    label: t.toUpperCase(),
    value: lessonList.filter((l) => l.fileType === t).length,
    color: FILE_TYPE_COLORS[t],
  }));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(" ")[0]}`}
        subtitle="Overview of the university learning management system"
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <CardsSkeleton count={4} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Classes" value={classes.data?.count ?? 0} icon={School} tone="brand" />
            <StatCard label="Students" value={students.data?.count ?? 0} icon={Users} tone="accent" />
            <StatCard label="Teachers" value={teachers.data?.count ?? 0} icon={GraduationCap} tone="brand" />
            <StatCard label="Subjects" value={subjects.data?.count ?? 0} icon={BookOpen} tone="accent" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold text-ink">Students per class</h2>
              <p className="mb-5 mt-0.5 text-sm text-ink-muted">Enrollment across all cohorts</p>
              <BarList
                data={studentsPerClass}
                emptyIcon={Users}
                emptyTitle="No classes yet"
                emptyHint="Create classes and assign students to see enrollment."
              />
            </div>

            <div className="card">
              <h2 className="font-semibold text-ink">Subjects per class</h2>
              <p className="mb-5 mt-0.5 text-sm text-ink-muted">How many subjects each class offers</p>
              <BarList
                data={subjectsPerClass}
                emptyIcon={BookOpen}
                emptyTitle="No classes yet"
                emptyHint="Create classes and subjects to see this breakdown."
              />
            </div>

            <div className="card">
              <h2 className="font-semibold text-ink">Lesson materials by type</h2>
              <p className="mb-5 mt-0.5 text-sm text-ink-muted">
                {lessonList.length} file{lessonList.length === 1 ? "" : "s"} uploaded by teachers
              </p>
              <Donut
                data={byType}
                centerLabel="lessons"
                emptyIcon={PieChart}
                emptyTitle="No lessons yet"
                emptyHint="Teachers haven't uploaded any lesson files."
              />
            </div>

            <div className="card">
              <h2 className="font-semibold text-ink">Quick actions</h2>
              <div className="mt-4 space-y-2">
                {[
                  { to: "/admin/classes", label: "Manage classes", icon: School },
                  { to: "/admin/students", label: "Manage students", icon: Users },
                  { to: "/admin/teachers", label: "Manage teachers", icon: GraduationCap },
                  { to: "/admin/subjects", label: "Manage subjects", icon: BookOpen },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:bg-brand-50/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-brand-500" /> {label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
