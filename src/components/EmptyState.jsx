export default function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      {title && <p className="empty-title">{title}</p>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}