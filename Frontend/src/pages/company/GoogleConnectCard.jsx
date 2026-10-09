// NEW – put on company/AdminSettingsPage.jsx (or CompanySettingsPage):  <GoogleConnectCard />
// One-time connection so interviews get a Google Calendar event + Meet link.
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { card, btn } from "../../utils/ui";

export default function GoogleConnectCard() {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState("");

  const load = () => apiFetch("/api/interview/google/status").then((r) => setStatus(r.data)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const connect = async () => {
    try { window.location.href = (await apiFetch("/api/interview/google/connect")).data.url; }
    catch (e) { setErr(e.message); }
  };
  const disconnect = async () => { await apiFetch("/api/interview/google", { method: "DELETE" }); load(); };

  const flag = new URLSearchParams(window.location.search).get("google");

  return (
    <section style={card}>
      <h3 style={{ marginTop: 0 }}>Google Calendar & Meet</h3>
      {flag === "connected" && <p style={{ color: "#166534" }}>✅ Google connected.</p>}
      {flag === "error" && <p style={{ color: "#dc2626" }}>Could not connect Google. Please try again.</p>}
      {err && <p style={{ color: "#dc2626" }}>{err}</p>}
      {!status ? <p>Loading…</p> : status.connected ? (
        <>
          <p>Connected as <strong>{status.googleEmail}</strong>. Interviews you schedule will be added to this calendar with a Meet link.</p>
          <button style={btn("danger")} onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <>
          <p>Connect your Google account so CampusHire can create the calendar event and Meet link for interviews.</p>
          <button style={btn()} onClick={connect}>Connect Google</button>
        </>
      )}
    </section>
  );
}
