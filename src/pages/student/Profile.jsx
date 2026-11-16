import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveProfile } from "../../data/store";
import { isNonEmpty, isValidEmail } from "../../utils/validators";

const DEGREE_OPTIONS = [
  "B.Tech", "B.E", "B.Sc", "M.Sc", "M.Tech", "MCA", "BCA", "BBA", "MBA", "MBA (Analytics)", "Other"
];

export default function StudentProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  if (profile && !form) {
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      email: profile.email || "",
      dob: profile.dob || "",
      address: profile.address || "",
      degree: profile.degree || "",
      branch: profile.branch || "",
      university: profile.university || "",
      graduationYear: profile.graduationYear || "",
      skills: profile.skills || ""
    });
  }
  if (!form) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setBusy(true);
    try {
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
        skills: form.skills.trim()
      });
      await refreshProfile();
      setNotice("Profile saved. Your offer letter always reflects these details.");
    } catch (err) {
      console.error(err);
      setError("Could not save your profile. Please try again.");
    }
    setBusy(false);
  }

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 2; year <= currentYear + 3; year += 1) {
    yearOptions.push(String(year));
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My profile</h1>
          <p className="page-sub">
            Your details are used on your offer letter and internship certificate.
          </p>
        </div>
      </div>

      <div className="card form-card">
        {error && <div className="notice notice-error">{error}</div>}
        {notice && <div className="notice notice-success">{notice}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="form-section">Personal</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sp-name">Full name</label>
              <input
                id="sp-name" className="input" type="text"
                value={form.name} onChange={(e) => update("name", e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="sp-phone">Phone</label>
              <input
                id="sp-phone" className="input" type="tel"
                value={form.phone} onChange={(e) => update("phone", e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="sp-email">Email</label>
              <input
                id="sp-email" className="input" type="email"
                value={form.email} onChange={(e) => update("email", e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="sp-dob">Date of birth</label>
              <input
                id="sp-dob" className="input" type="date"
                value={form.dob} onChange={(e) => update("dob", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sp-address">Address</label>
            <input
              id="sp-address" className="input" type="text"
              value={form.address} onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <h3 className="form-section">Academic</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sp-degree">Degree</label>
              <select
                id="sp-degree" className="input"
                value={form.degree} onChange={(e) => update("degree", e.target.value)}
              >
                <option value="">Select degree…</option>
                {DEGREE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sp-branch">Branch / Specialization</label>
              <input
                id="sp-branch" className="input" type="text"
                value={form.branch} onChange={(e) => update("branch", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="sp-university">University / College</label>
              <input
                id="sp-university" className="input" type="text"
                value={form.university} onChange={(e) => update("university", e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="sp-year">Graduation year</label>
              <select
                id="sp-year" className="input"
                value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)}
              >
                <option value="">Select year…</option>
                {yearOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="sp-skills">Skills (comma separated)</label>
            <input
              id="sp-skills" className="input" type="text"
              placeholder="e.g. JavaScript, Python, Excel"
              value={form.skills} onChange={(e) => update("skills", e.target.value)}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}