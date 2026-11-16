import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { deleteClass, getClasses, notifyStudentsOfClass, updateClass } from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { classStatusTone, formatDate, formatTime, sortClassesDesc } from "../../utils/format";

export default function MentorClasses() {
  const location = useLocation();
  const [classes, setClasses] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const items = await getClasses();
      setClasses(sortClassesDesc(items));
    } catch {
      setClasses([]);
    }
  }

  async function handleStatus(item, status) {
    setError("");
    try {
      await updateClass(item.id, { status });
      notifyStudentsOfClass({ ...item, status }, "updated").catch(() => {});
      await load();
    } catch (err) {
      console.error(err);
      setError("Could not update the class. Please try again.");
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete the class "${item.title}"? Students will no longer see it.`)) return;
    setError("");
    try {
      await deleteClass(item.id);
      await load();
    } catch (err) {
      console.error(err);
      setError("Could not delete the class. Please try again.");
    }
  }

  if (classes === null) return <FullPageLoader label="Loading classes…" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-sub">{classes.length} classes in total</p>
        </div>
      </div>

      {notice && <div className="notice notice-success">{notice}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="card table-card">
        {classes.length === 0 ? (
          <EmptyState title="No classes yet" hint="Schedule your first class to get started." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Date &amp; time</th>
                <th>Meet</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>{item.title}</div>
                    <div className="cell-sub">{item.mentorName}</div>
                  </td>
                  <td>
                    {formatDate(item.date)} · {formatTime(item.time)}
                  </td>
                  <td>
                    {item.meetUrl ? (
                      <a
                        className="link-plain"
                        href={item.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${classStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="right">
                    <div className="row-actions">
                      {item.status === "scheduled" ? (
                        <>
                          <button
                            type="button" className="btn btn-ghost btn-sm"
                            onClick={() => handleStatus(item, "completed")}
                          >
                            Complete
                          </button>
                          <button
                            type="button" className="btn btn-ghost btn-sm"
                            onClick={() => handleStatus(item, "cancelled")}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button" className="btn btn-ghost btn-sm"
                          onClick={() => handleStatus(item, "scheduled")}
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        type="button" className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
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