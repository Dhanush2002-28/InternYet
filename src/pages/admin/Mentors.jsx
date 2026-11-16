import { useEffect, useState } from "react";
import {
  deleteApprovedMentor,
  getApprovedMentors,
  saveApprovedMentor
} from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate } from "../../utils/format";
import { isNonEmpty, isValidEmail } from "../../utils/validators";

export default function AdminMentors() {
  const [mentors, setMentors] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getApprovedMentors()
      .then((items) => {
        if (active) setMentors(items);
      })
      .catch(() => {
        if (active) setMentors([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (mentors === null) return <FullPageLoader label="Loading mentors…" />;

  async function loadMentors() {
    const items = await getApprovedMentors();
    setMentors(items);
  }

  async function handleAdd(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!isNonEmpty(name)) {
      setError("Please enter the mentor's full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await saveApprovedMentor(email.trim(), {
        name: name.trim(),
        approvedAt: new Date().toISOString()
      });
      await loadMentors();
      setName("");
      setEmail("");
      setNotice(`${email.trim()} approved. Their next Google sign-in becomes a mentor account.`);
    } catch (err) {
      console.error(err);
      setError("Could not approve the mentor. Please try again.");
    }
    setBusy(false);
  }

  async function handleRemove(entry) {
    if (!window.confirm(`Remove ${entry.email} from the approved mentors list?`)) return;
    setError("");
    try {
      await deleteApprovedMentor(entry.email);
      await loadMentors();
    } catch (err) {
      console.error(err);
      setError("Could not remove the mentor. Please try again.");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mentors</h1>
          <p className="page-sub">
            Approve mentors by their Google email. Firestore rules check this list before granting
            the mentor role.
          </p>
        </div>
      </div>

      {notice && <div className="notice notice-success">{notice}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="grid grid-2">
        <div className="card form-card">
          <h3 className="card-title">Approve a mentor</h3>
          <p className="hint">
            The mentor signs in with Google using this exact email. Their first sign-in
            automatically creates their mentor account.
          </p>
          <form onSubmit={handleAdd} noValidate>
            <div className="field">
              <label htmlFor="am-name">Full name</label>
              <input
                id="am-name" className="input" type="text"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="am-email">Google email</label>
              <input
                id="am-email" className="input" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Approving…" : "Approve mentor"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Approved mentors ({mentors.length})</h3>
          {mentors.length === 0 ? (
            <EmptyState title="No approved mentors" hint="Approve a mentor to get started." />
          ) : (
            <div className="card-list">
              {mentors.map((entry) => (
                <div className="list-row" key={entry.email}>
                  <div>
                    <div>{entry.name}</div>
                    <div className="cell-sub">
                      {entry.email} · approved {formatDate(entry.approvedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemove(entry)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}