import { useEffect, useState } from "react";
import { getUsersByRole } from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import {
  formatDate,
  initials,
  internshipStatusLabel,
  internshipStatusTone
} from "../../utils/format";

export default function AdminStudents() {
  const [students, setStudents] = useState(null);
  const [query, setQuery] = useState("");

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

  if (students === null) return <FullPageLoader label="Loading students…" />;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? students.filter(
        (s) =>
          String(s.name || "").toLowerCase().includes(q) ||
          String(s.email || "").toLowerCase().includes(q)
      )
    : students;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">
            Read-only view. Use the mentor dashboard to update statuses and issue certificates.
          </p>
        </div>
        <input
          className="input search"
          type="search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

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
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.uid}>
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
                  <td>{formatDate(student.createdAt)}</td>
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
    </div>
  );
}