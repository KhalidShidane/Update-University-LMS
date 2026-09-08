import { BookOpen } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import SubjectCard from "../../components/SubjectCard";
import { Alert, EmptyState, PageHeader, CardsSkeleton } from "../../components/ui";

export default function TeacherSubjects() {
  const { data, loading, error } = useFetch("/subjects");
  const subjects = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="My Subjects"
        subtitle="Subjects assigned to you — open one to manage its lessons"
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <CardsSkeleton count={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects assigned"
          subtitle="When an administrator assigns you a subject it will appear here."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <SubjectCard
              key={s._id}
              subject={s}
              to={`/teacher/subjects/${s._id}`}
              showTeacher={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
