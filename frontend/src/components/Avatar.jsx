import { useState } from "react";
import { assetUrl, initials } from "../utils/assets";

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-32 w-32 text-3xl",
};

const palette = [
  "bg-brand-100 text-brand-700",
  "bg-accent-100 text-accent-700",
];

function hashColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export default function Avatar({ name = "", src, size = "md", ring = false, className = "" }) {
  const [broken, setBroken] = useState(false);
  const url = src ? assetUrl(src) : "";
  const ringCls = ring ? "ring-2 ring-white shadow-sm" : "";
  const base = `${sizes[size]} aspect-square shrink-0 overflow-hidden rounded-full ${ringCls} ${className}`;

  if (url && !broken) {
    return (
      <span className={`${base} block bg-slate-100`}>
        <img
          src={url}
          alt={name}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover object-center"
        />
      </span>
    );
  }

  return (
    <span className={`${base} ${hashColor(name)} inline-flex items-center justify-center font-semibold`}>
      {initials(name) || "?"}
    </span>
  );
}
