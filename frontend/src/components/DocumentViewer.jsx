import { useEffect, useRef, useState } from "react";
import { Download, FileWarning } from "lucide-react";
import { Spinner } from "./ui";
import { getLessonBlob, downloadLesson } from "../utils/lessonFiles";

/**
 * Renders a lesson document inline:
 *   pdf  -> native <iframe>
 *   docx -> docx-preview (HTML render)
 *   pptx -> pptx-preview (slide list)
 *
 * Files are fetched through the authenticated API, so nothing is exposed publicly.
 */
export default function DocumentViewer({ lesson, height = "80vh" }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    let objectUrl = "";
    let pptxViewer = null;
    const host = hostRef.current;

    if (host) host.innerHTML = "";
    setStatus("loading");
    setMessage("");
    setPdfUrl("");

    (async () => {
      try {
        const blob = await getLessonBlob(lesson._id, "preview");
        if (cancelled) return;

        if (lesson.fileType === "pdf") {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
          setStatus("ready");
          return;
        }

        if (lesson.fileType === "docx") {
          const { renderAsync } = await import("docx-preview");
          if (cancelled || !hostRef.current) return;
          await renderAsync(blob, hostRef.current, undefined, {
            className: "docx",
            inWrapper: true,
            breakPages: true,
            experimental: true,
          });
          if (!cancelled) setStatus("ready");
          return;
        }

        if (lesson.fileType === "pptx") {
          const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import("@aiden0z/pptx-renderer");
          if (cancelled || !hostRef.current) return;
          pptxViewer = await PptxViewer.open(await blob.arrayBuffer(), hostRef.current, {
            zipLimits: RECOMMENDED_ZIP_LIMITS,
            fitMode: "contain",
            listOptions: { windowed: true, showSlideLabels: true },
          });
          if (!cancelled) setStatus("ready");
          return;
        }

        setStatus("error");
        setMessage("Preview is not available for this file type.");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err?.message || "Could not render this document. Try downloading it instead.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      try {
        pptxViewer?.destroy?.();
      } catch {
        /* ignore */
      }
      if (host) host.innerHTML = "";
    };
  }, [lesson]);

  if (!lesson) return null;

  const isPdf = lesson.fileType === "pdf";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
      style={{ minHeight: 220 }}
    >
      {isPdf ? (
        pdfUrl && <iframe title={lesson.title} src={pdfUrl} className="w-full" style={{ height }} />
      ) : (
        <div className="doc-host overflow-auto bg-slate-100" style={{ height }}>
          <div ref={hostRef} className="mx-auto w-full" />
        </div>
      )}

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white text-ink-muted">
          <Spinner className="h-5 w-5 text-brand-500" /> Loading document…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center">
          <FileWarning className="h-9 w-9 text-slate-400" />
          <p className="text-sm font-medium text-ink">Preview unavailable</p>
          <p className="max-w-sm text-sm text-ink-muted">{message}</p>
          <button className="btn-primary mt-1" onClick={() => downloadLesson(lesson._id, lesson.fileName)}>
            <Download className="h-4 w-4" /> Download file
          </button>
        </div>
      )}
    </div>
  );
}
