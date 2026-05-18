import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// ── User pages ────────────────────────────────────────────────
import Header       from "./pages/user/Header";
import Footer       from "./pages/user/Footer";
import Home         from "./pages/user/Home";
import Member       from "./pages/user/Member";
import ClassDetail  from "./pages/user/ClassDetail";
import WelcomePopup from "./pages/user/WelcomePopup";
import Contact      from "./pages/user/Contact";
import Notice       from "./pages/user/Notice";
import UpcomingEvent from "./pages/user/UpcomingEvent";
import About        from "./pages/user/About";
import AlbumPage    from "./pages/user/Album";

// ── Admin pages ───────────────────────────────────────────────
import AdminSignup    from "./pages/admin/AdminSignup";
import AdminLogin     from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

const Placeholder = ({ title }) => (
  <div style={{
    minHeight: "60vh", display: "flex", alignItems: "center",
    justifyContent: "center", fontFamily: "Lato, sans-serif",
    fontSize: "1.5rem", color: "#8B1A1A"
  }}>
    <h2>{title} — Coming Soon</h2>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Admin routes manage their own header — hide the user header/footer on them
const ADMIN_PATHS = ["/admin-signup", "/admin/login", "/admin/dashboard"];

function AppContent() {
  const { pathname } = useLocation();
  const isAdminPage = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {!isAdminPage && <Header />}
      {!isAdminPage && <WelcomePopup />}

      <Routes>
        {/* ── User routes ── */}
        <Route path="/"               element={<Home />} />
        <Route path="/about"          element={<About />} />
        <Route path="/member"         element={<Member />} />
        <Route path="/upcoming-event" element={<UpcomingEvent />} />
        <Route path="/class-detail"   element={<ClassDetail />} />
        <Route path="/contact"        element={<Contact />} />
        <Route path="/notice"         element={<Notice />} />
        <Route path="/album"          element={<AlbumPage />} />

        {/* ── Admin routes ── */}
        <Route path="/admin-signup"   element={<AdminSignup />} />
        <Route path="/admin/login"    element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
        />
      </Routes>

      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;
