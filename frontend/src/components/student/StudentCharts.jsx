import { Link } from "react-router-dom";
import { ClipboardList, BookOpen } from "lucide-react";
import { BarList, Donut } from "../charts";

const STATUS_META = [
  { key: "pending", label: "Pending", color: "#94a3b8" },
  { key: "submitted", label: "Submitted", color: "#3BA9D8" },
  { key: "late", label: "Late", color: "#475569" },
  { key: "completed", label: "Completed", color: "#18A05A" },
];

export default function StudentCharts({ assignments = [], subjects = [], loading }) {
  const statusData = STATUS_META.map((m) => ({
    label: m.label,
    color: m.color,
    value: assignments.filter((a) => a.status === m.key).length,
  }));

  const materialsData = [...subjects]
    .map((s) => ({ label: s.subjectName, value: s.lessonCount || 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Overview</h2>
        <Link
          to="/student/assignments"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          My Assignments
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-52 w-full" />
          <div className="skeleton h-52 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold text-ink">Assignment status</h3>
            <p className="mb-5 mt-0.5 text-sm text-ink-muted">
              {assignments.length} assignment{assignments.length === 1 ? "" : "s"} in total
            </p>
            <Donut
              data={statusData}
              centerLabel="assignments"
              emptyIcon={ClipboardList}
              emptyTitle="No assignments yet"
              emptyHint="Your lecturers haven't set any assignments."
            />
          </div>

          <div className="card">
            <h3 className="font-semibold text-ink">Materials by subject</h3>
            <p className="mb-5 mt-0.5 text-sm text-ink-muted">Lesson files available per subject</p>
            <BarList
              data={materialsData}
              emptyIcon={BookOpen}
              emptyTitle="No materials yet"
              emptyHint="Materials uploaded by your lecturers will appear here."
            />
          </div>
        </div>
      )}
    </section>
  );
}
