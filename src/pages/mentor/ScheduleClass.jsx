import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notifyStudentsOfClass, saveClass } from "../../data/store";
import { newId, todayISO } from "../../utils/format";
import { isHttpsUrl, isNonEmpty } from "../../utils/validators";

export default function MentorScheduleClass() {
  const { profile: me } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: todayISO(),
    time: "10:00",
    meetUrl: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isNonEmpty(form.title)) {
      setError("Please enter a class title.");
      return;
    }
    if (!isNonEmpty(form.date) || !isNonEmpty(form.time)) {
      setError("Please pick a date and time.");
      return;
    }
    if (!isHttpsUrl(form.meetUrl)) {
      setError("Please enter a valid Google Meet link (https://meet.google.com/…).");
      return;
    }
    setBusy(true);
    try {
      const cls = {
        id: newId("c"),
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        meetUrl: form.meetUrl.trim(),
        mentorUid: me?.uid || "",
        mentorName: me?.name || "Mentor",
        status: "scheduled"
      };
      await saveClass(cls);
      notifyStudentsOfClass(cls, "created").catch(() => {});
      navigate("/mentor/classes", { state: { notice: "Class scheduled successfully." } });
    } catch (err) {
      console.error(err);
      setError("Could not schedule the class. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Schedule a class</h1>
          <p className="page-sub">
            Students see the class immediately and can join with one click from the Meet link.
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card form-card">
          {error && <div className="notice notice-error">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="sc-title">Class title</label>
              <input
                id="sc-title" className="input" type="text"
                placeholder="e.g. React Fundamentals — Week 2"
                value={form.title} onChange={(e) => update("title", e.target.value)} required
              />
            </div>
            <div className="field">
              <label htmlFor="sc-desc">Description (optional)</label>
              <textarea
                id="sc-desc" className="input textarea" rows={3}
                placeholder="What will be covered in this session?"
                value={form.description} onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sc-date">Date</label>
                <input
                  id="sc-date" className="input" type="date"
                  value={form.date} onChange={(e) => update("date", e.target.value)} required
                />
              </div>
              <div className="field">
                <label htmlFor="sc-time">Time</label>
                <input
                  id="sc-time" className="input" type="time"
                  value={form.time} onChange={(e) => update("time", e.target.value)} required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="sc-meet">Google Meet link</label>
              <input
                id="sc-meet" className="input" type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={form.meetUrl} onChange={(e) => update("meetUrl", e.target.value)} required
              />
            </div>
            <div className="card-actions">
              <Link className="btn btn-ghost" to="/mentor/classes">Cancel</Link>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Scheduling…" : "Schedule class"}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Scheduling tips</h3>
          <ul className="bullets">
            <li>Create the Google Meet meeting first, then paste the join link here.</li>
            <li>Use a consistent title pattern (e.g. “Topic — Week N”) so students can find sessions.</li>
            <li>You can complete, cancel or delete a class any time from the Classes page.</li>
            <li>Time is shown to students in their local timezone as picked here.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}