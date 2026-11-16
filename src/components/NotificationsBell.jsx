import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeMyNotifications
} from "../data/store";
import { timeAgo } from "../utils/format";

function Icon({ type }) {
  const props = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
  if (type === "chat") {
    return (
      <svg {...props} stroke="currentColor" strokeWidth="1.8">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (type === "forum") {
    return (
      <svg {...props} stroke="currentColor" strokeWidth="1.8">
        <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
      </svg>
    );
  }
  if (type === "class") {
    return (
      <svg {...props} stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  return (
    <svg {...props} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </svg>
  );
}

export default function NotificationsBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeMyNotifications(user.uid, setItems);
  }, [user?.uid]);

  useEffect(() => {
    function onDown(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [profile?.uid]);

  if (!user) return null;

  const unread = items.filter((n) => !n.read).length;

  function rolePath() {
    if (profile?.role === "mentor") return "mentor";
    if (profile?.role === "admin") return "admin";
    return "student";
  }

  function destinationFor(notif) {
    const ref = notif.ref || {};
    if (ref.kind === "chat" && ref.convId) return `/${rolePath()}/messages?c=${encodeURIComponent(ref.convId)}`;
    if (ref.kind === "class") return "/student/classes";
    if (ref.kind === "certificate") return "/student/certificate";
    if (ref.kind === "forum" && ref.postId) return `/${rolePath()}/forums/${ref.postId}`;
    return null;
  }

  async function handleOpen(notif) {
    setOpen(false);
    if (!notif.read) {
      markNotificationRead(user.uid, notif.id).catch(() => {});
    }
    const dest = destinationFor(notif);
    if (dest) navigate(dest);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(user.uid).catch(() => {});
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`notif-bell${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span>Notifications</span>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={handleMarkAll}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <p className="notif-empty">You are all caught up.</p>
            ) : (
              items.slice(0, 15).map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={`notif-item${n.read ? "" : " unread"}`}
                  onClick={() => handleOpen(n)}
                >
                  <span className={`notif-icon notif-icon-${n.type}`}>
                    <Icon type={n.type} />
                  </span>
                  <span className="notif-item-body">
                    <span className="notif-item-title">{n.title}</span>
                    {n.text && <span className="notif-item-text">{n.text}</span>}
                    <span className="notif-item-time">{timeAgo(n.at)}</span>
                  </span>
                  {!n.read && <span className="notif-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}