import { useRef, useState } from "react";
import { Camera, Trash2, Hash, School, Building2, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PageHeader, RoleBadge, Spinner, Alert } from "../components/ui";
import Avatar from "../components/Avatar";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ fullName: user.fullName, email: user.email, password: "" });
  const [photo, setPhoto] = useState(null); // { file, preview }
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    form.fullName !== user.fullName ||
    form.email !== user.email ||
    form.password.length > 0 ||
    !!photo ||
    removePhoto;

  const pickPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file");
    if (file.size > 3 * 1024 * 1024) return setError("Image must be under 3 MB");
    setError("");
    setRemovePhoto(false);
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("email", form.email);
      if (form.password) fd.append("password", form.password);
      if (photo) fd.append("avatar", photo.file);
      if (removePhoto) fd.append("removeAvatar", "true");
      await updateProfile(fd);
      toast.success("Profile updated");
      setForm((f) => ({ ...f, password: "" }));
      setPhoto(null);
      setRemovePhoto(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = removePhoto ? "" : photo?.preview || user.avatarUrl;

  const meta = [];
  if (user.role === "student" && user.student) {
    meta.push({ icon: Hash, label: "Student ID", value: user.student.studentId });
    meta.push({
      icon: School,
      label: "Class",
      value: user.student.class
        ? `${user.student.class.className} · ${user.student.class.academicYear}`
        : "Not assigned yet",
    });
  }
  if (user.role === "teacher" && user.teacher) {
    meta.push({ icon: Building2, label: "Department", value: user.teacher.department || "—" });
  }
  meta.push({
    icon: CalendarDays,
    label: "Member since",
    value: new Date(user.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account information and photo" />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* Photo card */}
        <div className="card flex flex-col items-center text-center">
          <div className="relative">
            <Avatar name={form.fullName} src={currentAvatar} size="2xl" ring />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft ring-4 ring-white transition hover:bg-brand-700"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>
          <p className="mt-4 text-lg font-bold text-ink">{form.fullName}</p>
          <RoleBadge role={user.role} className="mt-1.5" />

          <div className="mt-5 flex w-full flex-col gap-2">
            <button type="button" className="btn-secondary btn-sm w-full" onClick={() => fileRef.current?.click()}>
              <Camera className="h-3.5 w-3.5" /> {currentAvatar ? "Change photo" : "Upload photo"}
            </button>
            {(user.avatarUrl || photo) && !removePhoto && (
              <button
                type="button"
                className="btn-ghost btn-sm w-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => {
                  setPhoto(null);
                  setRemovePhoto(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove photo
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Square image works best. JPG, PNG or WEBP, max 3&nbsp;MB.
          </p>
        </div>

        {/* Details form */}
        <form onSubmit={save} className="card space-y-5">
          {error && <Alert onClose={() => setError("")}>{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input sm:max-w-xs"
              placeholder="Leave blank to keep current"
              value={form.password}
              minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
                    <dd className="text-sm font-medium text-ink">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-5">
            <button
              type="button"
              className="btn-secondary"
              disabled={!dirty || saving}
              onClick={() => {
                setForm({ fullName: user.fullName, email: user.email, password: "" });
                setPhoto(null);
                setRemovePhoto(false);
                setError("");
              }}
            >
              Reset
            </button>
            <button className="btn-primary" disabled={!dirty || saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
