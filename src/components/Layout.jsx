import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { demoReset } from "../data/demo";
import { organization } from "../config/organization";
import { initials } from "../utils/format";
import ThemeToggle from "../components/ThemeToggle";
import NotificationsBell from "./NotificationsBell";
import { usePaymentVerified } from "./PaymentGate";

const NAV = {
  student: [
    { to: "/student", label: "Dashboard", end: true },
    { to: "/student/classes", label: "My Classes" },
    { to: "/student/forums", label: "Forum" },
    { to: "/student/offer-letter", label: "Offer Letter" },
    { to: "/student/certificate", label: "Certificate" },
    { to: "/student/payment", label: "Payment" },
    { to: "/student/messages", label: "Messages" },
    { to: "/student/profile", label: "Profile" }
  ],
  mentor: [
    { to: "/mentor", label: "Dashboard", end: true },
    { to: "/mentor/students", label: "Students" },
    { to: "/mentor/classes", label: "Classes" },
    { to: "/mentor/schedule", label: "Schedule Class" },
    { to: "/mentor/forums", label: "Forum" },
    { to: "/mentor/messages", label: "Messages" }
  ],
  admin: [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/mentors", label: "Mentors" },
    { to: "/admin/users", label: "All Users" },
    { to: "/admin/payment", label: "Payment" },
    { to: "/admin/forums", label: "Forum" },
    { to: "/admin/messages", label: "Messages" }
  ]
};

const STUDENT_LINKS_BEFORE_PAYMENT = ["/student", "/student/profile", "/student/payment"];

function roleLabel(role) {
  if (role === "mentor") return "Mentor";
  if (role === "admin") return "Admin";
  return "Student";
}

export default function Layout() {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = profile?.role;
  const paymentVerified = usePaymentVerified();
  let links = NAV[role] || NAV.student;
  if (role === "student" && paymentVerified !== true) {
    links = links.filter((link) => STUDENT_LINKS_BEFORE_PAYMENT.includes(link.to));
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  function handleResetDemo() {
    if (window.confirm("Reset all demo data? This clears the seeded demo records in this browser.")) {
      demoReset();
      window.location.reload();
    }
  }

  return (
    <div className="app-shell">
      {isDemoMode && (
        <div className="demo-banner">
          Demo mode — data is stored in this browser only. Configure Firebase to go live.
          <button type="button" className="link-btn" onClick={handleResetDemo}>
            Reset demo data
          </button>
        </div>
      )}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">IP</span>
            <span className="brand-name">{organization.shortName}</span>
          </div>
          <nav className="topnav" aria-label="Primary navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className={`menu-toggle${menuOpen ? " open" : ""}`}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="topbar-user">
            <span className="avatar">{initials(profile?.name || user?.name)}</span>
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{profile?.name || user?.name}</span>
              <span className="role-badge">{roleLabel(role)}</span>
            </div>
            <NotificationsBell />
            <ThemeToggle />
            <button type="button" className="btn btn-ghost btn-sm signout-btn" onClick={handleSignOut}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span className="signout-text">Sign out</span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <>
            <button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="Close navigation menu"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <div className="mobile-nav-user">
                <span className="avatar">{initials(profile?.name || user?.name)}</span>
                <div>
                  <strong>{profile?.name || user?.name}</strong>
                  <span className="role-badge">{roleLabel(role)}</span>
                </div>
              </div>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {link.label}
                </NavLink>
              ))}
              <button type="button" className="mobile-nav-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </nav>
          </>
        )}
      </header>
      <main key={location.pathname} className="page-content">
        <Outlet />
      </main>
      <footer className="page-footer">
        <span>{organization.name} · Internship Portal</span>
        <span>{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}