import { FileText, FileType2, Presentation, FileSpreadsheet, FileArchive, File } from "lucide-react";

const MAP = {
  pdf: { Icon: FileText, cls: "bg-brand-100 text-brand-700" },
  docx: { Icon: FileType2, cls: "bg-accent-100 text-accent-700" },
  doc: { Icon: FileType2, cls: "bg-accent-100 text-accent-700" },
  pptx: { Icon: Presentation, cls: "bg-slate-100 text-slate-600" },
  ppt: { Icon: Presentation, cls: "bg-slate-100 text-slate-600" },
  xlsx: { Icon: FileSpreadsheet, cls: "bg-brand-100 text-brand-700" },
  xls: { Icon: FileSpreadsheet, cls: "bg-brand-100 text-brand-700" },
  csv: { Icon: FileSpreadsheet, cls: "bg-brand-100 text-brand-700" },
  zip: { Icon: FileArchive, cls: "bg-slate-200 text-slate-700" },
  txt: { Icon: FileText, cls: "bg-slate-100 text-slate-600" },
};

const DEFAULT = { Icon: File, cls: "bg-slate-100 text-slate-600" };

export function fileMeta(type) {
  return MAP[String(type || "").toLowerCase()] || DEFAULT;
}

/** Whether this file type can be previewed in-browser (DocumentViewer). */
export function isViewable(type) {
  return ["pdf", "docx", "pptx"].includes(String(type || "").toLowerCase());
}

export default function FileIcon({ type, size = "md", className = "" }) {
  const { Icon, cls } = fileMeta(type);
  const box = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-11 w-11";
  const ic = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-xl ${cls} ${className}`}>
      <Icon className={ic} />
    </span>
  );
}
