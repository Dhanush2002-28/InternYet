import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  counterpartOf,
  getAllUsers,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  subscribeConversations,
  subscribeConversationMessages
} from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { initials, timeAgo } from "../../utils/format";
import { isNonEmpty } from "../../utils/validators";

const PARTNER_ROLES = {
  student: ["mentor", "admin"],
  mentor: ["student", "admin"],
  admin: ["student", "mentor"]
};

const PARTNER_LABEL = {
  student: "your mentor and the admin",
  mentor: "students and the admin",
  admin: "students and mentors"
};

function roleLabel(role) {
  if (role === "mentor") return "Mentor";
  if (role === "admin") return "Admin";
  return "";
}

export default function Messages({ role = "student" }) {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("c");
  const [convs, setConvs] = useState(null);
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [allUsers, setAllUsers] = useState(null);
  const messagesEndRef = useRef(null);

  const meUid = profile?.uid;

  useEffect(() => {
    if (!meUid) return undefined;
    return subscribeConversations(meUid, setConvs);
  }, [meUid]);

  useEffect(() => {
    if (!selectedId || !meUid) {
      setMessages(null);
      return undefined;
    }
    markConversationRead(selectedId, meUid).catch(() => {});
    return subscribeConversationMessages(selectedId, (items) => {
      setMessages(items);
      const last = items[items.length - 1];
      if (last && last.fromUid !== meUid) {
        markConversationRead(selectedId, meUid).catch(() => {});
      }
    });
  }, [selectedId, meUid]);

  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: "end" });
    }
  }, [messages, selectedId]);

  function selectConversation(id) {
    setDraft("");
    if (id) setSearchParams({ c: id });
    else setSearchParams({});
  }

  async function toggleDirectory() {
    setDirectoryOpen((v) => !v);
    if (!allUsers) {
      try {
        setAllUsers(await getAllUsers());
      } catch (err) {
        console.error(err);
        setAllUsers([]);
      }
    }
  }

  async function startChat(user) {
    try {
      const conv = await getOrCreateConversation({
        a: { uid: profile.uid, name: profile.name, role: profile.role },
        b: { uid: user.uid, name: user.name, role: user.role }
      });
      setDirectoryOpen(false);
      selectConversation(conv.id);
    } catch (err) {
      console.error(err);
      setError("Could not open a chat. Please try again.");
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    const selected = (convs || []).find((c) => c.id === selectedId);
    if (!text || !selected) return;
    setDraft("");
    setBusy(true);
    const other = counterpartOf(selected, meUid);
    try {
      await sendMessage(selectedId, {
        fromUid: meUid,
        fromName: profile.name,
        body: text,
        otherUid: other ? other.uid : null
      });
    } catch (err) {
      console.error(err);
      setDraft(text);
      setError("Message not sent. Please try again.");
    }
    setBusy(false);
  }

  if (convs === null) return <FullPageLoader label="Loading messages…" />;

  const partners = (allUsers || []).filter(
    (u) => u.uid !== meUid && PARTNER_ROLES[role].includes(u.role)
  );
  const selected = convs.find((c) => c.id === selectedId) || null;
  const counterpart = selected ? counterpartOf(selected, meUid) : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-sub">One-on-one chats with {PARTNER_LABEL[role]}.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={toggleDirectory}>
          {directoryOpen ? "Close" : "New chat"}
        </button>
      </div>

      {error && (
        <div className="notice notice-error">
          {error}{" "}
          <button type="button" className="link-btn" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {directoryOpen && (
        <div className="card chat-directory-card">
          <p className="card-title">Start a new chat</p>
          {partners.length === 0 ? (
            <p className="hint">No one to chat with yet.</p>
          ) : (
            <div className="chat-directory">
              {partners.map((user) => (
                <button
                  key={user.uid}
                  type="button"
                  className="chat-directory-item"
                  onClick={() => startChat(user)}
                >
                  <span className="avatar sm">{initials(user.name)}</span>
                  <span className="chat-directory-name">{user.name}</span>
                  {roleLabel(user.role) && <span className="badge badge-gray">{roleLabel(user.role)}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`chat-body${selectedId ? " show-thread" : ""}`}>
        <div className="chat-convlist">
          {convs.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No conversations yet"
                hint="Use New chat to message your mentor, students or the admin."
              />
            </div>
          ) : (
            convs.map((conv) => {
              const other = counterpartOf(conv, meUid);
              const unreadCount = Number(conv.unread?.[meUid]) || 0;
              return (
                <button
                  key={conv.id}
                  type="button"
                  className={`chat-conv${conv.id === selectedId ? " active" : ""}`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <span className="avatar sm">{initials(other ? other.name : "?")}</span>
                  <span className="chat-conv-main">
                    <span className="chat-conv-name">
                      {other ? other.name : "Unknown"}
                      {other && roleLabel(other.role) && (
                        <span className="badge badge-gray">{roleLabel(other.role)}</span>
                      )}
                    </span>
                    <span className="chat-conv-last">
                      {conv.lastMessage ? conv.lastMessage.text : "No messages yet"}
                    </span>
                  </span>
                  <span className="chat-conv-meta">
                    <span className="chat-conv-time">{timeAgo(conv.lastMessage ? conv.lastMessage.at : "")}</span>
                    {unreadCount > 0 && (
                      <span className="chat-unread">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="chat-thread card">
          {selected ? (
            <>
              <div className="chat-thread-head">
                <button
                  type="button"
                  className="chat-back"
                  onClick={() => selectConversation(null)}
                  aria-label="Back to conversations"
                >
                  &larr;
                </button>
                <span className="avatar sm">{initials(counterpart ? counterpart.name : "?")}</span>
                <div className="chat-thread-who">
                  <span className="chat-conv-name">{counterpart ? counterpart.name : ""}</span>
                  {counterpart && roleLabel(counterpart.role) && (
                    <span className="badge badge-gray">{roleLabel(counterpart.role)}</span>
                  )}
                </div>
              </div>
              <div className="chat-messages">
                {messages === null ? (
                  <p className="hint">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="hint">Say hello — this conversation is just starting.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`chat-bubble${m.fromUid === meUid ? " mine" : ""}`}>
                      {m.fromUid !== meUid && <span className="chat-bubble-name">{m.fromName}</span>}
                      <span className="chat-bubble-text">{m.body}</span>
                      <span className="chat-bubble-time">{timeAgo(m.at)}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="chat-composer">
                <input
                  className="input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={busy || !isNonEmpty(draft)}>
                  {busy ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-thread-empty">
              <EmptyState
                title="Select a conversation"
                hint="Pick a chat from the list, or start a new one with New chat."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}