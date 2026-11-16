import { useEffect, useState } from "react";
import { getAllUsers } from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate, initials } from "../../utils/format";

const ROLE_TONE = { student: "gray", mentor: "blue", admin: "amber" };
const ROLE_LABEL = { student: "Student", mentor: "Mentor", admin: "Admin" };

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let active = true;
    getAllUsers()
      .then((items) => {
        if (active) setUsers(items);
      })
      .catch(() => {
        if (active) setUsers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (users === null) return <FullPageLoader label="Loading users…" />;

  const filtered = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);
  const sorted = [...filtered].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">All users</h1>
          <p className="page-sub">{users.length} accounts on the portal</p>
        </div>
        <select
          className="input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card table-card">
        {sorted.length === 0 ? (
          <EmptyState title="No users found" hint="Try a different role filter." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.uid}>
                  <td>
                    <div className="cell-name">
                      <span className="avatar sm">{initials(item.name)}</span>
                      <div>
                        <div>{item.name || "—"}</div>
                        <div className="cell-sub">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${ROLE_TONE[item.role] || "gray"}`}>
                      {ROLE_LABEL[item.role] || item.role}
                    </span>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}