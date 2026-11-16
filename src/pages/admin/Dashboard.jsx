import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getClasses, getUsersByRole } from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate, initials } from "../../utils/format";

const ROLE_LABEL = { student: "Student", mentor: "Mentor", admin: "Admin" };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getUsersByRole("student"), getUsersByRole("mentor"), getClasses()])
      .then(([studentList, mentorList, classList]) => {
        if (active) setStats({ students: studentList, mentors: mentorList, classes: classList });
      })
      .catch(() => {
        if (active) setStats({ students: [], mentors: [], classes: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  if (stats === null) return <FullPageLoader label="Loading overview…" />;

  const recent = [...stats.students]
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin overview</h1>
          <p className="page-sub">Program health at a glance.</p>
        </div>
        <Link className="btn btn-primary btn-sm" to="/admin/mentors">
          Manage mentors
        </Link>
      </div>

      <div className="grid grid-3">
        <div className="stat-card">
          <span className="stat-label">Students</span>
          <span className="stat-value">{stats.students.length}</span>
          <Link className="link-plain" to="/admin/students">View all →</Link>
        </div>
        <div className="stat-card">
          <span className="stat-label">Mentors</span>
          <span className="stat-value">{stats.mentors.length}</span>
          <Link className="link-plain" to="/admin/mentors">Approve mentors →</Link>
        </div>
        <div className="stat-card">
          <span className="stat-label">Classes</span>
          <span className="stat-value">{stats.classes.length}</span>
          <p className="hint">Scheduled by mentors</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Recent registrations</h3>
          {recent.length === 0 ? (
            <EmptyState title="No students yet" hint="New student registrations appear here." />
          ) : (
            <div className="card-list">
              {recent.map((student) => (
                <div className="list-row" key={student.uid}>
                  <span className="avatar sm">{initials(student.name)}</span>
                  <div>
                    <div>{student.name}</div>
                    <div className="cell-sub">{student.email}</div>
                  </div>
                  <span className="hint">{formatDate(student.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="card-title">Quick actions</h3>
          <ul className="bullets">
            <li><Link to="/admin/mentors">Approve a mentor by Google email</Link></li>
            <li><Link to="/admin/students">Browse all student profiles</Link></li>
            <li><Link to="/admin/users">Review every account and its role</Link></li>
          </ul>
          <p className="hint">
            Admins and mentors manage classes and certificates from their own dashboards.
          </p>
        </div>
      </div>
    </div>
  );
}