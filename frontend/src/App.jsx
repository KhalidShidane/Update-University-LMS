import { Navigate, Route, Routes } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  BookOpen,
  UserCircle,
  Megaphone,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute, { dashboardByRole } from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import { PageLoader } from "./components/ui";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageSubjects from "./pages/admin/ManageSubjects";
import ManageAnnouncements from "./pages/admin/ManageAnnouncements";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherSubjects from "./pages/teacher/TeacherSubjects";
import TeacherSubjectDetails from "./pages/teacher/TeacherSubjectDetails";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentSubjectDetails from "./pages/student/StudentSubjectDetails";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentAssignmentDetail from "./pages/student/StudentAssignmentDetail";
import LessonViewer from "./pages/student/LessonViewer";

const adminNav = [
  { to: "/admin", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/admin/classes", label: "Classes", icon: School },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/profile", label: "Profile", icon: UserCircle },
];
const teacherNav = [
  { to: "/teacher", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/teacher/subjects", label: "My Subjects", icon: BookOpen },
  { to: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/teacher/profile", label: "Profile", icon: UserCircle },
];
const studentNav = [
  { to: "/student", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/student/subjects", label: "My Subjects", icon: BookOpen },
  { to: "/student/assignments", label: "My Assignments", icon: ClipboardList },
  { to: "/student/profile", label: "Profile", icon: UserCircle },
];

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardByRole[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route
        element={
          <ProtectedRoute roles={["admin"]}>
            <DashboardLayout title="Admin" nav={adminNav} />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/classes" element={<ManageClasses />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/teachers" element={<ManageTeachers />} />
        <Route path="/admin/subjects" element={<ManageSubjects />} />
        <Route path="/admin/announcements" element={<ManageAnnouncements />} />
        <Route path="/admin/profile" element={<Profile />} />
      </Route>

      {/* Teacher */}
      <Route
        element={
          <ProtectedRoute roles={["teacher"]}>
            <DashboardLayout title="Teacher" nav={teacherNav} />
          </ProtectedRoute>
        }
      >
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/subjects" element={<TeacherSubjects />} />
        <Route path="/teacher/subjects/:id" element={<TeacherSubjectDetails />} />
        <Route path="/teacher/assignments" element={<TeacherAssignments />} />
        <Route path="/teacher/profile" element={<Profile />} />
      </Route>

      {/* Student */}
      <Route
        element={
          <ProtectedRoute roles={["student"]}>
            <DashboardLayout title="Student" nav={studentNav} />
          </ProtectedRoute>
        }
      >
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/subjects" element={<StudentSubjects />} />
        <Route path="/student/subjects/:id" element={<StudentSubjectDetails />} />
        <Route path="/student/subjects/:subjectId/lessons/:lessonId" element={<LessonViewer />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/student/assignments/:id" element={<StudentAssignmentDetail />} />
        <Route path="/student/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
