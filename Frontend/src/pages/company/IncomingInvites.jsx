// NEW – drop this inside company/CollaborationPage.jsx:   <IncomingInvites />
// Shows invitations that COLLEGES sent to this company.
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../utils/api";
import { card, btn } from "../../utils/ui";

export default function IncomingInvites() {
  const [invites, setInvites] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try { setInvites((await apiFetch("/api/company/collab/incoming?status=pending")).data.invites); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const respond = async (collegeId, result) => {
    setBusy(collegeId);
    try {
      await apiFetch(`/api/company/collab/respond/${collegeId}`, { method: "POST", body: JSON.stringify({ result }) });
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(null); }
  };

  return (
    <section style={{ ...card, marginBottom: "1.5rem" }}>
      <h3 style={{ marginTop: 0 }}>Invites from colleges {invites.length > 0 && `(${invites.length})`}</h3>
      {err && <p style={{ color: "#dc2626" }}>{err}</p>}
      {invites.length === 0 ? <p style={{ color: "#94a3b8" }}>No pending invites.</p> : invites.map((i) => (
        <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".75rem 0", borderTop: "1px solid #f1f5f9" }}>
          <div>
            <strong>{i.college.name}</strong>
            <div style={{ color: "#64748b", fontSize: ".85rem" }}>{i.college.address}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn("success")} disabled={busy === i.college.id} onClick={() => respond(i.college.id, "1")}>Accept</button>
            <button style={btn("danger")} disabled={busy === i.college.id} onClick={() => respond(i.college.id, "0")}>Decline</button>
          </div>
        </div>
      ))}
    </section>
  );
}
