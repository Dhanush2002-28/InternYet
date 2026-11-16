import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUsersByRole, issueCertificateForStudent, reopenInternship, sendNotification } from "../../data/store";
import { sendCertificateEmail } from "../../services/emailService";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import {
  formatDate,
  initials,
  internshipStatusLabel,
  internshipStatusTone
} from "../../utils/format";
import { organization } from "../../config/organization";

export default function MentorStudents() {
  const { profile: me } = useAuth();
  const [students, setStudents] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getUsersByRole("student")
      .then((items) => {
        if (active) setStudents(items);
      })
      .catch(() => {
        if (active) setStudents([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (students && selected) {
      const fresh = students.find((s) => s.uid === selected.uid);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [students, selected]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q)
    );
  }, [students, query]);

  if (students === null) return <FullPageLoader label="Loading students…" />;

  async function handleComplete() {
    if (
      !window.confirm(
        `Mark ${selected.name}'s internship as completed and issue their certificate?`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const now = new Date().toISOString();
      const issuerName = me?.name || "Program Mentor";
      const certificate = await issueCertificateForStudent(selected.uid, {
        studentName: selected.name,
        program: organization.program,
        issuerName,
        completedAt: now
      });
      const number = certificate.number;
      await sendNotification(selected.uid, {
        type: "certificate",
        title: "Your internship certificate is ready",
        text: "Certificate " + number + " has been issued.",
        ref: { kind: "certificate" }
      }).catch(() => {});
      const fresh = await getUsersByRole("student");
      setStudents(fresh);
      setNotice(`Certificate issued to ${selected.name}. They can now download it.`);
      sendCertificateEmail(selected, { number, issuedAt: now, issuerName }, now)
        .then((result) => {
          if (result?.skipped) {
            setNotice(`Certificate issued to ${selected.name}. (Emails are not configured yet, so nothing was sent.)`);
          } else {
            setNotice(`Certificate issued to ${selected.name} and emailed to ${selected.email}.`);
          }
        })
        .catch((err) => {
          console.error(err);
          setNotice(`Certificate issued to ${selected.name}. The certificate email could not be sent.`);
        });
    } catch (err) {
      console.error(err);
      setError("Could not update the student record. Please try again.");
    }
    setBusy(false);
  }

  async function handleReopen() {
    if (
      !window.confirm(
        `Re-open ${selected.name}'s internship? Their certificate will be revoked.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const oldCertNumber = selected.internship?.certificate?.number;
      await reopenInternship(selected.uid, oldCertNumber);
      const fresh = await getUsersByRole("student");
      setStudents(fresh);
      setNotice(`Internship re-opened for ${selected.name}.`);
    } catch (err) {
      console.error(err);
      setError("Could not update the student record. Please try again.");
    }
    setBusy(false);
  }

  const selectedStatus = selected?.internship?.status;
  const selectedCert = selected?.internship?.certificate;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">{students.length} registered students</p>
        </div>
        <input
          className="input search"
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {notice && <div className="notice notice-success">{notice}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="directory-layout">
        <div className="card table-card">
          {filtered.length === 0 ? (
            <EmptyState title="No students found" hint="Try a different search term." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>University</th>
                  <th>Offer letter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr
                    key={student.uid}
                    className={selected?.uid === student.uid ? "row-selected" : "row-click"}
                    onClick={() => setSelected(student)}
                  >
                    <td>
                      <div className="cell-name">
                        <span className="avatar sm">{initials(student.name)}</span>
                        <div>
                          <div>{student.name}</div>
                          <div className="cell-sub">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.university || "—"}</td>
                    <td className="mono">{student.offerLetter?.number || "—"}</td>
                    <td>
                      <span
                        className={`badge badge-${internshipStatusTone(student.internship?.status)}`}
                      >
                        {internshipStatusLabel(student.internship?.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="card detail-panel">
          {!selected ? (
            <EmptyState
              title="Select a student"
              hint="Choose a student from the list to view their full profile and issue certificates."
            />
          ) : (
            <div>
              <div className="detail-head">
                <span className="avatar lg">{initials(selected.name)}</span>
                <div>
                  <h3>{selected.name}</h3>
                  <p className="hint">{selected.email}</p>
                </div>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Phone</dt>
                  <dd>{selected.phone || "—"}</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd>{formatDate(selected.dob)}</dd>
                </div>
                <div>
                  <dt>Degree</dt>
                  <dd>{selected.degree || "—"}{selected.branch ? ` — ${selected.branch}` : ""}</dd>
                </div>
                <div>
                  <dt>University</dt>
                  <dd>{selected.university || "—"}</dd>
                </div>
                <div>
                  <dt>Graduation year</dt>
                  <dd>{selected.graduationYear || "—"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{selected.address || "—"}</dd>
                </div>
                <div>
                  <dt>Skills</dt>
                  <dd>{selected.skills || "—"}</dd>
                </div>
                <div>
                  <dt>Offer letter</dt>
                  <dd>
                    {selected.offerLetter
                      ? `${selected.offerLetter.number} · issued ${formatDate(selected.offerLetter.issuedAt)}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Registered on</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                {selectedStatus === "completed" ? (
                  <>
                    <div className="notice notice-success">
                      Certificate issued: {selectedCert?.number} · {formatDate(selectedCert?.issuedAt)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleReopen}
                      disabled={busy}
                    >
                      Re-open internship
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleComplete}
                    disabled={busy}
                  >
                    {busy ? "Working…" : "Mark completed & issue certificate"}
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}