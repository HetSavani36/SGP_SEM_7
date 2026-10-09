// NEW – route inside /student:  <Route path="aptitude" element={<AptitudeListPage />} />
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { card, btn, badge, fmtDateTime } from "../../utils/ui";

export default function AptitudeListPage() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => { apiFetch("/api/aptitude/my").then((r) => setItems(r.data)).catch((e) => setErr(e.message)); }, []);

  if (err) return <p style={{ color: "#dc2626", padding: "2rem" }}>{err}</p>;
  if (!items) return <p style={{ padding: "2rem" }}>Loading…</p>;

  return (
    <div style={{ padding: "0 2rem 2rem" }}>
      <h2 className="page-title">Aptitude Tests</h2>
      <p className="page-subtitle">Tests assigned after a company shortlists you.</p>
      {items.length === 0 && <div style={{ ...card, color: "#94a3b8" }}>No tests assigned yet.</div>}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
        {items.map((a) => {
          const t = a.job.aptitudeTest; const at = a.aptitudeAttempt;
          const done = at && at.status !== "in_progress";
          const closed = t.closesAt && new Date(t.closesAt) < new Date();
          return (
            <div key={a.id} style={card}>
              <h4 style={{ margin: 0 }}>{a.job.title}</h4>
              <p style={{ margin: "2px 0 10px", color: "#64748b", fontSize: ".85rem" }}>{a.job.company.name}</p>
              <p style={{ margin: "0 0 10px", fontSize: ".85rem" }}>{t.title} · {t._count.questions} questions · {t.durationMins} min · pass {t.passingPercent}%</p>
              {t.opensAt && new Date(t.opensAt) > new Date() && <p style={{ fontSize: ".8rem", color: "#854d0e" }}>Opens {fmtDateTime(t.opensAt)}</p>}
              {t.closesAt && <p style={{ fontSize: ".8rem", color: closed ? "#dc2626" : "#64748b" }}>{closed ? "Closed" : "Closes"} {fmtDateTime(t.closesAt)}</p>}
              {done ? (
                <span style={at.passed ? badge("#dcfce7", "#166534") : badge("#fee2e2", "#991b1b")}>
                  {at.percent}% – {at.passed ? "Passed" : "Not passed"}
                </span>
              ) : (
                <button style={btn()} disabled={closed} onClick={() => navigate(`/student/aptitude/${t.id}`)}>
                  {at ? "Resume test" : "Start test"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
