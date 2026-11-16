import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createForumReply,
  getForumPost,
  subscribeForumReplies
} from "../../data/store";
import { FullPageLoader } from "../../components/FullPageLoader";
import { formatDate, initials, timeAgo } from "../../utils/format";
import { isNonEmpty } from "../../utils/validators";

export default function ForumPost({ module = "student" }) {
  const { postId } = useParams();
  const { profile } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!postId) return;
    getForumPost(postId)
      .then((p) => setPost(p || null))
      .catch(() => setPost(null));
  }, [postId]);

  useEffect(() => {
    if (!postId) return undefined;
    return subscribeForumReplies(postId, setReplies);
  }, [postId]);

  async function handleReply(event) {
    event.preventDefault();
    setError("");
    if (!isNonEmpty(body)) {
      setError("Please write a reply.");
      return;
    }
    setBusy(true);
    try {
      await createForumReply(postId, { body, author: profile });
      setBody("");
    } catch (err) {
      console.error(err);
      setError("Could not post the reply. Please try again.");
    }
    setBusy(false);
  }

  if (post === null) return <FullPageLoader label="Loading discussion…" />;

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to={`/${module}/forums`} className="link-btn forum-back">
            &larr; Back to forum
          </Link>
          <h1 className="page-title">{post.title}</h1>
        </div>
      </div>

      <div className="card forum-detail">
        <div className="forum-post-meta">
          <span className="avatar sm">{initials(post.authorName)}</span>
          <span className="forum-post-author">{post.authorName}</span>
          {post.authorRole !== "student" && <span className="badge badge-amber">{post.authorRole}</span>}
          <span className="forum-post-time">{timeAgo(post.createdAt)}</span>
        </div>
        <p className="forum-detail-body">{post.body}</p>
      </div>

      <h2 className="forum-replies-title">
        {replies.length === 0 ? "No replies yet" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
      </h2>

      <div className="card forum-replies">
        {replies.length === 0 ? (
          <p className="hint">Be the first to reply to this discussion.</p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="reply">
              <span className="avatar sm">{initials(reply.authorName)}</span>
              <div className="reply-main">
                <div className="reply-meta">
                  <span className="forum-post-author">{reply.authorName}</span>
                  {reply.authorRole !== "student" && (
                    <span className="badge badge-amber">{reply.authorRole}</span>
                  )}
                  <span className="forum-post-time">
                    {timeAgo(reply.createdAt)} · {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="reply-body">{reply.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card forum-composer">
        <form onSubmit={handleReply}>
          {error && <div className="notice notice-error">{error}</div>}
          <div className="field">
            <label htmlFor="forum-reply">Add a reply</label>
            <textarea
              id="forum-reply"
              className="input textarea"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts…"
            />
          </div>
          <div className="forum-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Posting…" : "Post reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}