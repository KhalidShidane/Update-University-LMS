function Brand({ dark = false }) {
  return (
    <div className="relative flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
        <img src="/hormuud-logo.png" alt="Hormuud University" className="h-full w-full object-contain" />
      </span>
      <span className={`font-display text-lg font-bold ${dark ? "text-ink" : "text-white"}`}>
        Hormuud University LMS
      </span>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-12 text-white lg:flex">
        {/* Hormuud University campus — 40% opacity over the brand colour */}
        <img
          src="/hu-campus.jpg"
          alt="Hormuud University campus"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />

        <Brand />

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
            The learning management system built for Hormuud University.
          </h1>
          <p className="mt-4 text-white/70">
            A modern digital learning platform designed to make education, course management, and
            academic collaboration simpler for every student and lecturer.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          Hormuud University Learning Management System · © {new Date().getFullYear()} · All rights
          reserved
        </p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand dark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
