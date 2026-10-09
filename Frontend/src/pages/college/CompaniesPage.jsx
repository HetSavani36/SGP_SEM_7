// NEW – college -> company collaboration invites.
// Route:  <Route path="companies" element={<CollegeCompaniesPage />} />   (inside /college)
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../utils/api";
import { card, btn, badge, input } from "../../utils/ui";

const STATE = {
  none: null,
  sent: { text: "Invite sent", bg: "#fef9c3", color: "#854d0e" },
  received: { text: "Wants to collaborate", bg: "#dbeafe", color: "#1d4ed8" },
  collaborated: { text: "Collaborating", bg: "#dcfce7", color: "#166534" },
  rejected: { text: "Declined", bg: "#fee2e2", color: "#991b1b" },
};

export default function CollegeCompaniesPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`/api/college/companies?page=${page}&limit=9&search=${encodeURIComponent(search)}`);
      setRows(r.data.companies);
      setHasNext(r.data.pagination.hasNextPage);
    } catch (e) { setMsg(e.message); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const invite = async (id) => {
    setBusyId(id); setMsg("");
    try {
      const r = await apiFetch(`/api/college/collab/invite/${id}`, { method: "POST" });
      setMsg(r.message);
      await load();
    } catch (e) { setMsg(e.message); } finally { setBusyId(null); }
  };

  const respond = async (id, result) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/college/collab/request/${id}`, { method: "POST", body: JSON.stringify({ result }) });
      await load();
    } catch (e) { setMsg(e.message); } finally { setBusyId(null); }
  };

  return (
    <div style={{ padding: "0 2rem 2rem" }}>
      <h2 className="page-title">Companies</h2>
      <p className="page-subtitle">Invite companies to hire from your campus.</p>

      <input style={{ ...input, maxWidth: 360, margin: "1rem 0" }} placeholder="Search companies…" value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
      {msg && <div style={{ ...card, padding: ".75rem 1rem", marginBottom: "1rem", background: "#eff6ff" }}>{msg}</div>}

      {loading ? <p>Loading…</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
          {rows.map((c) => {
            const s = STATE[c.collabState];
            return (
              <div key={c.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <h4 style={{ margin: 0 }}>{c.name}</h4>
                  {s && <span style={badge(s.bg, s.color)}>{s.text}</span>}
                </div>
                <p style={{ color: "#64748b", fontSize: ".85rem", margin: "6px 0 14px" }}>{c.address}</p>

                {c.collabState === "none" || c.collabState === "rejected" ? (
                  <button style={btn()} disabled={busyId === c.id} onClick={() => invite(c.id)}>
                    {c.collabState === "rejected" ? "Invite again" : "Send collaboration invite"}
                  </button>
                ) : c.collabState === "received" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btn("success")} disabled={busyId === c.id} onClick={() => respond(c.id, "1")}>Accept</button>
                    <button style={btn("danger")} disabled={busyId === c.id} onClick={() => respond(c.id, "0")}>Decline</button>
                  </div>
                ) : c.collabState === "sent" ? (
                  <span style={{ fontSize: ".8rem", color: "#94a3b8" }}>Waiting for the company to respond…</span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
        <button style={btn("ghost")} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
        <button style={btn("ghost")} disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
