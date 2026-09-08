import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthShell from "../components/AuthShell";
import { Alert, Spinner } from "../components/ui";

function Input({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input className={`input ${Icon ? "pl-10" : ""}`} {...props} />
    </div>
  );
}

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    studentId: "",
    class: "",
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);

  // load the class list for the dropdown
  useEffect(() => {
    api
      .get("/classes/public")
      .then((r) => setClasses(r.data.data || []))
      .catch(() => setClasses([]));
  }, []);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        studentId: form.studentId.trim(),
        class: form.class || undefined,
        password: form.password,
      });
      toast.success("Account created. Welcome!");
      navigate("/student", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-ink">Create your student account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pick your class now, or register without one and an administrator will assign you later.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onClose={() => setError("")}>{error}</Alert>}

        <div>
          <label className="label">Full name</label>
          <Input
            icon={User}
            required
            placeholder="Khalid Shidane"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <Input
              icon={Mail}
              type="email"
              required
              placeholder="you@university.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Student ID</label>
            <Input
              required
              placeholder="HU00000"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            />
          </div>
        </div>

        {/* Class dropdown */}
        <div>
          <label className="label">Class</label>
          <div className="relative">
            <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              className="input pl-10"
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
            >
              <option value="">— Select your class (optional) —</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} · {c.academicYear}
                </option>
              ))}
            </select>
          </div>
          <p className="field-hint">
            Your courses and lessons appear on your dashboard after you sign in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                className="input pl-10 pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm password</label>
            <Input
              icon={Lock}
              type="password"
              required
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
