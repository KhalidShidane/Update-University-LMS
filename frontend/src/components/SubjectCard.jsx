import { Link } from "react-router-dom";
import { BookOpen, FileText, User, ArrowRight } from "lucide-react";
import { assetUrl } from "../utils/assets";

export default function SubjectCard({ subject, to, showTeacher = true }) {
  const lessons = subject.lessonCount ?? subject.lessons?.length ?? 0;
  const image = subject.imageUrl ? assetUrl(subject.imageUrl) : "";
  const inactive = subject.status === "inactive";

  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-400">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 badge bg-white/90 font-mono text-[11px] text-ink-soft shadow-sm">
          {subject.subjectCode}
        </span>
        {inactive && (
          <span className="absolute right-3 top-3 badge bg-slate-200 text-slate-700 shadow-sm">
            Inactive
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-semibold text-ink">{subject.subjectName}</h3>

        {showTeacher && subject.teacher?.user?.fullName && (
          <p className="flex items-center gap-1.5 text-sm text-ink-muted">
            <User className="h-3.5 w-3.5" /> {subject.teacher.user.fullName}
          </p>
        )}

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-ink-muted">
          {subject.description || "No description provided for this subject yet."}
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <FileText className="h-3.5 w-3.5" />
            {lessons} lesson{lessons === 1 ? "" : "s"}
          </span>
          <span className="btn-primary btn-sm">
            View Subject <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
