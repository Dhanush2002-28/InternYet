import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveProfile } from "../data/store";
import { sendOfferLetterEmail } from "../services/emailService";
import { organization } from "../config/organization";
import { genNumber, initials } from "../utils/format";
import { isNonEmpty, isValidEmail } from "../utils/validators";
import ThemeToggle from "../components/ThemeToggle";

const DEGREE_OPTIONS = [
  "B.Tech",
  "B.E",
  "B.Sc",
  "M.Sc",
  "M.Tech",
  "MCA",
  "BCA",
  "BBA",
  "MBA",
  "MBA (Analytics)",
  "Other"
];

export default function CompleteProfile() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    degree: "",
    branch: "",
    university: "",
    graduationYear: "",
    skills: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (loading) {
    return (
      <div className="wizard">
        <div className="wizard-header">
          <div className="brand">
            <span className="brand-mark">IP</span>
            <span className="brand-name">Internship Portal</span>
          </div>
        </div>
        <div className="wizard-body">
          <div className="loader-wrap">
            <div className="loader" />
            <p className="hint">Preparing your profile…</p>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!initialized && profile) {
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      email: profile.email || user.email || "",
      dob: profile.dob || "",
      address: profile.address || "",
      degree: profile.degree || "",
      branch: profile.branch || "",
      university: profile.university || "",
      graduationYear: profile.graduationYear || "",
      skills: profile.skills || ""
    });
    setInitialized(true);
  }
  if (profile && profile.offerLetter) return <Navigate to="/student" replace />;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!isNonEmpty(form.name) || form.name.trim().length < 3) {
      setError("Please enter your full name.");
      return;
    }
    if (!isNonEmpty(form.phone) || form.phone.trim().length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isNonEmpty(form.university)) {
      setError("Please enter your university or college.");
      return;
    }
    if (!isNonEmpty(form.degree)) {
      setError("Please select your degree.");
      return;
    }
    if (!isNonEmpty(form.graduationYear)) {
      setError("Please select your graduation year.");
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const offerNumber = genNumber("OFFER");
      await saveProfile(user.uid, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        address: form.address.trim(),
        degree: form.degree,
        branch: form.branch.trim(),
        university: form.university.trim(),
        graduationYear: form.graduationYear,
        skills: form.skills.trim(),
        offerLetter: { number: offerNumber, issuedAt: now },
        internship: { status: "in-progress" }
      });
      sendOfferLetterEmail({
        name: form.name.trim(),
        email: form.email.trim(),
        offerLetter: { number: offerNumber, issuedAt: now }
      })
        .then((result) => {
          if (!result?.skipped) {
            setNotice("Your profile is complete, your offer letter has been generated and a copy is on its way to your email.");
          }
        })
        .catch((err) => console.error("Offer letter email failed", err));
      setNotice("Your profile is complete and your offer letter has been generated.");
      window.setTimeout(() => navigate("/student"), 900);
    } catch (err) {
      setError("Could not save your profile. Please try again.");
      console.error(err);
      setBusy(false);
    }
  }

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 2; year <= currentYear + 3; year += 1) {
    yearOptions.push(String(year));
  }

  return (
    <div className="wizard">
      <header className="wizard-header">
        <div className="brand">
          <span className="brand-mark">IP</span>
          <span className="brand-name">Internship Portal</span>
        </div>
        <div className="wizard-header-right">
          <span className="avatar">{initials(user.name || form.name)}</span>
          <ThemeToggle />
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <div className="wizard-body">
        <div className="wizard-grid">
          <div className="card wizard-main">
            <p className="eyebrow">Step 2 of 2</p>
            <h1 className="auth-title">Complete your profile</h1>
            <p className="auth-sub">
              These details are used on your offer letter and your internship record. You can
              update them later from your dashboard.
            </p>

            {error && <div className="notice notice-error">{error}</div>}
            {notice && <div className="notice notice-success">{notice}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <h3 className="form-section">Personal</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cp-name">Full name</label>
                  <input
                    id="cp-name"
                    className="input"
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-phone">Phone</label>
                  <input
                    id="cp-phone"
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-email">Email</label>
                  <input
                    id="cp-email"
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-dob">Date of birth</label>
                  <input
                    id="cp-dob"
                    className="input"
                    type="date"
                    value={form.dob}
                    onChange={(e) => update("dob", e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="cp-address">Address</label>
                <input
                  id="cp-address"
                  className="input"
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>

              <h3 className="form-section">Academic</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cp-degree">Degree</label>
                  <select
                    id="cp-degree"
                    className="input"
                    value={form.degree}
                    onChange={(e) => update("degree", e.target.value)}
                    required
                  >
                    <option value="">Select degree…</option>
                    {DEGREE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="cp-branch">Branch / Specialization</label>
                  <input
                    id="cp-branch"
                    className="input"
                    type="text"
                    value={form.branch}
                    onChange={(e) => update("branch", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-university">University / College</label>
                  <input
                    id="cp-university"
                    className="input"
                    type="text"
                    value={form.university}
                    onChange={(e) => update("university", e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-year">Graduation year</label>
                  <select
                    id="cp-year"
                    className="input"
                    value={form.graduationYear}
                    onChange={(e) => update("graduationYear", e.target.value)}
                    required
                  >
                    <option value="">Select year…</option>
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="cp-skills">Skills (comma separated)</label>
                <input
                  id="cp-skills"
                  className="input"
                  type="text"
                  placeholder="e.g. JavaScript, Python, Excel"
                  value={form.skills}
                  onChange={(e) => update("skills", e.target.value)}
                />
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy
                  ? "Generating your offer letter…"
                  : "Complete registration & generate offer letter"}
              </button>
            </form>
          </div>

          <aside className="card wizard-side">
            <h3 className="card-title">Your program</h3>
            <dl className="detail-list">
              <div>
                <dt>Program</dt>
                <dd>{organization.program}</dd>
              </div>
              <div>
                <dt>Organization</dt>
                <dd>{organization.name}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{organization.duration}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>Online · Google Meet</dd>
              </div>
              <div>
                <dt>Stipend</dt>
                <dd>{organization.stipend}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{organization.email}</dd>
              </div>
            </dl>
            <p className="hint">
              By completing this form you agree to the internship terms and the program code of
              conduct.
            </p>
          </aside>
        </div>
      </div>
      <footer className="wizard-footer">
        <Link to="/" className="link-plain">Back to home</Link>
      </footer>
    </div>
  );
}