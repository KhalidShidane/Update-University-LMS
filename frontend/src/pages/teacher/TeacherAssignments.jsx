import { ClipboardList } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { PageHeader, PageLoader } from "../../components/ui";
import TeacherAssignmentsPanel from "../../components/teacher/TeacherAssignmentsPanel";

export default function TeacherAssignments() {
  const { data, loading } = useFetch("/subjects");
  if (loading) return <PageLoader label="Loading" />;

  const subjects = data?.data || [];

  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="Assignments"
        subtitle="Every assignment across your subjects — review and grade submissions"
      />
      <TeacherAssignmentsPanel subjects={subjects} standalone />
    </div>
  );
}
