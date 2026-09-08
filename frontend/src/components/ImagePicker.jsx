import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { assetUrl } from "../utils/assets";

/**
 * Optional image picker with drag & drop and a live preview.
 * props:
 *   value      File | null            newly chosen file
 *   onChange   (File | null) => void
 *   currentUrl string                 existing image URL (edit mode)
 *   onClear    () => void             called when an existing image is removed
 *   maxSizeMB  number
 */
export default function ImagePicker({
  value,
  onChange,
  currentUrl,
  onClear,
  maxSizeMB = 4,
  title = "Add a photo",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!value) return setPreview("");
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shown = preview || (currentUrl ? assetUrl(currentUrl) : "");

  const validate = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > maxSizeMB * 1024 * 1024) return setError(`Image must be under ${maxSizeMB} MB.`);
    setError("");
    onChange(file);
  };

  const clear = () => {
    onChange(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  return (
    <div>
      {shown ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          <img src={shown} alt="Lesson cover" className="h-40 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-soft shadow-sm hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-lg bg-white/90 p-1.5 text-slate-500 shadow-sm hover:bg-white hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
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
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            validate(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragging
              ? "border-brand-500 bg-brand-50"
              : "border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40"
          }`}
        >
          <ImagePlus className="mb-2 h-6 w-6 text-brand-500" />
          <p className="text-sm font-medium text-ink">
            <span className="text-brand-600">{title}</span> (optional)
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">JPG, PNG or WEBP — up to {maxSizeMB} MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => validate(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-slate-600">{error}</p>}
    </div>
  );
}
