import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClasses, getUsersByRole } from "../../data/store";
import ClassCard from "../../components/ClassCard";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { classDateTime, formatDate, isUpcoming } from "../../utils/format";

export default function MentorDashboard() {
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getUsersByRole("student"), getClasses()])
      .then(([studentList, classList]) => {
        if (!active) return;
        setStudents(studentList);
        setClasses(classList);
      })
      .catch(() => {
        if (active) {
          setStudents([]);
          setClasses([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (students === null || classes === null) {
    return <FullPageLoader label="Loading your dashboard…" />;
  }

  const completed = students.filter((s) => s.internship?.status === "completed").length;
  const upcoming = classes
    .filter((c) => c.status === "scheduled")
    .sort((a, b) => classDateTime(a).getTime() - classDateTime(b).getTime())
    .slice(0, 4);
  const completedClasses = classes.filter((c) => c.status === "completed").length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mentor dashboard</h1>
          <p className="page-sub">Manage your students and upcoming classes.</p>
        </div>
        <div className="row-actions">
          <Link className="btn btn-ghost btn-sm" to="/mentor/students">View students</Link>
          <Link className="btn btn-primary btn-sm" to="/mentor/schedule">Schedule a class</Link>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="stat-card">
          <span className="stat-label">Students</span>
          <span className="stat-value">{students.length}</span>
          <p className="hint">{completed} completed so far</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Upcoming classes</span>
          <span className="stat-value">{classes.filter((c) => isUpcoming(c)).length}</span>
          <Link className="link-plain" to="/mentor/classes">Manage classes →</Link>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed classes</span>
          <span className="stat-value">{completedClasses}</span>
          <p className="hint">All-time on this portal</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Next up</h3>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            hint="Schedule a class and it will appear here and for all students."
          />
        ) : (
          <div className="card-list">
            <ClassCard classItem={upcoming[0]} />
            {upcoming.slice(1).map((item) => (
              <div className="mini-class" key={item.id}>
                <div className="mini-class-title">{item.title}</div>
                <div className="hint">
                  {formatDate(item.date)} · {item.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}