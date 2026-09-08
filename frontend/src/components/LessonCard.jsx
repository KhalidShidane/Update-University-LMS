import { FileText, Presentation, FileType2, CalendarDays } from "lucide-react";
import { fileTypeBadge } from "./ui";
import { formatBytes } from "../utils/lessonFiles";
import { assetUrl } from "../utils/assets";

const ICONS = { pdf: FileText, docx: FileType2, pptx: Presentation };

export default function LessonCard({ lesson, actions }) {
  const Icon = ICONS[lesson.fileType] || FileText;
  const cover = lesson.coverUrl ? assetUrl(lesson.coverUrl) : "";

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-16 w-24 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${fileTypeBadge(
              lesson.fileType
            )}`}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{lesson.title}</h3>
            <span className={`badge ${fileTypeBadge(lesson.fileType)} uppercase`}>{lesson.fileType}</span>
          </div>
          {lesson.description && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{lesson.description}</p>
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="truncate">{lesson.fileName}</span>
            <span>{formatBytes(lesson.fileSize)}</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {new Date(lesson.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
