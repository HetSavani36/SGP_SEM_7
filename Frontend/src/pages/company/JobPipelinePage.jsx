// REPLACES company/JobPipelinePage.jsx  –  columns now follow the real flow:
//   (students arrive here only after the college mentor approved them)
//   New  ->  Shortlisted / Aptitude  ->  Interview  ->  Finalized
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { btn, badge, fmtDateTime } from "../../utils/ui";
import ScheduleInterviewModal from "./ScheduleInterviewModal";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A");

function JobPipelinePage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null); // application being scheduled / rescheduled
  const [busy, setBusy] = useState(null);

  const fetchPipeline = useCallback(async () => {
    try { setJobData((await apiFetch(`/api/company/applications/pipeline/${jobId}`)).data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jobId]);
  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  const act = async (appId, fn) => {
    setBusy(appId);
    try { await fn(); await fetchPipeline(); } catch (e) { alert(e.message); } finally { setBusy(null); }
  };
  const shortlist = (id, result) => act(id, () => apiFetch(`/api/company/application/${id}`, { method: "POST", body: JSON.stringify({ result }) }));
  const finalDecision = (id, result) => act(id, () => apiFetch(`/api/company/application/${id}/final`, { method: "POST", body: JSON.stringify({ result }) }));
  const cancelInterview = (app) => window.confirm("Cancel this interview? The student and Google Calendar will be notified.") &&
    act(app.id, () => apiFetch(`/api/interview/${app.interview.id}/cancel`, { method: "POST" }));

  if (loading) return <div className="dashboard-loading" style={{ height: "100vh" }}>Loading ATS Board...</div>;
  if (!jobData) return null;

  // NOTE: the deadline is the last day STUDENTS can apply. The company must still be able to shortlist,
  // test and interview afterwards, so only "not approved" / "closed" make the board read-only
  // (the old page also locked itself on the due date).
  const isReadOnly = !jobData.isApproved || jobData.status === "closed";
  let readOnlyReason = "";
  if (jobData.status === "closed") readOnlyReason = "This job is closed.";
  else if (!jobData.isApproved) readOnlyReason = "This job is pending approval from the college.";

  const hasTest = !!jobData.aptitudeTest?.isPublished;
  const cols = { pending: [], process: [], interview: [], finalized: [] };
  jobData.applications.forEach((a) => {
    if (a.status === "pending") cols.pending.push(a);
    else if (a.status === "shortlisted" || a.status === "aptitude") cols.process.push(a);
    else if (a.status === "interview") cols.interview.push(a);
    else cols.finalized.push(a);
  });

  const aptitudeChip = (a) => {
    if (!hasTest) return null;
    const at = a.aptitudeAttempt;
    if (!at) return <span style={badge("#f1f5f9", "#475569")}>📝 Test not started</span>;
    if (at.status === "in_progress") return <span style={badge("#e0e7ff", "#3730a3")}>📝 Test in progress</span>;
    return <span style={at.passed ? badge("#dcfce7", "#166534") : badge("#fee2e2", "#991b1b")}>📝 {at.percent}% · {at.passed ? "Passed" : "Failed"}{at.tabSwitches > 2 ? ` · ⚠ ${at.tabSwitches} tab switches` : ""}</span>;
  };

  const Column = ({ title, color, apps, render }) => (
    <div style={{ backgroundColor: "#f8fafc", borderRadius: 12, minWidth: 310, maxWidth: 310, display: "flex", flexDirection: "column", borderTop: `4px solid ${color}`, height: "100%", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
      <h3 style={{ margin: 0, padding: "1rem", fontSize: "1.05rem", color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
        {title}<span style={{ backgroundColor: "#e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: 20, fontSize: ".8rem", fontWeight: "bold" }}>{apps.length}</span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", padding: "1rem", flexGrow: 1 }}>
        {apps.length === 0
          ? <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8", fontSize: ".9rem", border: "1px dashed #cbd5e1", borderRadius: 8 }}>No candidates in this phase.</div>
          : apps.map((a) => <StudentCard key={a.id} app={a} actions={render(a)} />)}
      </div>
    </div>
  );

  const StudentCard = ({ app, actions }) => (
    <div style={{ backgroundColor: "#fff", padding: "1.25rem", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".5rem" }}>
        <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem" }}>{app.student.user.name}</h4>
        <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>{formatDate(app.appliedAt)}</span>
      </div>
      <p style={{ margin: "0 0 .5rem", fontSize: ".85rem", color: "#64748b" }}>{app.student.branch} • Year {app.student.year}</p>
      {app.student.skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: ".75rem" }}>
          {app.student.skills.slice(0, 3).map((s, i) => <span key={i} style={{ backgroundColor: "#f1f5f9", color: "#475569", fontSize: ".7rem", padding: "2px 8px", borderRadius: 4 }}>{s.skill.name}</span>)}
        </div>
      )}
      {app.student.resume && <a href={app.student.resume} target="_blank" rel="noreferrer" style={{ fontSize: ".85rem", color: "#4f46e5", textDecoration: "none", fontWeight: 500 }}>📄 View Resume</a>}
      {aptitudeChip(app) && <div style={{ marginTop: 8 }}>{aptitudeChip(app)}</div>}
      <div style={{ borderTop: "1px solid #f1f5f9", marginTop: ".75rem", paddingTop: ".75rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>{actions}</div>
    </div>
  );

  const disabled = <span style={{ fontSize: ".8rem", color: "#94a3b8", fontStyle: "italic" }}>Actions disabled</span>;
  const rejectBtn = (a, fn) => <button style={{ ...btn("danger"), flex: 1 }} disabled={busy === a.id} onClick={() => fn(a.id)}>Reject</button>;

  return (
    <div style={{ height: "calc(100vh - 80px)", width: "100%", maxWidth: "100vw", display: "flex", flexDirection: "column", padding: "0 2rem 1rem", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, width: 40, height: 40, cursor: "pointer", fontSize: "1.2rem", color: "#475569" }}>←</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="page-title" style={{ margin: 0 }}>{jobData.title}</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Pipeline • {jobData.college.name}</p>
        </div>
        <button style={btn("ghost")} onClick={() => navigate(`/company/applications/${jobId}/aptitude`)}>
          📝 Aptitude test {jobData.aptitudeTest ? (jobData.aptitudeTest.isPublished ? "(live)" : "(draft)") : "(create)"}
        </button>
      </div>

      {isReadOnly && <div style={{ backgroundColor: "#fffbeb", color: "#854d0e", padding: "1rem", borderRadius: 8, marginBottom: "1rem", border: "1px solid #fef08a", fontSize: ".9rem" }}>⚠️ <strong>Read-only:</strong> {readOnlyReason}</div>}
      {jobData.awaitingMentorCount > 0 && (
        <div style={{ backgroundColor: "#faf5ff", color: "#6b21a8", padding: ".75rem 1rem", borderRadius: 8, marginBottom: "1rem", border: "1px solid #e9d5ff", fontSize: ".9rem" }}>
          ⏳ {jobData.awaitingMentorCount} application(s) are waiting for the college mentor. They appear here once approved.
        </div>
      )}

      <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto", overflowY: "hidden", flexGrow: 1, paddingBottom: "1rem", minWidth: 0 }}>
        <Column title="New (mentor approved)" color="#eab308" apps={cols.pending} render={(a) => isReadOnly ? disabled : (
          <>
            <button style={{ ...btn("ghost"), flex: 1, background: "#eff6ff", color: "#2563eb" }} disabled={busy === a.id} onClick={() => shortlist(a.id, "1")}>Shortlist{hasTest ? " + send test" : ""}</button>
            {rejectBtn(a, (id) => shortlist(id, "0"))}
          </>
        )} />

        <Column title={hasTest ? "Aptitude round" : "Shortlisted"} color="#a855f7" apps={cols.process} render={(a) => {
          if (isReadOnly) return disabled;
          const canSchedule = !hasTest || a.aptitudeAttempt?.passed;
          return (
            <>
              {canSchedule
                ? <button style={{ ...btn(), flex: 1 }} onClick={() => setScheduling(a)}>📅 Schedule interview</button>
                : <span style={{ fontSize: ".8rem", color: "#64748b", fontStyle: "italic", flex: 1 }}>{a.aptitudeAttempt?.status && a.aptitudeAttempt.status !== "in_progress" ? "Did not pass the test" : "Waiting for the student to take the test"}</span>}
              {rejectBtn(a, (id) => shortlist(id, "0"))}
            </>
          );
        }} />

        <Column title="Interview" color="#3b82f6" apps={cols.interview} render={(a) => {
          const iv = a.interview;
          const live = iv?.status === "scheduled";
          return (
            <div style={{ width: "100%" }}>
              {iv && live && (
                <div style={{ fontSize: ".85rem", marginBottom: 8 }}>
                  <div>📅 {fmtDateTime(iv.startsAt)}</div>
                  {iv.mode === "online" ? iv.meetLink && <a href={iv.meetLink} target="_blank" rel="noreferrer">🎥 Join Meet</a> : <div>📍 {iv.address}</div>}
                </div>
              )}
              {iv && !live && <p style={{ fontSize: ".8rem", color: "#dc2626" }}>Interview was {iv.status}.</p>}
              {isReadOnly ? disabled : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {live ? (
                    <>
                      <button style={btn("ghost")} onClick={() => setScheduling(a)}>Reschedule</button>
                      <button style={btn("ghost")} onClick={() => cancelInterview(a)}>Cancel</button>
                      <button style={btn("success")} disabled={busy === a.id} onClick={() => finalDecision(a.id, "hire")}>Hire</button>
                      {rejectBtn(a, (id) => finalDecision(id, "reject"))}
                    </>
                  ) : <button style={btn()} onClick={() => setScheduling(a)}>Schedule again</button>}
                </div>
              )}
            </div>
          );
        }} />

        <Column title="Finalized" color="#94a3b8" apps={cols.finalized} render={(a) => {
          const hired = a.status === "hired";
          return <div style={{ width: "100%", padding: 6, textAlign: "center", borderRadius: 6, backgroundColor: hired ? "#dcfce7" : "#fee2e2" }}>
            <span style={{ fontSize: ".85rem", fontWeight: "bold", color: hired ? "#166534" : "#991b1b" }}>{hired ? "🎉 Hired Candidate" : "✕ Application Rejected"}</span>
          </div>;
        }} />
      </div>

      {scheduling && <ScheduleInterviewModal application={scheduling} onClose={() => setScheduling(null)} onDone={() => { setScheduling(null); fetchPipeline(); }} />}
    </div>
  );
}

export default JobPipelinePage;
