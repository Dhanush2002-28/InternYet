import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentGate from "./components/PaymentGate";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import CompleteProfile from "./pages/CompleteProfile";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentOfferLetter from "./pages/student/OfferLetter";
import StudentCertificate from "./pages/student/Certificate";
import StudentClasses from "./pages/student/Classes";
import StudentForum from "./pages/student/Forum";
import StudentForumPost from "./pages/student/ForumPost";
import StudentPayment from "./pages/student/Payment";
import Messages from "./pages/modules/Messages";
import MentorDashboard from "./pages/mentor/Dashboard";
import MentorStudents from "./pages/mentor/Students";
import MentorScheduleClass from "./pages/mentor/ScheduleClass";
import MentorClasses from "./pages/mentor/Classes";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminMentors from "./pages/admin/Mentors";
import AdminUsers from "./pages/admin/Users";
import AdminPayment from "./pages/admin/Payment";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute roles={["student"]}>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={["student"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="offer-letter" element={<PaymentGate><StudentOfferLetter /></PaymentGate>} />
            <Route path="certificate" element={<PaymentGate><StudentCertificate /></PaymentGate>} />
            <Route path="payment" element={<StudentPayment />} />
            <Route path="classes" element={<PaymentGate><StudentClasses /></PaymentGate>} />
            <Route path="forums" element={<PaymentGate><StudentForum /></PaymentGate>} />
            <Route path="forums/:postId" element={<PaymentGate><StudentForumPost /></PaymentGate>} />
            <Route path="messages" element={<PaymentGate><Messages role="student" /></PaymentGate>} />
          </Route>
          <Route
            path="/mentor"
            element={
              <ProtectedRoute roles={["mentor", "admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MentorDashboard />} />
            <Route path="students" element={<MentorStudents />} />
            <Route path="schedule" element={<MentorScheduleClass />} />
            <Route path="classes" element={<MentorClasses />} />
            <Route path="messages" element={<Messages role="mentor" />} />
            <Route path="forums" element={<StudentForum module="mentor" />} />
            <Route path="forums/:postId" element={<StudentForumPost module="mentor" />} />
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="mentors" element={<AdminMentors />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payment" element={<AdminPayment />} />
            <Route path="messages" element={<Messages role="admin" />} />
            <Route path="forums" element={<StudentForum module="admin" />} />
            <Route path="forums/:postId" element={<StudentForumPost module="admin" />} />
          </Route>
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}