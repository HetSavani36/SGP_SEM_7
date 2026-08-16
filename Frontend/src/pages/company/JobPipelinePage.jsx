import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/* ---------- Helpers ---------- */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

function JobPipelinePage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/company/applications/pipeline/${jobId}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setJobData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [jobId]);

  const handlePhase1Decision = async (appId, action) => {
    try {
      await fetch(`${apiUrl}/api/company/application/${appId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: action }),
        credentials: "include"
      });
      fetchPipeline(); 
    } catch (err) { alert("Action failed"); }
  };

  const handleFinalDecision = async (appId, action) => {
    try {
      await fetch(`${apiUrl}/api/company/application/${appId}/final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: action }),
        credentials: "include"
      });
      fetchPipeline(); 
    } catch (err) { alert("Action failed"); }
  };

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh' }}>Loading ATS Board...</div>;
  if (!jobData) return null;

  // --- READ ONLY LOGIC ---
  const isExpired = new Date(jobData.dueDate) < new Date();
  const isPendingApproval = !jobData.isApproved;
  const isClosed = jobData.status === "closed";
  const isReadOnly = isExpired || isPendingApproval || isClosed;

  let readOnlyReason = "";
  if (isClosed) readOnlyReason = "This job is closed.";
  else if (isPendingApproval) readOnlyReason = "This job is currently pending approval from the college.";
  else if (isExpired) readOnlyReason = "This job's application deadline has passed.";

  // Group applications into columns
  const cols = { pending: [], mentorReview: [], interviewReady: [], finalized: [] };
  
  jobData.applications.forEach(app => {
    if (app.status === "pending") cols.pending.push(app);
    else if (app.status === "shortlisted" && app.mentorApproval === "pending") cols.mentorReview.push(app);
    else if (app.status === "shortlisted" && app.mentorApproval === "approved") cols.interviewReady.push(app);
    else cols.finalized.push(app);
  });

  /* ---------------- COLUMN COMPONENT ---------------- */
  const Column = ({ title, color, apps, children }) => (
    <div style={{ 
      backgroundColor: '#f8fafc', borderRadius: '12px', minWidth: '310px', maxWidth: '310px',
      display: 'flex', flexDirection: 'column', borderTop: `4px solid ${color}`,
      height: '100%', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ 
        margin: 0, padding: '1rem', fontSize: '1.05rem', color: '#0f172a', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0'
      }}>
        {title} 
        <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {apps.length}
        </span>
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', padding: '1rem', flexGrow: 1 }}>
        {apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.9rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No candidates in this phase.
          </div>
        ) : (
          apps.map(app => children(app))
        )}
      </div>
    </div>
  );

  /* ---------------- STUDENT CARD COMPONENT ---------------- */
  const StudentCard = ({ app, renderActions }) => (
    <div 
      style={{ 
        backgroundColor: '#fff', padding: '1.25rem', borderRadius: '10px', 
        border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', lineHeight: '1.2' }}>{app.student.user.name}</h4>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          {formatDate(app.appliedAt)}
        </span>
      </div>

      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
        {app.student.branch} • Year {app.student.year}
      </p>

      {app.student.skills && app.student.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem' }}>
          {app.student.skills.slice(0, 3).map((s, idx) => (
            <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>
              {s.skill.name}
            </span>
          ))}
          {app.student.skills.length > 3 && (
            <span style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
              +{app.student.skills.length - 3}
            </span>
          )}
        </div>
      )}
      
      {app.student.resume && (
        <a href={app.student.resume} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1rem', fontWeight: 500 }}>
          📄 View Resume
        </a>
      )}
      
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        {renderActions(app)}
      </div>
    </div>
  );

  return (
    <div style={{ 
        height: 'calc(100vh - 80px)',
        width: '100%',
        maxWidth: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        padding: '0 2rem 1rem 2rem',
        boxSizing: 'border-box',
        overflow: 'hidden'
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0, width: '100%', justifyContent: 'flex-start' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", color: "#475569", flexShrink: 0 }}
        >
          ←
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="page-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {jobData.title}
          </h2>
          <p className="page-subtitle" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Pipeline • {jobData.college.name}
          </p>
        </div>
      </div>

      {/* READ ONLY BANNER */}
      {isReadOnly && (
        <div style={{ 
          backgroundColor: '#fffbeb', color: '#854d0e', padding: '1rem', borderRadius: '8px', 
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', 
          border: '1px solid #fef08a', flexShrink: 0, fontSize: '0.9rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Read-Only Mode Active:</strong> {readOnlyReason} You can view applications, but cannot make hiring decisions.
          </div>
        </div>
      )}

      {/* KANBAN BOARD CONTAINER */}
      <div style={{ 
        display: 'flex', gap: '1.5rem', overflowX: 'auto', overflowY: 'hidden', 
        flexGrow: 1, width: '100%', paddingBottom: '1rem', boxSizing: 'border-box', minWidth:0
      }}>
        
        <Column title="New Applications" color="#eab308" apps={cols.pending}>
          {(app) => (
            <StudentCard key={app.id} app={app} renderActions={(a) => (
              isReadOnly ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Actions disabled</span>
              ) : (
                <>
                  <button onClick={() => handlePhase1Decision(a.id, "1")} style={{ flex: 1, padding: '8px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Shortlist
                  </button>
                  <button onClick={() => handlePhase1Decision(a.id, "0")} style={{ flex: 1, padding: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Reject
                  </button>
                </>
              )
            )} />
          )}
        </Column>

        <Column title="Mentor Reviewing" color="#a855f7" apps={cols.mentorReview}>
          {(app) => (
            <StudentCard key={app.id} app={app} renderActions={() => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center', padding: '4px' }}>
                <span style={{ fontSize: '1rem' }}>⏳</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Awaiting College Mentor</span>
              </div>
            )} />
          )}
        </Column>

        <Column title="Interview & Final" color="#3b82f6" apps={cols.interviewReady}>
          {(app) => (
            <StudentCard key={app.id} app={app} renderActions={(a) => (
              isReadOnly ? (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Actions disabled</span>
              ) : (
                <>
                  <button onClick={() => handleFinalDecision(a.id, "hire")} style={{ flex: 1, padding: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Hire
                  </button>
                  <button onClick={() => handleFinalDecision(a.id, "reject")} style={{ flex: 1, padding: '8px', backgroundColor: '#f8fafc', color: '#ef4444', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Reject
                  </button>
                </>
              )
            )} />
          )}
        </Column>

        <Column title="Finalized" color="#94a3b8" apps={cols.finalized}>
          {(app) => (
            <StudentCard key={app.id} app={app} renderActions={(a) => {
              const isHired = a.status === "hired";
              return (
                <div style={{ width: '100%', padding: '6px', textAlign: 'center', borderRadius: '6px', backgroundColor: isHired ? '#dcfce7' : '#fee2e2' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isHired ? '#166534' : '#991b1b' }}>
                    {isHired ? "🎉 Hired Candidate" : "✕ Application Rejected"}
                  </span>
                </div>
              );
            }} />
          )}
        </Column>

      </div>
    </div>
  );
}

export default JobPipelinePage;