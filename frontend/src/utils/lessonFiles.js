import api from "../api/axios";

/**
 * Fetch a lesson file as a Blob (auth header is added by the axios interceptor).
 */
export async function getLessonBlob(lessonId, mode = "preview") {
  const res = await api.get(`/lessons/${lessonId}/${mode}`, { responseType: "blob" });
  return res.data;
}

/**
 * Fetch a lesson file and return an object URL. Caller must revoke it when done.
 */
export async function getLessonBlobUrl(lessonId, mode = "preview") {
  return URL.createObjectURL(await getLessonBlob(lessonId, mode));
}

/**
 * Trigger a browser download of a lesson file.
 */
export async function downloadLesson(lessonId, fileName = "lesson") {
  const res = await api.get(`/lessons/${lessonId}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Trigger a browser download from any authenticated API path that streams a file.
 */
export async function downloadFrom(apiPath, fileName = "file") {
  const res = await api.get(apiPath, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
