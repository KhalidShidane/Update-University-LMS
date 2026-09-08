const styles = {
  pending: { cls: "bg-slate-100 text-slate-600", label: "Pending" },
  submitted: { cls: "bg-accent-100 text-accent-700", label: "Submitted" },
  late: { cls: "bg-slate-800 text-white", label: "Late" },
  completed: { cls: "bg-brand-100 text-brand-700", label: "Completed" },
};

export default function AssignmentStatusBadge({ status }) {
  const s = styles[status] || styles.pending;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export { styles as assignmentStatusStyles };
