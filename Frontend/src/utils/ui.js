// Tiny style helpers so the new pages match the inline-style look of the existing ones.
export const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.05)" };
export const input = { width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: ".95rem", boxSizing: "border-box", background: "#fff" };
export const label = { display: "block", fontSize: ".8rem", fontWeight: 600, color: "#475569", marginBottom: 4 };
export const btn = (kind = "primary") => ({
  padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: ".85rem",
  border: kind === "primary" ? "none" : "1px solid " + (kind === "danger" ? "#fecaca" : "#e2e8f0"),
  background: kind === "primary" ? "#4f46e5" : kind === "danger" ? "#fef2f2" : kind === "success" ? "#10b981" : "#f8fafc",
  color: kind === "primary" || kind === "success" ? "#fff" : kind === "danger" ? "#dc2626" : "#334155",
});
export const badge = (bg, color) => ({ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: ".75rem", fontWeight: 600, whiteSpace: "nowrap" });

export const fmtDateTime = (d, tz) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", ...(tz && { timeZone: tz }) });

/** value for <input type="datetime-local"> (local time) */
export const toLocalInput = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
