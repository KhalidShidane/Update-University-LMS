import { BookOpen } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import SubjectCard from "../../components/SubjectCard";
import { Alert, EmptyState, PageHeader, CardsSkeleton } from "../../components/ui";

export default function StudentSubjects() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch("/subjects");
  const klass = user?.student?.class;
  const subjects = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="My Subjects"
        subtitle={klass ? `${klass.className} · ${klass.academicYear}` : "No class assigned"}
      />

      {error && <Alert>{error}</Alert>}

      {!klass ? (
        <Alert type="info">
          You will see your subjects here once an administrator assigns you to a class.
        </Alert>
      ) : loading ? (
        <CardsSkeleton count={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          subtitle="Your class has no subjects assigned yet."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <SubjectCard key={s._id} subject={s} to={`/student/subjects/${s._id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
