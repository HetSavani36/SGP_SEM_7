// NEW – used by JobPipelinePage. Schedules (or reschedules) an interview with Google Meet / Calendar.
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import { card, btn, input, label, toLocalInput } from "../../utils/ui";

export default function ScheduleInterviewModal({ application, onClose, onDone }) {
  const existing = application.interview?.status === "scheduled" ? application.interview : null;
  const [google, setGoogle] = useState(null);
  const [form, setForm] = useState({
    startsAt: toLocalInput(existing?.startsAt ?? new Date(Date.now() + 24 * 3600 * 1000)),
    durationMins: existing ? Math.round((new Date(existing.endsAt) - new Date(existing.startsAt)) / 60000) : 45,
    mode: existing?.mode ?? "online",
    meetLink: "", address: existing?.address ?? "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch("/api/interview/google/status").then((r) => setGoogle(r.data)).catch(() => setGoogle({ connected: false })); }, []);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const payload = {
        ...form,
        durationMins: Number(form.durationMins),
        startsAt: new Date(form.startsAt).toISOString(),                      // local -> UTC
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (existing) await apiFetch(`/api/interview/${existing.id}/reschedule`, { method: "PATCH", body: JSON.stringify(payload) });
      else await apiFetch("/api/interview/schedule", { method: "POST", body: JSON.stringify({ ...payload, applicationId: application.id }) });
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={onClose}>
      <div style={{ ...card, width: 460, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{existing ? "Reschedule" : "Schedule"} interview – {application.student.user.name}</h3>

        <label style={label}>Date & time</label>
        <input type="datetime-local" style={input} value={form.startsAt} min={toLocalInput()} onChange={set("startsAt")} />

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Duration (min)</label>
            <input type="number" min={15} max={240} step={5} style={input} value={form.durationMins} onChange={set("durationMins")} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Mode</label>
            <select style={input} value={form.mode} onChange={set("mode")} disabled={!!existing}>
              <option value="online">Online</option><option value="offline">On campus / office</option>
            </select>
          </div>
        </div>

        {!existing && form.mode === "online" && (
          <div style={{ marginTop: 12 }}>
            {google?.connected ? (
              <p style={{ fontSize: ".85rem", color: "#166534", margin: "0 0 8px" }}>✅ A Google Meet link will be created on <strong>{google.googleEmail}</strong> and invites emailed automatically.</p>
            ) : (
              <p style={{ fontSize: ".85rem", color: "#854d0e", margin: "0 0 8px" }}>
                Google not connected. <a href="/company/settings">Connect Google</a> for automatic Meet links, or paste a link below.
              </p>
            )}
            <label style={label}>Meeting link {google?.connected ? "(optional – overrides Google Meet)" : "(required)"}</label>
            <input style={input} placeholder="https://meet.google.com/…  or Zoom / Teams" value={form.meetLink} onChange={set("meetLink")} />
          </div>
        )}
        {!existing && form.mode === "offline" && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Venue / address</label>
            <input style={input} value={form.address} onChange={set("address")} />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label style={label}>Notes for the student (optional)</label>
          <textarea style={{ ...input, minHeight: 60 }} value={form.notes} onChange={set("notes")} />
        </div>

        {err && <p style={{ color: "#dc2626", fontSize: ".85rem" }}>{err}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button style={btn("ghost")} onClick={onClose}>Close</button>
          <button style={btn()} disabled={busy} onClick={submit}>{busy ? "Saving…" : existing ? "Reschedule" : "Schedule & send invite"}</button>
        </div>
      </div>
    </div>
  );
}
