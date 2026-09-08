import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./ui";

const dashboardByRole = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageLoader label="Checking your session" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardByRole[user.role] || "/login"} replace />;
  }

  return children;
}

export { dashboardByRole };
