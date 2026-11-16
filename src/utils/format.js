export function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const d = new Date(dateOnly ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(time) {
  if (!time) return "";
  const [h, m] = String(time).split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function initials(name) {
  if (!name) return "?";
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function newId(prefix = "id") {
  if (globalThis.crypto && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function genNumber(prefix) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function classDateTime(item) {
  return new Date(`${item.date}T${item.time || "00:00"}`);
}

export function isUpcoming(item) {
  return item.status === "scheduled" && classDateTime(item).getTime() >= Date.now();
}

export function sortClassesDesc(classes) {
  return [...classes].sort((a, b) => classDateTime(b).getTime() - classDateTime(a).getTime());
}

export function internshipStatusLabel(status) {
  if (status === "in-progress") return "In progress";
  if (status === "completed") return "Completed";
  return "Registered";
}

export function internshipStatusTone(status) {
  if (status === "in-progress") return "blue";
  if (status === "completed") return "green";
  return "gray";
}

export function classStatusTone(status) {
  if (status === "scheduled") return "blue";
  if (status === "completed") return "green";
  return "red";
}


export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}