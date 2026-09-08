import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { formatBytes } from "../utils/lessonFiles";

const EXT_LABEL = {
  pdf: "PDF",
  docx: "Word",
  doc: "Word",
  pptx: "PowerPoint",
  ppt: "PowerPoint",
  xlsx: "Excel",
  xls: "Excel",
  zip: "ZIP",
  txt: "Text",
  csv: "CSV",
};

function extOf(name = "") {
  return name.split(".").pop()?.toLowerCase() || "";
}

/**
 * Drag & drop file picker.
 * props: value (File|null), onChange(File|null), accept (['pdf','docx','pptx']),
 *        maxSizeMB, currentName (existing file name when editing)
 */
export default function Dropzone({
  value,
  onChange,
  accept = ["pdf", "docx", "pptx"],
  maxSizeMB = 15,
  currentName,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const acceptAttr = accept.map((e) => `.${e}`).join(",");

  const validate = useCallback(
    (file) => {
      if (!file) return;
      const ext = extOf(file.name);
      if (!accept.includes(ext)) {
        setError(`Unsupported file type. Allowed: ${accept.map((e) => EXT_LABEL[e] || e).join(", ")}.`);
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is larger than ${maxSizeMB} MB.`);
        return;
      }
      setError("");
      onChange(file);
    },
    [accept, maxSizeMB, onChange]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    validate(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        <span
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
            dragging ? "bg-brand-600 text-white" : "bg-white text-brand-500 shadow-sm"
          }`}
        >
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-ink">
          <span className="text-brand-600">Click to upload</span> or drag & drop
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {accept.map((e) => e.toUpperCase()).join(" · ")} — up to {maxSizeMB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => validate(e.target.files?.[0])}
        />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-slate-600">{error}</p>}

      {value ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{value.name}</p>
            <p className="text-xs text-ink-muted">{formatBytes(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setError("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        currentName && (
          <p className="mt-2 text-xs text-ink-muted">
            Current file: <span className="font-medium text-ink-soft">{currentName}</span> — choose a
            new file to replace it.
          </p>
        )
      )}
    </div>
  );
}
