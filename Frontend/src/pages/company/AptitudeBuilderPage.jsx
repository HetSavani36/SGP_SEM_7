// NEW – route inside /company:  <Route path="applications/:jobId/aptitude" element={<AptitudeBuilderPage />} />
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { card, btn, input, label, badge, fmtDateTime, toLocalInput } from "../../utils/ui";

const blankQ = () => ({ text: "", options: ["", "", "", ""], correctIndex: 0, marks: 1, section: "" });

export default function AptitudeBuilderPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null); // saved test (with id / isPublished)
  const [form, setForm] = useState({ title: "Aptitude Test", instructions: "", durationMins: 30, passingPercent: 50, negativeMarking: 0, autoRejectOnFail: false, opensAt: "", closesAt: "" });
  const [questions, setQuestions] = useState([blankQ()]);
  const [results, setResults] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const locked = (test?._count?.attempts ?? 0) > 0;

  const load = async () => {
    const t = (await apiFetch(`/api/aptitude/job/${jobId}`)).data;
    if (!t) return;
    setTest(t);
    setForm({
      title: t.title, instructions: t.instructions ?? "", durationMins: t.durationMins, passingPercent: t.passingPercent,
      negativeMarking: t.negativeMarking, autoRejectOnFail: t.autoRejectOnFail,
      opensAt: t.opensAt ? toLocalInput(t.opensAt) : "", closesAt: t.closesAt ? toLocalInput(t.closesAt) : "",
    });
    setQuestions(t.questions.map((q) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex, marks: q.marks, section: q.section ?? "" })));
    if (t._count.attempts > 0) setResults((await apiFetch(`/api/aptitude/${t.id}/results`)).data);
  };
  useEffect(() => { load().catch((e) => setMsg({ type: "err", text: e.message })); }, [jobId]);

  const setQ = (i, patch) => setQuestions((qs) => qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const setOpt = (i, j, v) => setQ(i, { options: questions[i].options.map((o, k) => (k === j ? v : o)) });

  const save = async () => {
    setBusy(true); setMsg({ type: "", text: "" });
    try {
      const body = {
        ...form,
        durationMins: Number(form.durationMins), passingPercent: Number(form.passingPercent), negativeMarking: Number(form.negativeMarking),
        opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : null,
        closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
        questions: questions.map((q) => ({ ...q, marks: Number(q.marks) || 1, section: q.section || undefined })),
      };
      const r = await apiFetch(`/api/aptitude/job/${jobId}`, { method: "POST", body: JSON.stringify(body) });
      setMsg({ type: "ok", text: r.message });
      await load();
    } catch (e) { setMsg({ type: "err", text: e.message }); } finally { setBusy(false); }
  };

  const togglePublish = async () => {
    try {
      const r = await apiFetch(`/api/aptitude/${test.id}/publish`, { method: "PATCH", body: JSON.stringify({ publish: !test.isPublished }) });
      setMsg({ type: "ok", text: r.message }); await load();
    } catch (e) { setMsg({ type: "err", text: e.message }); }
  };

  return (
    <div style={{ padding: "0 2rem 3rem", maxWidth: 980 }}>
      <button style={btn("ghost")} onClick={() => navigate(-1)}>← Back to pipeline</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1rem 0" }}>
        <h2 className="page-title" style={{ margin: 0 }}>Aptitude test {test && <span style={badge(test.isPublished ? "#dcfce7" : "#fef9c3", test.isPublished ? "#166534" : "#854d0e")}>{test.isPublished ? "Published" : "Draft"}</span>}</h2>
        {test && <button style={btn(test.isPublished ? "ghost" : "success")} onClick={togglePublish}>{test.isPublished ? "Unpublish" : "Publish to shortlisted students"}</button>}
      </div>

      {msg.text && <div style={{ ...card, padding: ".7rem 1rem", marginBottom: "1rem", background: msg.type === "err" ? "#fef2f2" : "#f0fdf4", color: msg.type === "err" ? "#991b1b" : "#166534" }}>{msg.text}</div>}
      {locked && <div style={{ ...card, background: "#fffbeb", marginBottom: "1rem" }}>Students have started this test, so questions and settings are locked.</div>}

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Title</label><input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={label}>Instructions</label><textarea style={{ ...input, minHeight: 60 }} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
          <div><label style={label}>Duration (minutes)</label><input type="number" style={input} value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} /></div>
          <div><label style={label}>Passing %</label><input type="number" style={input} value={form.passingPercent} onChange={(e) => setForm({ ...form, passingPercent: e.target.value })} /></div>
          <div><label style={label}>Negative marking (0–1 of marks)</label><input type="number" step="0.25" min="0" max="1" style={input} value={form.negativeMarking} onChange={(e) => setForm({ ...form, negativeMarking: e.target.value })} /></div>
          <div><label style={label}>Opens at (optional)</label><input type="datetime-local" style={input} value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} /></div>
          <div><label style={label}>Closes at (optional)</label><input type="datetime-local" style={input} value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".9rem" }}>
            <input type="checkbox" checked={form.autoRejectOnFail} onChange={(e) => setForm({ ...form, autoRejectOnFail: e.target.checked })} /> Auto-reject students below passing %
          </label>
        </div>

        <h3>Questions ({questions.length})</h3>
        {questions.map((q, i) => (
          <div key={i} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Q{i + 1}</strong>
              <button style={btn("danger")} onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))} disabled={questions.length === 1}>Remove</button>
            </div>
            <textarea style={{ ...input, margin: "8px 0", minHeight: 56 }} placeholder="Question text" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} />
            {q.options.map((o, j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input type="radio" name={`c${i}`} checked={q.correctIndex === j} onChange={() => setQ(i, { correctIndex: j })} title="Correct answer" />
                <input style={input} placeholder={`Option ${j + 1}`} value={o} onChange={(e) => setOpt(i, j, e.target.value)} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <input style={{ ...input, maxWidth: 200 }} placeholder="Section (Quant, Logical…)" value={q.section} onChange={(e) => setQ(i, { section: e.target.value })} />
              <input style={{ ...input, maxWidth: 90 }} type="number" min={1} max={10} value={q.marks} onChange={(e) => setQ(i, { marks: e.target.value })} title="Marks" />
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn("ghost")} onClick={() => setQuestions((qs) => [...qs, blankQ()])}>+ Add question</button>
          <button style={btn()} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save test"}</button>
        </div>
      </fieldset>

      {results && (
        <>
          <h3 style={{ marginTop: "2rem" }}>Results</h3>
          <p style={{ color: "#64748b" }}>{results.stats.attempted} attempted · {results.stats.passed} passed · average {results.stats.average}%</p>
          <div style={{ ...card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".9rem" }}>
              <thead><tr style={{ background: "#f8fafc", textAlign: "left" }}>{["Student", "Roll no", "Score", "%", "Result", "Tab switches", "Submitted"].map((h) => <th key={h} style={{ padding: 10 }}>{h}</th>)}</tr></thead>
              <tbody>
                {results.attempts.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 10 }}>{a.application.student.user.name}</td>
                    <td style={{ padding: 10 }}>{a.application.student.rollNo}</td>
                    <td style={{ padding: 10 }}>{a.score ?? "-"} / {a.totalMarks ?? "-"}</td>
                    <td style={{ padding: 10 }}>{a.percent ?? "-"}</td>
                    <td style={{ padding: 10 }}>{a.status === "in_progress" ? <span style={badge("#e0e7ff", "#3730a3")}>In progress</span> : a.passed ? <span style={badge("#dcfce7", "#166534")}>Passed</span> : <span style={badge("#fee2e2", "#991b1b")}>Failed</span>}</td>
                    <td style={{ padding: 10, color: a.tabSwitches > 2 ? "#dc2626" : undefined }}>{a.tabSwitches}</td>
                    <td style={{ padding: 10 }}>{a.submittedAt ? fmtDateTime(a.submittedAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
