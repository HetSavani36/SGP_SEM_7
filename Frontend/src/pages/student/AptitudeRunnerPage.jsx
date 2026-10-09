// NEW – route inside /student:  <Route path="aptitude/:testId" element={<AptitudeRunnerPage />} />
// The server owns the clock; this page only displays it.
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { card, btn } from "../../utils/ui";

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function AptitudeRunnerPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [cur, setCur] = useState(0);
  const [left, setLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [started, setStarted] = useState(false);

  const offset = useRef(0);
  const dirty = useRef(false);
  const submitting = useRef(false);
  const answersRef = useRef({});
  answersRef.current = answers;

  /* ---- start / resume only after the student presses the button (timer starts server-side) ---- */
  const start = async () => {
    try {
      const r = (await apiFetch(`/api/aptitude/${testId}/start`, { method: "POST" })).data;
      offset.current = new Date(r.serverNow).getTime() - Date.now();
      setAnswers(r.answers ?? {});
      setData(r);
      setStarted(true);
    } catch (e) { setErr(e.message); }
  };

  const submit = useCallback(async () => {
    if (submitting.current || !data) return;
    submitting.current = true;
    try {
      const r = (await apiFetch(`/api/aptitude/attempt/${data.attemptId}/submit`, { method: "POST", body: JSON.stringify({ answers: answersRef.current }) })).data;
      setResult(r);
    } catch (e) { setErr(e.message); submitting.current = false; }
  }, [data]);

  /* ---- countdown ---- */
  useEffect(() => {
    if (!data || result) return;
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(data.expiresAt).getTime() - (Date.now() + offset.current)) / 1000));
      setLeft(s);
      if (s === 0) submit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data, result, submit]);

  /* ---- autosave every 15 s ---- */
  useEffect(() => {
    if (!data || result) return;
    const id = setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;
      apiFetch(`/api/aptitude/attempt/${data.attemptId}/save`, { method: "PATCH", body: JSON.stringify({ answers: answersRef.current }) }).catch(() => { dirty.current = true; });
    }, 15000);
    return () => clearInterval(id);
  }, [data, result]);

  /* ---- integrity signals: tab switch + accidental close ---- */
  useEffect(() => {
    if (!data || result) return;
    const onHide = () => { if (document.hidden) apiFetch(`/api/aptitude/attempt/${data.attemptId}/violation`, { method: "POST" }).catch(() => {}); };
    const onUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("beforeunload", onUnload); };
  }, [data, result]);

  const choose = (qid, idx) => { dirty.current = true; setAnswers((a) => ({ ...a, [qid]: idx })); };

  /* ---------------- views ---------------- */
  if (err) return (
    <div style={{ padding: "2rem" }}>
      <div style={{ ...card, color: "#991b1b" }}>{err}</div>
      <button style={{ ...btn("ghost"), marginTop: 12 }} onClick={() => navigate("/student/aptitude")}>← Back</button>
    </div>
  );

  if (result) return (
    <div style={{ padding: "2rem", maxWidth: 520 }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>{result.late ? "Time is over" : "Submitted"}</h2>
        <p style={{ fontSize: "2rem", margin: "8px 0" }}>{result.percent}%</p>
        <p style={{ color: result.passed ? "#166534" : "#991b1b", fontWeight: 600 }}>{result.passed ? "You passed 🎉" : "Below the passing mark"}</p>
        <p style={{ color: "#64748b", fontSize: ".9rem" }}>The company will review your result and contact you for the next step.</p>
        <button style={btn()} onClick={() => navigate("/student/aptitude")}>Done</button>
      </div>
    </div>
  );

  if (!started) return (
    <div style={{ padding: "2rem", maxWidth: 560 }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Before you begin</h2>
        <ul style={{ color: "#475569", lineHeight: 1.7 }}>
          <li>The timer starts when you press Start and <strong>cannot be paused</strong>.</li>
          <li>Closing the page does not stop the timer. You can reopen the test and continue until time ends.</li>
          <li>Switching tabs is recorded and visible to the company.</li>
          <li>Answers are saved automatically; the test submits itself when time ends.</li>
        </ul>
        <button style={btn()} onClick={start}>Start test</button>
      </div>
    </div>
  );

  const q = data.questions[cur];
  const answered = Object.keys(answers).length;
  return (
    <div style={{ padding: "0 2rem 2rem", display: "grid", gridTemplateColumns: "1fr 260px", gap: "1rem", alignItems: "start" }} onCopy={(e) => e.preventDefault()}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: ".85rem" }}>
          <span>Question {cur + 1} of {data.questions.length}{q.section ? ` · ${q.section}` : ""}</span><span>{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
        </div>
        <h3 style={{ whiteSpace: "pre-wrap" }}>{q.text}</h3>
        {q.options.map((o, i) => (
          <label key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 8, cursor: "pointer",
            border: `1px solid ${answers[q.id] === i ? "#4f46e5" : "#e2e8f0"}`, background: answers[q.id] === i ? "#eef2ff" : "#fff" }}>
            <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => choose(q.id, i)} /> {o}
          </label>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button style={btn("ghost")} disabled={cur === 0} onClick={() => setCur(cur - 1)}>← Previous</button>
          <div style={{ display: "flex", gap: 8 }}>
            {answers[q.id] !== undefined && <button style={btn("ghost")} onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.id]; dirty.current = true; return n; })}>Clear</button>}
            <button style={btn("ghost")} disabled={cur === data.questions.length - 1} onClick={() => setCur(cur + 1)}>Next →</button>
          </div>
        </div>
      </div>

      <aside style={{ ...card, position: "sticky", top: 12 }}>
        <div style={{ fontSize: "1.8rem", fontWeight: 700, color: left < 60 ? "#dc2626" : "#0f172a", textAlign: "center" }}>{left === null ? "--:--" : mmss(left)}</div>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: ".8rem", marginTop: 0 }}>{answered}/{data.questions.length} answered</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, margin: "12px 0" }}>
          {data.questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setCur(i)} style={{ padding: 6, borderRadius: 6, cursor: "pointer", fontSize: ".8rem",
              border: i === cur ? "2px solid #4f46e5" : "1px solid #e2e8f0", background: answers[qq.id] !== undefined ? "#dcfce7" : "#fff" }}>{i + 1}</button>
          ))}
        </div>
        <button style={{ ...btn("success"), width: "100%" }} onClick={() => { if (window.confirm(`Submit now? ${data.questions.length - answered} unanswered.`)) submit(); }}>Submit test</button>
      </aside>
    </div>
  );
}
