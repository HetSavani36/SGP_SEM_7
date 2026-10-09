// NEW – route inside /student:  <Route path="interviews" element={<InterviewsPage />} />
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { card, badge, fmtDateTime } from "../../utils/ui";

export default function InterviewsPage() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { apiFetch("/api/interview/my").then((r) => setRows(r.data)).catch((e) => setErr(e.message)); }, []);
  if (err) return <p style={{ color: "#dc2626", padding: "2rem" }}>{err}</p>;
  if (!rows) return <p style={{ padding: "2rem" }}>Loading…</p>;

  const now = Date.now();
  return (
    <div style={{ padding: "0 2rem 2rem" }}>
      <h2 className="page-title">My Interviews</h2>
      {rows.length === 0 && <div style={{ ...card, color: "#94a3b8" }}>No interviews scheduled yet.</div>}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
        {rows.map((iv) => {
          const live = iv.status === "scheduled" && now >= new Date(iv.startsAt).getTime() - 10 * 60000 && now <= new Date(iv.endsAt).getTime();
          return (
            <div key={iv.id} style={{ ...card, opacity: iv.status === "cancelled" ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h4 style={{ margin: 0 }}>{iv.application.job.title}</h4>
                <span style={iv.status === "scheduled" ? badge("#dbeafe", "#1d4ed8") : iv.status === "completed" ? badge("#dcfce7", "#166534") : badge("#fee2e2", "#991b1b")}>{iv.status}</span>
              </div>
              <p style={{ margin: "2px 0 10px", color: "#64748b", fontSize: ".85rem" }}>{iv.application.job.company.name}</p>
              <p style={{ margin: 0 }}>📅 {fmtDateTime(iv.startsAt, iv.timeZone)} – {new Date(iv.endsAt).toLocaleTimeString("en-IN", { timeStyle: "short", timeZone: iv.timeZone })}</p>
              {iv.mode === "online"
                ? iv.meetLink && iv.status === "scheduled" && (
                    <a href={iv.meetLink} target="_blank" rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 10, padding: "8px 14px", borderRadius: 8, textDecoration: "none", fontWeight: 600, background: live ? "#10b981" : "#4f46e5", color: "#fff" }}>
                      {live ? "Join now" : "Join link"}
                    </a>)
                : <p style={{ margin: "8px 0 0" }}>📍 {iv.address}</p>}
              {iv.notes && <p style={{ color: "#64748b", fontSize: ".85rem" }}>{iv.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
