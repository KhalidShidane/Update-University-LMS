import { ClipboardList } from "lucide-react";
import { PageHeader } from "../../components/ui";
import AssignmentsDeadlines from "../../components/student/AssignmentsDeadlines";

export default function StudentAssignments() {
  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="My Assignments"
        subtitle="Everything set by your lecturers — open one, do the work, and submit before the deadline"
      />
      <AssignmentsDeadlines limit={0} showViewAll={false} heading="All assignments" />
    </div>
  );
}
