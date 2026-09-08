/**
 * Resolve a server asset path (e.g. "/uploads/avatars/x.png") to a full URL.
 * In dev the Vite proxy forwards /uploads to the API, so relative works.
 */
const BASE = import.meta.env.VITE_ASSET_URL || "";

export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path}`;
}

/** Initials for the avatar fallback. */
export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
