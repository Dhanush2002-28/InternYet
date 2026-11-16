import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createForumPost, subscribeForumPosts } from "../../data/store";
import EmptyState from "../../components/EmptyState";
import { FullPageLoader } from "../../components/FullPageLoader";
import { initials, timeAgo } from "../../utils/format";
import { isNonEmpty } from "../../utils/validators";

export default function Forum({ module = "student" }) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeForumPosts(setPosts), []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isNonEmpty(title)) {
      setError("Please enter a title.");
      return;
    }
    if (!isNonEmpty(body)) {
      setError("Please write something to discuss.");
      return;
    }
    setBusy(true);
    try {
      await createForumPost({ title, body, author: profile });
      setTitle("");
      setBody("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Could not post. Please try again.");
    }
    setBusy(false);
  }

  if (posts === null) return <FullPageLoader label="Loading forum…" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Student forum</h1>
          <p className="page-sub">Discuss the program, projects and preparation with your batch.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "New discussion"}
        </button>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {showForm && (
        <div className="card forum-composer">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="forum-title">Title</label>
              <input
                id="forum-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How are you handling the final project review?"
              />
            </div>
            <div className="field">
              <label htmlFor="forum-body">What would you like to discuss?</label>
              <textarea
                id="forum-body"
                className="input textarea"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="forum-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Posting…" : "Post discussion"}
              </button>
            </div>
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No discussions yet"
            hint="Start the first discussion — your batchmates will see it here instantly."
          />
        </div>
      ) : (
        <div className="forum-list">
          {posts.map((post) => (
            <Link key={post.id} to={`/${module}/forums/${post.id}`} className="card forum-post">
              <h2 className="forum-post-title">{post.title}</h2>
              <p className="forum-post-body">{post.body}</p>
              <div className="forum-post-meta">
                <span className="avatar sm">{initials(post.authorName)}</span>
                <span className="forum-post-author">{post.authorName}</span>
                {post.authorRole !== "student" && (
                  <span className="badge badge-amber">{post.authorRole}</span>
                )}
                <span className="forum-post-time">{timeAgo(post.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}