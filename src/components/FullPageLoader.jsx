export function FullPageLoader({ label = "Loading…" }) {
  return (
    <div className="loader-wrap">
      <div className="loader" />
      <p className="hint">{label}</p>
    </div>
  );
}